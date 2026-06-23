
DROP POLICY IF EXISTS "Buyer or seller can read transfer proofs" ON storage.objects;

CREATE POLICY "Buyers can read transfer proofs for their purchases"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'transfer-proofs'
  AND EXISTS (
    SELECT 1
    FROM public.purchases p
    JOIN public.profiles pr_b ON pr_b.id = p.buyer_id
    WHERE (p.transfer_payment_proof_url LIKE ('%' || objects.name)
        OR p.name_change_proof_url      LIKE ('%' || objects.name))
      AND pr_b.user_id = auth.uid()
  )
);

CREATE POLICY "Sellers can read their own uploaded transfer proofs"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'transfer-proofs'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);
