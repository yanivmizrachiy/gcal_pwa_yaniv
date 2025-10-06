'use client';

import { useState, useCallback } from 'react';
import CommandBar from '@/components/CommandBar';
import EventList from '@/components/EventList';
import ExecUrlBanner from '@/components/ExecUrlBanner';
import ThemeToggle from '@/components/ThemeToggle';
import { ToastContainer, type ToastType } from '@/components/Toast';
import { fetchEvents, selfTest, getErrorMessage } from '@/lib/api';
import type { CalendarEvent } from '@/types/calendar';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleTodayEvents = async () => {
    setLoading(true);
    try {
      const response = await fetchEvents();
      const items = response.items || [];
      setEvents(items);
      addToast(`נמצאו ${items.length} אירועים`, 'success');
    } catch (error) {
      const message = getErrorMessage(error);
      addToast(message, 'error');
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelfTest = async () => {
    setLoading(true);
    try {
      const response = await selfTest();
      if (response.ok) {
        addToast(
          `SelfTest הצליח! משתמש: ${response.user || 'לא ידוע'} | זמן: ${new Date(response.now).toLocaleTimeString('he-IL')}`,
          'success'
        );
      } else {
        addToast('SelfTest נכשל', 'error');
      }
    } catch (error) {
      const message = getErrorMessage(error);
      addToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async (text: string) => {
    addToast('פקודה בשפה טבעית תטופל ב-Stage 2', 'info');
    console.log('Command text:', text);
    // Stage 2: Parse and execute command
  };

  const handleSearchRange = async (start: string, end: string) => {
    addToast(`חיפוש טווח תאריכים (${start} עד ${end}) יטופל ב-Stage 2`, 'info');
    console.log('Search range:', { start, end });
    // Stage 2: Implement range search
  };

  return (
    <div className="min-h-screen">
      <ExecUrlBanner />
      
      {/* Header */}
      <header className="glass border-b border-white/10 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">📅</div>
            <div>
              <h1 className="text-xl font-bold">יומן חכם</h1>
              <p className="text-xs opacity-70">מערכת ניהול אירועים חכמה</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <CommandBar
          onExecute={handleExecute}
          onTodayEvents={handleTodayEvents}
          onSelfTest={handleSelfTest}
          onSearchRange={handleSearchRange}
          loading={loading}
        />

        <EventList events={events} loading={loading} />

        {/* Info Card */}
        <div className="card text-sm opacity-70">
          <p className="mb-2">
            <strong>Stage 1:</strong> ממשק משתמש בסיסי עם קריאת אירועים.
          </p>
          <p>
            <strong>Stage 2 (בקרוב):</strong> CRUD מלא, פענוח NLP, ואינטגרציה עם GPT.
          </p>
        </div>
      </main>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
