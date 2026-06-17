
REVOKE EXECUTE ON FUNCTION public.check_duplicate_booking_reference() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enforce_booking_fingerprint() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lock_listing_on_purchase() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_sold_listing_edits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_sold_listing_delete() FROM PUBLIC, anon, authenticated;
