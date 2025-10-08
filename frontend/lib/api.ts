import {
  CalendarEvent,
  CreateEventRequest,
  UpdateEventRequest,
  FindEventsOptions,
  SelfTestResponse,
  FindEventsResponse,
  CreateEventResponse,
  UpdateEventResponse,
  DeleteEventResponse,
  ParseNlpResponse,
} from '@/types/calendar';

const API_URL = process.env.NEXT_PUBLIC_EXEC_URL || '';

/**
 * Make a POST request to the Apps Script backend
 */
async function post<T>(action: string, payload: any = {}): Promise<T> {
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      ...payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  
  if (!data.ok) {
    throw new Error(data.error || 'Unknown error');
  }

  return data;
}

/**
 * Legacy GET request for backward compatibility
 */
async function get(mode: string = 'selftest'): Promise<any> {
  const url = new URL(API_URL);
  url.searchParams.set('mode', mode);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}

/**
 * Self-test endpoint
 */
export async function selfTest(): Promise<SelfTestResponse> {
  return post<SelfTestResponse>('selfTest');
}

/**
 * Find events with optional filters
 */
export async function findEvents(options?: FindEventsOptions): Promise<FindEventsResponse> {
  return post<FindEventsResponse>('findEvents', { options });
}

/**
 * Create a new event
 */
export async function createEvent(event: CreateEventRequest): Promise<CreateEventResponse> {
  return post<CreateEventResponse>('createEvent', { event });
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  changes: UpdateEventRequest
): Promise<UpdateEventResponse> {
  return post<UpdateEventResponse>('updateEvent', { eventId, changes });
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<DeleteEventResponse> {
  return post<DeleteEventResponse>('deleteEvent', { eventId });
}

/**
 * Parse natural language command
 */
export async function parseNlp(
  text: string,
  parseOnly: boolean = false
): Promise<ParseNlpResponse> {
  return post<ParseNlpResponse>('parseNlp', { text, parseOnly });
}

/**
 * Legacy: Get events via GET endpoint
 */
export async function getEventsLegacy(): Promise<{ ok: boolean; count: number; events: CalendarEvent[] }> {
  return get('events');
}

/**
 * Legacy: Self-test via GET endpoint
 */
export async function selfTestLegacy(): Promise<{ ok: boolean; mode: string; ts: string; user: string | null }> {
  return get('selftest');
}
