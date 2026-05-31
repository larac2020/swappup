
CREATE TABLE public.user_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  ip_hash text,
  device_hash text,
  country text,
  user_agent text,
  hit_count integer NOT NULL DEFAULT 1,
  first_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  last_seen_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX user_sessions_unique_fingerprint
  ON public.user_sessions (user_id, COALESCE(ip_hash,''), COALESCE(device_hash,''));
CREATE INDEX user_sessions_ip_hash_idx ON public.user_sessions (ip_hash);
CREATE INDEX user_sessions_device_hash_idx ON public.user_sessions (device_hash);
CREATE INDEX user_sessions_user_id_idx ON public.user_sessions (user_id);

GRANT ALL ON public.user_sessions TO service_role;

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages user sessions"
  ON public.user_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
