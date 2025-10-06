# System Architecture - Google Calendar Smart Editor

## 📐 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              PWA Frontend (index.html)                 │ │
│  │  ┌──────────────────┐  ┌──────────────────────────┐   │ │
│  │  │  Hebrew UI       │  │   Service Worker         │   │ │
│  │  │  - RTL Layout    │  │   (sw.js)                │   │ │
│  │  │  - NLP Editor    │  │   - Cache Management     │   │ │
│  │  │  - Event List    │  │   - Network Strategies   │   │ │
│  │  │  - Config Panel  │  │   - Offline Support      │   │ │
│  │  └──────────────────┘  └──────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │ ↕ HTTPS POST/GET
                            │ (JSON API)
┌─────────────────────────────────────────────────────────────┐
│              Google Apps Script Backend                      │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Code.gs (V8 Runtime)                 │ │
│  │  ┌──────────────────┐  ┌──────────────────────────┐   │ │
│  │  │  API Layer       │  │   NLP Engine (v1)        │   │ │
│  │  │  - doGet         │  │   - parseHebrewNLP()     │   │ │
│  │  │  - doPost        │  │   - extractDateTime()    │   │ │
│  │  │  - 6 Actions     │  │   - Pattern Matching     │   │ │
│  │  └──────────────────┘  └──────────────────────────┘   │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │ ↕ CalendarApp API
┌─────────────────────────────────────────────────────────────┐
│                   Google Calendar API                        │
│  - User's Personal Calendar                                  │
│  - Events (CRUD operations)                                  │
│  - OAuth 2.0 Authorization                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow

### 1. Create Event Flow (Hebrew NLP)

```
User Input: "צור פגישה מחר בשעה 14:00"
     │
     ▼
┌─────────────────────────────────┐
│  Frontend (index.html)          │
│  - User types in textarea       │
│  - Clicks "בצע פעולה"           │
└─────────────────────────────────┘
     │
     ▼ HTTP POST (JSON)
     {
       action: "parseText",
       options: {
         text: "צור פגישה מחר...",
         parseOnly: false
       }
     }
     │
     ▼
┌─────────────────────────────────┐
│  Service Worker (sw.js)         │
│  - Network-first strategy       │
│  - Forwards request to backend  │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Backend doPost() [Code.gs]     │
│  Routes to: handleParseText()   │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  parseHebrewNLP() [Code.gs]     │
│  - Detect intent: "create"      │
│  - Extract title: "פגישה"      │
│  - Parse time: "מחר 14:00"     │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  handleCreateEvent() [Code.gs]  │
│  - CalendarApp.createEvent()    │
│  - Returns event details        │
└─────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────┐
│  Google Calendar API            │
│  - Event created in user's cal  │
└─────────────────────────────────┘
     │
     ▼ HTTP Response (JSON)
     {
       ok: true,
       event: {
         id: "abc123",
         title: "פגישה",
         start: "2024-12-26T14:00:00Z"
       }
     }
     │
     ▼
┌─────────────────────────────────┐
│  Frontend (index.html)          │
│  - Show success message         │
│  - Refresh event list           │
│  - Clear input                  │
└─────────────────────────────────┘
```

### 2. Find Events Flow

```
User Action: Click "השבוע" button
     │
     ▼ HTTP POST (JSON)
     {
       action: "findEvents",
       options: {
         timeMin: "2024-12-25T00:00:00Z",
         timeMax: "2025-01-01T23:59:59Z",
         maxResults: 20
       }
     }
     │
     ▼
Backend: handleFindEvents()
     │ CalendarApp.getEvents(timeMin, timeMax)
     │
     ▼
     {
       ok: true,
       count: 5,
       events: [
         { id, title, start, end, allDay },
         ...
       ]
     }
     │
     ▼
Frontend: Display in event list with edit/delete buttons
```

---

## 🗂️ Component Details

### Frontend (index.html)

#### Responsibilities
- User interface rendering (Hebrew RTL)
- API URL configuration management
- User input collection and validation
- API calls to backend
- Event list rendering
- Success/error message display
- Service Worker registration

#### Key Functions
```javascript
callAPI(action, options)     // Main API wrapper
loadEvents(timeMin, timeMax)  // Load and display events
deleteEvent(eventId)          // Delete with confirmation
editEvent(eventId)            // Populate editor
parseText()                   // Parse-only mode
executeText()                 // Execute NLP command
selfTest()                    // System diagnostics
```

#### UI Sections
1. **Install Card**: PWA installation prompt
2. **Config Card**: API URL input
3. **NLP Editor Card**: Textarea + action buttons
4. **Events List Card**: Dynamic event list with actions

---

### Service Worker (sw.js)

#### Caching Strategy

```javascript
┌────────────────────────────────────────────┐
│           Fetch Request                    │
└────────────────────────────────────────────┘
              │
              ▼
        ┌──────────┐
        │ Static?  │ ──Yes──> Cache-First Strategy
        └──────────┘              │
              │ No                ▼
              ▼            ┌─────────────┐
        ┌──────────┐       │ Check Cache │
        │ API Call?│       └─────────────┘
        └──────────┘              │
              │ Yes         ┌─────▼─────┐
              ▼             │   Found?  │
    Network-First           └───────────┘
    Strategy                      │
              │             Yes ┌─┴─┐ No
              ▼                 │   │
    ┌─────────────┐            │   └──> Fetch from Network
    │ Try Network │            │              │
    └─────────────┘            │              ▼
         │    │                │        ┌──────────┐
    Success  Fail              └──────> │ Response │
         │    │                         └──────────┘
         ▼    ▼
    ┌──────────────┐
    │   Response   │
    └──────────────┘
```

#### Cached Assets (v4)
- `./` (root)
- `./index.html`
- `./manifest.webmanifest`
- `./icons/icon-192.png`
- `./icons/icon-512.png`

---

### Backend (Code.gs)

#### API Endpoints

```javascript
┌─────────────────────────────────────────────┐
│              doGet(e)                        │
│  Legacy endpoint for backward compatibility │
│  ├─ mode=selftest → System check            │
│  ├─ mode=today → Today's events             │
│  └─ mode=events → Next 7 days events        │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│              doPost(e)                       │
│  Main JSON API - routes to action handlers  │
│  ├─ selfTest → handleSelfTest()             │
│  ├─ findEvents → handleFindEvents()         │
│  ├─ createEvent → handleCreateEvent()       │
│  ├─ updateEvent → handleUpdateEvent()       │
│  ├─ deleteEvent → handleDeleteEvent()       │
│  └─ parseText → handleParseText()           │
└─────────────────────────────────────────────┘
```

#### NLP Engine Architecture (v1)

```
┌───────────────────────────────────────────────────────┐
│                 parseHebrewNLP(text)                   │
│  Main NLP engine - pattern-based Hebrew parsing       │
└───────────────────────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│   Intent    │ │   Title     │ │  DateTime   │
│ Detection   │ │ Extraction  │ │ Extraction  │
└─────────────┘ └─────────────┘ └─────────────┘
        │               │               │
        │               │               └──> extractDateTime()
        │               │                        │
        │               │                        ▼
        │               │               ┌──────────────────┐
        │               │               │ - היום/מחר/שבוע │
        │               │               │ - DD/MM/YYYY    │
        │               │               │ - HH:MM         │
        │               │               └──────────────────┘
        │               │
        └───────────────┴────────────────────────┐
                                                  │
                                                  ▼
                        ┌──────────────────────────────────┐
                        │     Return Parsed Object:        │
                        │  {                               │
                        │    intent: string,               │
                        │    event: { title, start, end }, │
                        │    tokens: string[]              │
                        │  }                               │
                        └──────────────────────────────────┘
```

#### Pattern Matching (v1)

```javascript
Intent Detection:
┌──────────────────────────────────────────┐
│  Create:  /צור|יצירה|חדש|הוסף|תזכורת/  │
│  Update:  /עדכן|שנה|ערוך/                │
│  Delete:  /מחק|הסר|בטל/                  │
└──────────────────────────────────────────┘

Time Patterns:
┌──────────────────────────────────────────┐
│  Relative: /היום|עכשיו|מחר|שבוע הבא/    │
│  Time:     /(\d{1,2}):(\d{2})/          │
│  Date:     /(\d{1,2})\/(\d{1,2})/       │
└──────────────────────────────────────────┘
```

---

## 🔐 Security Architecture

### OAuth 2.0 Flow

```
┌──────────────┐
│     User     │
└──────────────┘
       │ 1. Opens PWA
       ▼
┌──────────────┐
│   Frontend   │
└──────────────┘
       │ 2. Calls Apps Script URL
       ▼
┌────────────────────────┐
│    Apps Script         │
│  (Not yet authorized)  │
└────────────────────────┘
       │ 3. Redirects to OAuth
       ▼
┌────────────────────────┐
│  Google OAuth Consent  │
│  ┌──────────────────┐  │
│  │ Allow access to: │  │
│  │ ✓ Google Calendar│  │
│  │ ✓ Email address  │  │
│  └──────────────────┘  │
└────────────────────────┘
       │ 4. User approves
       ▼
┌────────────────────────┐
│    Apps Script         │
│  (Authorized)          │
│  - Has calendar token  │
└────────────────────────┘
       │ 5. API calls work
       ▼
┌────────────────────────┐
│   Google Calendar API  │
│   (User's calendar)    │
└────────────────────────┘
```

### Permission Boundaries

```javascript
┌─────────────────────────────────────────────┐
│        Web App Access: ANYONE               │
│  (Anyone with URL can access)               │
└─────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│     Execute As: USER_ACCESSING              │
│  (Runs in context of accessing user)        │
└─────────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│     OAuth Scope: calendar                   │
│  (Full read/write access to user's cal)     │
└─────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────┐
│   User A     │    │   User B     │
│  Calendar A  │    │  Calendar B  │
│  (isolated)  │    │  (isolated)  │
└──────────────┘    └──────────────┘
```

**Security Principles**:
1. **User-level isolation**: Each user can only access their own calendar
2. **No shared state**: No server-side database or shared storage
3. **Direct API calls**: Frontend → Apps Script → Calendar API
4. **OAuth protected**: Authorization required on first use
5. **No credentials stored**: All handled by Google OAuth

---

## 📊 Performance Characteristics

### Frontend Performance

```
Initial Load:
├─ HTML: ~10KB
├─ No external JS libraries
├─ Inline CSS: ~2KB
├─ Service Worker: ~2KB
└─ Total: ~14KB (minified would be ~8KB)

Runtime:
├─ DOM updates: < 16ms (60fps)
├─ API calls: 200-1000ms (network dependent)
├─ NLP parsing: < 50ms (client-side preview in v2)
└─ Event list render: O(n) where n = event count
```

### Backend Performance

```
Apps Script Execution:
├─ Cold start: 1-3 seconds
├─ Warm execution: 100-500ms
├─ NLP parsing: < 50ms (regex based)
├─ Calendar API call: 100-300ms
└─ Total typical response: 300-800ms

Limitations:
├─ Quota: 90 min/day execution time
├─ Timeout: 6 min max script runtime
├─ URL fetch: 20,000 per day
└─ Calendar operations: Subject to Calendar API quotas
```

### Service Worker Performance

```
Cache Operations:
├─ Cache hit: < 10ms
├─ Cache miss: Network latency
├─ Cache update: Async (non-blocking)
└─ Cache size: ~50KB (static assets)

Network Strategies:
├─ Static assets: Cache-first (instant load)
├─ API calls: Network-first (always fresh)
└─ Offline: Graceful fallback
```

---

## 🔮 Future Architecture (v2)

### Planned Enhancements

```
┌─────────────────────────────────────────────┐
│           Enhanced NLP Engine v2             │
│  ┌────────────────────────────────────────┐ │
│  │  Tokenizer                             │ │
│  │  ├─ Action tokens                      │ │
│  │  ├─ Entity tokens (person, location)   │ │
│  │  ├─ Time tokens (enhanced)             │ │
│  │  └─ Modifier tokens                    │ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │  Context Manager                       │ │
│  │  ├─ Previous command history           │ │
│  │  ├─ Pronoun resolution                 │ │
│  │  └─ Multi-step operations              │ │
│  └────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────┐ │
│  │  Multi-language Support                │ │
│  │  ├─ Hebrew (עברית)                     │ │
│  │  └─ English                            │ │
│  └────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Client-Side Parsing (v2)

```
Current (v1):
Frontend → Backend → Parse → Execute → Response
         (Network latency for parsing)

Future (v2):
Frontend → Parse Locally → Preview
         ↓ (User confirms)
         Backend → Execute → Response
         (Network only for execution)

Benefits:
- Instant feedback
- Reduced API calls
- Better UX
- Lower quota usage
```

---

## 📁 File Structure

```
gcal_pwa_yaniv/
├── Frontend (PWA)
│   ├── index.html         [299 lines] - Main UI
│   ├── sw.js              [41 lines]  - Service Worker
│   ├── manifest.webmanifest           - PWA manifest
│   └── icons/                         - PWA icons
│       ├── icon-192.png
│       └── icon-512.png
│
├── Backend (Apps Script)
│   └── src/
│       ├── Code.gs        [416 lines] - Main backend + NLP
│       └── appsscript.json            - OAuth & config
│
├── Documentation
│   ├── README.md          [355 lines] - Project overview
│   ├── OPERATING_GUIDELINES.md [247]  - User guide (Hebrew)
│   ├── CHANGELOG.md       [261 lines] - Release notes
│   ├── ARCHITECTURE.md    [This file] - System design
│   └── docs/
│       └── NLP_NOTES.md   [558 lines] - NLP technical docs
│
└── Config
    └── .gitignore         [43 lines]  - Git ignore rules
```

**Total**: ~2,200 lines across all files

---

## 🎯 Design Principles

1. **Simplicity**: Minimal dependencies, vanilla JavaScript
2. **Performance**: Lightweight, fast loading, efficient caching
3. **Security**: User-level isolation, OAuth protected
4. **Accessibility**: Hebrew RTL support, clear UI
5. **Offline-first**: PWA with service worker caching
6. **Extensibility**: Modular design for future enhancements
7. **Documentation**: Comprehensive docs for users & developers

---

## 📊 Metrics & Monitoring

### Key Metrics to Track

```javascript
// Frontend
- Page load time
- Time to interactive
- API call latency
- Cache hit rate
- PWA install rate

// Backend
- Script execution time
- API call success rate
- NLP parsing accuracy
- Calendar API errors
- Quota usage

// User Experience
- Command success rate
- Parse-only usage
- Feature adoption
- Error frequency
```

### Logging Strategy

```javascript
// Frontend (console.log in dev mode)
console.log('[API]', action, options);
console.log('[NLP]', parsed);
console.log('[Cache]', hit ? 'HIT' : 'MISS');

// Backend (Apps Script Logger)
Logger.log('NLP Intent: ' + intent);
Logger.log('Event created: ' + eventId);
Logger.log('Error: ' + err.toString());
```

---

**Version**: 1.0.0  
**Last Updated**: December 2024  
**Status**: Production Architecture
