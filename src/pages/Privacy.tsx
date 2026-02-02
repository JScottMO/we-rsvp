import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Shield, UserX, Database, Trash2, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Privacy = () => {
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
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <BackButton />

        <div className="mt-8 mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Privacy & Data Policy</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            we.rsvp is built with privacy as a core principle. Here's exactly what we collect, 
            how we handle it, and why we believe less is more.
          </p>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="w-5 h-5 text-primary" />
                No Accounts Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>
                Unlike most scheduling tools, we.rsvp doesn't require you to create an account. 
                This means:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>No email addresses collected for registration</li>
                <li>No passwords stored (except optional per-response passwords)</li>
                <li>No user profiles or tracking across events</li>
                <li>No social login integrations harvesting your data</li>
              </ul>
              <p>
                You simply share a link, and participants join by entering a display name of their choice.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5 text-primary" />
                What Data We Collect
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-muted-foreground">
              <p>We collect only what's absolutely necessary to make scheduling work:</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground">Event Information</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                    <li>Event title and optional description</li>
                    <li>Date options and time range</li>
                    <li>Finalized date/time (when confirmed)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground">Participant Responses</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                    <li>Display name (chosen by participant)</li>
                    <li>Availability selections on the grid</li>
                    <li>Optional password hash (if participant chooses to protect their response)</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-foreground">What We Don't Collect</h4>
                  <ul className="list-disc list-inside space-y-1 ml-2 mt-1">
                    <li>Email addresses</li>
                    <li>Phone numbers</li>
                    <li>Location data</li>
                    <li>Device fingerprints</li>
                    <li>Browsing history or behavior tracking</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                How Data Is Protected
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Encrypted storage:</strong> All data is stored in a secure database with 
                  encryption at rest
                </li>
                <li>
                  <strong>Password hashing:</strong> If you set a password to protect your response, 
                  it's hashed using bcrypt—we never store plain text passwords
                </li>
                <li>
                  <strong>Rate limiting:</strong> API endpoints are protected against abuse with 
                  request limits
                </li>
                <li>
                  <strong>No analytics tracking:</strong> We don't use Google Analytics, Facebook 
                  Pixel, or any user-level tracking tools
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-primary" />
                Data Retention & Deletion
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-muted-foreground">
              <p>We believe in keeping data only as long as it's useful:</p>
              <ul className="list-disc list-inside space-y-2 ml-2">
                <li>
                  <strong>Automatic cleanup:</strong> Finalized events and all associated responses 
                  are automatically deleted 7 days after the event is confirmed
                </li>
                <li>
                  <strong>No data sales:</strong> We never sell, share, or monetize your scheduling data
                </li>
                <li>
                  <strong>Minimal footprint:</strong> Once deleted, data is permanently removed from 
                  our systems
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Our Commitment
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground">
              <p>
                we.rsvp exists to solve a simple problem: finding a time that works for everyone. 
                We don't need your personal data to do that. Our business model doesn't depend on 
                advertising or selling user information. We keep things simple, private, and focused 
                on what matters—scheduling.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 mb-4">
          <BackButton />
        </div>
      </div>
    </div>
  );
};

export default Privacy;
