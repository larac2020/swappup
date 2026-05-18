-- Add DELETE policy for transfer-proofs storage bucket (owner-scoped)
CREATE POLICY "Users can delete their own transfer proofs"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'transfer-proofs' AND (auth.uid())::text = (storage.foldername(name))[1]);