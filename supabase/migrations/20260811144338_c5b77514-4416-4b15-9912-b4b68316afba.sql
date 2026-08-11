CREATE OR REPLACE VIEW public.public_airline_fees
WITH (security_invoker = false) AS
SELECT
  a.airline_name,
  a.route_type,
  a.fee_amount,
  a.fee_max,
  a.currency,
  a.is_transferable,
  a.last_verified_at,
  a.source_url
FROM public.airline_change_fees a;

GRANT SELECT ON public.public_airline_fees TO anon, authenticated;

DROP POLICY IF EXISTS "Anyone can read airline change fees" ON public.airline_change_fees;
CREATE POLICY "Authenticated can read airline change fees"
ON public.airline_change_fees
FOR SELECT
TO authenticated
USING (true);