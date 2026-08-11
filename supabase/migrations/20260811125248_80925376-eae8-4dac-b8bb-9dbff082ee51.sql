-- 1. Tombstone marker on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS anonymized_at timestamptz;

-- 2. Profile survives deletion of the auth user
ALTER TABLE public.profiles ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_user_id_fkey FOREIGN KEY (user_id)
  REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Listings must never cascade-delete with a profile
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_seller_id_fkey;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_seller_id_fkey FOREIGN KEY (seller_id)
  REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- 4. Purchases keep pointing at the tombstoned profile
ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS purchases_buyer_id_fkey;
ALTER TABLE public.purchases
  ADD CONSTRAINT purchases_buyer_id_fkey FOREIGN KEY (buyer_id)
  REFERENCES public.profiles(id) ON DELETE RESTRICT;

ALTER TABLE public.purchases DROP CONSTRAINT IF EXISTS purchases_seller_id_fkey;
ALTER TABLE public.purchases
  ADD CONSTRAINT purchases_seller_id_fkey FOREIGN KEY (seller_id)
  REFERENCES public.profiles(id) ON DELETE RESTRICT;

-- 5. Allow the service role to set the tombstone marker (trigger already exits early
--    for service_role; this keeps user-side updates blocked on the new column too).
CREATE OR REPLACE FUNCTION public.prevent_protected_profile_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;

  IF NEW.has_payment_method        IS DISTINCT FROM OLD.has_payment_method
     OR NEW.verification_status    IS DISTINCT FROM OLD.verification_status
     OR NEW.transactions_bought    IS DISTINCT FROM OLD.transactions_bought
     OR NEW.transactions_sold      IS DISTINCT FROM OLD.transactions_sold
     OR NEW.id_document_url        IS DISTINCT FROM OLD.id_document_url
     OR NEW.id_document_type       IS DISTINCT FROM OLD.id_document_type
     OR NEW.id_document_country    IS DISTINCT FROM OLD.id_document_country
     OR NEW.id_document_expiry     IS DISTINCT FROM OLD.id_document_expiry
     OR NEW.id_document_first_name IS DISTINCT FROM OLD.id_document_first_name
     OR NEW.id_document_last_name  IS DISTINCT FROM OLD.id_document_last_name
     OR NEW.id_document_dob        IS DISTINCT FROM OLD.id_document_dob
     OR NEW.id_document_number_last4 IS DISTINCT FROM OLD.id_document_number_last4
     OR NEW.account_status         IS DISTINCT FROM OLD.account_status
     OR NEW.payouts_frozen         IS DISTINCT FROM OLD.payouts_frozen
     OR NEW.fraud_case_id          IS DISTINCT FROM OLD.fraud_case_id
     OR NEW.anonymized_at          IS DISTINCT FROM OLD.anonymized_at
     OR NEW.user_id                IS DISTINCT FROM OLD.user_id
  THEN
    RAISE EXCEPTION 'PROTECTED_COLUMNS: protected fields can only be updated by the server';
  END IF;

  RETURN NEW;
END;
$function$;