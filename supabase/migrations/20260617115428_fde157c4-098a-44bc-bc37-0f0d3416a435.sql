-- Lock down profile columns that must only be written server-side (via service role).
-- Triggers run for service_role too, so we explicitly allow it through.
CREATE OR REPLACE FUNCTION public.prevent_protected_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role (edge functions / admin) bypasses this guard.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

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
  THEN
    RAISE EXCEPTION 'PROTECTED_COLUMNS: payment, verification and ID document fields can only be updated by the server';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_protected_profile_updates_trigger ON public.profiles;
CREATE TRIGGER prevent_protected_profile_updates_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_protected_profile_updates();