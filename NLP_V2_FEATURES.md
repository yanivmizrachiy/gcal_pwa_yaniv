# NLP v2 Phase A - Feature Documentation

This document describes the natural language processing features implemented in NLP v2 Phase A.

## Overview

NLP v2 builds upon v1 with enhanced Hebrew natural language understanding, including:
- Part-of-day time inference
- Extended duration phrase support
- Unified warnings schema
- Improved title extraction
- Recurrence conflict validation
- Smart slot suggestion with all-day event handling

## Warning Codes

All warnings follow a unified schema:
```json
{
  "code": "WARNING_CODE",
  "message": "הודעה בעברית",
  "context": { /* optional context data */ }
}
```

### Available Warning Codes

- `MISSING_TITLE` - Title was empty after processing, default title used
- `IGNORED_DURATION` - Duration phrase ignored because explicit time range provided
- `DEFAULT_TIME_INFERRED` - Time inferred from part-of-day (morning/noon/afternoon/evening)
- `GUEST_EMAIL_INVALID` - Guest email format invalid (future)
- `GUEST_LIST_TRUNCATED` - Too many guests, list truncated (future)
- `RECURRENCE_UNSUPPORTED` - Recurrence pattern not supported (future)
- `RECURRENCE_CONFLICT` - Both "until" and "times" specified (conflict)
- `AMBIGUOUS_MATCH` - Multiple events match criteria (future)
- `NO_MATCH` - No events found matching criteria (future)
- `SERIES_INSTANCE_DELETE` - Deleting instance vs series ambiguity (future)

## Part-of-Day Heuristics

When no explicit time (HH:MM) is provided, these keywords trigger default times:

| Hebrew Keyword | Time Assigned | English |
|----------------|---------------|---------|
| בבוקר, בוקר | 09:00 | Morning |
| בצהריים, צהריים | 12:30 | Noon |
| אחר הצהריים, אחה"צ | 15:00 | Afternoon |
| בערב, ערב | 19:00 | Evening |

### Examples

```
מחר בבוקר פגישת הנהלה
→ Start: tomorrow 09:00, End: tomorrow 10:00
→ Warning: DEFAULT_TIME_INFERRED { partOfDay: "morning", assignedStart: "..." }

היום בצהריים ארוחה
→ Start: today 12:30, End: today 13:30
→ Warning: DEFAULT_TIME_INFERRED { partOfDay: "noon", ... }
```

Default duration: 60 minutes (unless duration phrase provided)

## Duration Phrases

Extended support for Hebrew duration phrases:

| Hebrew Phrase | Duration | Notes |
|---------------|----------|-------|
| רבע שעה | 15 minutes | Quarter hour |
| שעה | 60 minutes | One hour |
| שעתיים | 120 minutes | Two hours |
| שלושת רבעי שעה | 45 minutes | Three quarters |
| ¾ שעה | 45 minutes | Unicode fraction |

### Duration Precedence

If both time range (HH:MM-HH:MM) and duration phrase present:
- Time range takes precedence
- Duration phrase ignored
- Warning issued: `IGNORED_DURATION`

### Examples

```
היום 14:00 רבע שעה פגישה
→ Start: 14:00, End: 14:15

היום 10:00-11:00 פגישה שעה
→ Start: 10:00, End: 11:00
→ Warning: IGNORED_DURATION { durationMinutes: 60 }

מחר בבוקר שלושת רבעי שעה סדנה
→ Start: 09:00, End: 09:45
→ Warning: DEFAULT_TIME_INFERRED
```

## Title Extraction Refinement

### Quoted Segments

Text within double quotes becomes the primary title:

```
היום 10:00 "פגישה חשובה מאוד" צבע אדום
→ Title: "פגישה חשובה מאוד"
→ Color: red
```

### Functional Token Stripping

These tokens are automatically removed from title:

**Operation verbs:**
- Create: צור, צרי, יצירה, הוסף, הוסיפי, הוספה
- Update: עדכן, עדכני, עדכון, שנה, שני, שינוי, ערוך, ערכי, עריכה, תקן, תקני, תיקון
- Delete: מחק, מחקי, מחיקה, הסר, הסרי, הסרה, בטל, בטלי, ביטול

**System tokens:**
- Time: 10:00, 14:30-15:00, etc.
- Dates: היום, מחר, מחרתיים
- Colors: אדום, כחול, ירוק, etc.
- Reminders: תזכורת, תזכורות
- Recurrence: כל, עד, פעמים, פעם
- Part-of-day: בבוקר, בצהריים, אחר הצהריים, בערב
- Duration: שעה, שעתיים, דקות, רבע

### Missing Title Handling

If all tokens are functional (nothing left for title):
- Default title: "אירוע"
- Warning: `MISSING_TITLE`

```
היום 10:00 צבע אדום תזכורת 30
→ Title: "אירוע"
→ Warning: MISSING_TITLE
```

## Recurrence Validation

### Conflict Detection

Cannot specify both "until" (עד) and "times" (פעמים) in same command:

```
כל יום 10:00 פגישה עד 31.12 פעמים 10
→ success: false
→ error: "חזרתיות לא תקינה: לא ניתן להגדיר גם 'עד' וגם 'פעמים'"
```

### Valid Patterns

```
כל יום 10:00 פגישה עד 31.12
→ Parsed successfully (until only)

כל יום 10:00 פגישה פעמים 5
→ Parsed successfully (times only)
```

**Note:** Full recurrence implementation coming in future commits. Current version validates conflicts only.

## Suggest Slots Function

New `suggestSlots` action finds available time slots in calendar.

### All-Day Event Handling

All-day events block the entire calendar day (00:00 - 23:59:59.999):

```
Event: "Holiday" (all-day on 2025-01-01)
suggestSlots query for 2025-01-01
→ No slots available that day
```

### Interval Merging

Adjacent and overlapping events are merged correctly:

```
Events:
  10:00-11:00 Meeting A
  11:00-12:00 Meeting B
  
Merged busy interval: 10:00-12:00
Free slots: before 10:00, after 12:00
```

### API Usage

```javascript
POST /endpoint
{
  "action": "suggestSlots",
  "startDate": "2025-01-10T00:00:00Z",
  "endDate": "2025-01-17T23:59:59Z",
  "durationMinutes": 60,
  "calendarId": null  // null = default calendar
}
```

**Response:**
```json
{
  "ok": true,
  "action": "suggestSlots",
  "count": 5,
  "slots": [
    {
      "start": "2025-01-10T08:00:00Z",
      "end": "2025-01-10T09:00:00Z",
      "lengthMinutes": 60
    },
    ...
  ]
}
```

## selfTest Updates

Enhanced selfTest response shows NLP v2 status:

```json
{
  "ok": true,
  "action": "selfTest",
  "message": "בדיקה תקינה",
  "nlpVersion": "v2",
  "now": "2025-01-10T10:00:00Z",
  "progressPercent": 100,
  "features": [
    "warnings-v2",
    "timeofday-heuristics",
    "duration-phrases",
    "title-refinement",
    "recurrence-validation"
  ]
}
```

## Backward Compatibility

All v1 commands continue to work unchanged:

```
היום 10:00 ישיבה
→ Works exactly as in v1
→ warnings: [] (empty but present)
```

## Token Classification

New token types added:

- `timeofday` - Part-of-day keywords (בבוקר, בערב, etc.)
- `duration` - Duration phrases (שעה, רבע, etc.)
- `recurrence` - Recurrence keywords (כל, עד, פעמים)

Existing types: `time`, `date`, `color`, `reminder`, `number`, `text`

## Complete Example

```
Input: מחר בבוקר "סדנת חדשנות" שעה צבע כחול תזכורת 30

Parsed:
- Date: tomorrow
- Time: 09:00 (inferred from "בבוקר")
- Duration: 60 minutes (from "שעה")
- Title: "סדנת חדשנות" (quoted segment)
- Color: blue
- Reminders: [30]
- Warnings: [
    {
      "code": "DEFAULT_TIME_INFERRED",
      "message": "שעה הושלמה אוטומטית (בוקר→09:00)",
      "context": {
        "partOfDay": "morning",
        "assignedStart": "2025-01-11T07:00:00.000Z"
      }
    }
  ]

Result:
- Start: 2025-01-11 09:00
- End: 2025-01-11 10:00
- Event created with all attributes
```

## Future Enhancements (Not in Phase A)

- Full fuzzy disambiguation flow
- Guest add/remove NLP for updates
- Disambiguation result packaging
- Full recurrence pattern support (weekly, monthly, etc.)
- Update/delete event matching by fuzzy search
- Multi-language support beyond Hebrew

## API Reference

### parseNlp

All `parseNlp` responses include `interpreted.warnings` array (may be empty).

### New Actions

- `suggestSlots` - Find free time slots in calendar range

### Updated Actions

- `selfTest` - Now includes v2 metadata and feature list

## Notes

- All messages in Hebrew (למעט קודי אזהרה)
- Warning codes in UPPERCASE_ENGLISH
- Production-ready implementation
- Maintains full v1 compatibility
