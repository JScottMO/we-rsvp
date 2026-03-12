import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Share2, Users, CalendarDays, Clock, Lock, AlertTriangle, CalendarCheck, Globe } from "lucide-react";
import { AvailabilityGrid } from "@/components/AvailabilityGrid";
import { ParticipantList } from "@/components/ParticipantList";
import { FinalizeEventDialog } from "@/components/FinalizeEventDialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { decryptText, encryptText, isEncrypted, getKeyFromHash } from "@/lib/encryption";
import { format, parseISO } from "date-fns";

interface Event {
  id: string;
  title: string;
  description?: string;
  dateOptions: string[];
  earliestTime: string;
  latestTime: string;
  timeIncrement: number;
  weekStartDay: number;
  isFinalized: boolean;
  finalizedDate?: string;
  finalizedTime?: string;
  advancedTimeSlots?: Record<string, boolean>;
  timezone?: string;
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
  const [showFinalizeDialog, setShowFinalizeDialog] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [finalizeSelection, setFinalizeSelection] = useState<{ date: string; time: string } | null>(null);
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
          weekStartDay: eventData.week_start_day,
          isFinalized: eventData.is_finalized || false,
          finalizedDate: eventData.finalized_date || undefined,
          finalizedTime: eventData.finalized_time || undefined,
          advancedTimeSlots: eventData.advanced_time_slots as Record<string, boolean> | undefined,
          timezone: eventData.timezone || undefined,
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

        if (funcError) {
          // Parse the error response for password-related messages
          try {
            const errorBody = funcError?.context ? await funcError.context.json() : null;
            if (errorBody?.requiresPassword) {
              // If no password was provided, the user needs to enter one to edit
              if (!participantPassword) {
                toast({
                  title: "Password required",
                  description: "This participant has a password. Please enter it to edit.",
                  variant: "destructive"
                });
                return;
              }
            }
            if (errorBody?.error === 'Invalid password') {
              toast({
                title: "Invalid password",
                description: "The password you entered is incorrect.",
                variant: "destructive"
              });
              return;
            }
          } catch {
            // Could not parse error body
          }
          throw funcError;
        }

        if (result?.error) throw new Error(result.error);

        // If the existing response has no password, only allow editing if the new user also provides no password
        // This prevents a second person from silently merging into a password-less response
        // Check if the existing response is password-protected by checking the verify result
        // The verify succeeded, meaning either no password was needed or the correct password was given
        // If the response has no password and the joining user didn't provide one, it could be the original user OR someone else
        // To prevent name collisions, require a password to reclaim a password-less entry
        // Actually, check if response has a password: if verify succeeded without a password, the response is unprotected
        if (result?.exists) {
          // Verify succeeded without requiring a password — the existing entry is unprotected.
          // If the new user also has no password, we can't verify identity — block reuse.
          // If the new user IS providing a password, they're a different person trying to
          // use an already-taken name — also block.
          // The only way to reach this point with a password-protected entry is if the
          // correct password was provided (verify would have failed otherwise), which is fine.
          const existingIsUnprotected = !participantPassword || 
            (participantPassword && !funcError);
          // More precisely: if verify succeeded without needing a password, entry is unprotected
          // We know the entry is unprotected if we didn't provide a password and verify succeeded
          if (!participantPassword) {
            toast({
              title: "Name already taken",
              description: "Someone with this name has already responded. Please choose a different name or set a password to protect your response.",
              variant: "destructive"
            });
            return;
          }
          // If user provided a password but the existing entry has NO password,
          // verify succeeds (no password check needed), but they're a different person
          // trying to claim this name. Block it.
          // We can detect this: verify succeeded AND the existing entry didn't require a password.
          // The edge function returns requiresPassword:true when a password is needed but not provided.
          // Since we DID provide a password and verify succeeded without complaint, 
          // the entry either has no password OR our password matched.
          // To distinguish: re-verify WITHOUT a password to see if the entry is protected.
          const { data: checkResult, error: checkError } = await supabase.functions.invoke('manage-response', {
            body: {
              action: 'verify',
              eventId,
              participantName: encryptedName,
            }
          });
          
          // If verify succeeds without a password, the entry is unprotected
          // and the current user (who wants a password) is a different person
          if (!checkError && checkResult?.exists) {
            toast({
              title: "Name already taken",
              description: "Someone with this name has already responded without a password. Please choose a different name.",
              variant: "destructive"
            });
            return;
          }
        }

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
        // Try to parse the error response for requiresPassword
        try {
          const errorBody = saveError?.context ? await saveError.context.json() : null;
          if (errorBody?.requiresPassword) {
            toast({
              title: "Password required",
              description: "This response is password protected. Please enter the correct password.",
              variant: "destructive"
            });
            return;
          }
          if (errorBody?.error === 'Invalid password') {
            toast({
              title: "Invalid password",
              description: "The password you entered is incorrect.",
              variant: "destructive"
            });
            return;
          }
        } catch {
          // Could not parse error body
        }
        throw saveError;
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

  const handleCancelEditing = async () => {
    if (!userResponse || !eventId) {
      setIsEditing(false);
      return;
    }

    // If this is a new participant (empty id means not yet saved), just reset local state
    if (!userResponse.id) {
      // Remove from local responses list
      setResponses(prev => prev.filter(r => r.participantName !== userResponse.participantName));
      setUserResponse(null);
      setIsEditing(false);
      setParticipantName('');
      setParticipantPassword('');
      return;
    }

    // If existing participant, delete their response from the database
    try {
      // Find the encrypted name if needed
      const { data: existingResponses } = await supabase
        .from('responses_public')
        .select('id, participant_name')
        .eq('event_id', eventId);

      let nameToDelete = userResponse.participantName;
      
      if (existingResponses) {
        for (const r of existingResponses) {
          if (encryptionKey && isEncrypted(r.participant_name ?? '')) {
            try {
              const decrypted = await decryptText(r.participant_name ?? '', encryptionKey);
              if (decrypted.toLowerCase() === userResponse.participantName.toLowerCase()) {
                nameToDelete = r.participant_name ?? userResponse.participantName;
                break;
              }
            } catch {
              // Skip if can't decrypt
            }
          } else if ((r.participant_name ?? '').toLowerCase() === userResponse.participantName.toLowerCase()) {
            nameToDelete = r.participant_name ?? userResponse.participantName;
            break;
          }
        }
      }

      const { data: deleteResult, error: deleteError } = await supabase.functions.invoke('manage-response', {
        body: {
          action: 'delete',
          eventId,
          participantName: nameToDelete,
          password: participantPassword || undefined
        }
      });

      if (deleteError) {
        console.error('Delete error:', deleteError);
        throw deleteError;
      }

      if (deleteResult?.requiresPassword) {
        toast({
          title: "Password required",
          description: "This response is password protected. Enter your password to remove it.",
          variant: "destructive"
        });
        return;
      }

      if (deleteResult?.error) {
        throw new Error(deleteResult.error);
      }

      // Remove from local state
      setResponses(prev => prev.filter(r => r.id !== userResponse.id));
      setUserResponse(null);
      setIsEditing(false);
      setParticipantName('');
      setParticipantPassword('');

      toast({
        title: "Response removed",
        description: "Your availability has been cleared from this event."
      });
    } catch (err) {
      console.error('handleCancelEditing error:', err);
      toast({
        title: "Error",
        description: "Failed to remove your response. Please try again.",
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

  const handleFinalizeEvent = async (date: string, startTime: string, endTime: string) => {
    if (!eventId) return;
    
    try {
      const { error } = await supabase.rpc('finalize_event', {
        p_event_id: eventId,
        p_finalized_date: date,
        p_finalized_time: `${startTime}-${endTime}`
      });

      if (error) throw error;

      // Update local state
      setEvent(prev => prev ? {
        ...prev,
        isFinalized: true,
        finalizedDate: date,
        finalizedTime: `${startTime}-${endTime}`
      } : null);

      toast({
        title: "Event finalized",
        description: "The event has been closed. No more responses will be accepted."
      });
    } catch (error) {
      console.error('Failed to finalize event:', error);
      toast({
        title: "Error",
        description: "Failed to finalize the event. Please try again.",
        variant: "destructive"
      });
      throw error;
    }
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
      {/* Finalized Event Banner */}
      {event.isFinalized && event.finalizedDate && event.finalizedTime && (
        <div className="bg-primary/10 border-b border-primary/30">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center gap-3 text-primary">
              <CalendarCheck className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-medium">Event confirmed!</p>
                <p className="text-sm">
                  {format(parseISO(event.finalizedDate), 'EEEE, MMMM d, yyyy')} at{' '}
                  {event.finalizedTime.split('-').map(t => 
                    format(new Date(`2000-01-01T${t}`), 'h:mm a')
                  ).join(' - ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {event.isFinalized ? (
                  <CalendarCheck className="w-5 h-5 text-primary-foreground" />
                ) : encryptionKey ? (
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
            <div className="flex flex-col items-end gap-2">
              <Button variant="outline" size="sm" onClick={copyEventLink}>
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
              {!event.isFinalized && (
                <p className="text-xs text-muted-foreground">
                  Share this link to find the best time!
                </p>
              )}
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
          {!isEditing && !event.isFinalized && responses.length === 0 && (
            <Card className="mb-8 bg-muted/50 border-dashed">
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-2">👋 Welcome! Here's how it works:</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                  <li><strong>Share this event</strong> — <button onClick={copyEventLink} className="text-primary hover:underline font-medium inline">click here to copy the link</button> and send it to your friends.</li>
                  <li><strong>Click "Join event"</strong> to add your name and start selecting times.</li>
                  <li><strong>Click or drag on the grid</strong> to mark when you're available.</li>
                  <li><strong>Save your response</strong> — the grid will show where everyone overlaps.</li>
                </ol>
                <p className="text-sm text-muted-foreground mt-3">
                  The greener a time slot, the more people are free.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Instruction boxes */}
          {!event.isFinalized && (
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-accent rounded-lg border border-border">
                <p className="text-sm font-medium text-accent-foreground mb-1">📝 Mark your availability</p>
                <p className="text-xs text-muted-foreground">
                  Click <strong>"Join event"</strong> below, then click or drag across time slots to mark when you're free. Your selections are outlined in black. Green shading shows when others are available. Don't forget to <strong>Save response</strong> when you're done!
                </p>
              </div>
              <div className="p-4 bg-accent rounded-lg border border-border">
                <p className="text-sm font-medium text-accent-foreground mb-1">✅ Finalize the event</p>
                <p className="text-xs text-muted-foreground">
                  Once everyone has responded, <strong>join the event</strong> to access the <strong>"Finalize event"</strong> button. Pick the best date and time, then lock it in — participants can download the event or share it via email.
                </p>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Availability Grid */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Availability</CardTitle>
                    {event.timezone && (
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Globe className="w-3 h-3" />
                        Times shown in <span className="bg-yellow-200 dark:bg-yellow-900 text-foreground px-1 rounded font-medium">{event.timezone.replace(/_/g, ' ')}</span>
                      </p>
                    )}
                  </div>
                  {!isEditing && !event.isFinalized && (
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
                  {event.isFinalized && (
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      Event closed
                    </span>
                  )}
                </CardHeader>
                <CardContent>
                  <AvailabilityGrid
                    event={event}
                    responses={responses}
                    userResponse={userResponse}
                    isEditing={isEditing}
                    isFinalizing={isFinalizing}
                    onAvailabilityChange={handleAvailabilityChange}
                    onFinalizeSlotClick={(date, time) => {
                      setFinalizeSelection({ date, time });
                      setShowFinalizeDialog(true);
                    }}
                  />
                  {isEditing && !isFinalizing && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      <Button onClick={handleSaveResponse}>
                        Save response
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={() => setIsFinalizing(true)}
                      >
                        <CalendarCheck className="w-4 h-4 mr-2" />
                        Finalize event
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={handleCancelEditing}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                  {isFinalizing && (
                    <div className="mt-4 p-3 bg-primary/10 border border-primary/30 rounded-md">
                      <p className="text-sm font-medium text-primary mb-2">
                        🎯 Click a time slot on the grid to select the final time
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsFinalizing(false)}
                      >
                        Cancel finalization
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

      {/* Finalize Event Dialog */}
      {finalizeSelection && (
        <FinalizeEventDialog
          open={showFinalizeDialog}
          onOpenChange={(open) => {
            setShowFinalizeDialog(open);
            if (!open) {
              setFinalizeSelection(null);
              setIsFinalizing(false);
            }
          }}
          event={{
            id: event.id,
            title: event.title,
            description: event.description,
            dateOptions: event.dateOptions,
            earliestTime: event.earliestTime,
            latestTime: event.latestTime,
            timeIncrement: event.timeIncrement,
          }}
          selectedDate={finalizeSelection.date}
          selectedTime={finalizeSelection.time}
          onFinalize={handleFinalizeEvent}
        />
      )}
    </div>
  );
};

export default EventView;