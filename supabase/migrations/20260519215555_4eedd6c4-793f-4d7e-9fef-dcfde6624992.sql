
CREATE TABLE public.airline_change_fee_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_code text NOT NULL,
  route_type text NOT NULL DEFAULT 'international',
  previous_fee numeric,
  new_fee numeric,
  previous_currency text,
  new_currency text,
  previous_is_transferable boolean,
  new_is_transferable boolean,
  source_url text,
  confidence text,
  accepted boolean NOT NULL DEFAULT false,
  rejection_reason text,
  notes text,
  run_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.airline_change_fee_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages fee history"
  ON public.airline_change_fee_history FOR ALL
  TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_fee_history_airline_run ON public.airline_change_fee_history (airline_code, run_at DESC);

CREATE TABLE public.airline_fee_review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  airline_code text NOT NULL,
  airline_name text,
  route_type text NOT NULL DEFAULT 'international',
  current_fee numeric,
  proposed_fee numeric NOT NULL,
  current_currency text,
  proposed_currency text,
  current_is_transferable boolean,
  proposed_is_transferable boolean,
  reason text NOT NULL,
  source_url text,
  confidence text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewer_notes text
);
ALTER TABLE public.airline_fee_review_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages fee review queue"
  ON public.airline_fee_review_queue FOR ALL
  TO service_role USING (true) WITH CHECK (true);
CREATE INDEX idx_fee_review_status ON public.airline_fee_review_queue (status, created_at DESC);
