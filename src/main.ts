/**
 * Main application entry point
 * Bootstraps the app shell and registers service worker
 */

import { initAppShell } from './app-shell';
import { showToast } from './ui/components/Toast';

/**
 * Registers the service worker for PWA functionality
 */
async function registerServiceWorker(): Promise<void> {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('Service Worker registered:', registration.scope);

      // Listen for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showToast('גרסה חדשה זמינה. רענן את הדף לעדכון.', {
                type: 'info',
                duration: 10000,
              });
            }
          });
        }
      });
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
}

/**
 * Initialize PWA install prompt
 */
function initInstallPrompt(): void {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    console.log('PWA install prompt available');
    // Could show a custom install button here
    // For Phase A.1, just log it
  });

  window.addEventListener('appinstalled', () => {
    console.log('PWA installed successfully');
    showToast('האפליקציה הותקנה בהצלחה!', { type: 'success' });
  });
}

/**
 * Main initialization function
 */
async function init(): Promise<void> {
  console.log('gcal_pwa_yaniv - Phase A.1 starting...');

  // Check for required environment variables
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    console.warn(
      'Missing OAuth configuration. Please set VITE_GOOGLE_CLIENT_ID and VITE_REDIRECT_URI'
    );
  }

  // Register service worker
  registerServiceWorker();

  // Initialize install prompt handling
  initInstallPrompt();

  // Initialize app shell and routing
  initAppShell();

  console.log('gcal_pwa_yaniv - Phase A.1 initialized successfully');
}

// Start the application
init().catch((error) => {
  console.error('Failed to initialize application:', error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--text-primary);">
        <h1>שגיאה בטעינת האפליקציה</h1>
        <p style="color: var(--text-secondary); margin-top: 10px;">
          ${error.message || 'שגיאה לא ידועה'}
        </p>
      </div>
    `;
  }
});
