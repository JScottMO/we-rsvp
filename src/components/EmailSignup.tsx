import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

const emailSchema = z.string().trim().email("Please enter a valid email").max(255);

export const EmailSignup = ({ className = "" }: { className?: string }) => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast({ title: "Invalid email", description: result.error.issues[0].message, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("email_signups").insert({ email: result.data });
      if (error) {
        if (error.code === "23505") {
          // Duplicate - still show success to avoid leaking info
          setIsSubmitted(true);
        } else {
          throw error;
        }
      } else {
        setIsSubmitted(true);
      }
    } catch {
      toast({ title: "Something went wrong", description: "Please try again later.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className={`flex items-center justify-center gap-2 text-primary ${className}`}>
        <Check className="w-5 h-5" />
        <span className="text-sm font-medium">You're on the list! We'll let you know.</span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-center gap-2 mb-3">
        <Mail className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          We build free, privacy-first tools — get notified when we launch more
        </p>
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 max-w-sm mx-auto">
        <Input
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1"
          required
        />
        <Button type="submit" size="sm" disabled={isSubmitting || !email.trim()}>
          {isSubmitting ? "..." : "Notify me"}
        </Button>
      </form>
    </div>
  );
};
