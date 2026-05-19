
DROP POLICY IF EXISTS "Sellers can update their transfer proofs" ON storage.objects;

CREATE POLICY "Sellers can update their transfer proofs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'transfer-proofs'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1
    FROM public.purchases p
    JOIN public.profiles pr ON pr.id = p.seller_id
    WHERE pr.user_id = auth.uid()
      AND split_part(split_part(name, '/', 2), '-', 1) = p.id::text
  )
)
WITH CHECK (
  bucket_id = 'transfer-proofs'
  AND (auth.uid())::text = (storage.foldername(name))[1]
  AND EXISTS (
    SELECT 1
    FROM public.purchases p
    JOIN public.profiles pr ON pr.id = p.seller_id
    WHERE pr.user_id = auth.uid()
      AND split_part(split_part(name, '/', 2), '-', 1) = p.id::text
  )
);
