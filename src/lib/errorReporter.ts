import { supabase } from "@/integrations/supabase/client";

let reportedErrors = new Set<string>();

export async function reportError(
  source: string,
  message: string,
  context?: Record<string, unknown>
) {
  // Deduplicate within session
  const key = `${source}:${message}`;
  if (reportedErrors.has(key)) return;
  reportedErrors.add(key);

  // Cap stored keys to prevent memory leak
  if (reportedErrors.size > 100) {
    reportedErrors = new Set([...reportedErrors].slice(-50));
  }

  try {
    await supabase.functions.invoke('report-error', {
      body: {
        source,
        message,
        context,
        url: window.location.href,
        userAgent: navigator.userAgent,
      },
    });
  } catch {
    // Silently fail - don't create error loops
  }
}

// Global error handler for uncaught exceptions
export function initErrorReporter() {
  window.addEventListener('error', (event) => {
    reportError('frontend:uncaught', event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || String(event.reason);
    reportError('frontend:unhandled-rejection', message);
  });
}
