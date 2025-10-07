export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  allDay: boolean;
  description?: string;
  location?: string;
  color?: string;
  guests?: string[]; // NLP v2: attendee emails
  recurrenceText?: string; // NLP v2: Hebrew recurrence summary
}

export interface CreateEventRequest {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  color?: string;
  reminders?: number[];
  guests?: string[]; // NLP v2: attendee emails
  allDay?: boolean; // NLP v2: all-day event flag
  durationMinutes?: number; // NLP v2: explicit duration
  recurrence?: RecurrencePattern; // NLP v2: recurrence pattern
}

// NLP v2: Recurrence pattern
export interface RecurrencePattern {
  type: 'daily' | 'weekly';
  weekday?: number; // 0=Sunday, 6=Saturday (for weekly)
  until?: string; // ISO date string
  times?: number; // Number of occurrences
}

export interface UpdateEventRequest {
  title?: string;
  start?: string;
  end?: string;
  description?: string;
  location?: string;
  color?: string;
  reminders?: number[];
  guestsAdd?: string[]; // NLP v2: guests to add
  guestsRemove?: string[]; // NLP v2: guests to remove
}

export interface FindEventsOptions {
  timeMin?: string;
  timeMax?: string;
  q?: string;
  maxResults?: number;
}

export interface NlpToken {
  text: string;
  index: number;
  type: 'time' | 'date' | 'color' | 'reminder' | 'number' | 'text' | 'duration'; // NLP v2: added 'duration'
}

export interface NlpInterpretation {
  success: boolean;
  tokens: NlpToken[];
  operation: 'create' | 'update' | 'delete' | null;
  event?: CreateEventRequest;
  changes?: UpdateEventRequest;
  eventId?: string | null;
  error?: string | null;
  warnings?: string[]; // NLP v2: parsing warnings
}

export interface ApiResponse<T = any> {
  ok: boolean;
  error?: string;
  message?: string;
  data?: T;
}

export interface SelfTestResponse extends ApiResponse {
  action: 'selfTest';
  nlpVersion: string;
  now: string;
}

export interface FindEventsResponse extends ApiResponse {
  action: 'findEvents';
  count: number;
  events: CalendarEvent[];
}

export interface CreateEventResponse extends ApiResponse {
  action: 'createEvent';
  event: CalendarEvent;
}

export interface UpdateEventResponse extends ApiResponse {
  action: 'updateEvent';
  changedFields: string[];
  event: CalendarEvent;
}

export interface DeleteEventResponse extends ApiResponse {
  action: 'deleteEvent';
}

export interface ParseNlpResponse extends ApiResponse {
  action: 'parseNlp';
  parseOnly?: boolean;
  interpreted: NlpInterpretation;
  event?: CalendarEvent;
}

// NLP v2: Suggest slots request options
export interface SuggestSlotsOptions {
  durationMinutes?: number; // Default: 60
  timeMin?: string; // ISO string, default: now
  timeMax?: string; // ISO string, default: now + 7 days
  partOfDay?: 'morning' | 'noon' | 'afternoon' | 'evening' | 'בבוקר' | 'צהריים' | 'אחר הצהריים' | 'בערב';
  maxSuggestions?: number; // Default: 3
}

// NLP v2: Suggest slots response
export interface SuggestSlotsResponse extends ApiResponse {
  action: 'suggestSlots';
  suggestions: TimeSlot[];
  count: number;
}

// NLP v2: Time slot suggestion
export interface TimeSlot {
  start: string; // ISO string
  end: string; // ISO string
  lengthMinutes: number;
}
