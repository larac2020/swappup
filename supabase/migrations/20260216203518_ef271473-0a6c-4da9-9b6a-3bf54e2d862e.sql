
ALTER TABLE public.listings ADD COLUMN per_ticket_inclusions jsonb DEFAULT NULL;
COMMENT ON COLUMN public.listings.per_ticket_inclusions IS 'JSON array of per-ticket inclusions when they differ, e.g. [{"luggage":true,"carryOn":true,"meal":false,"speedy":false}, ...]';
