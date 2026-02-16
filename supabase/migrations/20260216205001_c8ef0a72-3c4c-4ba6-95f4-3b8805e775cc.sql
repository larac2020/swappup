
-- Track listing views for stats
CREATE TABLE public.listing_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  viewed_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(listing_id, viewer_id)
);

-- Enable RLS
ALTER TABLE public.listing_views ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert a view (upsert pattern)
CREATE POLICY "Users can record views"
ON public.listing_views
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = listing_views.viewer_id AND profiles.user_id = auth.uid()
));

-- Sellers can see view counts for their own listings
CREATE POLICY "Sellers can view stats for their listings"
ON public.listing_views
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM listings
  JOIN profiles ON profiles.id = listings.seller_id
  WHERE listings.id = listing_views.listing_id AND profiles.user_id = auth.uid()
));

-- Also allow viewers to see their own views (for upsert conflict detection)
CREATE POLICY "Users can see their own views"
ON public.listing_views
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles WHERE profiles.id = listing_views.viewer_id AND profiles.user_id = auth.uid()
));

-- Index for fast count queries
CREATE INDEX idx_listing_views_listing_id ON public.listing_views(listing_id);
