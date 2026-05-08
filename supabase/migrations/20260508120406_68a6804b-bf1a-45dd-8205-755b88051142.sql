-- Add column for payment proof
ALTER TABLE public.purchases
ADD COLUMN IF NOT EXISTS transfer_payment_proof_url text;

-- Create private storage bucket for transfer proofs
INSERT INTO storage.buckets (id, name, public)
VALUES ('transfer-proofs', 'transfer-proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Sellers can upload proofs into a folder named after their auth uid
CREATE POLICY "Sellers can upload their transfer proofs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'transfer-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Sellers can update their transfer proofs"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'transfer-proofs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Buyer or seller of the related purchase can read the proof
CREATE POLICY "Buyer or seller can read transfer proofs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'transfer-proofs'
  AND EXISTS (
    SELECT 1 FROM public.purchases p
    JOIN public.profiles pr_b ON pr_b.id = p.buyer_id
    LEFT JOIN public.profiles pr_s ON pr_s.id = p.seller_id
    WHERE p.transfer_payment_proof_url LIKE '%' || storage.objects.name
      AND (pr_b.user_id = auth.uid() OR pr_s.user_id = auth.uid())
  )
);