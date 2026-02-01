// iCal file generation utilities

export interface ICalEvent {
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  location?: string;
}

/**
 * Generate an iCal (.ics) file content string
 */
export function generateICalFile(event: ICalEvent): string {
  const uid = `${Date.now()}@we-rsvp.lovable.app`;
  const dtstamp = formatICalDate(new Date());
  
  // Parse date and times
  const [year, month, day] = event.date.split('-').map(Number);
  const [startHour, startMin] = event.startTime.split(':').map(Number);
  const [endHour, endMin] = event.endTime.split(':').map(Number);
  
  const startDate = new Date(year, month - 1, day, startHour, startMin);
  const endDate = new Date(year, month - 1, day, endHour, endMin);
  
  const dtstart = formatICalDate(startDate);
  const dtend = formatICalDate(endDate);
  
  // Escape special characters in text fields
  const escapedTitle = escapeICalText(event.title);
  const escapedDescription = event.description ? escapeICalText(event.description) : '';
  
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//we.rsvp//Event Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapedTitle}`,
  ];
  
  if (escapedDescription) {
    lines.push(`DESCRIPTION:${escapedDescription}`);
  }
  
  if (event.location) {
    lines.push(`LOCATION:${escapeICalText(event.location)}`);
  }
  
  lines.push('END:VEVENT', 'END:VCALENDAR');
  
  return lines.join('\r\n');
}

/**
 * Format a Date object to iCal format (YYYYMMDDTHHMMSS)
 */
function formatICalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Escape special characters for iCal text fields
 */
function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

/**
 * Download an iCal file
 */
export function downloadICalFile(event: ICalEvent, filename?: string): void {
  const content = generateICalFile(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `${event.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Generate a mailto link with event details
 */
export function generateMailtoLink(
  event: ICalEvent,
  recipients?: string[]
): string {
  const subject = encodeURIComponent(`Event Confirmed: ${event.title}`);
  
  const bodyLines = [
    `The event "${event.title}" has been confirmed!`,
    '',
    `📅 Date: ${formatReadableDate(event.date)}`,
    `🕐 Time: ${formatReadableTime(event.startTime)} - ${formatReadableTime(event.endTime)}`,
  ];
  
  if (event.description) {
    bodyLines.push('', `📝 Details: ${event.description}`);
  }
  
  bodyLines.push(
    '',
    'Please add this event to your calendar by creating a new event or downloading the .ics file from the event page.',
    '',
    '---',
    'Scheduled with we.rsvp - https://we.rsvp'
  );
  
  const body = encodeURIComponent(bodyLines.join('\n'));
  const to = recipients?.length ? recipients.join(',') : '';
  
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

/**
 * Format date to readable string
 */
function formatReadableDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * Format time to readable string
 */
function formatReadableTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes);
  return date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}
