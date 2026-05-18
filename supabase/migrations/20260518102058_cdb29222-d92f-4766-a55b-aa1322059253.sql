
DO $$
DECLARE
  v_user_id uuid;
  v_profile_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'lara.cuttini.cv@gmail.com';
  IF v_user_id IS NULL THEN
    RAISE NOTICE 'No user found';
    RETURN;
  END IF;

  SELECT id INTO v_profile_id FROM public.profiles WHERE user_id = v_user_id;

  IF v_profile_id IS NOT NULL THEN
    DELETE FROM public.cart_items WHERE user_id = v_profile_id;
    DELETE FROM public.watchlist WHERE user_id = v_profile_id;
    DELETE FROM public.search_history WHERE user_id = v_profile_id;
    DELETE FROM public.listing_views WHERE viewer_id = v_profile_id;
    DELETE FROM public.seller_reports WHERE reporter_id = v_profile_id OR seller_id = v_profile_id;
    DELETE FROM public.name_change_fee_disputes WHERE seller_id = v_profile_id;
    DELETE FROM public.purchases WHERE buyer_id = v_profile_id OR seller_id = v_profile_id;
    DELETE FROM public.listings WHERE seller_id = v_profile_id;
  END IF;

  DELETE FROM public.notifications WHERE user_id = v_user_id;
  DELETE FROM public.notification_preferences WHERE user_id = v_user_id;
  DELETE FROM public.data_consent WHERE user_id = v_user_id;
  DELETE FROM public.fraud_scores WHERE user_id = v_user_id;
  DELETE FROM public.profiles WHERE user_id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
END $$;
