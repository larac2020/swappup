REVOKE SELECT (booking_reference, booking_fingerprint) ON public.listings FROM anon, authenticated, PUBLIC;
GRANT SELECT (booking_reference, booking_fingerprint) ON public.listings TO service_role;