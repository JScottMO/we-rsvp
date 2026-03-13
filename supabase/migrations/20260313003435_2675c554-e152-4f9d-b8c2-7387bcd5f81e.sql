
-- Persistent counter for cumulative events created
CREATE TABLE public.site_counters (
  key text PRIMARY KEY,
  value bigint NOT NULL DEFAULT 0
);

ALTER TABLE public.site_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access" ON public.site_counters FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);

-- Seed with current event count
INSERT INTO public.site_counters (key, value)
SELECT 'total_events_created', COUNT(*) FROM public.events;

-- Trigger to increment counter on new event
CREATE OR REPLACE FUNCTION public.increment_event_counter()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.site_counters SET value = value + 1 WHERE key = 'total_events_created';
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_event_created
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.increment_event_counter();

-- Update stats function with persistent event counter and 244 view offset
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
  SELECT value INTO event_count FROM public.site_counters WHERE key = 'total_events_created';
  SELECT COUNT(*) + 244 INTO view_count FROM public.page_views;
  RETURN json_build_object('total_events', COALESCE(event_count, 0), 'total_views', view_count);
END;
$$;
