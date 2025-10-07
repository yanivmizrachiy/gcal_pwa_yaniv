'use client';

import { useState } from 'react';
import { parseNlp } from '@/lib/api';

interface NlpPanelProps {
  onSuccess: () => void;
}

export default function NlpPanel({ onSuccess }: NlpPanelProps) {
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handlePreview = async () => {
    if (!text.trim()) {
      setError('נא להזין פקודה');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await parseNlp(text, true);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בניתוח הפקודה');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!text.trim()) {
      setError('נא להזין פקודה');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await parseNlp(text, false);
      setResult(response);
      if (response.ok) {
        setTimeout(() => {
          setText('');
          setResult(null);
          onSuccess();
        }, 1500);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בביצוע הפקודה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="nlp-input" className="block text-sm font-medium mb-2">
          הזן פקודה בעברית
        </label>
        <textarea
          id="nlp-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='דוגמה: "מחר 10:00 פגישת צוות שעתיים עם team@example.com תזכורות 30,10 צבע כחול"'
          className="w-full px-3 py-2 bg-[#0b1220] border border-[#1e2a48] rounded-lg focus:outline-none focus:border-[#2e4c86] min-h-[80px]"
          rows={3}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700/50 rounded-lg">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-3 bg-green-900/20 border border-green-700/50 rounded-lg">
          <p className="text-green-300 text-sm">{result.message || 'הפעולה הושלמה בהצלחה'}</p>
          {result.interpreted && result.interpreted.event && (
            <div className="mt-2 text-xs text-[#9fb4d9]">
              <p>כותרת: {result.interpreted.event.title}</p>
              {result.interpreted.event.guests && result.interpreted.event.guests.length > 0 && (
                <p>משתתפים: {result.interpreted.event.guests.join(', ')}</p>
              )}
              {result.interpreted.event.recurrence && (
                <p>חוזר: {result.interpreted.event.recurrence.type}</p>
              )}
              {result.interpreted.event.allDay && <p>אירוע כל היום</p>}
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handlePreview}
          disabled={loading}
          className="px-4 py-2 bg-[#101a30] border border-[#1e2a48] rounded-lg hover:bg-[#162138] transition disabled:opacity-50"
        >
          {loading ? 'מנתח...' : 'תצוגה מקדימה'}
        </button>
        <button
          type="button"
          onClick={handleExecute}
          disabled={loading}
          className="px-4 py-2 bg-[#1b3a6b] border border-[#2e4c86] rounded-lg hover:bg-[#244a7f] transition disabled:opacity-50"
        >
          {loading ? 'מבצע...' : 'בצע'}
        </button>
      </div>

      <div className="text-xs text-[#9fb4d9] space-y-1">
        <p className="font-semibold">דוגמאות לפקודות:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>מחר 09:00 פגישת צוות שעתיים עם dani@example.com תזכורות 30,10 צבע כחול</li>
          <li>שלישי הבא 14:00–15:30 סינק מוצר כל שבוע עד 31.12</li>
          <li>15.11 יום מלא האקתון כל היום צבע אדום</li>
          <li>כל יום 08:30 רוטינת פתיחה חצי שעה תזכורת 5</li>
        </ul>
      </div>
    </div>
  );
}
