-- Extend listing_type enum with train_ticket
ALTER TYPE public.listing_type ADD VALUE IF NOT EXISTS 'train_ticket';

-- Add nullable train-specific columns to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS operator TEXT,
  ADD COLUMN IF NOT EXISTS train_number TEXT,
  ADD COLUMN IF NOT EXISTS train_class TEXT,
  ADD COLUMN IF NOT EXISTS origin_station TEXT,
  ADD COLUMN IF NOT EXISTS destination_station TEXT,
  ADD COLUMN IF NOT EXISTS departure_time TIME;