
-- Drop the views; replace with SECURITY DEFINER functions that
-- internally check ownership and return only safe columns.
DROP VIEW IF EXISTS public.public_profiles;
DROP VIEW IF EXISTS public.seller_purchases;

-- ---------------------------------------------------------------------
-- Public profile lookup: returns safe fields for one or many profiles.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_public_profiles(_profile_ids uuid[])
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  avatar_url text,
  verification_status verification_status,
  transactions_bought integer,
  transactions_sold integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id,
    p.user_id,
    p.full_name,
    p.avatar_url,
    p.verification_status,
    p.transactions_bought,
    p.transactions_sold,
    p.created_at
  FROM public.profiles p
  WHERE p.id = ANY(_profile_ids)
    AND auth.uid() IS NOT NULL;
$$;

REVOKE EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_public_profiles(uuid[]) TO authenticated;

-- ---------------------------------------------------------------------
-- Seller purchases: returns the caller's sales with buyer PII masked.
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_seller_purchases(_statuses text[] DEFAULT NULL)
RETURNS TABLE(
  id uuid,
  listing_id uuid,
  seller_id uuid,
  buyer_id uuid,
  quantity integer,
  total_price numeric,
  status text,
  escrow_status text,
  escrow_deadline timestamptz,
  transfer_deadline timestamptz,
  seller_transferred boolean,
  buyer_confirmed boolean,
  name_change_fee numeric,
  transfer_booking_ref text,
  transfer_surname text,
  transfer_confirmed_at timestamptz,
  seller_reminder_sent boolean,
  seller_deadline_warning_sent boolean,
  seller_late_warning_sent boolean,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    pu.id, pu.listing_id, pu.seller_id, pu.buyer_id, pu.quantity, pu.total_price,
    pu.status, pu.escrow_status, pu.escrow_deadline, pu.transfer_deadline,
    pu.seller_transferred, pu.buyer_confirmed, pu.name_change_fee,
    pu.transfer_booking_ref, pu.transfer_surname, pu.transfer_confirmed_at,
    pu.seller_reminder_sent, pu.seller_deadline_warning_sent, pu.seller_late_warning_sent,
    pu.created_at
  FROM public.purchases pu
  JOIN public.profiles pr ON pr.id = pu.seller_id
  WHERE pr.user_id = auth.uid()
    AND (_statuses IS NULL OR pu.status = ANY(_statuses))
  ORDER BY pu.created_at DESC;
$$;

REVOKE EXECUTE ON FUNCTION public.get_seller_purchases(text[]) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.get_seller_purchases(text[]) TO authenticated;
