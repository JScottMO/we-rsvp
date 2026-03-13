
-- Simple page view counter (privacy-first: no IP, no user data, just a timestamp)
CREATE TABLE public.page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert a page view
CREATE POLICY "Anyone can record a page view"
  ON public.page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- No public reads on raw data
CREATE POLICY "No public reads"
  ON public.page_views FOR SELECT
  TO anon, authenticated
  USING (false);

-- RPC to get site stats without exposing raw data
CREATE OR REPLACE FUNCTION public.get_site_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  event_count bigint;
  view_count bigint;
BEGIN
  SELECT COUNT(*) INTO event_count FROM public.events;
  SELECT COUNT(*) INTO view_count FROM public.page_views;
  RETURN json_build_object('total_events', event_count, 'total_views', view_count);
END;
$$;
