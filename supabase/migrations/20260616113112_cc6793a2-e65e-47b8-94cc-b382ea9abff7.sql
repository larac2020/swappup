ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS id_document_type text,
  ADD COLUMN IF NOT EXISTS id_document_country text,
  ADD COLUMN IF NOT EXISTS id_document_expiry date,
  ADD COLUMN IF NOT EXISTS id_document_first_name text,
  ADD COLUMN IF NOT EXISTS id_document_last_name text,
  ADD COLUMN IF NOT EXISTS id_document_dob date,
  ADD COLUMN IF NOT EXISTS id_document_number_last4 text;