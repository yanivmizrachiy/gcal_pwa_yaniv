# Operating Guidelines - Hebrew Calendar PWA

## Overview
This PWA provides a full CRUD interface for Google Calendar with Hebrew NLP support. Users can create, read, update, and delete calendar events through both a traditional form interface and natural Hebrew text input.

## Architecture

### Backend (src/Code.gs)
Google Apps Script web app with two HTTP endpoints:

#### GET Endpoints (doGet)
Legacy read-only modes for backward compatibility:
- `?mode=selftest` - Health check returning timestamp and user email
- `?mode=events` - Returns next 7 days of events (max 10)
- `?mode=today` - Returns today's events (0-24h, max 20)
- Unknown modes return JSON error with Hebrew message

#### POST Endpoints (doPost)
All POST actions expect JSON body with `action` field:

**CRUD Operations:**
- `selfTest` - Health check (same as GET selftest)
- `findEvents` - Query events with date range (start, end, maxResults ≤200)
- `createEvent` - Create new event (requires title, start; optional: end, location, description)
- `updateEvent` - Update existing event (requires eventId; optional: title, start, end, location, description)
- `deleteEvent` - Delete event (requires eventId)
- `getEvent` - Retrieve single event details (requires eventId)

**NLP Operations:**
- `text` - Parse Hebrew text and execute (NLP v1 - creates event)
- `parseOnly` - Parse Hebrew text without mutation (NLP v2-draft - preview only)

### Frontend (index.html)
Interactive Hebrew RTL UI with three main sections:
1. **NLP Quick Create** - Natural language event creation with preview
2. **Form Create** - Traditional form-based event creation
3. **Event List** - View, edit, and delete events

### Service Worker (sw.js v5)
- Caches static assets for offline capability
- Cleans up old cache versions on activation
- Version: yaniv-v5

### OAuth Scopes (src/appsscript.json)
- `calendar` - Full read/write access to Google Calendar
- `userinfo.email` - User identification
- `script.external_request` - External API calls

## Hebrew NLP v1 Features

### Supported Date Tokens
- `היום` (hayom) - Today
- `מחר` (machar) - Tomorrow

### Time Format
- `HH:MM` or `H:MM` (e.g., "14:30", "9:00")
- If no time specified, defaults to next hour

### Location Extraction
- Prefix: `ב-` or `ב` (e.g., "בתל אביב", "ב-משרד")

### Examples
```
"פגישה היום 14:00"
→ Meeting today at 14:00, duration 1 hour

"פגישה מחר 10:00 במשרד"
→ Meeting tomorrow at 10:00 at "משרד", duration 1 hour

"ארוחת צהריים 12:30"
→ Lunch today at 12:30, duration 1 hour
```

## Safety & Performance

### Rate Limiting
- `findEvents` capped at maxResults ≤200
- Short-circuit mapping to avoid processing large result sets
- Event queries limited to reasonable time ranges

### Validation
- `start` date validation with Hebrew error messages
- Required field checking (title, start for create; eventId for update/delete/get)
- Safe datetime parsing with fallbacks

### Error Handling
- All errors return `{ ok: false, error: "Hebrew message" }`
- Logging includes action type + summary substring (no full PII)
- Graceful degradation for parsing failures

### Security
- OAuth scope limited to calendar access only
- No storage of full event content in logs
- Input sanitization for special characters

## Deployment

### Prerequisites
- Google Apps Script project with Calendar API enabled
- OAuth consent configured for calendar scope
- Secrets configured in GitHub Actions:
  - `CLASP_TOKEN_JSON` - clasp authentication
  - `GAS_SCRIPT_ID` - Apps Script project ID

### Workflow (.github/workflows/gas-deploy.yml)
1. Push source files to Apps Script via clasp
2. Create version and deployment
3. Extract EXEC_URL
4. Run automated smoke tests (see below)
5. All tests must pass (HTTP 200 + ok:true) or workflow fails

### Smoke Tests
Automated tests run on every deployment:
- POST selfTest
- POST createEvent (real calendar - creates test event)
- POST findEvents (verifies created event)
- POST updateEvent (modifies test event)
- POST deleteEvent (cleans up test event)
- POST text (NLP create)
- POST parseOnly (NLP preview)

**Critical:** All smoke tests operate on the real calendar. Test events are cleaned up automatically.

## Known Limitations (TODOs)

### Not Implemented (Future v2)
- Move/duplicate events
- Advanced reminders reading
- htmlLink via Advanced Calendar API
- Ambiguous multi-match resolution for updates
- Attendees management (add/remove)
- All-day event inference beyond explicit phrases
- Multi-day event parsing
- Recurring event support in NLP
- Time zone handling for international users

### NLP v2-draft
- `parseOnly` returns parse results without execution
- Used for preview/validation before commit
- Full v2 will support update/delete via NLP

## Troubleshooting

### "שגיאה ביצירת אירוע"
- Check OAuth consent - may need re-authorization
- Verify start date is valid ISO 8601 format
- Ensure title is not empty

### Events not appearing
- Refresh the event list manually
- Check browser console for network errors
- Verify EXEC_URL is correct in index.html

### NLP parsing issues
- Ensure Hebrew text includes date token (היום/מחר) or time
- Check for typos in Hebrew keywords
- Use parseOnly to debug parsing before creating

### Deployment failures
- Verify clasp authentication is valid
- Check GAS_SCRIPT_ID matches your project
- Review smoke test logs in GitHub Actions

## Support
For issues or feature requests, open an issue in the GitHub repository.
