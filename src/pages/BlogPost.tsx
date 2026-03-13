import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Heart, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  likes_count: number;
  created_at: string;
}

const BlogPostPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const { toast } = useToast();

  useEffect(() => {
    const likedPosts = JSON.parse(localStorage.getItem("liked_posts") || "[]");
    
    const fetchPost = async () => {
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, slug, content, likes_count, created_at")
        .eq("slug", slug)
        .eq("published", true)
        .single();

      if (!error && data) {
        const typedData = data as BlogPost;
        setPost(typedData);
        setLikesCount(typedData.likes_count);
        setLiked(likedPosts.includes(typedData.id));
        document.title = `${typedData.title} | we.rsvp Blog`;
      }
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  const handleLike = async () => {
    if (!post || liked) return;

    const { error } = await supabase.functions.invoke("manage-blog", {
      body: { action: "like", postId: post.id },
    });

    if (!error) {
      setLiked(true);
      setLikesCount((c) => c + 1);
      const likedPosts = JSON.parse(localStorage.getItem("liked_posts") || "[]");
      localStorage.setItem("liked_posts", JSON.stringify([...likedPosts, post.id]));
      toast({ title: "Thanks for the love! ❤️" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto px-4 py-12 max-w-3xl">
          <div className="h-8 w-48 bg-muted animate-pulse rounded mb-4" />
          <div className="h-64 bg-muted animate-pulse rounded" />
        </main>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto px-4 py-12 max-w-3xl text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Post not found</h1>
          <Link to="/blog">
            <Button variant="outline">← Back to Blog</Button>
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 max-w-3xl">
        <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Blog
        </Link>

        <article>
          <header className="mb-8">
            <Badge variant="secondary" className="mb-3">
              {format(new Date(post.created_at), "MMMM d, yyyy")}
            </Badge>
            <h1 className="text-4xl font-bold text-foreground mb-4">{post.title}</h1>
          </header>

          <div className="prose prose-neutral dark:prose-invert max-w-none mb-8 [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:mt-8 [&_h2]:mb-4 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:mt-6 [&_h3]:mb-3 [&_p]:text-foreground [&_p]:leading-relaxed [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 [&_a]:text-primary [&_a]:underline [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:bg-muted [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_blockquote]:border-l-4 [&_blockquote]:border-primary [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-muted-foreground">
            <ReactMarkdown>{post.content}</ReactMarkdown>
          </div>

          <div className="flex items-center gap-3 pt-6 border-t border-border">
            <Button
              variant={liked ? "default" : "outline"}
              size="sm"
              onClick={handleLike}
              disabled={liked}
              className="gap-2"
            >
              <Heart className={`w-4 h-4 ${liked ? "fill-current" : ""}`} />
              {liked ? "Liked" : "Like this post"}
            </Button>
            <span className="text-sm text-muted-foreground">
              {likesCount} {likesCount === 1 ? "like" : "likes"}
            </span>
          </div>
        </article>
      </main>
      <SiteFooter />
    </div>
  );
};

export default BlogPostPage;
