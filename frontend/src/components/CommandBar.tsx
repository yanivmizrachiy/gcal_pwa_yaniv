'use client';

import { useState } from 'react';

interface CommandBarProps {
  onExecute: (text: string) => void;
  onTodayEvents: () => void;
  onSelfTest: () => void;
  onSearchRange: (start: string, end: string) => void;
  loading?: boolean;
}

export default function CommandBar({
  onExecute,
  onTodayEvents,
  onSelfTest,
  onSearchRange,
  loading = false,
}: CommandBarProps) {
  const [commandText, setCommandText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showRangePicker, setShowRangePicker] = useState(false);

  const handleExecute = () => {
    if (commandText.trim()) {
      onExecute(commandText.trim());
    }
  };

  const handleSearchRange = () => {
    if (startDate && endDate) {
      onSearchRange(startDate, endDate);
      setShowRangePicker(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Natural Language Input */}
      <div className="card">
        <label htmlFor="command-input" className="block text-sm font-medium mb-2 opacity-80">
          פקודה בשפה טבעית
        </label>
        <div className="flex gap-2">
          <textarea
            id="command-input"
            value={commandText}
            onChange={(e) => setCommandText(e.target.value)}
            placeholder="לדוגמה: צור פגישה מחר בשעה 10:00 עם יוסי..."
            rows={3}
            disabled={loading}
            className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none transition-all"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                handleExecute();
              }
            }}
          />
        </div>
        <div className="flex justify-end mt-2">
          <button
            onClick={handleExecute}
            disabled={loading || !commandText.trim()}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors"
          >
            {loading ? 'מעבד...' : 'בצע'}
          </button>
        </div>
        <p className="text-xs opacity-60 mt-2">
          טיפ: לחץ Ctrl+Enter לביצוע מהיר
        </p>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 className="text-sm font-medium mb-3 opacity-80">פעולות מהירות</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={onTodayEvents}
            disabled={loading}
            className="px-4 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            אירועי היום
          </button>
          
          <button
            onClick={() => setShowRangePicker(!showRangePicker)}
            disabled={loading}
            className="px-4 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            חפש טווח
          </button>
          
          <button
            onClick={onSelfTest}
            disabled={loading}
            className="px-4 py-3 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            SelfTest
          </button>
        </div>
      </div>

      {/* Date Range Picker */}
      {showRangePicker && (
        <div className="card animate-slide-down">
          <h3 className="text-sm font-medium mb-3">בחר טווח תאריכים</h3>
          <div className="space-y-3">
            <div>
              <label htmlFor="start-date" className="block text-xs opacity-70 mb-1">
                תאריך התחלה
              </label>
              <input
                type="date"
                id="start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="end-date" className="block text-xs opacity-70 mb-1">
                תאריך סיום
              </label>
              <input
                type="date"
                id="end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSearchRange}
                disabled={!startDate || !endDate}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
              >
                חפש
              </button>
              <button
                onClick={() => setShowRangePicker(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
