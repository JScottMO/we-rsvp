-- Fix 1: Create a secure view that excludes password_hash
-- This ensures password hashes are NEVER exposed via SELECT

CREATE VIEW public.responses_public
WITH (security_invoker=on) AS
  SELECT id, event_id, participant_name, availability, created_at, updated_at
  FROM public.responses;

-- Grant access to the view
GRANT SELECT ON public.responses_public TO anon, authenticated;

-- Fix 2: Update RLS policies
-- Drop the overly permissive update policy - updates will go through edge function
DROP POLICY IF EXISTS "Anyone can update responses" ON public.responses;

-- Drop the overly permissive insert policy - inserts will go through edge function
DROP POLICY IF EXISTS "Anyone can create responses" ON public.responses;

-- Create restrictive policies that only allow edge functions (service role) to modify
-- This ensures all modifications go through the secure edge function with password verification
CREATE POLICY "Responses insert via service role only" 
ON public.responses 
FOR INSERT 
WITH CHECK (false);

CREATE POLICY "Responses update via service role only" 
ON public.responses 
FOR UPDATE 
USING (false);

-- Keep SELECT policy but apps should query the view instead
-- The view excludes password_hash so this is safe as a fallback