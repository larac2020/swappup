CREATE OR REPLACE FUNCTION public.before_purchase_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  IF EXISTS (
    SELECT 1 FROM public.purchases
    WHERE listing_id = NEW.listing_id
      AND status IN ('pending','pending_transfer','transfer_confirmed','completed')
  ) THEN
    RAISE EXCEPTION 'LISTING_UNAVAILABLE: This listing already has an active purchase';
  END IF;

  RETURN NEW;
END;
$function$;