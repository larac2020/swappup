ALTER TABLE public.profiles
ADD COLUMN preferred_language text NOT NULL DEFAULT 'en'
CHECK (preferred_language IN ('en', 'it'));

CREATE INDEX IF NOT EXISTS idx_profiles_email_lower ON public.profiles (lower(email));