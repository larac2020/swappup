ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS declared_fare_type text,
  ADD COLUMN IF NOT EXISTS fare_gate_attested_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS fare_gate_attested_by uuid;