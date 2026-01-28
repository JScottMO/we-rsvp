-- Fix: Remove public SELECT access to responses table (protects password hashes)
-- The application uses responses_public view which excludes password_hash

-- Step 1: Drop the overly permissive SELECT policy on responses table
DROP POLICY IF EXISTS "Responses are publicly readable" ON public.responses;

-- Step 2: Create a new SELECT policy that denies all direct access
-- (service role still has access for edge functions)
CREATE POLICY "No direct SELECT on responses"
  ON public.responses
  FOR SELECT
  USING (false);

-- Step 3: Ensure the responses_public view is accessible
-- Grant SELECT on the view to anon and authenticated roles
GRANT SELECT ON public.responses_public TO anon, authenticated;