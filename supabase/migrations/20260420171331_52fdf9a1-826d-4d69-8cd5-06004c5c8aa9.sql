
CREATE TABLE public.seller_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  listing_id UUID,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create reports"
  ON public.seller_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = seller_reports.reporter_id
        AND profiles.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own reports"
  ON public.seller_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = seller_reports.reporter_id
        AND profiles.user_id = auth.uid()
    )
  );

CREATE INDEX idx_seller_reports_seller ON public.seller_reports(seller_id);
CREATE INDEX idx_seller_reports_listing ON public.seller_reports(listing_id);
