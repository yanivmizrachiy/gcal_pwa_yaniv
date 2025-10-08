# NLP v2 Testing Guide

This guide provides manual test scenarios to verify the NLP v2 implementation.

## Prerequisites
- Deploy updated `src/Code.gs` to Google Apps Script
- Ensure appropriate OAuth scopes are granted
- Have access to a test Google Calendar

## Test Scenarios

### 1. SelfTest Endpoint

#### GET Request
```bash
GET https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec?mode=selftest
```

**Expected Response:**
```json
{
  "ok": true,
  "action": "selfTest",
  "nlpVersion": "v2",
  "progressPercent": 100,
  "completed": true,
  "features": [
    "duration",
    "guests",
    "recurrence-basic",
    "slot-finder",
    "warnings-v2",
    "fuzzy-disambiguation",
    "parse-only",
    "color",
    "reminders"
  ],
  "warningsSample": [
    {
      "code": "MISSING_TITLE",
      "message": "כותרת לא זוהתה – הוגדרה ברירת מחדל"
    }
  ],
  "calendarAccess": true,
  "ts": "2025-10-08T...",
  "email": "your-email@example.com"
}
```

#### POST Request
```bash
POST https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
Content-Type: application/json

{
  "action": "selfTest"
}
```

**Expected:** Same response as GET

---

### 2. Create Event - Full Featured

#### Test: Complete event with all features
```json
{
  "action": "parseNlp",
  "text": "היום 14:00-15:30 ישיבת צוות תזכורות 30,10 משתתפים dani@test.com rina@test.com צבע כחול",
  "parseOnly": true
}
```

**Expected Response:**
```json
{
  "ok": true,
  "action": "parseNlp",
  "parseOnly": true,
  "operation": "create",
  "interpreted": {
    "success": true,
    "operation": "create",
    "warnings": [],
    "interpreted": {
      "title": "ישיבת צוות",
      "start": "2025-10-08T14:00:00.000Z",
      "end": "2025-10-08T15:30:00.000Z",
      "guests": ["dani@test.com", "rina@test.com"],
      "reminders": [30, 10],
      "color": "blue",
      "recurrence": null
    },
    "event": { ... }
  },
  "warnings": []
}
```

**Validation:**
- ✅ Title extracted: "ישיבת צוות"
- ✅ Time range parsed correctly
- ✅ Two guests detected
- ✅ Two reminders detected
- ✅ Color "כחול" → "blue"
- ✅ No warnings

---

### 3. Warning Scenarios

#### Test 3.1: Missing Title (MISSING_TITLE)
```json
{
  "action": "parseNlp",
  "text": "היום 14:00-15:30",
  "parseOnly": true
}
```

**Expected Warning:**
```json
{
  "warnings": [
    {
      "code": "MISSING_TITLE",
      "message": "כותרת לא זוהתה – הוגדרה ברירת מחדל"
    }
  ]
}
```

#### Test 3.2: Default Time Inferred (DEFAULT_TIME_INFERRED)
```json
{
  "action": "parseNlp",
  "text": "מחר ארוחת צהריים",
  "parseOnly": true
}
```

**Expected Warning:**
```json
{
  "warnings": [
    {
      "code": "DEFAULT_TIME_INFERRED",
      "message": "שעה לא צוינה – הוגדרה שעה ברירת מחדל (09:00)"
    }
  ]
}
```

#### Test 3.3: Duplicate Guests (GUEST_DUP_CONFLICT)
```json
{
  "action": "parseNlp",
  "text": "היום 10:00-11:00 meeting test@example.com test@example.com",
  "parseOnly": true
}
```

**Expected Warning:**
```json
{
  "warnings": [
    {
      "code": "GUEST_DUP_CONFLICT",
      "message": "משתתפים כפולים זוהו: test@example.com"
    }
  ]
}
```

#### Test 3.4: Recurrence Unsupported (RECURRENCE_UNSUPPORTED)
```json
{
  "action": "parseNlp",
  "text": "כל יום 09:00-09:30 פעילות בוקר",
  "parseOnly": true
}
```

**Expected Warning:**
```json
{
  "warnings": [
    {
      "code": "RECURRENCE_UNSUPPORTED",
      "message": "תזמון חוזר זוהה אך לא נתמך כרגע – אירוע בודד ייוצר"
    }
  ],
  "interpreted": {
    "recurrence": {
      "detected": true,
      "pattern": "daily"
    }
  }
}
```

---

### 4. Duration Parsing

#### Test 4.1: Half hour (חצי שעה)
```json
{
  "action": "parseNlp",
  "text": "היום 10:00 חצי שעה קפה",
  "parseOnly": true
}
```

**Expected:** Start: 10:00, End: 10:30

#### Test 4.2: Numeric duration
```json
{
  "action": "parseNlp",
  "text": "מחר 14:00 90 דקות workshop",
  "parseOnly": true
}
```

**Expected:** Start: 14:00, End: 15:30

---

### 5. Date Parsing

#### Test 5.1: Relative dates
- `"היום"` → Today
- `"מחר"` → Tomorrow
- `"מחרתיים"` → Day after tomorrow
- `"אתמול"` → Yesterday

#### Test 5.2: Weekdays
```json
{
  "action": "parseNlp",
  "text": "שני 14:00-15:00 review",
  "parseOnly": true
}
```

**Expected:** Next Monday at 14:00

---

### 6. Time Range Formats

#### Test 6.1: HH:MM-HH:MM
```json
{
  "action": "parseNlp",
  "text": "מחר 14:00-15:30 meeting",
  "parseOnly": true
}
```

#### Test 6.2: HH-HH (shorthand)
```json
{
  "action": "parseNlp",
  "text": "מחר 10-11 meeting",
  "parseOnly": true
}
```

**Expected:** Start: 10:00, End: 11:00

---

### 7. Color Parsing

Test all colors:
- `"צבע אדום"` → red
- `"צבע כחול"` → blue
- `"צבע ירוק"` → green
- `"צבע צהוב"` → yellow
- `"צבע כתום"` → orange
- `"צבע סגול"` → purple
- `"צבע ורוד"` → pink
- `"צבע חום"` → brown

Or without "צבע" prefix: `"כחול"` → blue

---

### 8. Update/Delete with Fuzzy Matching

#### Setup: Create test events first
1. Create event: "ישיבת צוות שבועית"
2. Create event: "stand-up daily"

#### Test 8.1: Delete with unique match
```json
{
  "action": "parseNlp",
  "text": "מחק stand-up",
  "parseOnly": false
}
```

**Expected:** Event deleted successfully (single match)

#### Test 8.2: Delete with ambiguous match
```json
{
  "action": "parseNlp",
  "text": "מחק ישיבת",
  "parseOnly": false
}
```

**Expected (if multiple matches):**
```json
{
  "ok": true,
  "operation": "disambiguation",
  "warnings": [
    {
      "code": "AMBIGUOUS_MATCH",
      "message": "נמצאו מספר אירועים תואמים (2) – נדרש בירור"
    }
  ],
  "disambiguation": [
    {
      "id": "event-id-1",
      "title": "ישיבת צוות שבועית",
      "start": "...",
      "end": "..."
    },
    {
      "id": "event-id-2",
      "title": "ישיבת הנהלה",
      "start": "...",
      "end": "..."
    }
  ]
}
```

#### Test 8.3: Delete with no match
```json
{
  "action": "parseNlp",
  "text": "מחק nonexistent-event",
  "parseOnly": false
}
```

**Expected:**
```json
{
  "ok": false,
  "warnings": [
    {
      "code": "NO_MATCH",
      "message": "לא נמצא אירוע התואם: nonexistent-event"
    }
  ]
}
```

---

### 9. parseOnly Flag Enforcement

#### Test 9.1: parseOnly=true should NOT create
```json
{
  "action": "parseNlp",
  "text": "היום 14:00-15:00 test event",
  "parseOnly": true
}
```

**Expected:** No event created in calendar

#### Test 9.2: parseOnly=false should create
```json
{
  "action": "parseNlp",
  "text": "היום 14:00-15:00 real event",
  "parseOnly": false
}
```

**Expected:** Event created in calendar

---

### 10. Guest Management

#### Test 10.1: Multiple valid emails
```json
{
  "action": "parseNlp",
  "text": "מחר 10:00-11:00 meeting user1@example.com user2@example.com user3@example.com",
  "parseOnly": false
}
```

**Expected:** Event created with all 3 guests

#### Test 10.2: Email with semicolon separator
```json
{
  "action": "parseNlp",
  "text": "מחר 10:00-11:00 meeting user1@example.com; user2@example.com",
  "parseOnly": false
}
```

**Expected:** Both guests added

---

### 11. Reminder Parsing

#### Test 11.1: Multiple reminders
```json
{
  "action": "parseNlp",
  "text": "היום 10:00-11:00 meeting תזכורות 30,10,5",
  "parseOnly": false
}
```

**Expected:** Event with 3 reminders: 30min, 10min, 5min before

#### Test 11.2: Single reminder
```json
{
  "action": "parseNlp",
  "text": "מחר 14:00-15:00 review תזכורת 15",
  "parseOnly": false
}
```

**Expected:** Event with 1 reminder: 15min before

---

### 12. Recurrence Patterns Detection

Test all patterns (detection only, not creation):
- `"כל יום"` → pattern: "daily"
- `"כל שבוע"` → pattern: "weekly"
- `"כל חודש"` → pattern: "monthly"
- `"כל יום שני"` → pattern: "weekday-שני"
- `"כל יום ראשון"` → pattern: "weekday-ראשון"

All should emit `RECURRENCE_UNSUPPORTED` warning.

---

## Backward Compatibility Tests

### Legacy GET Endpoints
1. `?mode=events` - Should list events
2. `?mode=today` - Should list today's events
3. `?mode=selftest` - Should return v2 contract

### Legacy POST Actions
1. `createEvent` - Should work with explicit event data
2. `updateEvent` - Should work with eventId + changes
3. `deleteEvent` - Should work with eventId
4. `findEvents` - Should work with options

---

## Integration Test Checklist

- [ ] SelfTest GET returns v2 contract
- [ ] SelfTest POST returns v2 contract
- [ ] Create event with parseOnly=true does NOT mutate calendar
- [ ] Create event with parseOnly=false DOES create event
- [ ] All warning codes trigger correctly
- [ ] Fuzzy matching works for update/delete
- [ ] Disambiguation returns list when ambiguous
- [ ] Guest emails validated and added
- [ ] Duplicate guests detected
- [ ] Reminders parsed and set
- [ ] Colors parsed and applied
- [ ] Durations calculated correctly
- [ ] Weekdays resolved to next occurrence
- [ ] Recurrence detected but not applied
- [ ] Legacy endpoints still functional

---

## Notes

- All Hebrew text should use UTF-8 encoding
- Timestamps in responses are ISO 8601 format
- Event IDs from Google Calendar are long strings with format like `eventId@google.com`
- When testing disambiguation, ensure you have multiple events with similar titles
- Test with actual Google Calendar to verify event creation/modification
