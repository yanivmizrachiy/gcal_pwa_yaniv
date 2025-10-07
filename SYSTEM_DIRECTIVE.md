# SYSTEM_DIRECTIVE.md
## Executive Directive: Stage 2.1 Incremental Hardening

### Objective
Establish governance framework and quality artifacts for the gcal_pwa_yaniv system, ensuring safe, verifiable, and bilingual operation of all calendar management features.

### Core Requirements

#### 1. Safety & Fail-Safe Operation
- **parseOnly Mode**: All NLP parsing must support non-destructive preview mode
  - When `parseOnly: true`, NO calendar mutations are executed
  - System MUST return interpreted command structure without side effects
  - Message: "תצוגה מקדימה - לא בוצעו שינויים" (Preview - no changes made)

#### 2. Backwards Compatibility
- All API changes MUST maintain backwards compatibility with existing UI code
- Response structures may be extended but not reduced
- Legacy endpoint support continues (doGet with modes: selftest, events, today)

#### 3. Bilingual Command Mode (Hebrew/English)
- **Primary Language**: Hebrew (עברית)
  - All user-facing messages in Hebrew
  - NLP command parsing in Hebrew
  - Error messages in Hebrew
- **Secondary Language**: English
  - API action names in English
  - Technical field names in English
  - Documentation in English

#### 4. CRUD Operations
All calendar operations must follow consistent patterns:

**Create Event**
- Action: `createEvent`
- Required: title, start, end
- Optional: description, location, color, reminders
- Response: `{ ok: true, action: 'createEvent', message: '...', event: {...} }`

**Read/Find Events**
- Action: `findEvents`
- Filters: timeMin, timeMax, maxResults, q (search query)
- Response: `{ ok: true, action: 'findEvents', count: N, events: [...], items: [...] }`
  - Note: `items` is backwards-compatible alias for `events`

**Update Event**
- Action: `updateEvent`
- Required: eventId
- Mutable fields: title, start, end, description, location, color, reminders
- Response: `{ ok: true, action: 'updateEvent', message: '...', changedFields: [...], event: {...} }`

**Delete Event**
- Action: `deleteEvent`
- Required: eventId
- Response: `{ ok: true, action: 'deleteEvent', message: '...' }`

**Parse NLP**
- Actions: `parseNlp` OR `text` (alias)
- Parameters: text (Hebrew command), parseOnly (boolean)
- Response (parseOnly=true): `{ ok: true, action: 'parseNlp', parseOnly: true, interpreted: {...}, message: '...' }`
- Response (parseOnly=false): Executes operation and returns result with `interpreted` field

#### 5. Error Handling & Normalization
All error responses MUST follow consistent structure:
```javascript
{
  ok: false,
  action?: string,  // Optional: which action was attempted
  error: string     // Hebrew error message
}
```

Examples:
- Unsupported action: `{ ok: false, error: "פעולה לא נתמכת: unknown" }`
- Missing event: `{ ok: false, action: 'deleteEvent', error: 'אירוע לא נמצא' }`
- NLP parse failure: `{ ok: false, action: 'parseNlp', error: 'לא הצלחתי להבין את הפקודה', tokens: [...] }`

#### 6. Action Aliases
To support future UI evolution while maintaining backwards compatibility:
- `text` → delegates to `handleParseNlp(payload.text, false)`
  - Future UI can call: `{ action: 'text', text: "...", parseOnly: true }`
  - Current implementation ignores unknown flags (like parseOnly) for text action

### NLP v1 Capabilities

#### Supported Commands
1. **Create Event**: Default operation when no update/delete keywords present
   - Date: היום (today), מחר (tomorrow), מחרתיים (day after tomorrow)
   - Time: HH:MM format (single time = 1 hour duration, two times = start-end)
   - Title: All words not matching other patterns
   - Color: אדום, כחול, ירוק, צהוב, כתום, סגול, ורוד, חום
   - Reminders: תזכורת followed by numbers (minutes before event)

2. **Update Event**: Keywords: עדכן, שנה, ערוך, תקן
   - Currently requires manual eventId (future: search by title)

3. **Delete Event**: Keywords: מחק, מחיקה, הסר, בטל
   - Currently requires manual eventId (future: search by title)

### Performance & Automation Targets
- API response time: < 2 seconds for CRUD operations
- NLP parsing: < 1 second for command interpretation
- Calendar sync: Real-time (uses CalendarApp.getDefaultCalendar())
- Automated deployment: GitHub Actions (gas-deploy.yml)
- Automated testing: Verify via selfTest action

### Verification & Quality Gates
See CHECKPOINTS.md for detailed verification criteria.

### Change Log
- **2025-01-XX**: Stage 2.1 directive established
  - Added 'text' action alias
  - Added 'items' backwards-compatible alias in findEvents
  - Normalized error response structures
  - Documented parseOnly safety guarantees
