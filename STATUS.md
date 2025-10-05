# Repository Status & Capability Map

**Last Updated**: 2024 (automated audit for pr/audit-inventory)  
**Repository**: yanivmizrachiy/gcal_pwa_yaniv  
**Purpose**: Progressive Web App (PWA) for Google Calendar integration with Hebrew localization

---

## 1. Overview

This repository implements a Progressive Web App that integrates with Google Calendar using Google Apps Script (GAS) as a backend. The PWA is designed for Hebrew-speaking users and provides installable mobile/desktop capabilities with offline-first architecture.

---

## 2. Module Inventory

### 2.1 Frontend (PWA)

| File | Purpose | Status | Notes |
|------|---------|--------|-------|
| `index.html` | Main PWA entry point | ✅ **Working** | Hebrew RTL layout, install prompt, iframe integration |
| `manifest.webmanifest` | PWA manifest | ✅ **Working** | Defines app metadata, icons, theme colors |
| `sw.js` | Service Worker | ✅ **Working** | Cache version: `yaniv-v3`, offline assets caching |
| `icons/icon-192.png` | PWA icon (192x192) | ✅ **Present** | Required for PWA installability |
| `icons/icon-512.png` | PWA icon (512x512) | ✅ **Present** | Required for PWA installability |

### 2.2 Backend (Google Apps Script)

| File | Purpose | Status | Notes |
|------|---------|--------|-------|
| `src/Code.gs` | GAS web app handler | ✅ **Working** | Implements `doGet()` with modes: info, selftest, events |
| `src/appsscript.json` | GAS project manifest | ✅ **Working** | OAuth scopes, timezone (Asia/Jerusalem), runtime V8 |

### 2.3 CI/CD Workflows

| Workflow | Trigger | Purpose | Status | Notes |
|----------|---------|---------|--------|-------|
| `gas-deploy.yml` | push to main, manual | Deploy GAS backend | ✅ **Working** | Includes clasp deployment, selftest, URL extraction |
| `pages.yml` | push to main, manual | Deploy GitHub Pages | ✅ **Working** | Static site deployment |
| `set-exec-url.yml` | issue with "Set EXEC_URL" | Update EXEC_URL in gh-pages | ✅ **Working** | Parses URL from issue, updates index.html |
| `update-from-issue.yml` | issue with "Update PWA" | Apply changes via issue | ⚠️ **Partial** | Uses deprecated npm package |
| `issue-commands.yml` | issue opened/edited | Trigger workflows from issues | ✅ **Working** | Detects deploy/update commands |

---

## 3. Detailed Capability Map

### 3.1 PWA Features

| Feature | Status | Implementation | Issues/Gaps |
|---------|--------|----------------|-------------|
| **Install Prompt** | ✅ Full | `beforeinstallprompt` event handler in `index.html` | None |
| **Service Worker** | ✅ Full | Caches 5 core assets, offline-first | Cache invalidation strategy basic |
| **Offline Support** | ⚠️ Partial | Static assets cached, iframe content requires network | Backend API calls fail offline |
| **RTL/Hebrew UI** | ✅ Full | `lang="he" dir="rtl"` with Hebrew text | None |
| **Responsive Design** | ✅ Full | CSS with mobile-first viewport | None |
| **Dark Theme** | ✅ Full | Dark color scheme (#0b1220 background) | No light theme option |
| **Manifest** | ✅ Full | Valid PWA manifest with icons, colors, display mode | None |

### 3.2 Google Apps Script Backend

| Feature | Status | Implementation | Issues/Gaps |
|---------|--------|----------------|-------------|
| **Web App Deployment** | ✅ Full | `webapp` config in `appsscript.json` | EXEC_URL must be manually set |
| **Calendar Read Access** | ✅ Full | OAuth scope: `calendar.readonly` | Write operations not implemented |
| **Selftest Endpoint** | ✅ Full | `?mode=selftest` returns user, timestamp | None |
| **Events Endpoint** | ✅ Full | `?mode=events` returns 7-day events (max 10) | Limited to 10 events, no pagination |
| **User Authentication** | ✅ Full | `executeAs: USER_ACCESSING` | Each user authorizes separately |
| **Error Handling** | ⚠️ Basic | Returns JSON payload | No try-catch, no error codes |
| **Rate Limiting** | ❌ Missing | None | Could hit GAS quota limits |

### 3.3 CI/CD Automation

| Feature | Status | Implementation | Issues/Gaps |
|---------|--------|----------------|-------------|
| **Automated GAS Deploy** | ✅ Full | clasp push, version, deploy | Requires `CLASP_TOKEN_JSON`, `GAS_SCRIPT_ID` secrets |
| **Selftest in CI** | ✅ Full | HTTP test after deployment | Only checks HTTP 200, not response validity |
| **EXEC_URL Extraction** | ⚠️ Partial | Primary + fallback regex parsing | May fail if GAS output format changes |
| **GitHub Pages Deploy** | ✅ Full | Uploads artifact, deploys to gh-pages | None |
| **Issue-Based Updates** | ⚠️ Partial | Parses issues for commands | `update-from-issue.yml` uses deprecated package |
| **Concurrency Control** | ✅ Full | Pages workflow has concurrency group | None |

### 3.4 Integration Points

| Integration | Status | Configuration | Issues/Gaps |
|-------------|--------|---------------|-------------|
| **Google Calendar API** | ✅ Working | Via CalendarApp in GAS | Read-only access |
| **GitHub Actions Secrets** | ✅ Required | `CLASP_TOKEN_JSON`, `GAS_SCRIPT_ID` | Must be configured manually |
| **GitHub Pages** | ✅ Working | Deploys to `github-pages` environment | EXEC_URL must be updated via issue |
| **Service Worker Cache** | ✅ Working | Local browser cache (`yaniv-v3`) | No cache versioning strategy |
| **External GAS iframe** | ✅ Working | Embedded via hardcoded URL in `index.html` | URL is static, not environment-aware |

---

## 4. Feature Readiness Assessment

### 4.1 Production-Ready ✅

- **PWA Core**: Install, offline static assets, service worker
- **Hebrew Localization**: Full RTL support
- **Calendar Read API**: Functional via GAS
- **Automated Deployment**: CI/CD pipelines operational
- **GitHub Pages Hosting**: Stable

### 4.2 Partially Ready ⚠️

- **Offline Experience**: Static only, no offline calendar data
- **Error Handling**: Basic, no user-friendly error messages
- **EXEC_URL Management**: Manual process via issues
- **Event Pagination**: Limited to 10 events
- **Cache Strategy**: No versioning or expiration logic

### 4.3 Missing/Not Implemented ❌

- **Calendar Write Operations**: No create/edit/delete events
- **Authentication UI**: Users must authorize in iframe
- **Rate Limiting**: No quota management
- **Analytics/Monitoring**: No error tracking or usage metrics
- **Testing**: No unit tests or integration tests
- **Documentation**: No README, API docs, or user guide
- **Environment Config**: Hardcoded URLs, no .env support
- **Light Theme**: Only dark theme available
- **Accessibility**: No ARIA labels or a11y testing

---

## 5. Known Issues & Technical Debt

### 5.1 Critical Issues

1. **Hardcoded EXEC_URL in iframe** (`index.html:19`)
   - Manual update required via issue-based workflow
   - No environment-specific configuration

2. **No Error Recovery** (`src/Code.gs`)
   - GAS endpoints lack try-catch blocks
   - Errors expose stack traces to users

3. **Deprecated Workflow Dependency** (`update-from-issue.yml:16`)
   - Uses `peter-evans/create-issue-from-file@v5`
   - Uses `@vercel/issue-parser` (unmaintained)

### 5.2 Performance Concerns

1. **Event Limit**: Only 10 events returned, no pagination
2. **Cache Invalidation**: Manual version bump required (`yaniv-v3` in `sw.js`)
3. **No CDN**: Icons and assets served from GitHub Pages (no caching headers)

### 5.3 Security Considerations

1. **Open Web App Access** (`appsscript.json:11`)
   - `access: ANYONE` allows any user with link
   - Consider restricting to domain or organization

2. **No HTTPS Enforcement**: Service worker requires HTTPS, but not explicitly validated

3. **No CSP Headers**: No Content Security Policy defined

---

## 6. Immediate Priorities for Production Hardening

### Priority 1: Environment Configuration & Secret Management 🔴 **CRITICAL**

**Problem**: Hardcoded EXEC_URL in `index.html` iframe requires manual updates via GitHub issues, breaking automation and creating deployment friction.

**Solution**:
- Add build-time environment variable injection for EXEC_URL
- Update `pages.yml` workflow to automatically inject EXEC_URL during deployment
- Use GitHub Actions environment variables instead of manual issue workflow
- Consider adding a config.js that fetches EXEC_URL dynamically

**Impact**: Eliminates manual deployment step, enables true CI/CD

**Files to Update**:
- `.github/workflows/pages.yml` (add env var injection)
- `index.html` (use template or config.js)
- Optionally deprecate `set-exec-url.yml` workflow

---

### Priority 2: Error Handling & User Experience 🟡 **HIGH**

**Problem**: No error handling in GAS backend, no user-facing error messages, no loading states in PWA.

**Solution**:
- Add try-catch blocks in `src/Code.gs` with proper error responses
- Add HTTP status codes (400, 500) for errors
- Add loading spinner and error messages in iframe or PWA UI
- Implement retry logic for failed API calls
- Add offline detection and user notification

**Impact**: Better UX, easier debugging, production reliability

**Files to Update**:
- `src/Code.gs` (wrap all logic in try-catch)
- `index.html` (add error UI if direct API calls are added)

---

### Priority 3: Testing & Monitoring Infrastructure 🟡 **HIGH**

**Problem**: No automated tests, no monitoring, no way to detect production issues proactively.

**Solution**:
- Add integration tests for GAS endpoints (selftest, events)
- Add PWA manifest validation test
- Add service worker cache verification test
- Implement basic monitoring (health check endpoint, uptime monitoring)
- Add GitHub Actions test job that runs before deploy
- Consider adding error logging to GAS (using Logger or external service)

**Impact**: Catch bugs before production, faster incident response

**Files to Create/Update**:
- Add `tests/` directory with Jest or similar
- Add test workflow in `.github/workflows/test.yml`
- Update `gas-deploy.yml` to block on test failures

---

## 7. Recommendations (Non-Critical)

### 7.1 Code Quality
- Add ESLint/Prettier configuration
- Add TypeScript for better type safety
- Add JSDoc comments for GAS functions

### 7.2 Features
- Implement event pagination (support more than 10 events)
- Add calendar write operations (create/edit events)
- Add multi-calendar support
- Add date range picker for custom queries

### 7.3 Performance
- Implement cache-first with stale-while-revalidate strategy
- Add service worker background sync for offline actions
- Optimize icons (currently 70 bytes, likely placeholder)

### 7.4 Documentation
- Create README.md with setup instructions
- Document API endpoints and parameters
- Add CONTRIBUTING.md
- Create user guide for installation

---

## 8. Deployment Checklist

Before merging to production:

- [ ] Verify `CLASP_TOKEN_JSON` and `GAS_SCRIPT_ID` secrets are configured
- [ ] Test PWA installation on Android and iOS
- [ ] Verify service worker caching works
- [ ] Test GAS selftest and events endpoints manually
- [ ] Ensure GitHub Pages is enabled and deployed
- [ ] Update EXEC_URL in deployed PWA
- [ ] Verify all GitHub Actions workflows pass
- [ ] Review and test on Hebrew locale browser
- [ ] Check manifest.webmanifest validation (Lighthouse)
- [ ] Verify OAuth consent screen is configured for Calendar API

---

## 9. Change Log

| Date | Change | Files Modified |
|------|--------|----------------|
| (baseline) | Initial PWA + GAS implementation | All core files |
| (baseline) | Added CI/CD workflows | `.github/workflows/*` |
| (current) | Added STATUS.md for audit | `STATUS.md` |

---

## 10. Glossary

- **PWA**: Progressive Web App - installable web application
- **GAS**: Google Apps Script - serverless backend on Google Cloud
- **clasp**: Command Line Apps Script Projects - CLI for GAS deployment
- **RTL**: Right-to-Left text direction for Hebrew
- **EXEC_URL**: Execution URL for deployed GAS web app
- **gh-pages**: GitHub Pages branch for static hosting

---

**Status**: ✅ Repository is functionally operational with defined improvement path  
**Next Review**: After implementing Priority 1-3 hardening tasks
