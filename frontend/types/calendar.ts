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
  type: 'time' | 'date' | 'color' | 'reminder' | 'number' | 'text' | 'email' | 'duration' | 'recurrence' | 'action' | 'guest-keyword';
}

export interface NlpWarning {
  code: string;
  message: string;
}

export interface NlpRecurrence {
  detected: boolean;
  pattern: string | null;
}

export interface NlpInterpretation {
  success: boolean;
  operation: 'create' | 'update' | 'delete' | 'disambiguation';
  warnings: NlpWarning[];
  interpreted?: {
    title?: string;
    start?: Date | string;
    end?: Date | string;
    guests?: string[];
    reminders?: number[];
    color?: string;
    recurrence?: NlpRecurrence | null;
  };
  event?: CreateEventRequest & { guests?: string[] };
  changes?: UpdateEventRequest;
  eventId?: string | null;
  error?: string | null;
  disambiguation?: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
  }>;
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
  progressPercent?: number;
  completed?: boolean;
  features?: string[];
  warningsSample?: NlpWarning[];
  calendarAccess?: boolean;
  ts: string;
  email?: string | null;
  // Legacy fields (v1)
  now?: string;
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
  parseOnly: boolean;
  operation?: 'create' | 'update' | 'delete' | 'disambiguation';
  interpreted?: NlpInterpretation;
  warnings: NlpWarning[];
  event?: CalendarEvent;
  changedFields?: string[];
  deletedEventId?: string;
  disambiguation?: Array<{
    id: string;
    title: string;
    start: string;
    end: string;
  }>;
}
