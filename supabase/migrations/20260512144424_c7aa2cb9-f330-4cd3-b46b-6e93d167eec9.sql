ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS name_change_risk_acknowledged_at timestamptz;