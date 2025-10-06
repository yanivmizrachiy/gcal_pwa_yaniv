/**
 * Application shell - lightweight view manager
 * Handles routing between different application views
 */

import { router } from './router';
import { createLayout, updateNavigation } from './ui/components/Layout';
import { showToast } from './ui/components/Toast';
import { sessionStore } from './state/session';
import { handleRedirect } from './auth/google-oauth';

/**
 * Renders dashboard view
 */
function renderDashboard(): void {
  const content = document.createElement('div');
  content.innerHTML = `
    <h1 style="margin-bottom: 20px;">לוח בקרה</h1>
    <div style="background: var(--bg-secondary); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
      <p style="margin-bottom: 10px;">ברוכים הבאים ליומן החכם של יניב</p>
      <p style="color: var(--text-secondary); font-size: 14px;">
        Phase A.1: המבנה הבסיסי והניווט מוכנים. Phase A.2 יוסיף את תהליך האימות המלא.
      </p>
    </div>
  `;
  updateView(content);
}

/**
 * Renders day view
 */
function renderDay(): void {
  const content = document.createElement('div');
  content.innerHTML = `
    <h1 style="margin-bottom: 20px;">תצוגת יום</h1>
    <div style="background: var(--bg-secondary); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
      <p style="color: var(--text-secondary);">תצוגת יום - בפיתוח</p>
    </div>
  `;
  updateView(content);
}

/**
 * Renders week view
 */
function renderWeek(): void {
  const content = document.createElement('div');
  content.innerHTML = `
    <h1 style="margin-bottom: 20px;">תצוגת שבוע</h1>
    <div style="background: var(--bg-secondary); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
      <p style="color: var(--text-secondary);">תצוגת שבוע - בפיתוח</p>
    </div>
  `;
  updateView(content);
}

/**
 * Renders month view
 */
function renderMonth(): void {
  const content = document.createElement('div');
  content.innerHTML = `
    <h1 style="margin-bottom: 20px;">תצוגת חודש</h1>
    <div style="background: var(--bg-secondary); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
      <p style="color: var(--text-secondary);">תצוגת חודש - בפיתוח</p>
    </div>
  `;
  updateView(content);
}

/**
 * Renders tasks view
 */
function renderTasks(): void {
  const content = document.createElement('div');
  content.innerHTML = `
    <h1 style="margin-bottom: 20px;">משימות</h1>
    <div style="background: var(--bg-secondary); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
      <p style="color: var(--text-secondary);">ניהול משימות - בפיתוח</p>
    </div>
  `;
  updateView(content);
}

/**
 * Renders reports view
 */
function renderReports(): void {
  const content = document.createElement('div');
  content.innerHTML = `
    <h1 style="margin-bottom: 20px;">דוחות</h1>
    <div style="background: var(--bg-secondary); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
      <p style="color: var(--text-secondary);">דוחות וסטטיסטיקות - בפיתוח</p>
    </div>
  `;
  updateView(content);
}

/**
 * Renders settings view
 */
function renderSettings(): void {
  const content = document.createElement('div');
  content.innerHTML = `
    <h1 style="margin-bottom: 20px;">הגדרות</h1>
    <div style="background: var(--bg-secondary); padding: 20px; border-radius: 12px; border: 1px solid var(--border-color);">
      <p style="color: var(--text-secondary); margin-bottom: 10px;">אימות: ${sessionStore.isAuthenticated() ? 'מחובר' : 'לא מחובר'}</p>
      <p style="color: var(--text-secondary); font-size: 14px;">הגדרות נוספות - בפיתוח</p>
    </div>
  `;
  updateView(content);
}

/**
 * Updates the main view content
 */
function updateView(content: HTMLElement): void {
  const main = document.querySelector('.app-main');
  if (main) {
    main.innerHTML = '';
    main.appendChild(content);
  }
  updateNavigation(router.getCurrentPath());
}

/**
 * Initializes the application shell
 */
export function initAppShell(): void {
  // Register routes
  router.on('/', renderDashboard);
  router.on('/day', renderDay);
  router.on('/week', renderWeek);
  router.on('/month', renderMonth);
  router.on('/tasks', renderTasks);
  router.on('/reports', renderReports);
  router.on('/settings', renderSettings);

  router.notFound(() => {
    showToast('דף לא נמצא', { type: 'error' });
    router.navigate('/');
  });

  // Handle OAuth redirect if present
  handleRedirect()
    .then((handled) => {
      if (handled) {
        showToast('אימות התקבל - ממתין להטמעה ב-Phase A.2', { type: 'info' });
      }
    })
    .catch((error) => {
      showToast(`שגיאת אימות: ${error.message}`, { type: 'error' });
    });

  // Start routing
  router.listen();

  // Initial render
  const initialContent = document.createElement('div');
  const layout = createLayout(initialContent);

  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = '';
    root.appendChild(layout);
  }

  // Trigger initial route
  router.resolve();
}
