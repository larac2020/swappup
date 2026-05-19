-- Remove the permissive public INSERT policy
DROP POLICY IF EXISTS "Users can create purchases" ON public.purchases;

-- Explicit deny policies for all client-side mutations.
-- Service role bypasses RLS, so edge functions continue to work.
CREATE POLICY "No client inserts on purchases"
  ON public.purchases FOR INSERT TO authenticated
  WITH CHECK (false);

CREATE POLICY "No client updates on purchases"
  ON public.purchases FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "No client deletes on purchases"
  ON public.purchases FOR DELETE TO authenticated
  USING (false);