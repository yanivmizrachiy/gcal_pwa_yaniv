/**
 * Toast notification system with accessibility support
 */

export type ToastType = 'info' | 'success' | 'warning' | 'error';

interface ToastOptions {
  duration?: number; // milliseconds, 0 = no auto-dismiss
  type?: ToastType;
}

const TOAST_STYLES = `
.toast {
  background: var(--bg-card, #1a2a48);
  border: 1px solid var(--border-color, #2e4c86);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 250px;
  max-width: 400px;
  animation: slideIn 0.3s ease;
}
.toast.info { border-right: 4px solid #3b82f6; }
.toast.success { border-right: 4px solid #10b981; }
.toast.warning { border-right: 4px solid #f59e0b; }
.toast.error { border-right: 4px solid #ef4444; }
.toast-message { flex: 1; color: var(--text-primary, #e7ecf5); }
.toast-close {
  background: none;
  border: none;
  color: var(--text-secondary, #9fb4d9);
  cursor: pointer;
  font-size: 20px;
  padding: 0;
  width: 24px;
  height: 24px;
}
@keyframes slideIn {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
`;

/**
 * Shows a toast notification
 * @param message - Text to display
 * @param options - Toast configuration
 */
export function showToast(message: string, options: ToastOptions = {}): void {
  const { duration = 5000, type = 'info' } = options;

  // Ensure styles are injected
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = TOAST_STYLES;
    document.head.appendChild(style);
  }

  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.setAttribute('role', 'status');
  toast.setAttribute('aria-live', 'polite');

  const messageSpan = document.createElement('span');
  messageSpan.className = 'toast-message';
  messageSpan.textContent = message;

  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.textContent = '×';
  closeBtn.setAttribute('aria-label', 'סגור');
  closeBtn.onclick = () => removeToast(toast);

  toast.appendChild(messageSpan);
  toast.appendChild(closeBtn);
  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => removeToast(toast), duration);
  }
}

function removeToast(toast: HTMLElement): void {
  toast.style.animation = 'slideIn 0.3s ease reverse';
  setTimeout(() => toast.remove(), 300);
}
