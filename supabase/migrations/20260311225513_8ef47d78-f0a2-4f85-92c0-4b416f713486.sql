
-- Fraud scores table to track seller risk
CREATE TABLE public.fraud_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  score integer NOT NULL DEFAULT 0,
  flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_flagged boolean NOT NULL DEFAULT false,
  listing_limit integer NOT NULL DEFAULT 10,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.fraud_scores ENABLE ROW LEVEL SECURITY;

-- Users can view their own fraud score
CREATE POLICY "Users can view their own fraud score"
  ON public.fraud_scores FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Only service role can modify fraud scores
CREATE POLICY "Service role can manage fraud scores"
  ON public.fraud_scores FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Add escrow_status to purchases table
ALTER TABLE public.purchases 
  ADD COLUMN IF NOT EXISTS escrow_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS escrow_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS buyer_confirmed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seller_transferred boolean NOT NULL DEFAULT false;

-- Duplicate listing prevention function
CREATE OR REPLACE FUNCTION public.check_duplicate_listing()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.listings
    WHERE seller_id = NEW.seller_id
      AND flight_number = NEW.flight_number
      AND departure_date = NEW.departure_date
      AND is_active = true
      AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND NEW.flight_number IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_LISTING: A listing with the same flight number and departure date already exists';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER prevent_duplicate_listings
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_duplicate_listing();

-- Price cap validation trigger (max 120% of original price when original is provided)
-- Note: the existing validation requires price < original_price. We keep that.
-- This adds a server-side enforcement.
CREATE OR REPLACE FUNCTION public.check_price_cap()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.original_price IS NOT NULL AND NEW.original_price > 0 THEN
    IF NEW.price > NEW.original_price THEN
      RAISE EXCEPTION 'PRICE_CAP: Selling price cannot exceed the original price';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_price_cap
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_price_cap();

-- Rate limiting function: check how many active listings a seller has
CREATE OR REPLACE FUNCTION public.check_listing_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  active_count integer;
  max_listings integer;
  user_uuid uuid;
BEGIN
  -- Get user_id from profiles
  SELECT p.user_id INTO user_uuid FROM public.profiles p WHERE p.id = NEW.seller_id;
  
  -- Get listing limit from fraud_scores (default 10)
  SELECT COALESCE(fs.listing_limit, 10) INTO max_listings
  FROM public.fraud_scores fs WHERE fs.user_id = user_uuid;
  
  IF max_listings IS NULL THEN
    max_listings := 10;
  END IF;
  
  -- Count active listings
  SELECT COUNT(*) INTO active_count
  FROM public.listings
  WHERE seller_id = NEW.seller_id AND is_active = true;
  
  IF active_count >= max_listings THEN
    RAISE EXCEPTION 'RATE_LIMIT: You have reached your maximum number of active listings (%)' , max_listings;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_listing_rate_limit
  BEFORE INSERT ON public.listings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_listing_rate_limit();
