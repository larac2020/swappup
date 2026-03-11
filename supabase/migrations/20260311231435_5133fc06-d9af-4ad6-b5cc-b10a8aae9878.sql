
-- Create listing_type enum
CREATE TYPE public.listing_type AS ENUM ('flight_ticket', 'travel_credit');

-- Add listing type and voucher-specific columns to listings
ALTER TABLE public.listings 
  ADD COLUMN listing_type public.listing_type NOT NULL DEFAULT 'flight_ticket',
  ADD COLUMN credit_type text,
  ADD COLUMN credit_value numeric,
  ADD COLUMN credit_expiry_date date,
  ADD COLUMN credit_currency text DEFAULT 'EUR';
