
-- 1) Permanent record of sold bookings (survives listing deletion/edits)
CREATE TABLE IF NOT EXISTS public.sold_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid,
  purchase_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  booking_reference_normalized text,
  booking_fingerprint text,
  sold_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.sold_bookings TO authenticated;
GRANT ALL ON public.sold_bookings TO service_role;

ALTER TABLE public.sold_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Sellers can view their sold bookings"
  ON public.sold_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = sold_bookings.seller_id AND p.user_id = auth.uid()
    )
  );

CREATE UNIQUE INDEX IF NOT EXISTS sold_bookings_ref_unique_idx
  ON public.sold_bookings (booking_reference_normalized)
  WHERE booking_reference_normalized IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS sold_bookings_fp_unique_idx
  ON public.sold_bookings (booking_fingerprint)
  WHERE booking_fingerprint IS NOT NULL;

CREATE INDEX IF NOT EXISTS sold_bookings_purchase_idx ON public.sold_bookings (purchase_id);

-- 2) Mark sold listings explicitly
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS is_sold boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sold_at timestamptz;

-- 3) When a purchase reaches a paid/escrow state, lock listing + record sold booking
CREATE OR REPLACE FUNCTION public.lock_listing_on_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l record;
  norm_ref text;
BEGIN
  -- Only act when transitioning into a state that represents a completed payment / escrow
  IF NEW.status NOT IN ('pending_transfer','transfer_confirmed','completed') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  SELECT * INTO l FROM public.listings WHERE id = NEW.listing_id;
  IF NOT FOUND THEN
    RETURN NEW;
  END IF;

  norm_ref := public.normalize_booking_ref(l.booking_reference);

  -- Permanently lock the listing
  UPDATE public.listings
     SET is_sold = true,
         sold_at = COALESCE(sold_at, now()),
         is_active = false,
         ticket_count = 0,
         updated_at = now()
   WHERE id = l.id;

  -- Idempotent insert (one row per purchase)
  INSERT INTO public.sold_bookings (
    listing_id, purchase_id, seller_id,
    booking_reference_normalized, booking_fingerprint
  )
  SELECT l.id, NEW.id, l.seller_id, norm_ref, l.booking_fingerprint
  WHERE NOT EXISTS (SELECT 1 FROM public.sold_bookings WHERE purchase_id = NEW.id);

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.lock_listing_on_purchase() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_lock_listing_on_purchase ON public.purchases;
CREATE TRIGGER trg_lock_listing_on_purchase
  AFTER INSERT OR UPDATE OF status ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION public.lock_listing_on_purchase();

-- 4) Extend duplicate-booking-ref check to also block against sold_bookings
CREATE OR REPLACE FUNCTION public.check_duplicate_booking_reference()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  norm text;
BEGIN
  norm := public.normalize_booking_ref(NEW.booking_reference);
  IF norm IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.listings
    WHERE public.normalize_booking_ref(booking_reference) = norm
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_BOOKING_REF: This booking has already been listed on Swappup and cannot be listed again.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.sold_bookings
    WHERE booking_reference_normalized = norm
      AND (NEW.id IS NULL OR listing_id IS DISTINCT FROM NEW.id)
  ) THEN
    RAISE EXCEPTION 'BOOKING_ALREADY_SOLD: This booking has already been sold on Swappup and cannot be listed again.';
  END IF;

  RETURN NEW;
END;
$$;

-- 5) Extend fingerprint enforcement to also check sold_bookings
CREATE OR REPLACE FUNCTION public.enforce_booking_fingerprint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fp text;
BEGIN
  fp := public.compute_booking_fingerprint(
    NEW.airline, NEW.flight_number, NEW.return_flight_number,
    NEW.departure_date, NEW.return_date,
    NEW.origin_airport, NEW.origin_city,
    NEW.destination_airport, NEW.destination_city,
    NEW.ticket_count, NEW.original_price
  );

  NEW.booking_fingerprint := fp;

  IF fp IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.listings
    WHERE booking_fingerprint = fp
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_BOOKING_FINGERPRINT: A very similar booking is already listed on Swappup. The same trip cannot be listed twice.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.sold_bookings
    WHERE booking_fingerprint = fp
      AND (NEW.id IS NULL OR listing_id IS DISTINCT FROM NEW.id)
  ) THEN
    RAISE EXCEPTION 'BOOKING_ALREADY_SOLD: This travel booking has already been sold on Swappup and cannot be listed again.';
  END IF;

  RETURN NEW;
END;
$$;

-- 6) Prevent editing a sold listing into a different ticket
CREATE OR REPLACE FUNCTION public.prevent_sold_listing_edits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF OLD.is_sold IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  IF NEW.airline                 IS DISTINCT FROM OLD.airline
     OR NEW.flight_number        IS DISTINCT FROM OLD.flight_number
     OR NEW.return_flight_number IS DISTINCT FROM OLD.return_flight_number
     OR NEW.departure_date       IS DISTINCT FROM OLD.departure_date
     OR NEW.return_date          IS DISTINCT FROM OLD.return_date
     OR NEW.origin_airport       IS DISTINCT FROM OLD.origin_airport
     OR NEW.origin_city          IS DISTINCT FROM OLD.origin_city
     OR NEW.destination_airport  IS DISTINCT FROM OLD.destination_airport
     OR NEW.destination_city     IS DISTINCT FROM OLD.destination_city
     OR NEW.ticket_count         IS DISTINCT FROM OLD.ticket_count
     OR NEW.original_price       IS DISTINCT FROM OLD.original_price
     OR NEW.booking_reference    IS DISTINCT FROM OLD.booking_reference
     OR NEW.is_sold              IS DISTINCT FROM OLD.is_sold
     OR NEW.is_active            IS DISTINCT FROM OLD.is_active
  THEN
    RAISE EXCEPTION 'LISTING_LOCKED: This listing has been sold and can no longer be modified or relisted.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_sold_listing_edits() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_prevent_sold_listing_edits ON public.listings;
CREATE TRIGGER trg_prevent_sold_listing_edits
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_sold_listing_edits();

-- 7) Also prevent deleting a sold listing (keep the audit trail)
CREATE OR REPLACE FUNCTION public.prevent_sold_listing_delete()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' THEN
    RETURN OLD;
  END IF;
  IF OLD.is_sold IS TRUE THEN
    RAISE EXCEPTION 'LISTING_LOCKED: Sold listings cannot be deleted.';
  END IF;
  RETURN OLD;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.prevent_sold_listing_delete() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_prevent_sold_listing_delete ON public.listings;
CREATE TRIGGER trg_prevent_sold_listing_delete
  BEFORE DELETE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.prevent_sold_listing_delete();

-- 8) Backfill: any purchase already in a paid state locks its listing + records sold booking
INSERT INTO public.sold_bookings (listing_id, purchase_id, seller_id, booking_reference_normalized, booking_fingerprint)
SELECT l.id, pu.id, l.seller_id, public.normalize_booking_ref(l.booking_reference), l.booking_fingerprint
FROM public.purchases pu
JOIN public.listings l ON l.id = pu.listing_id
WHERE pu.status IN ('pending_transfer','transfer_confirmed','completed')
  AND NOT EXISTS (SELECT 1 FROM public.sold_bookings sb WHERE sb.purchase_id = pu.id);

UPDATE public.listings l
SET is_sold = true,
    sold_at = COALESCE(l.sold_at, now()),
    is_active = false,
    ticket_count = 0,
    updated_at = now()
WHERE EXISTS (
  SELECT 1 FROM public.purchases pu
  WHERE pu.listing_id = l.id
    AND pu.status IN ('pending_transfer','transfer_confirmed','completed')
);
