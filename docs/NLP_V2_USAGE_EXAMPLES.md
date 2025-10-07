# NLP v2 Usage Examples

This document provides real-world examples of using the NLP v2 Hebrew natural language processing features.

## Delete Operations

### Delete with Explicit Event ID
```
מחק abc123_def456@google.com
```
Response:
```json
{
  "ok": true,
  "action": "deleteEvent",
  "message": "האירוע נמחק בהצלחה: פגישה עם רופא"
}
```

### Delete with Fuzzy Matching (Single Match)
```
מחק פגישה עם דוקטור
```
Response:
```json
{
  "ok": true,
  "action": "deleteEvent",
  "message": "האירוע נמחק בהצלחה: פגישה עם רופא",
  "interpreted": {
    "operation": "delete",
    "success": true,
    "warnings": []
  }
}
```

### Delete with Disambiguation (Multiple Matches)
```
מחק פגישה
```
Response:
```json
{
  "ok": false,
  "error": "נמצאו מספר אירועים תואמים. אנא בחר אחד מהרשימה או ציין שם מדויק יותר",
  "interpreted": {
    "operation": "delete",
    "success": false,
    "disambiguate": {
      "query": "פגישה",
      "candidates": [
        {
          "id": "abc123@google.com",
          "title": "פגישה עם רופא",
          "start": "2024-01-15T10:00:00.000Z",
          "end": "2024-01-15T11:00:00.000Z",
          "score": 0.85
        },
        {
          "id": "xyz789@google.com",
          "title": "פגישת צוות",
          "start": "2024-01-16T14:00:00.000Z",
          "end": "2024-01-16T15:00:00.000Z",
          "score": 0.72
        }
      ]
    }
  }
}
```

### Delete Recurring Event (Warning)
```
מחק פגישת צוות שבועית
```
Response:
```json
{
  "ok": true,
  "action": "deleteEvent",
  "message": "האירוע נמחק בהצלחה: פגישת צוות שבועית",
  "interpreted": {
    "operation": "delete",
    "success": true,
    "warnings": [
      "נמחק מופע יחיד. למחיקת כל הסדרה כתוב: מחק את כל הסדרה של פגישת צוות שבועית"
    ]
  }
}
```

## Update Operations

### Reschedule Event (Time Change)
```
העבר פגישת צוות ל-15:00-16:00
```
Response:
```json
{
  "ok": true,
  "action": "updateEvent",
  "message": "האירוע עודכן (שדות: זמן)",
  "changedFields": ["זמן"],
  "interpreted": {
    "operation": "update",
    "success": true,
    "changes": {
      "start": "2024-01-15T15:00:00.000Z",
      "end": "2024-01-15T16:00:00.000Z"
    }
  }
}
```

### Postpone Event (Alternative Syntax)
```
דחה ישיבה היום 17:00-18:00
```
Response:
```json
{
  "ok": true,
  "action": "updateEvent",
  "message": "האירוע עודכן (שדות: זמן)",
  "changedFields": ["זמן"]
}
```

### Change Event Title
```
שנה כותרת של פגישה ל פגישת סטטוס שבועית
```
Response:
```json
{
  "ok": true,
  "action": "updateEvent",
  "message": "האירוע עודכן (שדות: כותרת)",
  "changedFields": ["כותרת"],
  "interpreted": {
    "operation": "update",
    "changes": {
      "title": "פגישת סטטוס שבועית"
    }
  }
}
```

### Update Location
```
עדכן פגישה מיקום משרד 3 קומה 2
```
Response:
```json
{
  "ok": true,
  "action": "updateEvent",
  "message": "האירוע עודכן (שדות: מיקום)",
  "changedFields": ["מיקום"],
  "interpreted": {
    "operation": "update",
    "changes": {
      "location": "משרד 3 קומה 2"
    }
  }
}
```

### Update Color
```
שנה צבע של ישיבה לאדום
```
Response:
```json
{
  "ok": true,
  "action": "updateEvent",
  "message": "האירוע עודכן (שדות: צבע)",
  "changedFields": ["צבע"],
  "interpreted": {
    "operation": "update",
    "changes": {
      "color": "red"
    }
  }
}
```

### Update Reminders
```
עדכן פגישה תזכורת 10 30
```
Response:
```json
{
  "ok": true,
  "action": "updateEvent",
  "message": "האירוע עודכן (שדות: תזכורות)",
  "changedFields": ["תזכורות"],
  "interpreted": {
    "operation": "update",
    "changes": {
      "reminders": [10, 30]
    }
  }
}
```

### Multiple Field Update
```
עדכן פגישה 14:00-15:00 מיקום זום צבע כחול
```
Response:
```json
{
  "ok": true,
  "action": "updateEvent",
  "message": "האירוע עודכן (שדות: זמן, מיקום, צבע)",
  "changedFields": ["זמן", "מיקום", "צבע"],
  "interpreted": {
    "operation": "update",
    "changes": {
      "start": "2024-01-15T14:00:00.000Z",
      "end": "2024-01-15T15:00:00.000Z",
      "location": "זום",
      "color": "blue"
    }
  }
}
```

### Recurrence Update (Not Supported)
```
שנה פגישה לכל שבוע
```
Response:
```json
{
  "ok": false,
  "error": "עדכון חזרתיות אינו נתמך בשלב זה",
  "interpreted": {
    "operation": "update",
    "success": false
  }
}
```

## Create Operations (With Validation)

### Create with Valid Recurrence (Only 'times')
```json
POST /exec with:
{
  "action": "createEvent",
  "event": {
    "title": "פגישה שבועית",
    "start": "2024-01-15T10:00:00.000Z",
    "end": "2024-01-15T11:00:00.000Z",
    "recurrence": {
      "frequency": "weekly",
      "times": 10
    }
  }
}
```
Response:
```json
{
  "ok": true,
  "action": "createEvent",
  "message": "האירוע נוצר בהצלחה: פגישה שבועית"
}
```

### Create with Invalid Recurrence (Both 'until' and 'times')
```json
POST /exec with:
{
  "action": "createEvent",
  "event": {
    "title": "פגישה שבועית",
    "start": "2024-01-15T10:00:00.000Z",
    "end": "2024-01-15T11:00:00.000Z",
    "recurrence": {
      "frequency": "weekly",
      "times": 10,
      "until": "2024-03-15T00:00:00.000Z"
    }
  }
}
```
Response:
```json
{
  "ok": false,
  "error": "לא ניתן לציין גם תאריך סיום (until) וגם מספר פעמים (times) בחזרתיות"
}
```

## Fuzzy Matching Scenarios

### High Similarity (Score > 0.8)
Query: `פגישה עם דוקטור`
Event Title: `פגישה עם הרופא`
→ Match found (shared tokens: "פגישה", "עם")

### Moderate Similarity (Score > 0.55)
Query: `פגישה רופא`
Event Title: `פגישה עם רופא שיניים`
→ Match found (shared token: "פגישה", "רופא")

### Low Similarity (Score < 0.55)
Query: `פגישה`
Event Title: `ישיבת הנהלה`
→ No match (insufficient token overlap)

### With Typo (Levenshtein helps)
Query: `פגיסה דוקטור`  (typo: פגיסה instead of פגישה)
Event Title: `פגישה עם דוקטור`
→ Match found (Levenshtein distance = 1, token overlap)

## Error Scenarios

### No Matching Event Found
```
מחק פגישה עם הנשיא
```
Response:
```json
{
  "ok": false,
  "error": "לא מצאתי אירוע תואם",
  "interpreted": {
    "operation": "delete",
    "success": false
  }
}
```

### No Title Identified
```
מחק
```
Response:
```json
{
  "ok": false,
  "error": "לא זוהה שם אירוע למחיקה",
  "interpreted": {
    "operation": "delete",
    "success": false
  }
}
```

### No Changes Detected in Update
```
עדכן פגישה
```
Response:
```json
{
  "ok": false,
  "error": "לא זוהו שינויים לביצוע",
  "interpreted": {
    "operation": "update",
    "success": false
  }
}
```

## Tips for Best Results

### For Delete/Update Operations:
1. **Be specific**: Include unique keywords from the event title
2. **Use key words**: Include at least 3-character words that appear in the title
3. **Check disambiguation**: If multiple events match, use the provided event ID
4. **Use explicit IDs**: For precise operations, paste the event ID from the calendar

### For Fuzzy Matching:
- Fuzzy matching searches ±30 days from current date
- Minimum similarity score: 0.55
- At least one shared token must be ≥3 characters
- Future events are preferred over past events with equal scores
- Closer events (in time) are preferred

### Supported Update Fields:
- ✅ Time/schedule (העבר, דחה, הזז)
- ✅ Title (שנה כותרת ל)
- ✅ Location (מיקום)
- ✅ Color (צבע)
- ✅ Reminders (תזכורת)
- ❌ Recurrence (not supported in Phase A)
- ❌ Guest management (skeleton only in Phase A)

### Hebrew Keywords:
**Delete:** מחק, מחיקה, הסר, בטל  
**Update:** עדכן, שנה, ערוך, תקן, העבר, הזז, דחה  
**Time:** זמן, שעה  
**Title:** כותרת, שם  
**Location:** מיקום, ב  
**Color:** צבע + color name (אדום, כחול, ירוק, etc.)  
**Reminders:** תזכורת, תזכורות
