import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// In-memory rate limiting (resets when function cold starts)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS = {
  responsesPerMinute: 10,
  responsesPerHour: 30,
};

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const minuteKey = `${ip}:minute`;
  const hourKey = `${ip}:hour`;
  
  // Check minute limit
  const minuteLimit = rateLimitStore.get(minuteKey);
  if (minuteLimit) {
    if (now > minuteLimit.resetAt) {
      rateLimitStore.set(minuteKey, { count: 1, resetAt: now + 60000 });
    } else if (minuteLimit.count >= RATE_LIMITS.responsesPerMinute) {
      return { allowed: false, retryAfter: Math.ceil((minuteLimit.resetAt - now) / 1000) };
    } else {
      minuteLimit.count++;
    }
  } else {
    rateLimitStore.set(minuteKey, { count: 1, resetAt: now + 60000 });
  }
  
  // Check hour limit
  const hourLimit = rateLimitStore.get(hourKey);
  if (hourLimit) {
    if (now > hourLimit.resetAt) {
      rateLimitStore.set(hourKey, { count: 1, resetAt: now + 3600000 });
    } else if (hourLimit.count >= RATE_LIMITS.responsesPerHour) {
      return { allowed: false, retryAfter: Math.ceil((hourLimit.resetAt - now) / 1000) };
    } else {
      hourLimit.count++;
    }
  } else {
    rateLimitStore.set(hourKey, { count: 1, resetAt: now + 3600000 });
  }
  
  return { allowed: true };
}

interface RequestBody {
  action: 'create' | 'update' | 'verify' | 'delete';
  eventId: string;
  participantName: string;
  password?: string;
  availability?: Record<string, boolean>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('cf-connecting-ip') || 
               'unknown';
    
    // Check rate limit
    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: rateLimitResult.retryAfter 
        }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': String(rateLimitResult.retryAfter || 60)
          } 
        }
      );
    }

    const body: RequestBody = await req.json();
    const { action, eventId, participantName, password, availability } = body;

    // Input validation
    if (!eventId || !participantName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: eventId and participantName' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (participantName.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Participant name too long (max 100 characters)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate availability object size
    if (availability) {
      const availabilityStr = JSON.stringify(availability);
      if (availabilityStr.length > 50000) {
        return new Response(
          JSON.stringify({ error: 'Availability data too large' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Create Supabase client with service role for bypassing RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if event exists
    const { data: eventData, error: eventError } = await supabase
      .from('events')
      .select('id')
      .eq('id', eventId)
      .single();

    if (eventError || !eventData) {
      return new Response(
        JSON.stringify({ error: 'Event not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if response already exists
    const { data: existingResponse } = await supabase
      .from('responses')
      .select('id, participant_password_hash')
      .eq('event_id', eventId)
      .eq('participant_name', participantName)
      .maybeSingle();

    if (action === 'verify') {
      // Just verify if participant can edit (password check)
      if (existingResponse) {
        if (existingResponse.participant_password_hash) {
          if (!password) {
            return new Response(
              JSON.stringify({ error: 'Password required', requiresPassword: true }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          
          const passwordValid = bcrypt.compareSync(password, existingResponse.participant_password_hash);
          if (!passwordValid) {
            return new Response(
              JSON.stringify({ error: 'Invalid password' }),
              { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
        return new Response(
          JSON.stringify({ success: true, exists: true }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      return new Response(
        JSON.stringify({ success: true, exists: false }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'create') {
      if (existingResponse) {
        return new Response(
          JSON.stringify({ error: 'Response already exists for this participant. Use update action.' }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash password if provided
      let passwordHash = null;
      if (password && password.length > 0) {
        if (password.length < 4) {
          return new Response(
            JSON.stringify({ error: 'Password must be at least 4 characters' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        const salt = bcrypt.genSaltSync(10);
        passwordHash = bcrypt.hashSync(password, salt);
      }

      const { data, error } = await supabase
        .from('responses')
        .insert({
          event_id: eventId,
          participant_name: participantName,
          availability: availability || {},
          participant_password_hash: passwordHash,
        })
        .select('id, event_id, participant_name, availability, created_at, updated_at')
        .single();

      if (error) {
        console.error('Insert error:', error);
        await enqueueErrorNotification(supabase, 'manage-response:create', error.message, { eventId, participantName });
        return new Response(
          JSON.stringify({ error: 'Failed to create response' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'update') {
      if (!existingResponse) {
        return new Response(
          JSON.stringify({ error: 'Response not found. Use create action.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify password if set
      if (existingResponse.participant_password_hash) {
        if (!password) {
          return new Response(
            JSON.stringify({ error: 'Password required to update this response', requiresPassword: true }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const passwordValid = bcrypt.compareSync(password, existingResponse.participant_password_hash);
        if (!passwordValid) {
          return new Response(
            JSON.stringify({ error: 'Invalid password' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const { data, error } = await supabase
        .from('responses')
        .update({
          availability: availability || {},
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingResponse.id)
        .select('id, event_id, participant_name, availability, created_at, updated_at')
        .single();

      if (error) {
        console.error('Update error:', error);
        await enqueueErrorNotification(supabase, 'manage-response:update', error.message, { eventId, participantName });
        return new Response(
          JSON.stringify({ error: 'Failed to update response' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'delete') {
      if (!existingResponse) {
        return new Response(
          JSON.stringify({ error: 'Response not found.' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify password if set
      if (existingResponse.participant_password_hash) {
        if (!password) {
          return new Response(
            JSON.stringify({ error: 'Password required to delete this response', requiresPassword: true }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        const passwordValid = bcrypt.compareSync(password, existingResponse.participant_password_hash);
        if (!passwordValid) {
          return new Response(
            JSON.stringify({ error: 'Invalid password' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const { error } = await supabase
        .from('responses')
        .delete()
        .eq('id', existingResponse.id);

      if (error) {
        console.error('Delete error:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to delete response' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, deleted: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use create, update, verify, or delete.' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
