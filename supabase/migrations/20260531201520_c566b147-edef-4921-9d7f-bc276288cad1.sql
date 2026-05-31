ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS seller_finality_accepted_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS seller_finality_ip text;