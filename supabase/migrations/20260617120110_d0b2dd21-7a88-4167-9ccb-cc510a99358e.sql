CREATE OR REPLACE FUNCTION public.compute_booking_fingerprint(
  _airline text,
  _flight_number text,
  _return_flight_number text,
  _departure_date date,
  _return_date date,
  _origin_airport text,
  _origin_city text,
  _destination_airport text,
  _destination_city text,
  _ticket_count integer,
  _original_price numeric
) RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  WITH n AS (
    SELECT
      nullif(upper(regexp_replace(coalesce(_airline, ''), '[[:space:]]+', '', 'g')), '') AS airline,
      nullif(upper(regexp_replace(coalesce(_flight_number, ''), '[[:space:]\-]+', '', 'g')), '') AS flight_no,
      nullif(upper(regexp_replace(coalesce(_return_flight_number, ''), '[[:space:]\-]+', '', 'g')), '') AS return_flight_no,
      nullif(upper(regexp_replace(coalesce(_origin_airport, _origin_city, ''), '[[:space:]]+', '', 'g')), '') AS origin,
      nullif(upper(regexp_replace(coalesce(_destination_airport, _destination_city, ''), '[[:space:]]+', '', 'g')), '') AS destination,
      _departure_date AS dep,
      _return_date AS ret,
      coalesce(_ticket_count, 1) AS pax,
      CASE WHEN _original_price IS NULL THEN NULL ELSE round(_original_price)::text END AS price
  )
  SELECT
    CASE
      WHEN n.airline IS NULL OR n.flight_no IS NULL OR n.dep IS NULL
        OR n.origin IS NULL OR n.destination IS NULL THEN NULL
      ELSE md5(concat_ws(
        '|',
        n.airline,
        n.flight_no,
        coalesce(n.return_flight_no, ''),
        to_char(n.dep, 'YYYY-MM-DD'),
        coalesce(to_char(n.ret, 'YYYY-MM-DD'), ''),
        n.origin,
        n.destination,
        n.pax::text,
        coalesce(n.price, '')
      ))
    END
  FROM n
$$;

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS booking_fingerprint text;

CREATE INDEX IF NOT EXISTS listings_booking_fingerprint_idx
  ON public.listings (booking_fingerprint)
  WHERE booking_fingerprint IS NOT NULL;

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
    NEW.airline,
    NEW.flight_number,
    NEW.return_flight_number,
    NEW.departure_date,
    NEW.return_date,
    NEW.origin_airport,
    NEW.origin_city,
    NEW.destination_airport,
    NEW.destination_city,
    NEW.ticket_count,
    NEW.original_price
  );

  NEW.booking_fingerprint := fp;

  IF fp IS NULL THEN
    RETURN NEW;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.listings
    WHERE booking_fingerprint = fp
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_BOOKING_FINGERPRINT: A very similar booking is already listed on Swappup. The same trip cannot be listed twice.';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_booking_fingerprint() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS enforce_booking_fingerprint_trigger ON public.listings;
CREATE TRIGGER enforce_booking_fingerprint_trigger
BEFORE INSERT OR UPDATE OF airline, flight_number, return_flight_number,
  departure_date, return_date, origin_airport, origin_city,
  destination_airport, destination_city, ticket_count, original_price
ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.enforce_booking_fingerprint();

UPDATE public.listings
SET booking_fingerprint = public.compute_booking_fingerprint(
  airline, flight_number, return_flight_number,
  departure_date, return_date,
  origin_airport, origin_city,
  destination_airport, destination_city,
  ticket_count, original_price
)
WHERE booking_fingerprint IS NULL;