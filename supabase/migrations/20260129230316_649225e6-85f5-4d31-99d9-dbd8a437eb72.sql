-- Add explicit deny policies for UPDATE and DELETE on events table
-- This makes it clear that events cannot be modified or deleted by anyone

CREATE POLICY "Events cannot be deleted"
ON public.events
FOR DELETE
USING (false);

CREATE POLICY "Events cannot be updated"
ON public.events
FOR UPDATE
USING (false);