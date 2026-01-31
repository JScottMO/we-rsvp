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
  
  // Get encryption key from both location.hash (preferred) and window.location.hash (fallback)
  // This handles the race condition where react-router's location may not have the hash yet
  const getEncryptionKey = (): string | null => {
    // First try location.hash from react-router
    if (location.hash && location.hash.length > 1) {
      return location.hash.slice(1);
    }
    // Fallback to window.location.hash for initial navigation
    return getKeyFromHash();
  };
  
  const [event, setEvent] = useState<Event | null>(null);
  const [responses, setResponses] = useState<Response[]>([]);
  const [userResponse, setUserResponse] = useState<Response | null>(null);
  const [participantName, setParticipantName] = useState("");
  const [participantPassword, setParticipantPassword] = useState("");
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(() => getEncryptionKey());
  const [decryptionError, setDecryptionError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Update encryption key if hash changes (for navigation within SPA)
  useEffect(() => {
    const key = getEncryptionKey();
    if (key && key !== encryptionKey) {
      setEncryptionKey(key);
    }
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
          } catch {
            // Decryption error - invalid key, don't log details
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
      } catch {
        // Error fetching event - don't expose details
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
      // Check if participant already exists by comparing decrypted names in our local state
      // (responses already have decrypted names from the fetch)
      const existing = responses.find(r => r.participantName.toLowerCase() === participantName.trim().toLowerCase());
      
      if (existing) {
        // For existing participants, we need to verify password via edge function
        // We need to find the encrypted name from the database to verify
        const { data: responsesData } = await supabase
          .from('responses_public')
          .select('id, participant_name')
          .eq('event_id', eventId);
        
        // Find the matching encrypted name by decrypting all and comparing
        let encryptedName = participantName.trim();
        if (encryptionKey && responsesData) {
          for (const r of responsesData) {
            if (isEncrypted(r.participant_name)) {
              try {
                const decrypted = await decryptText(r.participant_name, encryptionKey);
                if (decrypted.toLowerCase() === participantName.trim().toLowerCase()) {
                  encryptedName = r.participant_name;
                  break;
                }
              } catch {
                // Skip if can't decrypt
              }
            } else if (r.participant_name.toLowerCase() === participantName.trim().toLowerCase()) {
              encryptedName = r.participant_name;
              break;
            }
          }
        }
        
        // Verify with edge function using the encrypted name
        const { data: result, error: funcError } = await supabase.functions.invoke('manage-response', {
          body: {
            action: 'verify',
            eventId,
            participantName: encryptedName,
            password: participantPassword || undefined
          }
        });

        if (funcError) throw funcError;

        if (result?.requiresPassword) {
          toast({
            title: "Password required",
            description: "This participant has a password. Please enter it to edit.",
            variant: "destructive"
          });
          return;
        }
        if (result?.error === 'Invalid password') {
          toast({
            title: "Invalid password",
            description: "The password you entered is incorrect.",
            variant: "destructive"
          });
          return;
        }
        if (result?.error) throw new Error(result.error);

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
    } catch {
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
      console.log('handleSaveResponse called with:', { 
        participantName: userResponse.participantName, 
        availability: userResponse.availability,
        encryptionKey: encryptionKey ? 'present' : 'missing'
      });
      
      // First, fetch all responses to find if this participant already exists
      const { data: existingResponses, error: fetchExistingError } = await supabase
        .from('responses_public')
        .select('id, participant_name')
        .eq('event_id', eventId);
      
      if (fetchExistingError) {
        console.error('Error fetching existing responses:', fetchExistingError);
      }
      
      console.log('Existing responses:', existingResponses);
      
      // Find the matching encrypted name by decrypting all and comparing
      let nameToSave = userResponse.participantName;
      let existingResponseId: string | null = null;
      
      if (existingResponses) {
        for (const r of existingResponses) {
          if (encryptionKey && isEncrypted(r.participant_name ?? '')) {
            try {
              const decrypted = await decryptText(r.participant_name ?? '', encryptionKey);
              if (decrypted.toLowerCase() === userResponse.participantName.toLowerCase()) {
                nameToSave = r.participant_name ?? userResponse.participantName; // Use existing encrypted name
                existingResponseId = r.id ?? null;
                console.log('Found matching encrypted response:', { id: existingResponseId, decrypted });
                break;
              }
            } catch {
              // Skip if can't decrypt
            }
          } else if ((r.participant_name ?? '').toLowerCase() === userResponse.participantName.toLowerCase()) {
            nameToSave = r.participant_name ?? userResponse.participantName;
            existingResponseId = r.id ?? null;
            console.log('Found matching plaintext response:', { id: existingResponseId });
            break;
          }
        }
      }
      
      // If new participant and encryption is enabled, encrypt the name
      if (!existingResponseId && encryptionKey) {
        nameToSave = await encryptText(userResponse.participantName, encryptionKey);
        console.log('Encrypted new participant name');
      }
      
      const action = existingResponseId ? 'update' : 'create';
      console.log('Calling edge function with:', { action, eventId, nameToSave: nameToSave.substring(0, 20) + '...', availability: userResponse.availability });
      
      // Use Supabase client's functions.invoke for proper URL handling
      const { data: saveResult, error: saveError } = await supabase.functions.invoke('manage-response', {
        body: {
          action,
          eventId,
          participantName: nameToSave,
          password: participantPassword || undefined,
          availability: userResponse.availability
        }
      });

      console.log('Edge function response:', { saveResult, saveError });

      if (saveError) {
        console.error('Save error:', saveError);
        // Check for rate limiting
        if (saveError.message?.includes('429') || saveError.message?.includes('rate limit')) {
          toast({
            title: "Too many requests",
            description: "Please wait a moment before trying again.",
            variant: "destructive"
          });
          return;
        }
        throw saveError;
      }

      if (saveResult?.requiresPassword) {
        toast({
          title: "Password required",
          description: "This response is password protected. Please enter the correct password.",
          variant: "destructive"
        });
        return;
      }
      
      if (saveResult?.error) {
        console.error('Save result error:', saveResult.error);
        throw new Error(saveResult.error);
      }
      
      // Refetch responses to get latest data from secure view
      const { data: refreshedResponses, error: fetchError } = await supabase
        .from('responses_public')
        .select('*')
        .eq('event_id', eventId);
        
      if (fetchError) {
        console.error('Error fetching refreshed responses:', fetchError);
        throw fetchError;
      }
      
      console.log('Refreshed responses:', refreshedResponses);
      
      // Decrypt participant names
      const decryptedResponses = await Promise.all(
        (refreshedResponses ?? []).map(async (r) => {
          let pName = r.participant_name ?? '';
          if (encryptionKey && isEncrypted(pName)) {
            try {
              pName = await decryptText(pName, encryptionKey);
            } catch {
              pName = '[Encrypted]';
            }
          }
          return {
            id: r.id ?? '',
            participantName: pName,
            availability: (r.availability ?? {}) as Record<string, boolean>,
            updatedAt: r.updated_at ?? new Date().toISOString()
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
    } catch (err) {
      // Error saving response - log for debugging
      console.error('handleSaveResponse error:', err);
      toast({
        title: "Error", 
        description: "Failed to save your response. Please try again.",
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

          {/* First-time user guidance */}
          {!isEditing && responses.length === 0 && (
            <Card className="mb-8 bg-muted/50 border-dashed">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">👋 Welcome! Here's how it works:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li><strong>Click "Join event"</strong> to add your name and start selecting times.</li>
                  <li><strong>Click or drag on the grid</strong> to mark when you're available.</li>
                  <li><strong>Save your response</strong> — the grid will show where everyone overlaps.</li>
                </ol>
                <p className="text-sm text-muted-foreground mt-3">
                  The greener a time slot, the more people are free. Share this link with others to find the best time!
                </p>
              </CardContent>
            </Card>
          )}

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