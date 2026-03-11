import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { source, message, context, url, userAgent } = await req.json();

    if (!source || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: source and message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const notificationEmail = Deno.env.get('NOTIFICATION_EMAIL');
    if (!notificationEmail) {
      throw new Error('NOTIFICATION_EMAIL is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const timestamp = new Date().toISOString();

    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #e11d48; margin-bottom: 16px;">⚠️ Error Report — we.rsvp</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Source</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${source}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Time</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${timestamp}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Message</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${message}</td></tr>
          ${context ? `<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">Context</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${JSON.stringify(context)}</td></tr>` : ''}
          ${url ? `<tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #e5e7eb;">URL</td><td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${url}</td></tr>` : ''}
          ${userAgent ? `<tr><td style="padding: 8px; font-weight: bold;">User Agent</td><td style="padding: 8px;">${userAgent}</td></tr>` : ''}
        </table>
      </div>
    `;

    // Enqueue the error notification email
    const { error: enqueueError } = await supabase.rpc('enqueue_email', {
      payload: {
        to: notificationEmail,
        subject: `[we.rsvp Error] ${source}: ${message.substring(0, 80)}`,
        html,
      },
    });

    if (enqueueError) {
      throw new Error(`Failed to enqueue email: ${enqueueError.message}`);
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Report error function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
