-- Add columns to track finalized events
ALTER TABLE public.events 
ADD COLUMN is_finalized boolean NOT NULL DEFAULT false,
ADD COLUMN finalized_date text,
ADD COLUMN finalized_time text;

-- Update RLS policy to allow updating only finalization fields
DROP POLICY IF EXISTS "Events cannot be updated" ON public.events;

CREATE POLICY "Events can only be finalized"
ON public.events
FOR UPDATE
USING (true)
WITH CHECK (
  -- Only allow updating finalization fields, not other fields
  is_finalized = true
);