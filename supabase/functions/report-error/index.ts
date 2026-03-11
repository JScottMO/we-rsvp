import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// In-memory rate limiting (resets on cold start)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMITS = {
  perIpPerMinute: 5,
  perIpPerHour: 20,
  globalPerMinute: 30,
};

let globalMinute = { count: 0, resetAt: Date.now() + 60000 };

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();

  // Global limit
  if (now > globalMinute.resetAt) {
    globalMinute = { count: 1, resetAt: now + 60000 };
  } else if (globalMinute.count >= RATE_LIMITS.globalPerMinute) {
    return { allowed: false, retryAfter: Math.ceil((globalMinute.resetAt - now) / 1000) };
  } else {
    globalMinute.count++;
  }

  // Per-IP minute limit
  const minuteKey = `${ip}:min`;
  const minuteLimit = rateLimitStore.get(minuteKey);
  if (minuteLimit) {
    if (now > minuteLimit.resetAt) {
      rateLimitStore.set(minuteKey, { count: 1, resetAt: now + 60000 });
    } else if (minuteLimit.count >= RATE_LIMITS.perIpPerMinute) {
      return { allowed: false, retryAfter: Math.ceil((minuteLimit.resetAt - now) / 1000) };
    } else {
      minuteLimit.count++;
    }
  } else {
    rateLimitStore.set(minuteKey, { count: 1, resetAt: now + 60000 });
  }

  // Per-IP hour limit
  const hourKey = `${ip}:hr`;
  const hourLimit = rateLimitStore.get(hourKey);
  if (hourLimit) {
    if (now > hourLimit.resetAt) {
      rateLimitStore.set(hourKey, { count: 1, resetAt: now + 3600000 });
    } else if (hourLimit.count >= RATE_LIMITS.perIpPerHour) {
      return { allowed: false, retryAfter: Math.ceil((hourLimit.resetAt - now) / 1000) };
    } else {
      hourLimit.count++;
    }
  } else {
    rateLimitStore.set(hourKey, { count: 1, resetAt: now + 3600000 });
  }

  return { allowed: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('cf-connecting-ip') ||
               'unknown';

    const rateLimitResult = checkRateLimit(ip);
    if (!rateLimitResult.allowed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded', retryAfter: rateLimitResult.retryAfter }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(rateLimitResult.retryAfter || 60) } }
      );
    }

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
