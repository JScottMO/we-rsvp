import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Users, Shield, BarChart3 } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

import { EmailSignup } from "@/components/EmailSignup";

const Index = () => {
  const [eventTitle, setEventTitle] = useState("");
  const [stats, setStats] = useState<{ total_events: number; total_views: number } | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Record page view
    supabase.from("page_views").insert({}).then();

    // Fetch stats
    supabase.rpc("get_site_stats").then(({ data }) => {
      if (data) setStats(data as { total_events: number; total_views: number });
    });
  }, []);

  const handleCreateEvent = () => {
    if (eventTitle.trim()) {
      // Navigate to event creation with title
      navigate(`/create?title=${encodeURIComponent(eventTitle)}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">we.rsvp</h1>
            </div>
            <div className="text-sm text-muted-foreground flex flex-col items-end">
              <span>Privacy-first group scheduling</span>
              <Link to="/compare" className="text-primary hover:underline text-xs">
                See how we compare →
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Find the perfect time, together
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              No accounts. No hassle. Just share a link and find when everyone's free.
            </p>
            
            {/* Quick Create */}
            <Card className="max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-lg">Create your event</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="event-title">Event name</Label>
                  <Input
                    id="event-title"
                    placeholder="Team meeting, dinner plans..."
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateEvent()}
                  />
                </div>
                <Button 
                  onClick={handleCreateEvent}
                  className="w-full"
                  disabled={!eventTitle.trim()}
                >
                  Get started
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No accounts needed</h3>
              <p className="text-muted-foreground">
                Share a link. Everyone joins instantly. No signups or passwords required.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Visual consensus</h3>
              <p className="text-muted-foreground">
                See availability overlap at a glance with our interactive heatmap.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-accent-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Privacy first</h3>
              <p className="text-muted-foreground">
                We don't track you. Your data stays minimal and anonymous.{" "}
                <Link to="/privacy" className="text-primary hover:underline">
                  Read more
                </Link>
              </p>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div className="flex justify-center gap-12 mb-8">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{stats.total_events.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Events created</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{stats.total_views.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Page visits</p>
              </div>
            </div>
          )}

          {/* Email Signup */}
          <div className="bg-muted rounded-lg p-6 max-w-lg mx-auto">
            <EmailSignup />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;