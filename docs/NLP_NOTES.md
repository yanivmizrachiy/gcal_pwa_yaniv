# Hebrew NLP Notes - Natural Language Processing for Calendar Events

## Overview
This document describes the Hebrew Natural Language Processing (NLP) features for calendar event creation and management.

## NLP v1 (Current - Implemented)

### Purpose
Enable users to create calendar events using natural Hebrew text instead of forms.

### Actions
- `text` - Parse Hebrew input and execute (create event in calendar)
- `parseOnly` - Parse Hebrew input without mutation (preview/validation only)

### Supported Tokens

#### Date References
| Hebrew | Transliteration | Meaning | Example |
|--------|----------------|---------|---------|
| היום | hayom | Today | "פגישה היום 14:00" |
| מחר | machar | Tomorrow | "פגישה מחר 10:00" |

**Default:** If no date token found, defaults to today.

#### Time Format
- Pattern: `HH:MM` or `H:MM` (24-hour format)
- Examples: `14:00`, `9:30`, `16:15`
- **Default:** If no time specified, defaults to current hour + 1

#### Location Extraction
- Prefix: `ב-` or `ב` (equivalent to "in" or "at")
- Pattern: `ב[-]?<location>`
- Examples:
  - `בתל אביב` → Location: "תל אביב"
  - `ב-משרד` → Location: "משרד"
  - `בבית הקפה` → Location: "בית"
- **Limitation:** Currently captures first word after prefix (TODO: multi-word locations)

#### Event Title
- All remaining text after extracting date/time/location becomes the title
- **Default:** If no text remains, title is "אירוע חדש" (New Event)

#### Duration
- **Fixed:** All events default to 1 hour duration
- End time = Start time + 60 minutes
- TODO: Support duration parsing (e.g., "שעתיים", "30 דקות")

### Parsing Algorithm

1. **Normalize:** Trim input text
2. **Extract Date:** Search for היום/מחר, set targetDate, remove token from text
3. **Extract Time:** Regex match `(\d{1,2}):(\d{2})`, validate 0≤hour<24 and 0≤minute<60, set time on targetDate, remove from text
4. **Extract Location:** Regex match `\bב[-]?([^\s,]+)`, capture first word, remove from text
5. **Extract Title:** Remaining text becomes title (or default)
6. **Set Duration:** end = start + 1 hour
7. **Return:** Parsed object with action='create'

### Examples with Parsing

#### Example 1: Basic with Time
```
Input: "פגישה היום 14:00"

Parsing steps:
1. Found "היום" → targetDate = today
2. Found "14:00" → set time to 14:00
3. No location found
4. Title = "פגישה"
5. Duration = 1 hour

Result:
{
  title: "פגישה",
  start: "2024-01-15T14:00:00Z",
  end: "2024-01-15T15:00:00Z",
  location: "",
  action: "create"
}
```

#### Example 2: Tomorrow with Location
```
Input: "פגישה מחר 10:00 במשרד"

Parsing steps:
1. Found "מחר" → targetDate = tomorrow
2. Found "10:00" → set time to 10:00
3. Found "במשרד" → location = "משרד"
4. Title = "פגישה"
5. Duration = 1 hour

Result:
{
  title: "פגישה",
  start: "2024-01-16T10:00:00Z",
  end: "2024-01-16T11:00:00Z",
  location: "משרד",
  action: "create"
}
```

#### Example 3: No Date Token
```
Input: "ארוחת צהריים 12:30"

Parsing steps:
1. No date token → targetDate = today (default)
2. Found "12:30" → set time to 12:30
3. No location found
4. Title = "ארוחת צהריים"
5. Duration = 1 hour

Result:
{
  title: "ארוחת צהריים",
  start: "2024-01-15T12:30:00Z",
  end: "2024-01-15T13:30:00Z",
  location: "",
  action: "create"
}
```

#### Example 4: Multi-word Title
```
Input: "שיחת וידאו עם הצוות היום 16:00"

Parsing steps:
1. Found "היום" → targetDate = today
2. Found "16:00" → set time to 16:00
3. No location found
4. Title = "שיחת וידאו עם הצוות"
5. Duration = 1 hour

Result:
{
  title: "שיחת וידאו עם הצוות",
  start: "2024-01-15T16:00:00Z",
  end: "2024-01-15T17:00:00Z",
  location: "",
  action: "create"
}
```

#### Example 5: parseOnly (Preview Mode)
```
API: POST { "action": "parseOnly", "text": "פגישה מחר 14:00" }

Response:
{
  "ok": true,
  "executed": false,
  "message": "ניתוח בלבד - לא בוצעה פעולה",
  "parsed": {
    "title": "פגישה",
    "start": "2024-01-16T14:00:00Z",
    "end": "2024-01-16T15:00:00Z",
    "location": "",
    "action": "create",
    "ok": true
  }
}
```

### UI Integration

#### Quick Create Flow
1. User types Hebrew text in textarea
2. User clicks "תצוגה מקדימה" (Preview)
3. Frontend calls `parseOnly` action
4. Display parsed result (title, start, end, location)
5. User clicks "צור אירוע" (Create Event)
6. Frontend calls `text` action
7. Event created in calendar
8. Event list refreshed

#### Error Messages
All errors returned in Hebrew:
- "חסר טקסט" - Missing text
- "שגיאה ב-NLP" - NLP error
- "שגיאה בניתוח" - Parsing error

### Response Format

#### Success (text action)
```json
{
  "ok": true,
  "executed": true,
  "eventId": "abc123...",
  "title": "פגישה",
  "start": "2024-01-15T14:00:00Z",
  "end": "2024-01-15T15:00:00Z",
  "parsed": { ... }
}
```

#### Success (parseOnly action)
```json
{
  "ok": true,
  "executed": false,
  "message": "ניתוח בלבד - לא בוצעה פעולה",
  "parsed": { ... }
}
```

#### Error
```json
{
  "ok": false,
  "error": "חסר טקסט"
}
```

## NLP v2 (Future Roadmap)

### Planned Features

#### Extended Date Tokens
- `מחרתיים` (mahratayim) - Day after tomorrow
- `בשבוע הבא` (bashavooa haba) - Next week
- `בחודש הבא` (bachodesh haba) - Next month
- Specific days: `ביום ראשון`, `ביום שני`, etc.
- Date formats: `ב-15/1`, `ב-15.1.2024`

#### Duration Parsing
- `שעה` (shaah) - 1 hour
- `שעתיים` (shaatayim) - 2 hours
- `חצי שעה` (chatzi shaah) - 30 minutes
- `X דקות` (dakot) - X minutes
- Example: "פגישה היום 14:00 שעתיים" → 14:00-16:00

#### All-Day Events
- Keywords: `כל היום`, `יום שלם`
- Example: "כנס כל היום מחר"

#### Recurring Events
- Keywords: `כל יום`, `כל שבוע`, `כל חודש`
- Example: "ישיבת צוות כל שבוע 10:00"

#### Update/Delete via NLP
- Update: "שנה את הפגישה מחר ל-15:00"
- Delete: "מחק את הפגישה מחר"
- Requires disambiguation if multiple matches

#### Multi-word Location Support
- Current: `בתל אביב` → "תל"
- Target: `בתל אביב` → "תל אביב"
- Solution: Better regex pattern or quote detection

#### Description/Notes
- Prefix: `הערה:` or `תיאור:`
- Example: "פגישה היום 14:00 הערה: להביא מסמכים"

#### Attendees
- Email detection: `עם john@example.com`
- Names: `עם יוסי ושרה`
- TODO: Ambiguity resolution for common names

#### Time Ranges
- Pattern: `מ-X עד-Y` or `בין X ל-Y`
- Example: "פגישה היום מ-14:00 עד-16:30"

#### Smart Defaults
- "ארוחת בוקר" → default time 08:00
- "ארוחת צהריים" → default time 12:30
- "ארוחת ערב" → default time 19:00
- "פגישת בוקר" → default time 09:00

### Implementation Strategy

1. **Phase 1:** Extended date tokens + duration parsing
2. **Phase 2:** All-day events + recurring patterns
3. **Phase 3:** Update/delete NLP + disambiguation
4. **Phase 4:** Multi-word locations + descriptions
5. **Phase 5:** Attendees + smart defaults

### Testing Plan

- Unit tests for each token type
- Integration tests for combined patterns
- Edge cases: ambiguous input, conflicting tokens
- Locale testing: IL timezone, Hebrew formatting
- Performance: parsing speed for long text

## Known Limitations

### Current (v1)
- Single-word locations only
- Fixed 1-hour duration
- No recurring events
- No all-day detection
- No update/delete via NLP
- No attendees support
- No description field
- No time range parsing
- No relative dates beyond tomorrow

### Parsing Edge Cases
- Ambiguous times (e.g., "5:00" - AM or PM?)
  - Current: Uses 24-hour format only
- Multiple time tokens in same text
  - Current: Uses first match only
- Conflicting date tokens (e.g., "היום מחר")
  - Current: Last token wins
- Non-standard Hebrew (typos, mixed languages)
  - Current: Best-effort parsing, may fail

### Error Handling
- Invalid Hebrew → May extract incorrect tokens
- Missing critical info → Uses defaults (may surprise user)
- Unparseable text → Falls back to title-only

## Best Practices

### For Users
1. Use clear, simple Hebrew sentences
2. Include date token (היום/מחר) explicitly
3. Use 24-hour time format (14:00 not 2:00)
4. Single-word locations work best
5. Use parseOnly to preview before creating

### For Developers
1. Always validate parsed result before execution
2. Log parsing failures for analysis
3. Test with real Hebrew input (not transliteration)
4. Consider edge cases (empty strings, special chars)
5. Provide clear error messages in Hebrew

## References
- Hebrew date/time vocabulary: https://hebrew.jerusalemplus.com/time
- Google Calendar API: https://developers.google.com/calendar
- Apps Script Calendar Service: https://developers.google.com/apps-script/reference/calendar
