
-- Add transfer-related fields to purchases table
ALTER TABLE public.purchases 
  ADD COLUMN IF NOT EXISTS buyer_full_name text,
  ADD COLUMN IF NOT EXISTS buyer_email text,
  ADD COLUMN IF NOT EXISTS transfer_booking_ref text,
  ADD COLUMN IF NOT EXISTS transfer_surname text,
  ADD COLUMN IF NOT EXISTS transfer_confirmed_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS transfer_deadline timestamp with time zone,
  ADD COLUMN IF NOT EXISTS name_change_fee numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_booking_ref text;

-- Allow sellers to update purchases they are involved in (for transfer confirmation)
CREATE POLICY "Sellers can update their sales"
ON public.purchases
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = purchases.seller_id 
  AND profiles.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = purchases.seller_id 
  AND profiles.user_id = auth.uid()
));
