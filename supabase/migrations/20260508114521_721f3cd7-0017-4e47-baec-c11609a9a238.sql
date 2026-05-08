
-- Disputes table
CREATE TABLE public.name_change_fee_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid,
  seller_id uuid NOT NULL,
  airline_code text NOT NULL,
  airline_name text,
  route_type text NOT NULL DEFAULT 'international',
  platform_fee numeric,
  proposed_fee numeric NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  evidence_url text,
  note text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);

ALTER TABLE public.name_change_fee_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can create their own fee disputes"
ON public.name_change_fee_disputes
FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = name_change_fee_disputes.seller_id AND p.user_id = auth.uid()
));

CREATE POLICY "Sellers can view their own fee disputes"
ON public.name_change_fee_disputes
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = name_change_fee_disputes.seller_id AND p.user_id = auth.uid()
));

CREATE POLICY "Service role manages fee disputes"
ON public.name_change_fee_disputes
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- Cap trigger: listing.name_change_fee cannot exceed the platform-verified fee
CREATE OR REPLACE FUNCTION public.enforce_name_change_fee_cap()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cap numeric;
  norm_code text;
BEGIN
  IF NEW.name_change_fee IS NULL OR NEW.name_change_fee <= 0 THEN
    RETURN NEW;
  END IF;
  IF NEW.airline IS NULL THEN
    RETURN NEW;
  END IF;

  norm_code := regexp_replace(lower(NEW.airline), '[^a-z0-9]+', '_', 'g');
  norm_code := regexp_replace(norm_code, '^_|_$', '', 'g');

  SELECT GREATEST(COALESCE(fee_max, 0), COALESCE(fee_amount, 0))
  INTO cap
  FROM public.airline_change_fees
  WHERE airline_code = norm_code
  ORDER BY last_verified_at DESC
  LIMIT 1;

  IF cap IS NOT NULL AND cap > 0 AND NEW.name_change_fee > cap THEN
    RAISE EXCEPTION 'FEE_CAP: name_change_fee (%) exceeds platform-verified cap (%) for %',
      NEW.name_change_fee, cap, NEW.airline;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_name_change_fee_cap_trg
BEFORE INSERT OR UPDATE OF name_change_fee, airline ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.enforce_name_change_fee_cap();
