'use client';

import { useState } from 'react';
import { CalendarEvent, UpdateEventRequest } from '@/types/calendar';
import { updateEvent } from '@/lib/api';

interface EventModalProps {
  event: CalendarEvent;
  onClose: () => void;
  onUpdate: () => void;
  onDelete: (event: CalendarEvent) => void;
}

export default function EventModal({ event, onClose, onUpdate, onDelete }: EventModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<UpdateEventRequest>({
    title: event.title,
    start: event.start,
    end: event.end,
    description: event.description || '',
    location: event.location || '',
    color: event.color || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      await updateEvent(event.id, formData);
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בעדכון אירוע');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatDateTimeForInput = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().slice(0, 16);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-[#101a30] border border-[#1e2a48] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold">{isEditing ? 'עריכת אירוע' : event.title}</h2>
            <button
              onClick={onClose}
              className="text-[#9fb4d9] hover:text-white text-2xl leading-none"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700/50 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">כותרת</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0d1528] border border-[#223556] rounded focus:border-[#2e4c86] focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">התחלה</label>
                  <input
                    type="datetime-local"
                    value={formatDateTimeForInput(formData.start || event.start)}
                    onChange={(e) => setFormData({ ...formData, start: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0d1528] border border-[#223556] rounded focus:border-[#2e4c86] focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">סיום</label>
                  <input
                    type="datetime-local"
                    value={formatDateTimeForInput(formData.end || event.end)}
                    onChange={(e) => setFormData({ ...formData, end: e.target.value })}
                    className="w-full px-3 py-2 bg-[#0d1528] border border-[#223556] rounded focus:border-[#2e4c86] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">תיאור</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0d1528] border border-[#223556] rounded focus:border-[#2e4c86] focus:outline-none"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">מיקום</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0d1528] border border-[#223556] rounded focus:border-[#2e4c86] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">צבע</label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-3 py-2 bg-[#0d1528] border border-[#223556] rounded focus:border-[#2e4c86] focus:outline-none"
                >
                  <option value="">ללא צבע</option>
                  <option value="red">אדום</option>
                  <option value="blue">כחול</option>
                  <option value="green">ירוק</option>
                  <option value="yellow">צהוב</option>
                  <option value="orange">כתום</option>
                  <option value="purple">סגול</option>
                  <option value="pink">ורוד</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-[#1b3a6b] border border-[#2e4c86] rounded-lg hover:bg-[#244a7f] transition disabled:opacity-50"
                >
                  {loading ? 'שומר...' : 'שמור שינויים'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-[#101a30] border border-[#1e2a48] rounded-lg hover:bg-[#162138] transition"
                >
                  ביטול
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[#9fb4d9] mb-1">מתי</p>
                <p className="text-lg">
                  {formatDateTime(event.start)}
                  <br />
                  עד {formatDateTime(event.end)}
                </p>
              </div>

              {event.description && (
                <div>
                  <p className="text-sm text-[#9fb4d9] mb-1">תיאור</p>
                  <p className="whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {event.location && (
                <div>
                  <p className="text-sm text-[#9fb4d9] mb-1">מיקום</p>
                  <p>📍 {event.location}</p>
                </div>
              )}

              {event.color && (
                <div>
                  <p className="text-sm text-[#9fb4d9] mb-1">צבע</p>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: event.color }}
                    />
                    <span>{event.color}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-[#1b3a6b] border border-[#2e4c86] rounded-lg hover:bg-[#244a7f] transition"
                >
                  ערוך
                </button>
                <button
                  onClick={() => onDelete(event)}
                  className="px-4 py-2 bg-red-900/30 border border-red-700/50 rounded-lg hover:bg-red-900/40 transition text-red-300"
                >
                  מחק
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
