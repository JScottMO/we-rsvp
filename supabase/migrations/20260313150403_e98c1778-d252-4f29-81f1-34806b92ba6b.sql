
ALTER TABLE public.blog_posts ADD COLUMN scheduled_at timestamp with time zone DEFAULT NULL;

-- Update RLS policy to only show published posts that are either not scheduled or past their schedule time
DROP POLICY "Published posts are publicly readable" ON public.blog_posts;
CREATE POLICY "Published posts are publicly readable" ON public.blog_posts
  FOR SELECT TO public
  USING (published = true AND (scheduled_at IS NULL OR scheduled_at <= now()));
