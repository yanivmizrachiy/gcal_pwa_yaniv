# יומן חכם – יניב (gcal_pwa_yaniv)

Progressive Web App (PWA) לניהול יומן Google Calendar עם תמיכה אופליין, OAuth2, ואפשרויות מתקדמות.

## 📋 Phase Roadmap

### Phase A – Foundations (Current)
**Progress: ~18%**

- **A.1** ✅ PWA Scaffold + TypeScript Architecture + PKCE Auth Skeleton
  - Project structure with Vite + TypeScript
  - Hash-based routing system
  - UI component library (Button, Toast, Spinner, Layout)
  - PKCE OAuth2 flow scaffolding
  - Service worker with caching strategy
  - RTL support and accessibility
  
- **A.2** (Next) Apps Script Backend + Token Exchange
  - Complete OAuth redirect handling
  - Token exchange via Apps Script proxy
  - Token persistence (localStorage)
  - Basic calendar list fetch
  - First event listing (read-only)

### Phase B – Calendar Core (Planned)
- Full CRUD operations for events
- Calendar list management
- Event recurrence handling
- Multi-calendar support

### Phase C – UI/UX Enhancement (Planned)
- Day/Week/Month view implementations
- Event creation forms
- Drag-and-drop event editing
- Advanced filtering and search

### Phase D – Smart Features (Planned)
- AI-powered event suggestions
- Natural language event creation
- Smart reminders and notifications
- Conflict detection

### Phase E – Tasks & Reports (Planned)
- Task management integration
- Time tracking and analytics
- Custom reports and insights
- Export functionality

### Phase F – Polish & Deployment (Planned)
- Performance optimization
- Comprehensive testing
- Production deployment
- User documentation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm (recommended) or npm
- Google Cloud Project with Calendar API enabled
- OAuth2 Client ID (get from [Google Cloud Console](https://console.cloud.google.com/apis/credentials))

### Installation

```bash
# Clone the repository
git clone https://github.com/yanivmizrachiy/gcal_pwa_yaniv.git
cd gcal_pwa_yaniv

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env

# Edit .env with your OAuth credentials
# VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
# VITE_REDIRECT_URI=http://localhost:5173
```

### Development

```bash
# Start development server
pnpm run dev

# Open http://localhost:5173
```

### Build for Production

```bash
# Create production build
pnpm run build

# Preview production build
pnpm run preview
```

### Code Quality

```bash
# Run ESLint
pnpm run lint

# Format code with Prettier
pnpm run format
```

## 🔐 OAuth2 Setup (Phase A.2 Coming Soon)

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google Calendar API

### 2. Configure OAuth2 Consent Screen
1. Navigate to "OAuth consent screen"
2. Choose "External" user type
3. Fill in app information
4. Add scopes:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/userinfo.email`
   - `https://www.googleapis.com/auth/userinfo.profile`

### 3. Create OAuth2 Credentials
1. Navigate to "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - Development: `http://localhost:5173`
   - Production: `https://yourusername.github.io/gcal_pwa_yaniv`
5. Copy Client ID to `.env`

### 4. Apps Script Backend (Phase A.2)
Phase A.2 will include detailed setup for the Apps Script backend that handles:
- Token exchange (PKCE flow completion)
- Calendar API proxy
- Secure token refresh

## 📱 PWA Features

### Service Worker
- **Caching Strategy**: Core assets cached on install
- **Network Strategy**: Network-first for API calls
- **Update Mechanism**: Automatic detection with user notification
- **Offline Support**: Basic offline shell (full offline in Phase C)

### Manifest
- **Install Prompt**: Available on supported browsers
- **Standalone Mode**: App-like experience
- **RTL Support**: Full Hebrew language support
- **Icons**: 192x192 and 512x512 (placeholders for now)

### Accessibility
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatible
- RTL layout throughout

## 🏗️ Project Structure

```
gcal_pwa_yaniv/
├── public/                 # Static assets
│   ├── index.html         # App shell HTML
│   ├── manifest.json      # PWA manifest
│   ├── sw.js              # Service worker
│   └── icons/             # App icons
├── src/                   # TypeScript source
│   ├── main.ts            # Entry point
│   ├── app-shell.ts       # View manager
│   ├── router.ts          # Hash-based router
│   ├── auth/              # OAuth2 implementation
│   │   └── google-oauth.ts
│   ├── calendar/          # Calendar API wrappers
│   │   └── api.ts
│   ├── state/             # State management
│   │   └── session.ts
│   ├── types/             # TypeScript types
│   │   └── calendar.ts
│   ├── ui/components/     # UI components
│   │   ├── Button.ts
│   │   ├── Layout.ts
│   │   ├── Spinner.ts
│   │   └── Toast.ts
│   └── utils/             # Utility functions
│       └── pkce.ts
├── config/                # Configuration
│   └── env.d.ts           # Environment types
├── src/                   # Apps Script backend (future)
│   └── Code.gs            # Apps Script proxy
├── .github/workflows/     # CI/CD
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🎨 Design System

### Colors (Dark Theme)
- **Primary Background**: `#0b1220`
- **Secondary Background**: `#101a30`
- **Card Background**: `#1a2a48`
- **Border**: `#2e4c86`
- **Text Primary**: `#e7ecf5`
- **Text Secondary**: `#9fb4d9`
- **Accent**: `#1b3a6b`

### Typography
- **Font**: Noto Sans Hebrew (with system fallbacks)
- **Direction**: RTL (Right-to-Left)
- **Language**: Hebrew (he)

## 🧪 Testing & Verification

### Manual Testing Checklist
- [ ] `pnpm run dev` starts development server
- [ ] Navigation switches hash routes correctly
- [ ] Service worker installs and caches assets
- [ ] `pnpm run build` creates dist/ directory
- [ ] Toast notifications appear and dismiss
- [ ] Layout is RTL-compliant
- [ ] All routes render without errors

### Lighthouse Audit (Optional)
- PWA score should be high
- Manifest properly configured
- Service worker active
- Accessibility checks pass

## 🔧 Development Notes

### Environment Variables
- **Development**: `.env` file (not committed)
- **Production**: Set via deployment platform
- **Required**: `VITE_GOOGLE_CLIENT_ID`, `VITE_REDIRECT_URI`
- **Optional**: `VITE_BACKEND_BASE` (Phase A.2+)

### Browser Support
- Modern browsers with ES2020 support
- Service Worker support required for offline
- Tested on: Chrome, Edge, Firefox, Safari

### Code Standards
- **Strict TypeScript**: All files type-checked
- **ESLint**: Enforces code quality
- **Prettier**: Automatic formatting
- **JSDoc**: Public functions documented

## 📦 Deployment

### GitHub Pages (Automated)
Push to `main` branch triggers automatic deployment via GitHub Actions.

**Workflow**: `.github/workflows/deploy-pages.yml`
- Builds with Vite
- Deploys to GitHub Pages
- Available at: `https://yourusername.github.io/gcal_pwa_yaniv`

### Manual Deployment
```bash
pnpm run build
# Upload dist/ contents to your hosting provider
```

## 🐛 Troubleshooting

### Service Worker Not Updating
1. Hard refresh (Ctrl+Shift+R / Cmd+Shift+R)
2. Clear site data in DevTools
3. Unregister old service worker manually

### OAuth Redirect Fails
1. Verify redirect URI matches exactly in Google Console
2. Check that Client ID is correct in `.env`
3. Ensure using https in production (http only for localhost)

### Build Errors
```bash
# Clean and reinstall
rm -rf node_modules dist
pnpm install
pnpm run build
```

## 🤝 Contributing

This is a personal project for Yaniv, but suggestions and feedback are welcome via issues.

## 📄 License

MIT License - See LICENSE file for details

## 🎯 Next Steps (Phase A.2)

1. Implement Apps Script backend for token exchange
2. Complete OAuth redirect handling with token persistence
3. Implement first calendar API calls (list calendars, list events)
4. Add authentication UI (login/logout buttons)
5. Test full OAuth flow end-to-end

---

**Current Phase**: A.1 (Complete)  
**Next Phase**: A.2 (OAuth Completion)  
**Overall Progress**: ~18% of Phases A-F
