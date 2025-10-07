# NLP v2 Usage Examples

## Delete Operations with Fuzzy Matching

### Example 1: Simple Delete
```
Input: "מחק פגישה"
Expected behavior:
1. Searches calendar for events with "פגישה" in title
2. If single match found with score ≥0.55: deletes it
3. If multiple matches: returns disambiguation list
4. If no matches: error "לא מצאתי אירוע תואם למחיקה"
```

### Example 2: Delete with More Context
```
Input: "מחק פגישה עם הלקוח"
Expected behavior:
- More specific query increases match accuracy
- Higher chance of single clear match
```

### Example 3: Disambiguation Required
```
Input: "מחק ישיבה"
Scenario: Multiple events contain "ישיבה"
Response:
{
  "ok": false,
  "needDisambiguation": true,
  "candidates": [
    {"id": "...", "title": "ישיבת צוות", "start": "...", "score": 0.75},
    {"id": "...", "title": "ישיבת הנהלה", "start": "...", "score": 0.70}
  ],
  "error": "מצאתי מספר אירועים תואמים. אנא בחר אירוע ספציפי."
}
```

### Example 4: Delete Recurring Event Instance
```
Input: "מחק פגישת סטטוס שבועית"
Scenario: Event is part of recurring series
Response:
{
  "ok": true,
  "action": "deleteEvent",
  "message": "האירוע נמחק בהצלחה: פגישת סטטוס שבועית",
  "warnings": [
    {
      "type": "SERIES_INSTANCE_DELETE",
      "message": "נמחק רק מופע יחיד. למחיקת כל הסדרה כתוב: מחק את כל הסדרה של פגישת סטטוס שבועית"
    }
  ]
}
```

## Update Operations with Fuzzy Matching

### Example 5: Simple Update (No Changes)
```
Input: "עדכן פגישה"
Expected behavior:
1. Finds matching event via fuzzy search
2. No specific changes detected
3. Returns success with matched eventId
```

### Example 6: Add Single Guest
```
Input: "עדכן פגישה הוסף john@example.com"
Expected behavior:
1. Finds matching event
2. Adds john@example.com to event guests
3. Returns success with guestsAdd array
```

### Example 7: Add Multiple Guests
```
Input: "עדכן ישיבה הוסף user1@test.com user2@test.com user3@test.com"
Response:
{
  "ok": true,
  "interpreted": {
    "eventId": "...",
    "changes": {
      "guestsAdd": ["user1@test.com", "user2@test.com", "user3@test.com"]
    }
  }
}
```

### Example 8: Remove Guest
```
Input: "עדכן פגישה הסר old-member@company.com"
Expected behavior:
1. Finds matching event
2. Removes old-member@company.com from guests
3. Returns success with guestsRemove array
```

### Example 9: Add and Remove Guests
```
Input: "עדכן אירוע הוסף new@example.com הסר old@example.com"
Response:
{
  "ok": true,
  "interpreted": {
    "eventId": "...",
    "changes": {
      "guestsAdd": ["new@example.com"],
      "guestsRemove": ["old@example.com"]
    }
  }
}
```

### Example 10: Invalid Email Warning
```
Input: "עדכן פגישה הוסף not-an-email"
Response:
{
  "ok": true,
  "interpreted": {...},
  "warnings": [
    {
      "type": "GUEST_EMAIL_INVALID",
      "message": "כתובת דוא\"ל לא תקינה: not-an-email"
    }
  ]
}
```

### Example 11: Duplicate Email Neutralized
```
Input: "עדכן פגישה הוסף user@test.com הסר user@test.com"
Response:
{
  "ok": true,
  "interpreted": {
    "eventId": "...",
    "changes": {}
  },
  "warnings": [
    {
      "type": "GUEST_DUPLICATE_NEUTRALIZED",
      "message": "דוא\"ל מופיע גם בהוספה וגם בהסרה, מבוטל: user@test.com"
    }
  ]
}
```

### Example 12: Blocked Recurrence Modification
```
Input: "עדכן פגישה חוזרת כל יום"
Response:
{
  "ok": false,
  "error": "שינוי חזרתיות אינו נתמך בעדכון בשלב זה",
  "operation": "update"
}
```

### Example 13: Blocked Recurrence with Weekday
```
Input: "עדכן אירוע כל שני"
Response:
{
  "ok": false,
  "error": "שינוי חזרתיות אינו נתמך בעדכון בשלב זה",
  "operation": "update"
}
```

## Fuzzy Matching Behavior

### Example 14: Typo Tolerance
```
Input: "מחק פגיסה"  (typo: ס instead of ש)
Expected: Still finds "פגישה" due to small Levenshtein distance
```

### Example 15: Partial Match
```
Input: "מחק פג"
Expected: May not match due to token length < 3 chars requirement
```

### Example 16: With Context Words
```
Input: "מחק את האירוע של פגישה"
Expected: Stop words "את", "של" filtered out, matches on "אירוע" and "פגישה"
```

### Example 17: Time Window
```
Input: "מחק פגישה ישנה"
Note: Only searches events from -30 days to +60 days
Events older than 30 days ago will not be found
```

## Error Cases

### Example 18: No Query Provided
```
Input: "מחק"
Response:
{
  "ok": false,
  "error": "מחיקה דורשת זיהוי אירוע ספציפי",
  "operation": "delete"
}
```

### Example 19: No Match Found
```
Input: "מחק אירוע-שלא-קיים-בכלל"
Response:
{
  "ok": false,
  "error": "לא מצאתי אירוע תואם למחיקה",
  "operation": "delete"
}
```

### Example 20: Update Without Query
```
Input: "עדכן"
Response:
{
  "ok": false,
  "error": "עדכון דורש זיהוי אירוע ספציפי",
  "operation": "update"
}
```

## Create Operations (Unchanged)

### Example 21: Create Still Works
```
Input: "פגישה היום 14:00-15:00"
Expected behavior:
- No update/delete keywords detected
- Falls through to create operation
- Creates new event as before
```

## Mixed Hebrew Verbs

### Example 22: Different Add Verbs
```
"עדכן פגישה הוסף user1@test.com"  ✓
"עדכן פגישה הוספת user2@test.com"  ✓
"עדכן פגישה לצרף user3@test.com"  ✓
All work the same way
```

### Example 23: Different Remove Verbs
```
"עדכן פגישה הסר user1@test.com"   ✓
"עדכן פגישה הורד user2@test.com"  ✓
"עדכן פגישה מחק user3@test.com"   ✓
All work the same way
```

## Scoring Examples

### Example 24: High Score Match
```
Query: "פגישת צוות"
Event: "פגישת צוות שבועית"
Expected: High score (≥0.75) due to exact token match
```

### Example 25: Medium Score Match
```
Query: "פגישה"
Event: "פגישת סטטוס"
Expected: Medium score (~0.55-0.70) due to shared root
```

### Example 26: Low Score No Match
```
Query: "פגישה"
Event: "ארוחת צהריים"
Expected: Low score (<0.55), no match
```
