ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'EUR';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS preferred_currency text NOT NULL DEFAULT 'EUR';