
-- Add voucher verification fields to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS voucher_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS voucher_confidence_score integer,
  ADD COLUMN IF NOT EXISTS voucher_reference_code text,
  ADD COLUMN IF NOT EXISTS voucher_verification_flags jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS voucher_restrictions text;
