
CREATE TABLE public.data_consent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_analytics boolean NOT NULL DEFAULT true,
  consent_marketing boolean NOT NULL DEFAULT false,
  consent_personalisation boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.data_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consent" ON public.data_consent
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own consent" ON public.data_consent
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own consent" ON public.data_consent
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());
