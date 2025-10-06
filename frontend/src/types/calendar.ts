// TypeScript interfaces for GAS backend responses

export interface CalendarEvent {
  id?: string;
  summary?: string;
  title?: string;
  start?: string | { dateTime?: string; date?: string };
  end?: string | { dateTime?: string; date?: string };
  location?: string;
  description?: string;
  allDay?: boolean;
}

export interface FindEventsResponse {
  items?: CalendarEvent[];
  count?: number;
  events?: CalendarEvent[];
  error?: string;
}

export interface SelfTestResponse {
  ok: boolean;
  now: string;
  user?: string | null;
  error?: string;
}

export interface ApiError {
  error: string;
  message?: string;
  details?: string;
}

export interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

export type ActionType = 'findEvents' | 'selfTest' | 'createEvent' | 'updateEvent' | 'deleteEvent';

export interface CommandRequest {
  action: ActionType;
  text?: string;
  start?: string;
  end?: string;
  [key: string]: unknown;
}
