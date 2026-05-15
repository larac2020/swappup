-- Index to speed up airline lookup by normalized code
CREATE INDEX IF NOT EXISTS idx_airline_change_fees_code_route ON public.airline_change_fees(airline_code, route_type);

-- Trigger: hard-block listings on airlines marked non-transferable
CREATE OR REPLACE FUNCTION public.enforce_listing_transferable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  norm_code text;
  is_xfer boolean;
BEGIN
  IF NEW.listing_type IS DISTINCT FROM 'flight_ticket' THEN
    RETURN NEW;
  END IF;
  IF NEW.airline IS NULL OR length(trim(NEW.airline)) = 0 THEN
    RETURN NEW;
  END IF;
  IF NEW.is_active IS NOT TRUE THEN
    RETURN NEW;
  END IF;

  norm_code := regexp_replace(lower(NEW.airline), '[^a-z0-9]+', '_', 'g');
  norm_code := regexp_replace(norm_code, '^_|_$', '', 'g');

  SELECT is_transferable INTO is_xfer
  FROM public.airline_change_fees
  WHERE airline_code = norm_code
  ORDER BY last_verified_at DESC
  LIMIT 1;

  IF is_xfer IS NOT NULL AND is_xfer = false THEN
    RAISE EXCEPTION 'NOT_TRANSFERABLE: % does not allow name changes; this listing cannot be published.', NEW.airline;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_listing_transferable ON public.listings;
CREATE TRIGGER trg_enforce_listing_transferable
  BEFORE INSERT OR UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_listing_transferable();

-- When an airline flips to non-transferable, auto-deactivate active listings + notify sellers
CREATE OR REPLACE FUNCTION public.deactivate_listings_on_non_transferable()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  rec record;
  seller_user_id uuid;
BEGIN
  IF NEW.is_transferable = false AND (OLD.is_transferable IS DISTINCT FROM false) THEN
    FOR rec IN
      SELECT l.id, l.seller_id, l.title, l.airline
      FROM public.listings l
      WHERE l.is_active = true
        AND l.listing_type = 'flight_ticket'
        AND regexp_replace(regexp_replace(lower(l.airline), '[^a-z0-9]+', '_', 'g'), '^_|_$', '', 'g') = NEW.airline_code
    LOOP
      UPDATE public.listings SET is_active = false, updated_at = now() WHERE id = rec.id;
      SELECT user_id INTO seller_user_id FROM public.profiles WHERE id = rec.seller_id;
      IF seller_user_id IS NOT NULL THEN
        INSERT INTO public.notifications (user_id, listing_id, type, title, message)
        VALUES (
          seller_user_id,
          rec.id,
          'warning',
          'Listing deactivated',
          format('Your listing "%s" was deactivated because %s no longer allows name changes for this fare.', rec.title, rec.airline)
        );
      END IF;
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_deactivate_on_non_transferable ON public.airline_change_fees;
CREATE TRIGGER trg_deactivate_on_non_transferable
  AFTER UPDATE ON public.airline_change_fees
  FOR EACH ROW EXECUTE FUNCTION public.deactivate_listings_on_non_transferable();

-- Required for scheduled fee refresh
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;