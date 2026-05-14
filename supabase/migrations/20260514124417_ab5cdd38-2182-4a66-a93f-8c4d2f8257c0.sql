-- Rename table
ALTER TABLE public.favorites RENAME TO watchlist;

-- Drop old policy names and recreate under the new feature name
DROP POLICY IF EXISTS "Users can view their own favorites" ON public.watchlist;
DROP POLICY IF EXISTS "Users can add favorites" ON public.watchlist;
DROP POLICY IF EXISTS "Users can remove favorites" ON public.watchlist;

CREATE POLICY "Users can view their watchlist"
ON public.watchlist FOR SELECT
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = watchlist.user_id AND profiles.user_id = auth.uid()));

CREATE POLICY "Users can add to their watchlist"
ON public.watchlist FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = watchlist.user_id AND profiles.user_id = auth.uid()));

CREATE POLICY "Users can remove from their watchlist"
ON public.watchlist FOR DELETE
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = watchlist.user_id AND profiles.user_id = auth.uid()));

-- Tracking columns for the daily digest
ALTER TABLE public.watchlist
  ADD COLUMN IF NOT EXISTS last_notified_price numeric,
  ADD COLUMN IF NOT EXISTS notified_unavailable_at timestamptz;

-- Notification preference toggle
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS watchlist_emails boolean NOT NULL DEFAULT true;