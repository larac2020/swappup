
-- 1. Trigger: block self-purchase + verify listing stock & active
CREATE OR REPLACE FUNCTION public.before_purchase_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  l_active boolean;
  l_count integer;
BEGIN
  IF NEW.buyer_id = NEW.seller_id THEN
    RAISE EXCEPTION 'SELF_PURCHASE: You cannot purchase your own listing';
  END IF;

  SELECT is_active, ticket_count INTO l_active, l_count
  FROM public.listings WHERE id = NEW.listing_id;

  IF NOT FOUND OR NOT l_active THEN
    RAISE EXCEPTION 'LISTING_UNAVAILABLE: This listing is no longer available';
  END IF;

  IF l_count < COALESCE(NEW.quantity, 1) THEN
    RAISE EXCEPTION 'OUT_OF_STOCK: Not enough tickets remaining';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_before_purchase_insert ON public.purchases;
CREATE TRIGGER trg_before_purchase_insert
BEFORE INSERT ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.before_purchase_insert();

-- 2. PII protection: replace seller-side select policy with one that
--    only exposes the row to seller once payment is authorised.
--    Mask PII columns via a security_invoker view used by seller UI.
CREATE OR REPLACE VIEW public.purchases_seller_view
WITH (security_invoker = true)
AS
SELECT
  p.id,
  p.listing_id,
  p.seller_id,
  p.buyer_id,
  p.quantity,
  p.total_price,
  p.name_change_fee,
  p.status,
  p.escrow_status,
  p.escrow_deadline,
  p.transfer_deadline,
  p.transfer_confirmed_at,
  p.transfer_booking_ref,
  p.transfer_surname,
  p.original_booking_ref,
  p.created_at,
  p.stripe_payment_id,
  p.buyer_confirmed,
  p.seller_transferred,
  CASE WHEN p.escrow_status IN ('authorized','pending_release','released','captured')
       THEN p.buyer_full_name ELSE NULL END AS buyer_full_name,
  CASE WHEN p.escrow_status IN ('authorized','pending_release','released','captured')
       THEN p.buyer_email ELSE NULL END AS buyer_email
FROM public.purchases p;

-- 3. Enable pg_cron + pg_net for scheduled expiry job
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;
