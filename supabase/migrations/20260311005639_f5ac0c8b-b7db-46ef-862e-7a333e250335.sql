
DROP POLICY "Events can only be finalized" ON public.events;
CREATE POLICY "Events can only be finalized"
  ON public.events
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (is_finalized = true);
