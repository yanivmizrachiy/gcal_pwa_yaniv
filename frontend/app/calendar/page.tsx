'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '@/types/calendar';
import { findEvents, deleteEvent } from '@/lib/api';
import EventForm from '@/components/EventForm';
import EventModal from '@/components/EventModal';
import NlpPanel from '@/components/NlpPanel';
import ConfirmDialog from '@/components/ConfirmDialog';

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showNlpPanel, setShowNlpPanel] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<CalendarEvent | null>(null);

  const loadEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await findEvents({
        timeMin: new Date().toISOString(),
        maxResults: 50,
      });
      setEvents(response.events);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בטעינת אירועים');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  const handleEventUpdated = () => {
    loadEvents();
    setShowEventModal(false);
  };

  const handleEventCreated = () => {
    loadEvents();
    setShowCreateForm(false);
  };

  const handleNlpExecuted = () => {
    loadEvents();
    setShowNlpPanel(false);
  };

  const handleDeleteRequest = (event: CalendarEvent) => {
    setDeleteConfirm(event);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    
    try {
      await deleteEvent(deleteConfirm.id);
      setDeleteConfirm(null);
      loadEvents();
      setShowEventModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה במחיקת אירוע');
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('he-IL', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <div className="min-h-screen bg-[#0b1220] text-[#e7ecf5]" dir="rtl">
      <div className="max-w-6xl mx-auto p-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold mb-4">יומן חכם</h1>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-4 py-2 bg-[#1b3a6b] border border-[#2e4c86] rounded-lg hover:bg-[#244a7f] transition"
            >
              {showCreateForm ? 'סגור טופס' : 'צור אירוע חדש'}
            </button>
            <button
              onClick={() => setShowNlpPanel(!showNlpPanel)}
              className="px-4 py-2 bg-[#1b3a6b] border border-[#2e4c86] rounded-lg hover:bg-[#244a7f] transition"
            >
              {showNlpPanel ? 'סגור פקודות' : 'פקודות בשפה טבעית'}
            </button>
            <button
              onClick={loadEvents}
              className="px-4 py-2 bg-[#101a30] border border-[#1e2a48] rounded-lg hover:bg-[#162138] transition"
            >
              רענן
            </button>
          </div>
        </header>

        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-700/50 rounded-lg">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {showCreateForm && (
          <div className="mb-6 bg-[#101a30] border border-[#1e2a48] rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">אירוע חדש</h2>
            <EventForm onSuccess={handleEventCreated} onCancel={() => setShowCreateForm(false)} />
          </div>
        )}

        {showNlpPanel && (
          <div className="mb-6 bg-[#101a30] border border-[#1e2a48] rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">פקודות בשפה טבעית</h2>
            <NlpPanel onSuccess={handleNlpExecuted} />
          </div>
        )}

        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8">טוען אירועים...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-[#9fb4d9]">אין אירועים להצגה</div>
          ) : (
            events.map((event) => (
              <div
                key={event.id}
                onClick={() => handleEventClick(event)}
                className="bg-[#101a30] border border-[#1e2a48] rounded-lg p-4 hover:border-[#2e4c86] cursor-pointer transition"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-1">{event.title}</h3>
                    <p className="text-sm text-[#9fb4d9]">
                      {formatDateTime(event.start)} - {formatDateTime(event.end)}
                    </p>
                    {event.location && (
                      <p className="text-sm text-[#9fb4d9] mt-1">📍 {event.location}</p>
                    )}
                  </div>
                  {event.color && (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showEventModal && selectedEvent && (
        <EventModal
          event={selectedEvent}
          onClose={() => setShowEventModal(false)}
          onUpdate={handleEventUpdated}
          onDelete={handleDeleteRequest}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="אישור מחיקה"
          message={`האם אתה בטוח שברצונך למחוק את האירוע "${deleteConfirm.title}"?`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
