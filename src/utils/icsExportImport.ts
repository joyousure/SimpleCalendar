import { CalendarEvent } from '../types/calendar';
import { saveFileToDevice, SaveFileResult } from './fileTransfer';

/**
 * Format date for ICS (e.g. 20261101 or 20261101T093000Z)
 */
function toIcsDateString(dateStr: string, timeStr?: string, isAllDay: boolean = false): string {
  const cleanDate = dateStr.replace(/-/g, '');
  if (isAllDay || !timeStr) {
    return cleanDate;
  }
  const [hh = '00', mm = '00'] = timeStr.split(':');
  return `${cleanDate}T${hh.padStart(2, '0')}${mm.padStart(2, '0')}00`;
}

/**
 * Generates RFC 5545 iCalendar (.ics) string for export
 */
export function generateIcsCalendar(events: CalendarEvent[], calendarName = 'Simple Calendar'): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SimpleCalendar//EN',
    `X-WR-CALNAME:${calendarName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach((event) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}@simplecalendar.local`);
    lines.push(`DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`);

    if (event.isAllDay) {
      lines.push(`DTSTART;VALUE=DATE:${toIcsDateString(event.startDate, undefined, true)}`);
      // In iCal, all-day DTEND is exclusive
      const endDateStr = event.endDate || event.startDate;
      const parts = endDateStr.split('-').map(Number);
      const nextDay = new Date(parts[0], parts[1] - 1, parts[2] + 1);
      const year = nextDay.getFullYear();
      const month = String(nextDay.getMonth() + 1).padStart(2, '0');
      const day = String(nextDay.getDate()).padStart(2, '0');
      lines.push(`DTEND;VALUE=DATE:${year}${month}${day}`);
    } else {
      lines.push(`DTSTART:${toIcsDateString(event.startDate, event.startTime)}`);
      lines.push(`DTEND:${toIcsDateString(event.endDate || event.startDate, event.endTime || event.startTime)}`);
    }

    // Escape special characters for iCal
    const escapeText = (text: string) =>
      text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

    lines.push(`SUMMARY:${escapeText(event.title || 'Untitled Event')}`);

    if (event.description) {
      lines.push(`DESCRIPTION:${escapeText(event.description)}`);
    }

    if (event.location) {
      lines.push(`LOCATION:${escapeText(event.location)}`);
    }

    if (event.recurrence && event.recurrence !== 'none') {
      let freq = 'DAILY';
      if (event.recurrence === 'weekly') freq = 'WEEKLY';
      if (event.recurrence === 'monthly') freq = 'MONTHLY';
      if (event.recurrence === 'yearly') freq = 'YEARLY';

      let rrule = `RRULE:FREQ=${freq}`;
      if (event.recurrenceEnd) {
        const until = toIcsDateString(event.recurrenceEnd, undefined, true);
        rrule += `;UNTIL=${until}`;
      }
      lines.push(rrule);
    }

    lines.push('STATUS:CONFIRMED');
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Downloads a string as a file in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string): Promise<SaveFileResult> {
  return saveFileToDevice(filename, content, mimeType);
}

/**
 * Simple parser for RFC 5545 iCalendar files
 */
export function parseIcsCalendar(icsContent: string, defaultCategoryId = 'cat-personal'): CalendarEvent[] {
  const lines = icsContent.split(/\r\n|\n|\r/);
  // Unfold folded lines (lines starting with space or tab)
  const unfoldedLines: string[] = [];
  for (const line of lines) {
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (unfoldedLines.length > 0) {
        unfoldedLines[unfoldedLines.length - 1] += line.slice(1);
      }
    } else {
      unfoldedLines.push(line);
    }
  }

  const events: CalendarEvent[] = [];
  let currentEvent: Partial<CalendarEvent> | null = null;

  for (const line of unfoldedLines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {
        id: 'ics-' + Math.random().toString(36).substring(2, 10),
        categoryId: defaultCategoryId,
        recurrence: 'none',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
    } else if (line.startsWith('END:VEVENT') && currentEvent) {
      if (currentEvent.title && currentEvent.startDate) {
        events.push({
          id: currentEvent.id || 'evt-' + Date.now(),
          title: currentEvent.title,
          description: currentEvent.description || '',
          location: currentEvent.location || '',
          categoryId: currentEvent.categoryId || defaultCategoryId,
          startDate: currentEvent.startDate,
          startTime: currentEvent.startTime,
          endDate: currentEvent.endDate || currentEvent.startDate,
          endTime: currentEvent.endTime,
          isAllDay: currentEvent.isAllDay ?? false,
          recurrence: currentEvent.recurrence || 'none',
          reminder: currentEvent.reminder || 'none',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      currentEvent = null;
    } else if (currentEvent) {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) continue;

      const propHeader = line.substring(0, colonIdx);
      const value = line.substring(colonIdx + 1);
      const propName = propHeader.split(';')[0].toUpperCase();

      if (propName === 'SUMMARY') {
        currentEvent.title = unescapeIcs(value);
      } else if (propName === 'DESCRIPTION') {
        currentEvent.description = unescapeIcs(value);
      } else if (propName === 'LOCATION') {
        currentEvent.location = unescapeIcs(value);
      } else if (propName === 'DTSTART') {
        const { date, time, isAllDay } = parseIcsDateTime(value, propHeader);
        currentEvent.startDate = date;
        currentEvent.startTime = time;
        currentEvent.isAllDay = isAllDay;
      } else if (propName === 'DTEND') {
        const { date, time } = parseIcsDateTime(value, propHeader);
        currentEvent.endDate = date;
        currentEvent.endTime = time;
      } else if (propName === 'RRULE') {
        if (value.includes('FREQ=DAILY')) currentEvent.recurrence = 'daily';
        else if (value.includes('FREQ=WEEKLY')) currentEvent.recurrence = 'weekly';
        else if (value.includes('FREQ=MONTHLY')) currentEvent.recurrence = 'monthly';
        else if (value.includes('FREQ=YEARLY')) currentEvent.recurrence = 'yearly';
      }
    }
  }

  return events;
}

function parseIcsDateTime(val: string, header: string): { date: string; time?: string; isAllDay: boolean } {
  const isDateOnly = header.includes('VALUE=DATE') || val.length === 8;
  if (isDateOnly) {
    const y = val.substring(0, 4);
    const m = val.substring(4, 6);
    const d = val.substring(6, 8);
    return { date: `${y}-${m}-${d}`, isAllDay: true };
  }

  // Format: 20261101T093000 or 20261101T093000Z
  const tIdx = val.indexOf('T');
  if (tIdx !== -1) {
    const datePart = val.substring(0, tIdx);
    const timePart = val.substring(tIdx + 1);
    const y = datePart.substring(0, 4);
    const m = datePart.substring(4, 6);
    const d = datePart.substring(6, 8);
    const hh = timePart.substring(0, 2);
    const mm = timePart.substring(2, 4);
    return {
      date: `${y}-${m}-${d}`,
      time: `${hh}:${mm}`,
      isAllDay: false,
    };
  }

  return { date: new Date().toISOString().split('T')[0], isAllDay: true };
}

function unescapeIcs(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}
