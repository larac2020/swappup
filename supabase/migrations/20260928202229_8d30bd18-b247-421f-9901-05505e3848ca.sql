CREATE TABLE public.fx_rates (
  currency_code text PRIMARY KEY,
  rate_per_eur numeric NOT NULL CHECK (rate_per_eur > 0),
  fetched_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL
);
GRANT SELECT ON public.fx_rates TO anon, authenticated;
GRANT ALL ON public.fx_rates TO service_role;
ALTER TABLE public.fx_rates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "FX rates are publicly readable" ON public.fx_rates FOR SELECT TO anon, authenticated USING (true);

ALTER TABLE public.listings ADD COLUMN name_change_fee_currency text;

CREATE OR REPLACE FUNCTION public.set_name_change_fee_currency()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE norm_code text; cur text;
BEGIN
  IF NEW.name_change_fee IS NULL OR NEW.airline IS NULL THEN
    NEW.name_change_fee_currency := NULL;
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.name_change_fee IS NOT DISTINCT FROM OLD.name_change_fee
     AND NEW.airline IS NOT DISTINCT FROM OLD.airline
     AND OLD.name_change_fee_currency IS NOT NULL THEN
    NEW.name_change_fee_currency := OLD.name_change_fee_currency;
    RETURN NEW;
  END IF;
  norm_code := regexp_replace(regexp_replace(lower(NEW.airline), '[^a-z0-9]+', '_', 'g'), '^_|_$', '', 'g');
  SELECT upper(currency) INTO cur FROM public.airline_change_fees
   WHERE airline_code = norm_code ORDER BY last_verified_at DESC LIMIT 1;
  NEW.name_change_fee_currency := cur;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_set_name_change_fee_currency
BEFORE INSERT OR UPDATE ON public.listings
FOR EACH ROW EXECUTE FUNCTION public.set_name_change_fee_currency();

DO $$
BEGIN
  BEGIN PERFORM cron.unschedule('refresh-fx-rates-weekdays'); EXCEPTION WHEN OTHERS THEN NULL; END;
  PERFORM cron.schedule('refresh-fx-rates-weekdays', '0 17 * * 1-5', $job$
    SELECT net.http_post(
      url := 'https://oiarehtqhgwkiunsarmz.supabase.co/functions/v1/refresh-fx-rates',
      headers := jsonb_build_object('Content-Type','application/json',
        'Authorization','Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1)),
      body := '{}'::jsonb);
  $job$);
END $$;