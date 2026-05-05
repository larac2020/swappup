ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS arrival_time time without time zone,
  ADD COLUMN IF NOT EXISTS return_departure_time time without time zone,
  ADD COLUMN IF NOT EXISTS return_arrival_time time without time zone,
  ADD COLUMN IF NOT EXISTS return_flight_number text;