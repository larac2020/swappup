CREATE POLICY "Purchase parties can view related listing"
ON public.listings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.purchases pu
    JOIN public.profiles pr
      ON pr.id = pu.buyer_id OR pr.id = pu.seller_id
    WHERE pu.listing_id = listings.id
      AND pr.user_id = auth.uid()
  )
);