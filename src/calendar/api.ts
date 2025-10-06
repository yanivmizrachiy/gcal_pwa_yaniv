/**
 * Google Calendar API wrapper functions
 * Phase A.1: Placeholder implementations that reject
 * Phase A.2+: Will implement via Apps Script proxy with actual API calls
 */

import type {
  CalendarEvent,
  CalendarListEntry,
  InsertEventPayload,
  UpdateEventPayload,
} from '../types/calendar';

/**
 * Fetches list of user's calendars
 */
export async function getCalendars(): Promise<CalendarListEntry[]> {
  // TODO Phase A.2: Implement via Apps Script backend
  return Promise.reject(new Error('getCalendars not yet implemented'));
}

/**
 * Lists events from a specific calendar
 * @param calendarId - Calendar identifier (default: 'primary')
 * @param timeMin - Lower bound (ISO 8601)
 * @param timeMax - Upper bound (ISO 8601)
 */
export async function listEvents(
  calendarId: string = 'primary',
  timeMin?: string,
  timeMax?: string
): Promise<CalendarEvent[]> {
  // TODO Phase A.2: Implement via Apps Script backend
  console.log('listEvents called with:', { calendarId, timeMin, timeMax });
  return Promise.reject(new Error('listEvents not yet implemented'));
}

/**
 * Creates a new calendar event
 * @param calendarId - Calendar identifier (default: 'primary')
 * @param event - Event data to create
 */
export async function createEvent(
  calendarId: string = 'primary',
  event: InsertEventPayload
): Promise<CalendarEvent> {
  // TODO Phase A.2: Implement via Apps Script backend
  console.log('createEvent called with:', { calendarId, event });
  return Promise.reject(new Error('createEvent not yet implemented'));
}

/**
 * Updates an existing calendar event
 * @param calendarId - Calendar identifier (default: 'primary')
 * @param event - Event data with id to update
 */
export async function updateEvent(
  calendarId: string = 'primary',
  event: UpdateEventPayload
): Promise<CalendarEvent> {
  // TODO Phase A.2: Implement via Apps Script backend
  console.log('updateEvent called with:', { calendarId, event });
  return Promise.reject(new Error('updateEvent not yet implemented'));
}

/**
 * Deletes a calendar event
 * @param calendarId - Calendar identifier (default: 'primary')
 * @param eventId - Event identifier to delete
 */
export async function deleteEvent(
  calendarId: string = 'primary',
  eventId: string
): Promise<void> {
  // TODO Phase A.2: Implement via Apps Script backend
  console.log('deleteEvent called with:', { calendarId, eventId });
  return Promise.reject(new Error('deleteEvent not yet implemented'));
}
