ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS seller_reminder_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seller_deadline_warning_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seller_late_warning_sent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS buyer_apology_sent boolean NOT NULL DEFAULT false;

-- Schedule the seller reminder job (every 15 minutes).
DO $$
DECLARE
  v_url text;
  v_key text;
BEGIN
  -- Best-effort fetch of Vault secrets (set by setup_email_infra). If absent, skip scheduling.
  BEGIN
    SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'email_queue_service_role_key' LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_key := NULL;
  END;

  v_url := 'https://oiarehtqhgwkiunsarmz.supabase.co/functions/v1/seller-reminders';

  IF v_key IS NOT NULL THEN
    PERFORM cron.unschedule('seller-reminders');
    PERFORM cron.schedule(
      'seller-reminders',
      '*/15 * * * *',
      format($job$
        SELECT net.http_post(
          url:=%L,
          headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' || %L),
          body:='{}'::jsonb
        );
      $job$, v_url, v_key)
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- ignore; can be scheduled manually later
  NULL;
END $$;