-- 1. Column to store the booking reference exactly as captured.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS booking_reference text;

-- 2. Helper: normalize a booking ref (uppercase, strip all whitespace + dashes).
CREATE OR REPLACE FUNCTION public.normalize_booking_ref(_ref text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN _ref IS NULL OR length(btrim(_ref)) = 0 THEN NULL
    ELSE upper(regexp_replace(_ref, '[[:space:]\-_]', '', 'g'))
  END
$$;

-- 3. Unique index on the normalized value (covers every listing, any status).
CREATE UNIQUE INDEX IF NOT EXISTS listings_booking_reference_unique_idx
  ON public.listings (public.normalize_booking_ref(booking_reference))
  WHERE booking_reference IS NOT NULL;

-- 4. Trigger to raise a clean, app-friendly error before insert/update.
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
    SELECT 1
    FROM public.listings
    WHERE public.normalize_booking_ref(booking_reference) = norm
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_BOOKING_REF: This booking has already been listed on Swappup and cannot be listed again.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.check_duplicate_booking_reference() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS check_duplicate_booking_reference_trigger ON public.listings;
CREATE TRIGGER check_duplicate_booking_reference_trigger
BEFORE INSERT OR UPDATE OF booking_reference ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.check_duplicate_booking_reference();