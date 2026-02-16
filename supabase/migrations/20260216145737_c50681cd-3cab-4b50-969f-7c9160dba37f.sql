
-- Create favorites table
CREATE TABLE public.favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, listing_id)
);

-- Enable RLS
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own favorites"
ON public.favorites FOR SELECT
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = favorites.user_id AND profiles.user_id = auth.uid()));

CREATE POLICY "Users can add favorites"
ON public.favorites FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = favorites.user_id AND profiles.user_id = auth.uid()));

CREATE POLICY "Users can remove favorites"
ON public.favorites FOR DELETE
USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = favorites.user_id AND profiles.user_id = auth.uid()));
