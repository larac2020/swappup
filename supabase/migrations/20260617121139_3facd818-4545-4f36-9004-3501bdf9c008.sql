
-- ============================================================
-- User roles (admin gate) — standard separated-roles pattern
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- Fraud monitoring for duplicate-ticket sales
-- ============================================================

DO $$ BEGIN
  CREATE TYPE public.fraud_status_t AS ENUM ('under_review','confirmed_fraud','cleared');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.seller_account_status_t AS ENUM ('active','suspended','banned');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status public.seller_account_status_t NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS payouts_frozen boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fraud_case_id uuid;

-- Extend self-elevation guard to cover new flags
CREATE OR REPLACE FUNCTION public.prevent_protected_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;

  IF NEW.has_payment_method        IS DISTINCT FROM OLD.has_payment_method
     OR NEW.verification_status    IS DISTINCT FROM OLD.verification_status
     OR NEW.transactions_bought    IS DISTINCT FROM OLD.transactions_bought
     OR NEW.transactions_sold      IS DISTINCT FROM OLD.transactions_sold
     OR NEW.id_document_url        IS DISTINCT FROM OLD.id_document_url
     OR NEW.id_document_type       IS DISTINCT FROM OLD.id_document_type
     OR NEW.id_document_country    IS DISTINCT FROM OLD.id_document_country
     OR NEW.id_document_expiry     IS DISTINCT FROM OLD.id_document_expiry
     OR NEW.id_document_first_name IS DISTINCT FROM OLD.id_document_first_name
     OR NEW.id_document_last_name  IS DISTINCT FROM OLD.id_document_last_name
     OR NEW.id_document_dob        IS DISTINCT FROM OLD.id_document_dob
     OR NEW.id_document_number_last4 IS DISTINCT FROM OLD.id_document_number_last4
     OR NEW.account_status         IS DISTINCT FROM OLD.account_status
     OR NEW.payouts_frozen         IS DISTINCT FROM OLD.payouts_frozen
     OR NEW.fraud_case_id          IS DISTINCT FROM OLD.fraud_case_id
  THEN
    RAISE EXCEPTION 'PROTECTED_COLUMNS: protected fields can only be updated by the server';
  END IF;

  RETURN NEW;
END;
$$;

-- fraud_cases
CREATE TABLE IF NOT EXISTS public.fraud_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.fraud_status_t NOT NULL DEFAULT 'under_review',
  reason text NOT NULL,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  opened_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.fraud_cases TO authenticated;
GRANT ALL ON public.fraud_cases TO service_role;
ALTER TABLE public.fraud_cases ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS fraud_cases_seller_idx ON public.fraud_cases(seller_id);
CREATE INDEX IF NOT EXISTS fraud_cases_status_idx ON public.fraud_cases(status);

CREATE POLICY "Seller can view own fraud case"
  ON public.fraud_cases FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = fraud_cases.seller_id AND p.user_id = auth.uid()));

CREATE POLICY "Admins manage fraud cases"
  ON public.fraud_cases FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_fraud_cases_updated_at
  BEFORE UPDATE ON public.fraud_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- fraud_events (append-only)
CREATE TABLE IF NOT EXISTS public.fraud_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid REFERENCES public.fraud_cases(id) ON DELETE SET NULL,
  seller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  listing_id uuid,
  purchase_id uuid,
  booking_reference text,
  booking_fingerprint text,
  actor_user_id uuid,
  evidence jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.fraud_events TO authenticated;
GRANT ALL ON public.fraud_events TO service_role;
ALTER TABLE public.fraud_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS fraud_events_case_idx ON public.fraud_events(case_id);
CREATE INDEX IF NOT EXISTS fraud_events_seller_idx ON public.fraud_events(seller_id);
CREATE INDEX IF NOT EXISTS fraud_events_created_idx ON public.fraud_events(created_at DESC);

CREATE POLICY "Seller can view own fraud events"
  ON public.fraud_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = fraud_events.seller_id AND p.user_id = auth.uid()));

CREATE POLICY "Admins read fraud events"
  ON public.fraud_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Block suspended / banned sellers from creating listings
CREATE OR REPLACE FUNCTION public.check_listing_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_count integer;
  max_listings integer;
  user_uuid uuid;
  acct_status public.seller_account_status_t;
BEGIN
  SELECT p.user_id, p.account_status INTO user_uuid, acct_status
  FROM public.profiles p WHERE p.id = NEW.seller_id;

  IF acct_status = 'banned' THEN
    RAISE EXCEPTION 'ACCOUNT_BANNED: This account is permanently banned and cannot create listings.';
  END IF;
  IF acct_status = 'suspended' THEN
    RAISE EXCEPTION 'ACCOUNT_SUSPENDED: This account is under review and cannot create new listings until cleared.';
  END IF;

  SELECT COALESCE(fs.listing_limit, 10) INTO max_listings
  FROM public.fraud_scores fs WHERE fs.user_id = user_uuid;
  IF max_listings IS NULL THEN max_listings := 10; END IF;

  SELECT COUNT(*) INTO active_count
  FROM public.listings WHERE seller_id = NEW.seller_id AND is_active = true;

  IF active_count >= max_listings THEN
    RAISE EXCEPTION 'RATE_LIMIT: You have reached your maximum number of active listings (%)', max_listings;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_listing_rate_limit() FROM PUBLIC, anon, authenticated;

-- Admin: resolve fraud case
CREATE OR REPLACE FUNCTION public.admin_resolve_fraud_case(
  _case_id uuid,
  _resolution public.fraud_status_t,
  _notes text DEFAULT NULL
)
RETURNS public.fraud_cases
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_case public.fraud_cases;
  v_seller_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN: admin role required';
  END IF;
  IF _resolution = 'under_review' THEN
    RAISE EXCEPTION 'INVALID_RESOLUTION: must be confirmed_fraud or cleared';
  END IF;

  SELECT * INTO v_case FROM public.fraud_cases WHERE id = _case_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'NOT_FOUND: fraud case not found'; END IF;
  v_seller_id := v_case.seller_id;

  UPDATE public.fraud_cases
     SET status = _resolution, resolution_notes = _notes,
         resolved_at = now(), resolved_by = auth.uid()
   WHERE id = _case_id RETURNING * INTO v_case;

  IF _resolution = 'confirmed_fraud' THEN
    UPDATE public.profiles
       SET account_status = 'banned', payouts_frozen = true, fraud_case_id = _case_id
     WHERE id = v_seller_id;

    UPDATE public.purchases
       SET escrow_status = 'canceled',
           status = CASE WHEN status IN ('pending','pending_transfer','transfer_confirmed')
                         THEN 'refunded' ELSE status END
     WHERE seller_id = v_seller_id
       AND escrow_status IN ('pending','authorized','held');

    INSERT INTO public.fraud_events (case_id, seller_id, event_type, actor_user_id, evidence)
    VALUES (_case_id, v_seller_id, 'admin_confirmed_fraud', auth.uid(), jsonb_build_object('notes', _notes));

  ELSIF _resolution = 'cleared' THEN
    UPDATE public.profiles
       SET account_status = 'active', payouts_frozen = false, fraud_case_id = NULL
     WHERE id = v_seller_id;

    INSERT INTO public.fraud_events (case_id, seller_id, event_type, actor_user_id, evidence)
    VALUES (_case_id, v_seller_id, 'admin_cleared', auth.uid(), jsonb_build_object('notes', _notes));
  END IF;

  RETURN v_case;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_resolve_fraud_case(uuid, public.fraud_status_t, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_resolve_fraud_case(uuid, public.fraud_status_t, text) TO authenticated;

-- Admin: manual ban
CREATE OR REPLACE FUNCTION public.admin_ban_seller(_seller_id uuid, _reason text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_case_id uuid;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'FORBIDDEN: admin role required';
  END IF;

  INSERT INTO public.fraud_cases (seller_id, status, reason, evidence, resolved_at, resolved_by, resolution_notes)
  VALUES (_seller_id, 'confirmed_fraud', _reason, jsonb_build_object('manual', true), now(), auth.uid(), _reason)
  RETURNING id INTO v_case_id;

  UPDATE public.profiles
     SET account_status = 'banned', payouts_frozen = true, fraud_case_id = v_case_id
   WHERE id = _seller_id;

  UPDATE public.purchases
     SET escrow_status = 'canceled',
         status = CASE WHEN status IN ('pending','pending_transfer','transfer_confirmed')
                       THEN 'refunded' ELSE status END
   WHERE seller_id = _seller_id
     AND escrow_status IN ('pending','authorized','held');

  INSERT INTO public.fraud_events (case_id, seller_id, event_type, actor_user_id, evidence)
  VALUES (v_case_id, _seller_id, 'admin_manual_ban', auth.uid(), jsonb_build_object('reason', _reason));

  RETURN v_case_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_ban_seller(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_ban_seller(uuid, text) TO authenticated;

-- Block seller payouts (release-escrow) when frozen — defensive guard on purchases status transitions
-- Done at edge-function layer; nothing to alter here.
