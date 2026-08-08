ALTER TABLE public.listings DISABLE TRIGGER trg_prevent_sold_listing_delete;
ALTER TABLE public.listings DISABLE TRIGGER trg_prevent_sold_listing_edits;

DELETE FROM public.cart_items;
DELETE FROM public.listing_views;
DELETE FROM public.watchlist;
DELETE FROM public.notifications WHERE listing_id IS NOT NULL;
DELETE FROM public.sold_bookings;
DELETE FROM public.purchases;
DELETE FROM public.listings;

ALTER TABLE public.listings ENABLE TRIGGER trg_prevent_sold_listing_delete;
ALTER TABLE public.listings ENABLE TRIGGER trg_prevent_sold_listing_edits;