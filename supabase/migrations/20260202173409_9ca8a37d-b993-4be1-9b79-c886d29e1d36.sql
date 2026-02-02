-- Create a function to clean up finalized events older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_old_finalized_events()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  -- Delete responses for old finalized events first (due to foreign key)
  DELETE FROM public.responses
  WHERE event_id IN (
    SELECT id FROM public.events
    WHERE is_finalized = true
    AND finalized_date IS NOT NULL
    AND finalized_date::date < CURRENT_DATE - INTERVAL '7 days'
  );
  
  -- Delete the old finalized events
  WITH deleted AS (
    DELETE FROM public.events
    WHERE is_finalized = true
    AND finalized_date IS NOT NULL
    AND finalized_date::date < CURRENT_DATE - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO deleted_count FROM deleted;
  
  RETURN deleted_count;
END;
$$;

-- Enable the required extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;