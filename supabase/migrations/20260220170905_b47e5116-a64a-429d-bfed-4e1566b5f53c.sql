-- Create storage bucket for ID document uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('id-documents', 'id-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Users can upload their own ID documents
CREATE POLICY "Users can upload their own ID documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'id-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can view their own ID documents
CREATE POLICY "Users can view their own ID documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'id-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update their own ID documents
CREATE POLICY "Users can update their own ID documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'id-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own ID documents
CREATE POLICY "Users can delete their own ID documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'id-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);