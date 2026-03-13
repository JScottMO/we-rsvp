import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Check } from "lucide-react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const feedbackSchema = z.object({
  name: z.string().trim().max(100, "Name must be under 100 characters").optional().or(z.literal("")),
  email: z.string().trim().email("Please enter a valid email").max(255).optional().or(z.literal("")),
  subject: z.string().trim().min(1, "Subject is required").max(200, "Subject must be under 200 characters"),
  message: z.string().trim().min(1, "Your feedback is required").max(5000, "Message must be under 5000 characters"),
});

const Feedback = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = feedbackSchema.safeParse({ name, email, subject, message });
    if (!result.success) {
      toast({
        title: "Validation error",
        description: result.error.errors[0].message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("submit-feedback", {
        body: {
          name: name.trim() || null,
          email: email.trim() || null,
          subject: subject.trim(),
          message: message.trim(),
        },
      });

      if (error) throw error;
      setIsSubmitted(true);
    } catch {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-accent-foreground" />
            </div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Submit Feedback
            </h2>
            <p className="text-muted-foreground">
              Share a comment, review, or suggestion. We'd love to hear from you.
            </p>
          </div>

          {isSubmitted ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">Thank you!</h3>
                  <p className="text-muted-foreground">
                    Your feedback has been submitted successfully.
                  </p>
                  <Link to="/">
                    <Button variant="outline" className="mt-4">Back to home</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Your feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Name <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        id="name"
                        placeholder="Your name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={100}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        maxLength={255}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      placeholder="What's this about?"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      maxLength={200}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Feedback, comment or review</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us what you think..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      maxLength={5000}
                      rows={5}
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !subject.trim() || !message.trim()}
                  >
                    {isSubmitting ? "Submitting..." : "Submit feedback"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Feedback;
