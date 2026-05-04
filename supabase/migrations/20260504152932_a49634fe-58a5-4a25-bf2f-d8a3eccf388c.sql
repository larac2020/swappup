
CREATE TABLE public.airline_change_fees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_code text NOT NULL,
  airline_name text NOT NULL,
  route_type text NOT NULL DEFAULT 'international',
  fee_amount numeric NOT NULL DEFAULT 0,
  fee_max numeric,
  currency text NOT NULL DEFAULT 'EUR',
  is_transferable boolean NOT NULL DEFAULT true,
  source_url text,
  notes text,
  confidence text NOT NULL DEFAULT 'medium',
  last_verified_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (airline_code, route_type)
);

CREATE INDEX idx_airline_change_fees_code ON public.airline_change_fees(airline_code);

ALTER TABLE public.airline_change_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read airline change fees"
  ON public.airline_change_fees FOR SELECT
  USING (true);

CREATE POLICY "Service role manages airline change fees"
  ON public.airline_change_fees FOR ALL
  TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER update_airline_change_fees_updated_at
  BEFORE UPDATE ON public.airline_change_fees
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
