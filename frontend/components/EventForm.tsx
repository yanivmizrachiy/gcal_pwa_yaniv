'use client';

import { useState } from 'react';
import { createEvent } from '@/lib/api';
import { CreateEventRequest } from '@/types/calendar';

interface EventFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EventForm({ onSuccess, onCancel }: EventFormProps) {
  const [formData, setFormData] = useState<CreateEventRequest>({
    title: '',
    start: '',
    end: '',
    description: '',
    location: '',
    color: '',
    reminders: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.start || !formData.end) {
      setError('נא למלא כותרת, זמן התחלה וסיום');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await createEvent(formData);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה ביצירת אירוע');
    } finally {
      setLoading(false);
    }
  };

  const handleReminderAdd = () => {
    const minutes = parseInt(prompt('דקות לפני האירוע:') || '0');
    if (minutes > 0) {
      setFormData({
        ...formData,
        reminders: [...(formData.reminders || []), minutes],
      });
    }
  };

  const handleReminderRemove = (index: number) => {
    const newReminders = [...(formData.reminders || [])];
    newReminders.splice(index, 1);
    setFormData({ ...formData, reminders: newReminders });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded text-red-300 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">כותרת *</label>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 bg-[#0d1528] border border-[#223556] rounded focus:border-[#2e4c86] focus:outline-none"
          placeholder="שם האירוע"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium mb-1">התחלה *</label>
          <input
            type="datetime-local"
            value={formData.start}
            onChange={(e) => setFormData({ ...formData, start: e.target.value })}
            className="w-full px-3 py-2 bg-[#0d1528] border border-[#223556] rounded focus:border-[#2e4c86] focus:outline-none"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">סיום *</label>
          <input
            type="datetime-local"
            value={formData.end}
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
          placeholder="פרטים נוספים"
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
          placeholder="כתובת או מיקום"
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

      <div>
        <label className="block text-sm font-medium mb-2">תזכורות</label>
        <div className="space-y-2">
          {formData.reminders && formData.reminders.length > 0 ? (
            formData.reminders.map((minutes, index) => (
              <div key={index} className="flex items-center justify-between bg-[#0d1528] border border-[#223556] rounded px-3 py-2">
                <span>{minutes} דקות לפני</span>
                <button
                  type="button"
                  onClick={() => handleReminderRemove(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <p className="text-sm text-[#9fb4d9]">אין תזכורות</p>
          )}
          <button
            type="button"
            onClick={handleReminderAdd}
            className="text-sm text-[#2e4c86] hover:text-[#3d5c96]"
          >
            + הוסף תזכורת
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[#1b3a6b] border border-[#2e4c86] rounded-lg hover:bg-[#244a7f] transition disabled:opacity-50"
        >
          {loading ? 'שומר...' : 'צור אירוע'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-[#101a30] border border-[#1e2a48] rounded-lg hover:bg-[#162138] transition"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}
