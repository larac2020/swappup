DO $$
DECLARE
  uid uuid;
BEGIN
  SELECT id INTO uid FROM auth.users WHERE lower(email) = lower('lara.cuttini.cv@gmail.com');
  IF uid IS NULL THEN
    RAISE NOTICE 'No user found';
    RETURN;
  END IF;

  DELETE FROM public.cart_items WHERE user_id = uid;
  DELETE FROM public.watchlist WHERE user_id = uid;
  DELETE FROM public.search_history WHERE user_id = uid;
  DELETE FROM public.notifications WHERE user_id = uid;
  DELETE FROM public.notification_preferences WHERE user_id = uid;
  DELETE FROM public.data_consent WHERE user_id = uid;
  DELETE FROM public.fraud_scores WHERE user_id = uid;
  DELETE FROM public.listing_views WHERE viewer_id IN (SELECT id FROM public.profiles WHERE user_id = uid);
  DELETE FROM public.seller_reports WHERE reporter_id IN (SELECT id FROM public.profiles WHERE user_id = uid) OR seller_id IN (SELECT id FROM public.profiles WHERE user_id = uid);
  DELETE FROM public.name_change_fee_disputes WHERE seller_id IN (SELECT id FROM public.profiles WHERE user_id = uid);
  DELETE FROM public.purchases WHERE buyer_id IN (SELECT id FROM public.profiles WHERE user_id = uid) OR seller_id IN (SELECT id FROM public.profiles WHERE user_id = uid);
  DELETE FROM public.listings WHERE seller_id IN (SELECT id FROM public.profiles WHERE user_id = uid);
  DELETE FROM public.profiles WHERE user_id = uid;
  DELETE FROM auth.users WHERE id = uid;
END $$;