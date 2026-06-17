
CREATE TABLE public.seller_declarations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,
  declaration_version text NOT NULL,
  declaration_text text NOT NULL,
  declaration_locale text,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.seller_declarations TO authenticated;
GRANT ALL ON public.seller_declarations TO service_role;

ALTER TABLE public.seller_declarations ENABLE ROW LEVEL SECURITY;

-- Users can insert their own declaration
CREATE POLICY "Users insert own declaration"
ON public.seller_declarations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can read their own declarations
CREATE POLICY "Users read own declarations"
ON public.seller_declarations
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can read all declarations (for disputes / fraud investigations)
CREATE POLICY "Admins read all declarations"
ON public.seller_declarations
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX seller_declarations_user_id_idx ON public.seller_declarations(user_id);
CREATE INDEX seller_declarations_listing_id_idx ON public.seller_declarations(listing_id);
