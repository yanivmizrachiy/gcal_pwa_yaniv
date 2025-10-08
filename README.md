# יומן חכם – Google Calendar PWA

Progressive Web App for smart Hebrew calendar management with natural language processing.

## Features

- 📅 Google Calendar integration via Apps Script backend
- 🇮🇱 Hebrew natural language processing for event creation
- 📱 PWA - Install on mobile/desktop
- 🎨 Dark theme optimized UI
- ⚡ Fast and responsive

## API Endpoints

### POST Actions
- `selfTest` - System diagnostics and NLP version info
- `findEvents` - Query calendar events
- `createEvent` - Create new calendar event
- `updateEvent` - Update existing event
- `deleteEvent` - Delete event
- `parseNlp` - Parse Hebrew natural language commands

### GET Modes
- `?mode=selftest` - System status
- `?mode=events` - List upcoming events
- `?mode=today` - Today's events

### NLP v2 (Hebrew Smart Parsing)

SelfTest exposes nlpVersion=v2 with structured features & warnings.

**Supported Operations:**
- **Create**: Natural language event creation with automatic field detection
- **Update**: Fuzzy matching to find and update events
- **Delete**: Fuzzy matching to find and delete events
- **Disambiguation**: When multiple events match, returns list for clarification

**Features:**
- Duration parsing (חצי שעה, שעה, N דקות)
- Guest management with email validation
- Recurrence detection (basic, non-mutating) - detects "כל יום", "כל שבוע", etc.
- Color support with Hebrew keywords
- Smart reminder parsing
- Fuzzy event matching for updates/deletes
- Warning system (v2) with structured codes
- Parse-only mode for preview without changes

**parseOnly Mode:**
Use `parseOnly:true` to preview interpretation without creating/modifying events.

**Example Commands:**
```
היום 14:00-15:30 ישיבת צוות תזכורות 30,10 משתתפים dani@example.com צבע כחול
מחר 09:00 חצי שעה stand-up תזכורת 5
כל יום 08:00-09:00 פעילות בוקר
מחק ישיבת צוות
עדכן stand-up 10:00-10:30
```

**Warning Codes:**
- `MISSING_TITLE` - Title not detected, default assigned
- `DEFAULT_TIME_INFERRED` - Time not specified, default used
- `GUEST_EMAIL_INVALID` - Invalid email address format
- `GUEST_DUP_CONFLICT` - Duplicate guests detected
- `RECURRENCE_UNSUPPORTED` - Recurrence pattern detected but not yet supported
- `AMBIGUOUS_MATCH` - Multiple events match, disambiguation required
- `NO_MATCH` - No events found matching query

## Development

### Backend (Apps Script)
Code is in `src/Code.gs` - deploy to Google Apps Script with appropriate OAuth scopes.

### Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```

### PWA
The root `index.html` provides a simple PWA wrapper that can be deployed to any static host.

## Architecture

- **Backend**: Google Apps Script (CalendarApp API)
- **Frontend**: Next.js 14 with TypeScript
- **PWA**: Service Worker + Web App Manifest
- **NLP**: Custom Hebrew parser (v2) with tokenization and semantic extraction

## License

MIT
