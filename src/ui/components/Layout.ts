/**
 * Main layout component with navigation
 */

const LAYOUT_STYLES = `
.app-layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.app-header {
  background: var(--bg-secondary, #101a30);
  border-bottom: 1px solid var(--border-color, #2e4c86);
  padding: 12px 16px;
}
.app-nav {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: thin;
}
.nav-btn {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  color: var(--text-secondary, #9fb4d9);
  cursor: pointer;
  white-space: nowrap;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  font-family: inherit;
}
.nav-btn:hover {
  background: var(--bg-card, #1a2a48);
  color: var(--text-primary, #e7ecf5);
}
.nav-btn.active {
  background: var(--accent, #1b3a6b);
  border-color: var(--accent-hover, #2e4c86);
  color: #fff;
}
.app-main {
  flex: 1;
  padding: 16px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}
`;

export interface NavigationItem {
  id: string;
  label: string;
  route: string;
}

const NAV_ITEMS: NavigationItem[] = [
  { id: 'dashboard', label: 'לוח בקרה', route: '#/' },
  { id: 'day', label: 'יום', route: '#/day' },
  { id: 'week', label: 'שבוע', route: '#/week' },
  { id: 'month', label: 'חודש', route: '#/month' },
  { id: 'tasks', label: 'משימות', route: '#/tasks' },
  { id: 'reports', label: 'דוחות', route: '#/reports' },
  { id: 'settings', label: 'הגדרות', route: '#/settings' },
];

/**
 * Creates the main application layout with navigation
 * @param contentElement - Main content to render
 */
export function createLayout(contentElement: HTMLElement): HTMLElement {
  // Ensure styles are injected
  if (!document.getElementById('layout-styles')) {
    const style = document.createElement('style');
    style.id = 'layout-styles';
    style.textContent = LAYOUT_STYLES;
    document.head.appendChild(style);
  }

  const layout = document.createElement('div');
  layout.className = 'app-layout';

  // Header with navigation
  const header = document.createElement('header');
  header.className = 'app-header';

  const nav = document.createElement('nav');
  nav.className = 'app-nav';
  nav.setAttribute('aria-label', 'ניווט ראשי');

  NAV_ITEMS.forEach((item) => {
    const btn = document.createElement('button');
    btn.className = 'nav-btn';
    btn.textContent = item.label;
    btn.dataset.route = item.route;
    btn.onclick = () => {
      window.location.hash = item.route.slice(1); // Remove '#'
    };

    // Set active state
    const currentHash = window.location.hash || '#/';
    if (currentHash === item.route) {
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
    }

    nav.appendChild(btn);
  });

  header.appendChild(nav);

  // Main content area
  const main = document.createElement('main');
  main.className = 'app-main';
  main.setAttribute('role', 'main');
  main.appendChild(contentElement);

  layout.appendChild(header);
  layout.appendChild(main);

  return layout;
}

/**
 * Updates active navigation state
 * @param route - Current route (e.g., '/', '/day')
 */
export function updateNavigation(route: string): void {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach((btn) => {
    const btnRoute = (btn as HTMLElement).dataset.route;
    if (btnRoute === `#${route}`) {
      btn.classList.add('active');
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.classList.remove('active');
      btn.removeAttribute('aria-current');
    }
  });
}
