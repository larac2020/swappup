DO $$
DECLARE
  v_key text;
BEGIN
  SELECT decrypted_secret INTO v_key
  FROM vault.decrypted_secrets
  WHERE name = 'email_queue_service_role_key'
  LIMIT 1;

  IF v_key IS NULL THEN
    RAISE EXCEPTION 'No email_queue_service_role_key in vault';
  END IF;

  PERFORM net.http_post(
    url := 'https://oiarehtqhgwkiunsarmz.supabase.co/functions/v1/send-transactional-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    ),
    body := jsonb_build_object(
      'templateName', 'welcome',
      'recipientEmail', 'b000002.test@gmail.com',
      'idempotencyKey', 'welcome-manual-b000002-' || extract(epoch from now())::text,
      'templateData', jsonb_build_object('firstName', 'Buyer2', 'locale', 'en')
    )
  );
END $$;