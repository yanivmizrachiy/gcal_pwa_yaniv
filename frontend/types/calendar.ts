export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO string
  end: string; // ISO string
  allDay: boolean;
  description?: string;
  location?: string;
  color?: string;
}

export interface CreateEventRequest {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  color?: string;
  reminders?: number[];
}

export interface UpdateEventRequest {
  title?: string;
  start?: string;
  end?: string;
  description?: string;
  location?: string;
  color?: string;
  reminders?: number[];
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
  type: 'time' | 'date' | 'color' | 'reminder' | 'number' | 'text';
}

export interface DisambiguationCandidate {
  id: string;
  title: string;
  start: string;
  end: string;
  score: number;
}

export interface NlpDisambiguation {
  query: string;
  candidates: DisambiguationCandidate[];
}

export interface NlpInterpretation {
  success: boolean;
  tokens: NlpToken[];
  operation: 'create' | 'update' | 'delete' | null;
  event?: CreateEventRequest;
  changes?: UpdateEventRequest;
  eventId?: string | null;
  error?: string | null;
  disambiguate?: NlpDisambiguation | null;
  warnings?: string[];
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
