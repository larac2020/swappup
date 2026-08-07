CREATE OR REPLACE FUNCTION public.get_my_listing_booking_reference(_listing_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT l.booking_reference
  FROM public.listings l
  WHERE l.id = _listing_id
    AND l.seller_id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.get_my_listing_booking_reference(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_listing_booking_reference(uuid) TO authenticated;