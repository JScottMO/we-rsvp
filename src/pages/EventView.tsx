import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Users, Download, CalendarDays, Clock, Lock, AlertTriangle } from "lucide-react";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";
import { ParticipantList } from "@/components/ParticipantList";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { decryptText, encryptText, isEncrypted, getKeyFromHash } from "@/lib/encryption";

interface Event {
  id: string;
  title: string;
  description?: string;
  dateOptions: string[];
  earliestTime: string;
  latestTime: string;
  timeIncrement: number;
  weekStartDay: number;
}

interface Response {
  id: string;
  participantName: string;
  availability: Record<string, boolean>;
  updatedAt: string;
}

const EventView = () => {
  const { eventId } = useParams();
  const location = useLocation();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [userResponse, setUserResponse] = useState<Response | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [participantPassword, setParticipantPassword] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [decryptionError, setDecryptionError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Extract encryption key from URL hash
  useEffect(() => {
    const key = getKeyFromHash();
    setEncryptionKey(key);
  }, [location.hash]);

  // Fetch event and responses from Supabase
  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventId) return;

      setIsLoading(true);
      try {
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();

        if (eventError) throw eventError;

        // Try to decrypt if we have an encryption key and data appears encrypted
        let decryptedTitle = eventData.title;
        let decryptedDescription = eventData.description;
        
        const titleIsEncrypted = isEncrypted(eventData.title);
        
        if (titleIsEncrypted && encryptionKey) {
          try {
            decryptedTitle = await decryptText(eventData.title, encryptionKey);
            if (eventData.description) {
              decryptedDescription = await decryptText(eventData.description, encryptionKey);
            }
            setDecryptionError(false);
          } catch (error) {
            console.error('Decryption failed:', error);
            setDecryptionError(true);
            decryptedTitle = '[Encrypted - Invalid key]';
            decryptedDescription = '';
          }
        } else if (titleIsEncrypted && !encryptionKey) {
          setDecryptionError(true);
          decryptedTitle = '[Encrypted - Key required]';
          decryptedDescription = '';
        }

        setEvent({
          id: eventData.id,
          title: decryptedTitle,
          description: decryptedDescription,
          dateOptions: eventData.date_options,
          earliestTime: eventData.earliest_time,
          latestTime: eventData.latest_time,
          timeIncrement: eventData.time_increment,
          weekStartDay: eventData.week_start_day
        });

        // Fetch responses from the secure view (excludes password_hash)
        const { data: responsesData, error: responsesError } = await supabase
          .from('responses_public')
          .select('*')
          .eq('event_id', eventId);

        if (responsesError) throw responsesError;

        // Decrypt participant names if encrypted
        const decryptedResponses = await Promise.all(
          responsesData.map(async (r) => {
            let participantName = r.participant_name;
            if (encryptionKey && isEncrypted(r.participant_name)) {
              try {
                participantName = await decryptText(r.participant_name, encryptionKey);
              } catch {
                participantName = '[Encrypted]';
              }
            }
            return {
              id: r.id,
              participantName,
              availability: r.availability as Record<string, boolean>,
              updatedAt: r.updated_at
            };
          })
        );

        setResponses(decryptedResponses);
      } catch (error) {
        console.error('Error fetching event:', error);
        toast({
          title: "Error",
          description: "Failed to load event. Please check the URL and try again.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [eventId, encryptionKey, toast]);

  const handleJoinEvent = async () => {
    if (!participantName.trim()) return;
    
    try {
      // For encrypted events, we need to encrypt the participant name before checking
      let nameToCheck = participantName.trim();
      if (encryptionKey) {
        nameToCheck = await encryptText(participantName.trim(), encryptionKey);
      }
      
      // Verify with edge function if participant exists and check password
      const response = await fetch('https://raxgcndwtqphoxoagthf.supabase.co/functions/v1/manage-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          eventId,
          participantName: nameToCheck,
          password: participantPassword || undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (result.requiresPassword) {
          toast({
            title: "Password required",
            description: "This participant has a password. Please enter it to edit.",
            variant: "destructive"
          });
          return;
        }
        if (result.error === 'Invalid password') {
          toast({
            title: "Invalid password",
            description: "The password you entered is incorrect.",
            variant: "destructive"
          });
          return;
        }
        throw new Error(result.error);
      }

      // Check if participant already exists (compare decrypted names)
      const existing = responses.find(r => r.participantName === participantName.trim());
      if (existing) {
        setUserResponse(existing);
        setIsEditing(true);
      } else {
        // Create new response (without ID since it will be generated by edge function)
        const newResponse: Response = {
          id: '',
          participantName: participantName.trim(),
          availability: {},
          updatedAt: new Date().toISOString()
        };
        setUserResponse(newResponse);
        setIsEditing(true);
      }
      setShowJoinDialog(false);
    } catch (error) {
      console.error('Error verifying participant:', error);
      toast({
        title: "Error",
        description: "Failed to verify participant. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleAvailabilityChange = (timeSlot: string, available: boolean) => {
    if (!userResponse) return;
    
    const updated = {
      ...userResponse,
      availability: {
        ...userResponse.availability,
        [timeSlot]: available
      },
      updatedAt: new Date().toISOString()
    };
    
    setUserResponse(updated);
    
    // Update in responses list
    setResponses(prev => {
      const existing = prev.find(r => r.participantName === participantName);
      if (existing) {
        return prev.map(r => r.participantName === participantName ? updated : r);
      } else {
        return [...prev, updated];
      }
    });
  };

  const handleSaveResponse = async () => {
    if (!userResponse || !eventId) return;
    
    try {
      // Encrypt participant name if we have an encryption key
      let nameToSave = userResponse.participantName;
      if (encryptionKey) {
        nameToSave = await encryptText(userResponse.participantName, encryptionKey);
      }
      
      // Check if user response already exists in the database (using encrypted name)
      const { data: existingResponseData } = await supabase
        .from('responses_public')
        .select('id')
        .eq('event_id', eventId)
        .eq('participant_name', nameToSave)
        .maybeSingle();
      
      const action = existingResponseData ? 'update' : 'create';
      
      // Use secure edge function for create/update
      const response = await fetch('https://raxgcndwtqphoxoagthf.supabase.co/functions/v1/manage-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          eventId,
          participantName: nameToSave,
          password: participantPassword || undefined,
          availability: userResponse.availability
        })
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            title: "Too many requests",
            description: "Please wait a moment before trying again.",
            variant: "destructive"
          });
          return;
        }
        if (result.requiresPassword) {
          toast({
            title: "Password required",
            description: "This response is password protected. Please enter the correct password.",
            variant: "destructive"
          });
          return;
        }
        throw new Error(result.error || 'Failed to save response');
      }
      
      // Refetch responses to get latest data from secure view
      const { data: responsesData, error: fetchError } = await supabase
        .from('responses_public')
        .select('*')
        .eq('event_id', eventId);
        
      if (fetchError) throw fetchError;
      
      // Decrypt participant names
      const decryptedResponses = await Promise.all(
        responsesData.map(async (r) => {
          let participantName = r.participant_name;
          if (encryptionKey && isEncrypted(r.participant_name)) {
            try {
              participantName = await decryptText(r.participant_name, encryptionKey);
            } catch {
              participantName = '[Encrypted]';
            }
          }
          return {
            id: r.id,
            participantName,
            availability: r.availability as Record<string, boolean>,
            updatedAt: r.updated_at
          };
        })
      );
      
      setResponses(decryptedResponses);
      
      toast({
        title: "Availability saved",
        description: "Your response has been recorded."
      });
      setIsEditing(false);
      setParticipantPassword(''); // Clear password after use
    } catch (error) {
      console.error('Error saving response:', error);
      toast({
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to save your response. Please try again.",
        variant: "destructive"
      });
    }
  };

  const copyEventLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: "Link copied",
      description: "Event link has been copied to your clipboard."
    });
  };

  const exportToCalendar = () => {
    // TODO: Generate .ics file
    toast({
      title: "Export coming soon",
      description: "Calendar export will be available soon."
    });
  };

  if (isLoading || !event) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Decryption Warning */}
      {decryptionError && (
        <div className="bg-destructive/10 border-b border-destructive/30">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Cannot decrypt event data</p>
                <p className="text-sm opacity-80">
                  This event is encrypted. Make sure you have the complete link including the encryption key after the #.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                {encryptionKey ? (
                  <Lock className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <CalendarDays className="w-5 h-5 text-primary-foreground" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{event.title}</h1>
                {event.description && (
                  <p className="text-muted-foreground">{event.description}</p>
                )}
                {encryptionKey && !decryptionError && (
                  <p className="text-xs text-primary flex items-center gap-1 mt-1">
                    <Lock className="w-3 h-3" />
                    End-to-end encrypted
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={copyEventLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={exportToCalendar}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Event Info */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <CalendarDays className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{event.dateOptions.length} dates</p>
                  <p className="text-sm text-muted-foreground">
                    {event.dateOptions.length === 1 ? 'Single day' : 'Multiple options'}
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{event.earliestTime} - {event.latestTime}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.timeIncrement}min intervals
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="flex items-center gap-3 pt-6">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">{responses.length} responses</p>
                  <p className="text-sm text-muted-foreground">
                    {responses.length === 0 ? 'No one yet' : 'People responded'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Availability Grid */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Availability</CardTitle>
                  {!isEditing && (
                    <Dialog open={showJoinDialog} onOpenChange={setShowJoinDialog}>
                      <DialogTrigger asChild>
                        <Button>
                          {userResponse ? "Edit response" : "Join event"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Join the event</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Your name</Label>
                            <Input
                              id="name"
                              placeholder="Enter your name"
                              value={participantName}
                              onChange={(e) => setParticipantName(e.target.value)}
                            />
                          </div>
                          <div>
                            <Label htmlFor="password">Password (optional)</Label>
                            <Input
                              id="password"
                              type="password"
                              placeholder="Secure your response (optional)"
                              value={participantPassword}
                              onChange={(e) => setParticipantPassword(e.target.value)}
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Without a password, anyone can edit your response using your name.
                            </p>
                          </div>
                          <Button 
                            onClick={handleJoinEvent}
                            disabled={!participantName.trim()}
                            className="w-full"
                          >
                            Continue
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </CardHeader>
                <CardContent>
                  <AvailabilityGrid
                    event={event}
                    responses={responses}
                    userResponse={userResponse}
                    isEditing={isEditing}
                    onAvailabilityChange={handleAvailabilityChange}
                  />
                  {isEditing && (
                    <div className="flex gap-2 mt-4">
                      <Button onClick={handleSaveResponse}>
                        Save response
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setIsEditing(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Participants List */}
            <div className="lg:col-span-1">
              <ParticipantList responses={responses} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EventView;