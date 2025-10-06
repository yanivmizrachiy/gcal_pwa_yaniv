'use client';

import type { CalendarEvent } from '@/types/calendar';

interface EventListProps {
  events: CalendarEvent[];
  loading?: boolean;
}

export default function EventList({ events, loading }: EventListProps) {
  if (loading) {
    return (
      <div className="card space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-300/20 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-300/20 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="card text-center py-8">
        <div className="text-6xl mb-4 opacity-50">📅</div>
        <p className="text-lg font-medium mb-2">אין אירועים להצגה</p>
        <p className="text-sm opacity-70">נסה לחפש טווח תאריכים אחר או הוסף אירוע חדש</p>
      </div>
    );
  }

  const formatDateTime = (dateValue: string | { dateTime?: string; date?: string } | undefined) => {
    if (!dateValue) return '';
    
    let dateStr: string;
    if (typeof dateValue === 'string') {
      dateStr = dateValue;
    } else if (dateValue.dateTime) {
      dateStr = dateValue.dateTime;
    } else if (dateValue.date) {
      dateStr = dateValue.date;
    } else {
      return '';
    }

    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('he-IL', {
        dateStyle: 'short',
        timeStyle: 'short',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">אירועים ({events.length})</h3>
      </div>
      {events.map((event, index) => {
        const title = event.summary || event.title || 'ללא כותרת';
        const startTime = formatDateTime(event.start);
        const endTime = formatDateTime(event.end);
        
        return (
          <div
            key={event.id || index}
            className="card hover:scale-[1.01] transition-transform cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-2"></div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-base mb-1 truncate">{title}</h4>
                <div className="flex flex-wrap gap-2 text-sm opacity-80">
                  {startTime && (
                    <span className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {startTime}
                      {endTime && ` - ${endTime}`}
                    </span>
                  )}
                  {event.allDay && (
                    <span className="px-2 py-0.5 bg-purple-500/20 rounded text-xs">
                      כל היום
                    </span>
                  )}
                </div>
                {event.location && (
                  <div className="flex items-center gap-1 text-sm opacity-70 mt-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="truncate">{event.location}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
