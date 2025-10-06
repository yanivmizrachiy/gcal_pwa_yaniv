'use client';

import { isExecUrlConfigured, getExecUrl } from '@/lib/api';
import { useEffect, useState } from 'react';

export default function ExecUrlBanner() {
  const [isConfigured, setIsConfigured] = useState(true);
  const [showOverride, setShowOverride] = useState(false);
  const [overrideUrl, setOverrideUrl] = useState('');

  useEffect(() => {
    setIsConfigured(isExecUrlConfigured());
  }, []);

  const handleSetOverride = () => {
    if (overrideUrl.trim()) {
      localStorage.setItem('EXEC_URL_OVERRIDE', overrideUrl.trim());
      setIsConfigured(true);
      setShowOverride(false);
      window.location.reload();
    }
  };

  if (isConfigured) {
    return null;
  }

  return (
    <div className="fixed top-0 inset-x-0 z-50 animate-slide-down">
      <div className="max-w-4xl mx-auto m-4">
        <div className="glass rounded-2xl p-4 border-2 border-yellow-500/50 bg-yellow-500/10">
          <div className="flex items-start gap-3">
            <div className="text-yellow-500 flex-shrink-0 mt-1">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg mb-2">כתובת EXEC_URL חסרה</h3>
              <p className="text-sm opacity-90 mb-3">
                על מנת להשתמש באפליקציה, יש להגדיר את כתובת ה-EXEC_URL של Google Apps Script.
              </p>
              
              {!showOverride ? (
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setShowOverride(true)}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
                  >
                    הגדר זמנית
                  </button>
                  <a
                    href="https://github.com/yanivmizrachiy/gcal_pwa_yaniv/issues/new?title=Set%20EXEC_URL&body=Please%20paste%20your%20EXEC_URL%20here"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    פתח Issue להגדרה קבועה
                  </a>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={overrideUrl}
                    onChange={(e) => setOverrideUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/.../exec"
                    className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-sm"
                    dir="ltr"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleSetOverride}
                      disabled={!overrideUrl.trim()}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors"
                    >
                      שמור
                    </button>
                    <button
                      onClick={() => setShowOverride(false)}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
