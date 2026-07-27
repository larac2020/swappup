
-- 1) profiles UPDATE: add WITH CHECK
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2) storage.objects: scope id-documents + transfer-proofs policies to authenticated
DROP POLICY IF EXISTS "Users can view their own ID documents" ON storage.objects;
CREATE POLICY "Users can view their own ID documents"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'id-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can upload their own ID documents" ON storage.objects;
CREATE POLICY "Users can upload their own ID documents"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'id-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can update their own ID documents" ON storage.objects;
CREATE POLICY "Users can update their own ID documents"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'id-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Users can delete their own ID documents" ON storage.objects;
CREATE POLICY "Users can delete their own ID documents"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'id-documents' AND (auth.uid())::text = (storage.foldername(name))[1]);

DROP POLICY IF EXISTS "Sellers can read their own uploaded transfer proofs" ON storage.objects;
CREATE POLICY "Sellers can read their own uploaded transfer proofs"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'transfer-proofs' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 3) buyer transfer-proof SELECT: exact path match instead of LIKE '%'||name
DROP POLICY IF EXISTS "Buyers can read transfer proofs for their purchases" ON storage.objects;
CREATE POLICY "Buyers can read transfer proofs for their purchases"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'transfer-proofs'
    AND EXISTS (
      SELECT 1
      FROM public.purchases p
      JOIN public.profiles pr_b ON pr_b.id = p.buyer_id
      WHERE pr_b.user_id = auth.uid()
        AND (
          p.transfer_payment_proof_url = objects.name
          OR p.name_change_proof_url = objects.name
        )
    )
  );
