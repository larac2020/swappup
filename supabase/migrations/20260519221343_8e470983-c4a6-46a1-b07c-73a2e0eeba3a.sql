ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS has_payment_method boolean NOT NULL DEFAULT false;

UPDATE public.profiles p
SET has_payment_method = true
WHERE EXISTS (
  SELECT 1 FROM public.listings l WHERE l.seller_id = p.id
);

DROP POLICY IF EXISTS "Verified users can create listings" ON public.listings;

CREATE POLICY "Verified users with payment method can create listings"
ON public.listings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = listings.seller_id
      AND profiles.user_id = auth.uid()
      AND profiles.has_payment_method = true
  )
);