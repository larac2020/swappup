-- Welcome email idempotency guard
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at timestamptz;

-- Update handle_new_user to enqueue a welcome email via send-transactional-email.
-- Uses the same vault secret pattern as the email queue infra.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_key text;
  v_url text := 'https://oiarehtqhgwkiunsarmz.supabase.co/functions/v1/send-transactional-email';
  v_first_name text;
BEGIN
  INSERT INTO public.profiles (user_id, email)
  VALUES (NEW.id, NEW.email);

  -- Best-effort: fire welcome email. Never block signup if anything goes wrong.
  BEGIN
    -- Idempotency: only fire if not already sent for this user
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE user_id = NEW.id AND welcome_email_sent_at IS NOT NULL
    ) AND NEW.email IS NOT NULL THEN
      BEGIN
        SELECT decrypted_secret INTO v_key
        FROM vault.decrypted_secrets
        WHERE name = 'email_queue_service_role_key'
        LIMIT 1;
      EXCEPTION WHEN OTHERS THEN
        v_key := NULL;
      END;

      -- Try to grab a first name from Google OAuth metadata (falls back to NULL).
      v_first_name := COALESCE(
        NEW.raw_user_meta_data->>'given_name',
        NEW.raw_user_meta_data->>'first_name',
        split_part(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''), ' ', 1)
      );
      IF v_first_name = '' THEN v_first_name := NULL; END IF;

      IF v_key IS NOT NULL THEN
        PERFORM net.http_post(
          url := v_url,
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || v_key
          ),
          body := jsonb_build_object(
            'templateName', 'welcome',
            'recipientEmail', NEW.email,
            'idempotencyKey', 'welcome-' || NEW.id::text,
            'templateData', jsonb_build_object(
              'firstName', v_first_name,
              'locale', 'en'
            )
          )
        );

        UPDATE public.profiles
          SET welcome_email_sent_at = now()
          WHERE user_id = NEW.id;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Never fail user signup because of email enqueue issues
    NULL;
  END;

  RETURN NEW;
END;
$function$;