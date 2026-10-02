-- 1. Email queue functions: only the timer (postgres) and the enqueue trigger may run them
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;

-- 2. Public fee view runs with the visitor's permissions
REVOKE SELECT ON public.airline_change_fees FROM anon;
GRANT SELECT (airline_name, route_type, fee_amount, fee_max, currency, is_transferable, last_verified_at, source_url)
  ON public.airline_change_fees TO anon;
DROP POLICY IF EXISTS "Public can read airline fee columns" ON public.airline_change_fees;
CREATE POLICY "Public can read airline fee columns" ON public.airline_change_fees
  FOR SELECT TO anon USING (true);
ALTER VIEW public.public_airline_fees SET (security_invoker = true);
GRANT SELECT ON public.public_airline_fees TO anon, authenticated;

-- 3. Compare against the caller's profile id
CREATE OR REPLACE FUNCTION public.get_my_listing_booking_reference(_listing_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT l.booking_reference
  FROM public.listings l
  JOIN public.profiles p ON p.id = l.seller_id
  WHERE l.id = _listing_id
    AND p.user_id = auth.uid()
$$;