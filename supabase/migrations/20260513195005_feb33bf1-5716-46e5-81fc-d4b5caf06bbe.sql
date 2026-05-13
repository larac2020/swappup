
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS train_type text,
  ADD COLUMN IF NOT EXISTS travel_class text,
  ADD COLUMN IF NOT EXISTS train_inclusions jsonb;

ALTER TABLE public.listings
  ALTER COLUMN airline DROP NOT NULL;
