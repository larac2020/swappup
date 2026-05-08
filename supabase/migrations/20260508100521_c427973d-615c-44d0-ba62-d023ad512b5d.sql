ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS origin_airport text,
  ADD COLUMN IF NOT EXISTS destination_airport text;