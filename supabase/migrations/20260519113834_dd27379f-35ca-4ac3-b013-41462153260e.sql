
-- Fix cart_items policies: user_id stores profiles.id, not auth.uid()
DROP POLICY IF EXISTS "Users can view their own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can add to their own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can update their own cart" ON public.cart_items;
DROP POLICY IF EXISTS "Users can delete from their own cart" ON public.cart_items;

CREATE POLICY "Users can view their own cart" ON public.cart_items
  FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can add to their own cart" ON public.cart_items
  FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own cart" ON public.cart_items
  FOR UPDATE TO authenticated
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete from their own cart" ON public.cart_items
  FOR DELETE TO authenticated
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Fix search_history policies: user_id stores profiles.id
DROP POLICY IF EXISTS "Users can view their own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can add to their search history" ON public.search_history;

CREATE POLICY "Users can view their own search history" ON public.search_history
  FOR SELECT TO authenticated
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can add to their search history" ON public.search_history
  FOR INSERT TO authenticated
  WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- Restrict fraud_scores to service_role only (hide internal risk data from end users)
DROP POLICY IF EXISTS "Users can view their own fraud score" ON public.fraud_scores;
