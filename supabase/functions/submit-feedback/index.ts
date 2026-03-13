import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, subject, message } = await req.json();

    // Validate required fields
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0 || subject.trim().length > 200) {
      return new Response(
        JSON.stringify({ error: 'Subject is required and must be under 200 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!message || typeof message !== 'string' || message.trim().length === 0 || message.trim().length > 5000) {
      return new Response(
        JSON.stringify({ error: 'Message is required and must be under 5000 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate optional fields
    const cleanName = name && typeof name === 'string' ? name.trim().slice(0, 100) : null;
    const cleanEmail = email && typeof email === 'string' ? email.trim().slice(0, 255) : null;
    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Store in database
    const { error: insertError } = await supabase
      .from('feedback')
      .insert({
        name: cleanName,
        email: cleanEmail,
        subject: cleanSubject,
        message: cleanMessage,
      });

    if (insertError) {
      console.error('Failed to insert feedback:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to save feedback' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email notification via queue
    const notificationEmail = Deno.env.get('NOTIFICATION_EMAIL');
    if (notificationEmail) {
      const contactLine = cleanName || cleanEmail
        ? `<p><strong>From:</strong> ${cleanName || 'Anonymous'}${cleanEmail ? ` (${cleanEmail})` : ''}</p>`
        : '<p><strong>From:</strong> Anonymous</p>';

      await supabase.rpc('enqueue_email', {
        payload: {
          to: notificationEmail,
          subject: `[we.rsvp Feedback] ${cleanSubject}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">New Feedback Received</h2>
              ${contactLine}
              <p><strong>Subject:</strong> ${cleanSubject}</p>
              <hr style="border: 1px solid #eee;" />
              <p style="white-space: pre-wrap;">${cleanMessage}</p>
            </div>
          `,
        },
      });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Submit feedback error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
