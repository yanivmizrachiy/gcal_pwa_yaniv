# יומן חכם – Smart Calendar PWA

A Progressive Web App (PWA) for Google Calendar with Hebrew Natural Language Processing (NLP) support and full CRUD capabilities.

## Features

- 📅 **Full Calendar CRUD**: Create, Read, Update, and Delete events
- 🇮🇱 **Hebrew NLP**: Natural language parsing for Hebrew text
- 📱 **PWA Support**: Install as a native app on mobile and desktop
- 🔄 **Offline-Ready**: Service worker with intelligent caching strategies
- 🔐 **Secure**: OAuth 2.0 authentication with Google Calendar API

## Architecture

### Components

1. **Frontend (PWA)**
   - `index.html` - Main PWA interface
   - `sw.js` - Service worker with cache strategies
   - `manifest.webmanifest` - PWA manifest

2. **Backend (Google Apps Script)**
   - `src/Code.gs` - Main API implementation
   - `src/appsscript.json` - OAuth scopes and configuration

### API Endpoints

#### Legacy GET Endpoint (Backward Compatible)

**Base URL**: Your deployed Apps Script web app URL

```
GET ?mode=selftest
GET ?mode=events
```

##### Examples:

```bash
# Self-test
curl "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?mode=selftest"

# Get events
curl "https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?mode=events"
```

#### Modern POST API

All POST requests expect JSON body with an `action` field.

**Content-Type**: `application/json`

### API Actions

#### 1. selfTest

Check if the service is operational.

**Request:**
```json
{
  "action": "selfTest"
}
```

**Response:**
```json
{
  "ok": true,
  "action": "selfTest",
  "message": "Service operational",
  "timestamp": "2024-01-15T10:30:00Z",
  "user": "user@example.com",
  "calendarAccess": true
}
```

---

#### 2. findEvents

Search and retrieve calendar events.

**Request:**
```json
{
  "action": "findEvents",
  "options": {
    "timeMin": "2024-01-15T00:00:00Z",
    "timeMax": "2024-01-22T23:59:59Z",
    "q": "meeting",
    "maxResults": 100
  }
}
```

**Options:**
- `timeMin` (ISO 8601 string, optional): Start time. Default: now
- `timeMax` (ISO 8601 string, optional): End time. Default: 7 days from timeMin
- `q` (string, optional): Search query (searches in title, description, location)
- `maxResults` (number, optional): Max results to return (1-200). Default: 100

**Response:**
```json
{
  "ok": true,
  "action": "findEvents",
  "message": "Found 5 event(s)",
  "count": 5,
  "events": [
    {
      "id": "event_id_123",
      "title": "Team Meeting",
      "start": "2024-01-15T14:00:00Z",
      "end": "2024-01-15T15:00:00Z",
      "allDay": false,
      "location": "Conference Room A",
      "description": "Weekly team sync",
      "color": "",
      "attendees": [
        {
          "email": "user@example.com",
          "name": "User Name",
          "status": "accepted"
        }
      ],
      "created": "2024-01-10T09:00:00Z",
      "updated": "2024-01-10T09:00:00Z"
    }
  ]
}
```

---

#### 3. createEvent

Create a new calendar event.

**Request:**
```json
{
  "action": "createEvent",
  "summary": "פגישה עם לקוח",
  "start": "2024-01-15T14:00:00Z",
  "end": "2024-01-15T15:00:00Z",
  "location": "Tel Aviv Office",
  "description": "Discuss Q1 plans",
  "attendees": [
    {"email": "colleague@example.com"}
  ],
  "reminders": [
    {"method": "popup", "minutes": 10}
  ],
  "color": "9"
}
```

**Required Fields:**
- `summary`: Event title
- `start`: Start time (ISO 8601)
- `end`: End time (ISO 8601)

**Optional Fields:**
- `location`: Event location
- `description`: Event description
- `attendees`: Array of `{email: string}` objects
- `reminders`: Array of `{method: "popup"|"email", minutes: number}` objects
- `color`: Calendar color ID (string "1"-"11")

**Response:**
```json
{
  "ok": true,
  "action": "createEvent",
  "message": "Event created: פגישה עם לקוח",
  "event": { /* full event object */ }
}
```

---

#### 4. updateEvent

Update an existing calendar event.

**Request:**
```json
{
  "action": "updateEvent",
  "id": "event_id_123",
  "summary": "Updated Meeting Title",
  "start": "2024-01-15T15:00:00Z",
  "attendees": [
    {"email": "new@example.com"}
  ],
  "attendeesMode": "replace"
}
```

**Required Fields:**
- `id`: Event ID

**Optional Fields:**
- `summary`: New title
- `start`: New start time
- `end`: New end time
- `location`: New location
- `description`: New description
- `attendees`: Array of attendees
- `attendeesMode`: "replace" or "merge" (default: "replace")
- `reminders`: Array of reminders (replaces all existing)
- `color`: New color ID

**Response:**
```json
{
  "ok": true,
  "action": "updateEvent",
  "message": "Event updated: Updated Meeting Title",
  "event": { /* full event object */ }
}
```

---

#### 5. deleteEvent

Delete a calendar event.

**Request:**
```json
{
  "action": "deleteEvent",
  "id": "event_id_123"
}
```

**Response:**
```json
{
  "ok": true,
  "action": "deleteEvent",
  "message": "Event deleted: Team Meeting",
  "id": "event_id_123"
}
```

---

#### 6. getEvent

Retrieve a single event by ID.

**Request:**
```json
{
  "action": "getEvent",
  "id": "event_id_123"
}
```

**Response:**
```json
{
  "ok": true,
  "action": "getEvent",
  "message": "Event retrieved",
  "event": { /* full event object */ }
}
```

---

#### 7. text (Hebrew NLP v1)

Parse Hebrew natural language text and create a calendar event.

**Request:**
```json
{
  "action": "text",
  "text": "פגישה עם דני מחר בשעה 15:00"
}
```

**Response:**
```json
{
  "ok": true,
  "action": "text",
  "message": "Event created from text: פגישה עם דני",
  "parsed": {
    "valid": true,
    "summary": "פגישה עם דני",
    "start": "2024-01-16T15:00:00Z",
    "end": "2024-01-16T16:00:00Z",
    "location": "",
    "description": ""
  },
  "event": { /* created event object */ }
}
```

**Supported Patterns:**
- Time: `15:00`, `1500`, `15`
- Date: `היום` (today), `מחר` (tomorrow), `מחרתיים` (day after tomorrow)
- Location: `ב[location]` (e.g., `בתל אביב`)

---

#### 8. parseOnly (Hebrew NLP v2)

Parse Hebrew text without creating an event (tokenization only).

**Request:**
```json
{
  "action": "parseOnly",
  "text": "פגישה עם דני מחר בשעה 15:00 בתל אביב"
}
```

**Response:**
```json
{
  "ok": true,
  "action": "parseOnly",
  "message": "Text parsed successfully",
  "parsed": {
    "valid": true,
    "summary": "פגישה עם דני",
    "start": "2024-01-16T15:00:00Z",
    "end": "2024-01-16T16:00:00Z",
    "location": "תל אביב",
    "description": ""
  },
  "tokens": [
    {"index": 0, "text": "פגישה", "type": "hebrew_word"},
    {"index": 1, "text": "עם", "type": "hebrew_word"},
    {"index": 2, "text": "דני", "type": "hebrew_word"},
    {"index": 3, "text": "מחר", "type": "date_relative"},
    {"index": 4, "text": "בשעה", "type": "hebrew_word"},
    {"index": 5, "text": "15:00", "type": "time"},
    {"index": 6, "text": "בתל", "type": "preposition"},
    {"index": 7, "text": "אביב", "type": "hebrew_word"}
  ]
}
```

---

## Error Handling

All API responses include an `ok` field. When `ok: false`, an `error` field contains the error message.

**Error Response Example:**
```json
{
  "ok": false,
  "action": "createEvent",
  "error": "Missing required fields: summary, start, end"
}
```

---

## Hebrew NLP Guide

### v1: Heuristic Parsing (text action)

The `text` action uses heuristic rules to parse Hebrew natural language and automatically create events.

**Examples:**

1. **Simple meeting tomorrow:**
   ```
   פגישה עם דני מחר בשעה 15:00
   → Meeting with Dani tomorrow at 15:00
   ```

2. **Today's event:**
   ```
   ארוחת צהריים היום בשעה 13
   → Lunch today at 13:00
   ```

3. **Day after tomorrow:**
   ```
   כנס מחרתיים בשעה 9:00
   → Conference day after tomorrow at 9:00
   ```

4. **With location:**
   ```
   פגישה מחר בשעה 10:00 בתל אביב
   → Meeting tomorrow at 10:00 in Tel Aviv
   ```

**Parsing Rules:**

1. **Date Recognition:**
   - `היום` → Today
   - `מחר` → Tomorrow
   - `מחרתיים` → Day after tomorrow

2. **Time Recognition:**
   - `HH:MM` format (e.g., `15:00`)
   - `HH` format (e.g., `15` → 15:00)
   - Default: 09:00 if no time specified

3. **Summary Extraction:**
   - Text before temporal markers
   - Or first 5 words if no clear boundary

4. **Location Extraction:**
   - Text after preposition `ב`

5. **Duration:**
   - Default: 1 hour

### v2: Tokenization (parseOnly action)

The `parseOnly` action provides detailed tokenization without creating events, useful for debugging and building more advanced NLP features.

**Token Types:**
- `time`: Time values (HH:MM format)
- `number`: Numeric values
- `date_relative`: Relative date keywords
- `hebrew_word`: Hebrew alphabetic words
- `preposition`: Prepositions (especially `ב`)
- `unknown`: Unclassified tokens

---

## Deployment

### Prerequisites

1. Google Account
2. Google Apps Script project
3. Node.js and npm (for clasp)

### Setup Steps

1. **Install clasp:**
   ```bash
   npm install -g @google/clasp
   ```

2. **Login to clasp:**
   ```bash
   clasp login
   ```

3. **Create or clone script:**
   ```bash
   # Option 1: Create new
   clasp create --type webapp --title "Smart Calendar"
   
   # Option 2: Clone existing
   clasp clone YOUR_SCRIPT_ID
   ```

4. **Deploy:**
   ```bash
   clasp push
   clasp deploy
   ```

5. **Get deployment URL:**
   ```bash
   clasp open --webapp
   ```

### GitHub Actions Deployment

The repository includes automated deployment via GitHub Actions. Required secrets:

- `CLASP_TOKEN_JSON`: Your clasp credentials
- `GAS_SCRIPT_ID`: Your Google Apps Script project ID

Push to `main` branch to trigger automatic deployment.

---

## Operational Guidelines

### Testing the API

1. **Self-test after deployment:**
   ```bash
   curl "YOUR_DEPLOYMENT_URL?mode=selftest"
   ```

2. **Test event creation:**
   ```bash
   curl -X POST YOUR_DEPLOYMENT_URL \
     -H "Content-Type: application/json" \
     -d '{
       "action": "createEvent",
       "summary": "Test Event",
       "start": "2024-01-15T10:00:00Z",
       "end": "2024-01-15T11:00:00Z"
     }'
   ```

3. **Test Hebrew NLP:**
   ```bash
   curl -X POST YOUR_DEPLOYMENT_URL \
     -H "Content-Type: application/json" \
     -d '{
       "action": "text",
       "text": "פגישה מחר בשעה 14:00"
     }'
   ```

### Debugging

1. **Check Apps Script logs:**
   - Open Apps Script editor
   - View → Execution log

2. **Test in Apps Script editor:**
   - Use the built-in debugger
   - Set breakpoints in Code.gs

3. **API Error Responses:**
   - All errors return `ok: false`
   - Check `error` field for details
   - Some responses include `stack` for debugging

### Rate Limits

Google Calendar API has quotas:
- 1,000,000 queries per day (per project)
- 10 queries per second (per user)

The API automatically limits `maxResults` to 200 to prevent abuse.

### Security Considerations

1. **OAuth Scopes:**
   - Full calendar access is required for write operations
   - Users must authorize the app

2. **Data Privacy:**
   - All calendar operations use the user's own calendar
   - No data is stored in Apps Script

3. **API Access:**
   - Web app is set to `ANYONE` access
   - Authentication via Google OAuth
   - All operations are performed as the user

### Best Practices

1. **Error Handling:**
   - Always check `ok` field in responses
   - Implement retry logic for network failures

2. **Date/Time Handling:**
   - Use ISO 8601 format for all date/times
   - Consider timezone differences

3. **Hebrew Text:**
   - NLP is heuristic-based; verify parsed results
   - Use `parseOnly` to preview before creating events

4. **Performance:**
   - Limit `maxResults` in findEvents to needed amount
   - Use specific time ranges to reduce query time

---

## PWA Features

### Installation

Users can install the app:
- **Android**: Tap "Install" or "Add to Home Screen"
- **iOS**: Share menu → "Add to Home Screen"
- **Desktop**: Install button in address bar

### Offline Support

- Static assets cached for offline access
- Apps Script API requires network (network-first strategy)
- Graceful degradation when offline

### Service Worker Strategies

1. **Static Assets**: Cache-first
   - HTML, CSS, icons, manifest
   - Cached on install, updated on activate

2. **API Calls**: Network-first
   - Apps Script endpoints
   - Falls back to error message if offline

---

## Troubleshooting

### Common Issues

**Issue**: "Missing required field: id"
- **Solution**: Ensure event ID is provided in update/delete/get requests

**Issue**: "Event not found"
- **Solution**: Verify event ID is correct and exists in calendar

**Issue**: "Could not parse text"
- **Solution**: Check Hebrew text format; ensure it includes temporal markers

**Issue**: "Network unavailable"
- **Solution**: Apps Script API requires internet; check connection

**Issue**: Buttons not working in UI
- **Solution**: Ensure deployment URL is updated in index.html iframe src

### Getting Help

1. Check execution logs in Apps Script editor
2. Test API endpoints with curl
3. Use browser developer tools to debug PWA
4. Review this documentation for API contracts

---

## Development

### Project Structure

```
gcal_pwa_yaniv/
├── src/
│   ├── Code.gs           # Apps Script backend
│   └── appsscript.json   # OAuth scopes & config
├── index.html            # PWA frontend
├── sw.js                 # Service worker
├── manifest.webmanifest  # PWA manifest
├── icons/                # App icons
└── README.md             # This file
```

### Making Changes

1. Edit files in `src/` for backend changes
2. Test locally if possible
3. Deploy with clasp or GitHub Actions
4. Update documentation if API changes

### Future Enhancements

- Enhanced Hebrew NLP with ML models
- Recurring event support
- Multiple calendar support
- Rich text descriptions
- Conflict detection
- Smart scheduling suggestions

---

## License

This project is for personal use. Modify and distribute as needed.

## Credits

Built for Yaniv's Smart Calendar project with Hebrew NLP support.
