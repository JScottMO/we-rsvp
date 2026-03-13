import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Edit, Eye, EyeOff, Plus } from "lucide-react";
import { format } from "date-fns";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  published: boolean;
  likes_count: number;
  created_at: string;
  scheduled_at: string | null;
}

const BlogAdmin = () => {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [creating, setCreating] = useState(false);
  const { toast } = useToast();

  // Form state
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [published, setPublished] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");

  const callApi = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("manage-blog", {
      body: { ...body, password },
    });
    if (error) throw error;
    return data;
  };

  const login = async () => {
    try {
      setLoading(true);
      const data = await callApi({ action: "list-all" });
      setPosts(data as BlogPost[]);
      setAuthenticated(true);
    } catch {
      toast({ title: "Invalid password", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const refreshPosts = async () => {
    try {
      const data = await callApi({ action: "list-all" });
      setPosts(data as BlogPost[]);
    } catch (e) {
      console.error(e);
    }
  };

  const generateSlug = (t: string) => {
    return t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setContent("");
    setExcerpt("");
    setPublished(false);
    setScheduledAt("");
    setEditing(null);
    setCreating(false);
  };

  const startCreate = () => {
    resetForm();
    setCreating(true);
  };

  const startEdit = (post: BlogPost) => {
    setTitle(post.title);
    setSlug(post.slug);
    setContent(post.content);
    setExcerpt(post.excerpt || "");
    setPublished(post.published);
    setScheduledAt(post.scheduled_at ? post.scheduled_at.slice(0, 16) : "");
    setEditing(post);
    setCreating(false);
  };

  const handleSave = async () => {
    if (!title.trim() || !slug.trim() || !content.trim()) {
      toast({ title: "Title, slug, and content are required", variant: "destructive" });
      return;
    }

    try {
      setLoading(true);
      if (editing) {
        await callApi({
          action: "update",
          postId: editing.id,
          title,
          slug,
          content,
          excerpt: excerpt || null,
          published,
        });
        toast({ title: "Post updated" });
      } else {
        await callApi({
          action: "create",
          title,
          slug,
          content,
          excerpt: excerpt || null,
          published,
        });
        toast({ title: "Post created" });
      }
      resetForm();
      await refreshPosts();
    } catch (e: any) {
      toast({ title: e.message || "Error saving post", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (postId: string) => {
    if (!confirm("Delete this post?")) return;
    try {
      await callApi({ action: "delete", postId });
      toast({ title: "Post deleted" });
      await refreshPosts();
    } catch (e: any) {
      toast({ title: e.message || "Error deleting", variant: "destructive" });
    }
  };

  const togglePublish = async (post: BlogPost) => {
    try {
      await callApi({ action: "update", postId: post.id, published: !post.published });
      toast({ title: post.published ? "Post unpublished" : "Post published" });
      await refreshPosts();
    } catch (e: any) {
      toast({ title: e.message || "Error", variant: "destructive" });
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto px-4 py-12 max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Blog Admin</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="password"
                placeholder="Enter admin password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && login()}
              />
              <Button onClick={login} disabled={loading} className="w-full">
                {loading ? "Verifying..." : "Login"}
              </Button>
            </CardContent>
          </Card>
        </main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">Blog Admin</h1>
          <Button onClick={startCreate} className="gap-2">
            <Plus className="w-4 h-4" /> New Post
          </Button>
        </div>

        {(creating || editing) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>{editing ? "Edit Post" : "New Post"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Title</label>
                <Input
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    if (!editing) setSlug(generateSlug(e.target.value));
                  }}
                  placeholder="Post title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Slug</label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="post-url-slug"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Excerpt</label>
                <Input
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Brief description for the listing page"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-foreground">Content (Markdown)</label>
                <Textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Write your post in Markdown..."
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="published" className="text-sm text-foreground">Published</label>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave} disabled={loading}>
                  {loading ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-foreground truncate">{post.title}</span>
                    <Badge variant={post.published ? "default" : "secondary"}>
                      {post.published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(post.created_at), "MMM d, yyyy")} · {post.likes_count} likes · /{post.slug}
                  </span>
                </div>
                <div className="flex items-center gap-1 ml-4">
                  <Button variant="ghost" size="icon" onClick={() => togglePublish(post)} title={post.published ? "Unpublish" : "Publish"}>
                    {post.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => startEdit(post)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(post.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {posts.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No posts yet. Create your first one!</p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};

export default BlogAdmin;
