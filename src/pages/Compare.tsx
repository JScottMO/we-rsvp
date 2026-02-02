import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Check, X, Minus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import profCLogo from "@/assets/prof-c-logo.png";
import buyMeCoffeeLogo from "@/assets/buymeacoffee.png";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const Compare = () => {
  const navigate = useNavigate();

  const BackButton = () => (
    <Button 
      variant="ghost" 
      onClick={() => navigate("/")}
      className="gap-2"
    >
      <ArrowLeft className="w-4 h-4" />
      Back to Home
    </Button>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <BackButton />

        <div className="mt-8 mb-8">
          <p className="text-sm text-muted-foreground mb-2">Last updated: February 2026</p>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            When2meet vs Doodle vs we.rsvp: Which Group Scheduling Tool Actually Respects Your Privacy?
          </h1>
          <p className="text-lg text-muted-foreground">
            You need to find a time when everyone's free. Simple, right? Yet the most popular scheduling tools either look like they're from 2005 or want your credit card. And almost none of them respect your privacy.
          </p>
          <p className="text-muted-foreground mt-4">
            We compared the three most popular group scheduling tools to help you decide which one actually deserves your trust.
          </p>
        </div>

        {/* Quick Verdict Table */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>The Quick Verdict</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-semibold">Feature</TableHead>
                    <TableHead>When2meet</TableHead>
                    <TableHead>Doodle</TableHead>
                    <TableHead className="text-primary font-semibold">we.rsvp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Price</TableCell>
                    <TableCell>Free</TableCell>
                    <TableCell>Free (limited) / $6.95+/mo</TableCell>
                    <TableCell className="text-primary font-medium">Free</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Account Required</TableCell>
                    <TableCell><X className="w-4 h-4 text-green-500" /></TableCell>
                    <TableCell><Check className="w-4 h-4 text-destructive" /> (for organizers)</TableCell>
                    <TableCell><X className="w-4 h-4 text-green-500" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Tracks You</TableCell>
                    <TableCell><Minus className="w-4 h-4 text-muted-foreground" /> Unclear</TableCell>
                    <TableCell><Check className="w-4 h-4 text-destructive" /> Yes</TableCell>
                    <TableCell><X className="w-4 h-4 text-green-500" /> No</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Modern Design</TableCell>
                    <TableCell><X className="w-4 h-4 text-destructive" /></TableCell>
                    <TableCell><Check className="w-4 h-4 text-green-500" /></TableCell>
                    <TableCell><Check className="w-4 h-4 text-green-500" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Visual Heatmap</TableCell>
                    <TableCell><Check className="w-4 h-4 text-green-500" /></TableCell>
                    <TableCell><X className="w-4 h-4 text-destructive" /></TableCell>
                    <TableCell><Check className="w-4 h-4 text-green-500" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Ad-Free</TableCell>
                    <TableCell><X className="w-4 h-4 text-destructive" /></TableCell>
                    <TableCell>Paid only</TableCell>
                    <TableCell><Check className="w-4 h-4 text-green-500" /></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            <p className="mt-4 text-muted-foreground">
              <strong className="text-foreground">Bottom line:</strong> If privacy matters to you, we.rsvp is the clear winner. If you need enterprise features and don't mind paying, Doodle works. When2meet is functional but showing its age.
            </p>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* When2meet */}
          <Card>
            <CardHeader>
              <CardTitle>When2meet: The Old Reliable</CardTitle>
              <p className="text-sm text-muted-foreground">Best for: People who don't care about aesthetics and just need something that works.</p>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                When2meet has been around forever, and it shows. The interface looks like it hasn't been updated since the early 2000s—think chunky buttons, basic colors, and a layout that screams "Web 1.0."
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Pros:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Completely free</li>
                    <li>No account needed</li>
                    <li>Familiar to many people</li>
                    <li>Gets the job done</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Cons:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Dated, clunky interface</li>
                    <li>Contains third-party ads</li>
                    <li>No mobile optimization</li>
                    <li>Unclear privacy practices</li>
                    <li>No modern features</li>
                  </ul>
                </div>
              </div>

              <p className="italic">
                When2meet works, but using it feels like stepping back in time. And those third-party ads? You're the product.
              </p>
            </CardContent>
          </Card>

          {/* Doodle */}
          <Card>
            <CardHeader>
              <CardTitle>Doodle: The Corporate Choice</CardTitle>
              <p className="text-sm text-muted-foreground">Best for: Teams with budget who need calendar integrations and enterprise features.</p>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                Doodle is the polished, professional option—if you're willing to pay. Their free tier is extremely limited, pushing you toward their $6.95/month Pro plan (or $8.95/month for teams).
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Pros:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Modern, clean interface</li>
                    <li>Calendar integrations</li>
                    <li>Professional features</li>
                    <li>Mobile apps</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Cons:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Free tier is crippled</li>
                    <li>$83+/year for basic features</li>
                    <li>Requires account creation</li>
                    <li>Heavy tracking and analytics</li>
                    <li>Shows ads on free tier</li>
                  </ul>
                </div>
              </div>

              <p className="italic">
                Doodle is great if your company is paying. For personal use or privacy-conscious users? The tracking alone is a dealbreaker.
              </p>
            </CardContent>
          </Card>

          {/* we.rsvp */}
          <Card className="border-primary">
            <CardHeader>
              <CardTitle className="text-primary">we.rsvp: The Privacy-First Alternative</CardTitle>
              <p className="text-sm text-muted-foreground">Best for: Anyone who wants modern scheduling without the surveillance or price tag.</p>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>
                we.rsvp takes a different approach: give users a beautiful, functional tool without harvesting their data or charging monthly fees.
              </p>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Pros:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Completely free (no hidden tiers)</li>
                    <li>No account required—for anyone</li>
                    <li>Zero tracking or analytics</li>
                    <li>Modern, clean design</li>
                    <li>Visual heatmap for easy consensus</li>
                    <li>Mobile-friendly</li>
                    <li>No ads, ever</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">Cons:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Newer (smaller community)</li>
                    <li>Fewer integrations (for now)</li>
                  </ul>
                </div>
              </div>

              <p className="italic font-medium text-foreground">
                we.rsvp proves you don't need to sacrifice privacy or pay monthly fees for good scheduling software.
              </p>
            </CardContent>
          </Card>

          {/* Privacy Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Privacy Comparison: The Real Differentiator</CardTitle>
              <p className="text-sm text-muted-foreground">Here's what each tool does with your data:</p>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-foreground mb-2">When2meet</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>No clear privacy policy</li>
                    <li>Third-party ads mean third-party tracking</li>
                    <li>Availability data stored indefinitely</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10">
                  <h4 className="font-medium text-foreground mb-2">Doodle</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Extensive data collection</li>
                    <li>Shares data with advertising partners</li>
                    <li>Uses cookies for cross-site tracking</li>
                    <li>Requires account with personal info</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-medium text-primary mb-2">we.rsvp</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>No tracking whatsoever</li>
                    <li>No cookies beyond essential function</li>
                    <li>Data stays minimal and anonymous</li>
                    <li>No accounts = no personal info stored</li>
                  </ul>
                </div>
              </div>
              <p className="text-foreground font-medium">
                In 2026, privacy isn't a luxury—it's a necessity. we.rsvp is the only option that treats your data with respect.
              </p>
            </CardContent>
          </Card>

          {/* Which Should You Choose */}
          <Card>
            <CardHeader>
              <CardTitle>Which Should You Choose?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <div className="grid md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-foreground mb-2">Choose When2meet if:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>You're already used to it</li>
                    <li>You don't care about design</li>
                    <li>Privacy isn't a concern</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <h4 className="font-medium text-foreground mb-2">Choose Doodle if:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Your company pays for it</li>
                    <li>You need calendar integrations</li>
                    <li>Enterprise features are essential</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-medium text-primary mb-2">Choose we.rsvp if:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Privacy matters to you</li>
                    <li>You want modern design without monthly fees</li>
                    <li>You hate creating accounts for everything</li>
                    <li>You want something that just works</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* CTA */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-8 text-center">
              <h3 className="text-2xl font-bold text-foreground mb-4">Try we.rsvp Today</h3>
              <p className="text-muted-foreground mb-6">
                Ready to schedule your next meeting without the surveillance?
              </p>
              <Button onClick={() => navigate("/")} size="lg" className="gap-2">
                Create your first event
                <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-sm text-muted-foreground mt-4">
                No account. No tracking. No hassle. Just share a link and find when everyone's free.
              </p>
            </CardContent>
          </Card>
        </div>

        <p className="text-sm text-muted-foreground text-center mt-8 mb-4">
          This comparison was created in February 2026. Features and pricing may change.
        </p>

        <div className="mb-4">
          <BackButton />
        </div>

        {/* Attribution */}
        <div className="flex items-center justify-center gap-6 bg-muted rounded-lg p-4 w-fit mx-auto mb-8">
          <a 
            href="https://christiansonjs.com/links/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src={profCLogo} 
              alt="Prof C Logo" 
              className="w-12 h-12"
            />
          </a>
          <a 
            href="https://buymeacoffee.com/profc" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:opacity-80 transition-opacity"
          >
            <img 
              src={buyMeCoffeeLogo} 
              alt="Buy me a coffee" 
              className="h-10"
            />
          </a>
        </div>
      </div>
    </div>
  );
};

export default Compare;
