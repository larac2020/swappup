DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = 'lara.cuttini.cv@gmail.com';
  IF uid IS NOT NULL THEN
    DELETE FROM public.notifications WHERE user_id = uid;
    DELETE FROM public.notification_preferences WHERE user_id = uid;
    DELETE FROM public.data_consent WHERE user_id = uid;
    DELETE FROM public.fraud_scores WHERE user_id = uid;
    DELETE FROM public.search_history WHERE user_id = uid;
    DELETE FROM public.watchlist WHERE user_id = uid;
    DELETE FROM public.cart_items WHERE user_id = uid;
    DELETE FROM public.profiles WHERE user_id = uid;
    DELETE FROM auth.users WHERE id = uid;
  END IF;
END $$;