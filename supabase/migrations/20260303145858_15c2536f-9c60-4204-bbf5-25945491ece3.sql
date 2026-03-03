
-- Add preference columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS favorite_departure_city text,
ADD COLUMN IF NOT EXISTS default_pax integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS favorite_categories text[] DEFAULT '{}';
