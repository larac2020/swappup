
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS return_travel_class text,
  ADD COLUMN IF NOT EXISTS return_luggage_included boolean,
  ADD COLUMN IF NOT EXISTS return_carry_on_included boolean,
  ADD COLUMN IF NOT EXISTS return_meal_included boolean,
  ADD COLUMN IF NOT EXISTS return_speedy_boarding boolean,
  ADD COLUMN IF NOT EXISTS return_per_ticket_inclusions jsonb;
