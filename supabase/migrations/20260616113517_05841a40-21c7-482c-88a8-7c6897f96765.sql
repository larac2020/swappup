REVOKE EXECUTE ON FUNCTION public.deactivate_past_listings() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.deactivate_past_listings() TO service_role;