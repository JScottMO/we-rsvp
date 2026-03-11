
-- Drop the permissive UPDATE policy
DROP POLICY IF EXISTS "Events can only be finalized" ON public.events;

-- Block ALL direct updates from public
CREATE POLICY "No direct UPDATE on events"
  ON public.events
  FOR UPDATE
  TO public
  USING (false);

-- Create a SECURITY DEFINER function that only allows setting finalization fields
CREATE OR REPLACE FUNCTION public.finalize_event(
  p_event_id uuid,
  p_finalized_date text,
  p_finalized_time text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.events
  SET
    is_finalized = true,
    finalized_date = p_finalized_date,
    finalized_time = p_finalized_time,
    updated_at = now()
  WHERE id = p_event_id
    AND is_finalized = false;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found or already finalized';
  END IF;
END;
$$;
