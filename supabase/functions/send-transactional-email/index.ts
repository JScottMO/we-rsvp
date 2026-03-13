import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Dequeue emails from the queue
    const { data: messages, error: dequeueError } = await supabase.rpc('dequeue_emails', { batch_size: 10 });

    if (dequeueError) {
      throw new Error(`Failed to dequeue emails: ${dequeueError.message}`);
    }

    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({ success: true, sent: 0, message: 'No emails in queue' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let sent = 0;
    let failed = 0;

    for (const msg of messages) {
      const payload = msg.message as EmailPayload;

      try {
        const emailResponse = await fetch('https://email.lovable.dev/v1/send', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${lovableApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: payload.to,
            subject: payload.subject,
            html: payload.html,
            from: 'noreply@notify.we.rsvp',
            purpose: 'transactional',
          }),
        });

        const responseText = await emailResponse.text();

        if (!emailResponse.ok) {
          console.error(`Email send failed [${emailResponse.status}]: ${responseText}`);
          failed++;
          continue;
        }

        // Delete the message from the queue after successful send
        await supabase.rpc('delete_email_message', { msg_id: msg.msg_id });
        sent++;
      } catch (sendError) {
        console.error('Error sending individual email:', sendError);
        failed++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, failed, total: messages.length }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Send transactional email error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
