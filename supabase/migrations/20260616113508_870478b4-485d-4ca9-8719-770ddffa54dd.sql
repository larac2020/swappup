-- 1) One-shot: deactivate listings on non-transferable airlines
UPDATE public.listings l
SET is_active = false, updated_at = now()
FROM public.airline_change_fees af
WHERE l.is_active = true
  AND l.listing_type = 'flight_ticket'
  AND af.is_transferable = false
  AND regexp_replace(regexp_replace(lower(l.airline), '[^a-z0-9]+', '_', 'g'), '^_|_$', '', 'g') = af.airline_code;

-- 2) One-shot: deactivate listings whose travel date is in the past
UPDATE public.listings
SET is_active = false, updated_at = now()
WHERE is_active = true
  AND (
    (return_date IS NULL AND departure_date < CURRENT_DATE)
    OR (return_date IS NOT NULL AND return_date < CURRENT_DATE)
  );

-- 3) Function for the scheduled job
CREATE OR REPLACE FUNCTION public.deactivate_past_listings()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.listings
  SET is_active = false, updated_at = now()
  WHERE is_active = true
    AND (
      (return_date IS NULL AND departure_date < CURRENT_DATE)
      OR (return_date IS NOT NULL AND return_date < CURRENT_DATE)
    );
$$;

-- 4) Schedule daily run at 02:15 UTC
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    BEGIN
      PERFORM cron.unschedule('deactivate-past-listings');
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
    PERFORM cron.schedule(
      'deactivate-past-listings',
      '15 2 * * *',
      $job$SELECT public.deactivate_past_listings();$job$
    );
  END IF;
END$$;