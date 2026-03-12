CREATE TABLE public.email_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_signups ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public signup)
CREATE POLICY "Anyone can sign up" ON public.email_signups
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- No one can read signups from the client
CREATE POLICY "No public reads" ON public.email_signups
  FOR SELECT TO anon, authenticated
  USING (false);