-- Add bumped_until column to listings for the bump feature
ALTER TABLE public.listings
ADD COLUMN bumped_until timestamp with time zone DEFAULT NULL;

-- Index for efficient querying of bumped listings
CREATE INDEX idx_listings_bumped_until ON public.listings (bumped_until)
WHERE bumped_until IS NOT NULL;