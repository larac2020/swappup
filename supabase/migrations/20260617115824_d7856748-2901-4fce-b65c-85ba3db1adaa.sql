CREATE OR REPLACE FUNCTION public.normalize_booking_ref(_ref text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _ref IS NULL OR length(btrim(_ref)) = 0 THEN NULL
    ELSE upper(regexp_replace(_ref, '[[:space:]\-_]', '', 'g'))
  END
$$;