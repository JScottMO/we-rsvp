-- Blog posts table
CREATE TABLE public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  published boolean NOT NULL DEFAULT false,
  likes_count integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Published posts are publicly readable"
  ON public.blog_posts FOR SELECT TO public
  USING (published = true);

-- No direct insert/update/delete from client (admin goes through edge function)
CREATE POLICY "No direct insert"
  ON public.blog_posts FOR INSERT TO public
  WITH CHECK (false);

CREATE POLICY "No direct update"
  ON public.blog_posts FOR UPDATE TO public
  USING (false);

CREATE POLICY "No direct delete"
  ON public.blog_posts FOR DELETE TO public
  USING (false);

-- Function to increment likes (anonymous, no tracking)
CREATE OR REPLACE FUNCTION public.like_blog_post(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.blog_posts
  SET likes_count = likes_count + 1
  WHERE id = post_id AND published = true;
END;
$$;

-- Trigger for updated_at
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON public.blog_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();