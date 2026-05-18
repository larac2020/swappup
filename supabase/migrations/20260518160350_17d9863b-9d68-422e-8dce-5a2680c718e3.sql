
-- =====================================================================
-- 1. PROFILES: owner-only base table + public_profiles safe view
-- =====================================================================
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Safe public view exposing only non-sensitive columns.
-- Owned by postgres; underlying RLS is bypassed but the view exposes
-- nothing private. Only authenticated role gets SELECT.
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles
WITH (security_invoker = off) AS
SELECT
  id,
  user_id,
  full_name,
  avatar_url,
  verification_status,
  transactions_bought,
  transactions_sold,
  created_at
FROM public.profiles;

REVOKE ALL ON public.public_profiles FROM anon, authenticated, public;
GRANT SELECT ON public.public_profiles TO authenticated;

-- =====================================================================
-- 2. PURCHASES: split buyer vs seller, seller goes through safe view
-- =====================================================================
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;

CREATE POLICY "Buyers can view their own purchases"
ON public.purchases
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = purchases.buyer_id
      AND p.user_id = auth.uid()
  )
);

-- Seller-facing view: masks buyer PII and payment identifiers.
DROP VIEW IF EXISTS public.seller_purchases;
CREATE VIEW public.seller_purchases
WITH (security_invoker = off) AS
SELECT
  p.id,
  p.listing_id,
  p.seller_id,
  p.buyer_id,
  p.quantity,
  p.total_price,
  p.status,
  p.escrow_status,
  p.escrow_deadline,
  p.transfer_deadline,
  p.seller_transferred,
  p.buyer_confirmed,
  p.name_change_fee,
  p.transfer_booking_ref,
  p.transfer_surname,
  p.transfer_confirmed_at,
  p.seller_reminder_sent,
  p.seller_deadline_warning_sent,
  p.seller_late_warning_sent,
  p.created_at
FROM public.purchases p
WHERE EXISTS (
  SELECT 1 FROM public.profiles pr
  WHERE pr.id = p.seller_id
    AND pr.user_id = auth.uid()
);

REVOKE ALL ON public.seller_purchases FROM anon, authenticated, public;
GRANT SELECT ON public.seller_purchases TO authenticated;

-- =====================================================================
-- 3. FLIGHT_VERIFICATIONS: service-role only
-- =====================================================================
DROP POLICY IF EXISTS "Authenticated users can read flight verifications" ON public.flight_verifications;

-- =====================================================================
-- 4. LISTING_VIEWS: hide viewer_id; expose aggregate counts only
-- =====================================================================
DROP POLICY IF EXISTS "Sellers can view stats for their listings" ON public.listing_views;

CREATE OR REPLACE FUNCTION public.get_listing_view_counts(_listing_ids uuid[])
RETURNS TABLE(listing_id uuid, view_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT lv.listing_id, COUNT(*)::bigint AS view_count
  FROM public.listing_views lv
  WHERE lv.listing_id = ANY(_listing_ids)
    AND EXISTS (
      SELECT 1 FROM public.listings l
      JOIN public.profiles p ON p.id = l.seller_id
      WHERE l.id = lv.listing_id
        AND p.user_id = auth.uid()
    )
  GROUP BY lv.listing_id;
$$;

REVOKE EXECUTE ON FUNCTION public.get_listing_view_counts(uuid[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_listing_view_counts(uuid[]) TO authenticated;
