ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS name_change_fee_original numeric,
  ADD COLUMN IF NOT EXISTS name_change_fee_original_currency text,
  ADD COLUMN IF NOT EXISTS fx_rate_used numeric,
  ADD COLUMN IF NOT EXISTS fx_rate_fetched_at timestamptz;

CREATE OR REPLACE FUNCTION public.lock_purchase_fx_fields()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  IF NEW.name_change_fee IS DISTINCT FROM OLD.name_change_fee
     OR NEW.total_price IS DISTINCT FROM OLD.total_price
     OR NEW.name_change_fee_original IS DISTINCT FROM OLD.name_change_fee_original
     OR NEW.name_change_fee_original_currency IS DISTINCT FROM OLD.name_change_fee_original_currency
     OR NEW.fx_rate_used IS DISTINCT FROM OLD.fx_rate_used
     OR NEW.fx_rate_fetched_at IS DISTINCT FROM OLD.fx_rate_fetched_at THEN
    RAISE EXCEPTION 'PROTECTED_COLUMNS: purchase amounts and FX rate are locked at checkout';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_lock_purchase_fx_fields ON public.purchases;
CREATE TRIGGER trg_lock_purchase_fx_fields BEFORE UPDATE ON public.purchases
FOR EACH ROW EXECUTE FUNCTION public.lock_purchase_fx_fields();