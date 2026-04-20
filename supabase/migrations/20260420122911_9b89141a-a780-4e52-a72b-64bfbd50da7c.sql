-- Cache table for external flight verification lookups
CREATE TABLE public.flight_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  airline_iata text NOT NULL,
  flight_number text NOT NULL,
  departure_date date NOT NULL,
  status text NOT NULL, -- 'verified' | 'not_found' | 'mismatch'
  verified_airline text,
  verified_origin_iata text,
  verified_destination_iata text,
  verified_origin_city text,
  verified_destination_city text,
  provider text NOT NULL DEFAULT 'aviationstack',
  raw_response jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (airline_iata, flight_number, departure_date)
);

CREATE INDEX idx_flight_verifications_lookup
  ON public.flight_verifications (airline_iata, flight_number, departure_date);

ALTER TABLE public.flight_verifications ENABLE ROW LEVEL SECURITY;

-- Authenticated users may read the cache (non-sensitive schedule data)
CREATE POLICY "Authenticated users can read flight verifications"
  ON public.flight_verifications
  FOR SELECT
  TO authenticated
  USING (true);

-- Only service role writes
CREATE POLICY "Service role manages flight verifications"
  ON public.flight_verifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE TRIGGER update_flight_verifications_updated_at
  BEFORE UPDATE ON public.flight_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();