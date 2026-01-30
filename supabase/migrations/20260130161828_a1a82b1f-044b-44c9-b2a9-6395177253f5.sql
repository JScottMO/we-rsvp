-- Drop and recreate the responses_public view WITHOUT security_invoker
-- This allows the view to bypass RLS on the base table while still hiding sensitive fields

DROP VIEW IF EXISTS public.responses_public;

CREATE VIEW public.responses_public AS
  SELECT 
    id,
    event_id,
    participant_name,
    availability,
    created_at,
    updated_at
  FROM public.responses;
  -- Note: Excludes participant_password_hash for security

-- Grant access to the view
GRANT SELECT ON public.responses_public TO anon;
GRANT SELECT ON public.responses_public TO authenticated;