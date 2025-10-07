# NLP v2 - דוגמאות בדיקה (Testing Examples)

## תיאור כללי
מסמך זה מכיל דוגמאות לבדיקת יכולות NLP v2 המלא. כל הפקודות בעברית.

## 1. selfTest - בדיקה עצמית
```json
{
  "action": "selfTest"
}
```

**תוצאה מצופה:**
- `nlpVersion: "v2"`
- `progressPercent: 100`
- `completed: true`
- רשימת features בעברית

---

## 2. יצירת אירועים (Create Events)

### 2.1 אירוע בסיסי עם זמן מפורש
```json
{
  "action": "parseNlp",
  "text": "פגישה עם דני היום 14:00-15:00",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- `operation: "create"`
- `event.title: "פגישה עם דני"`
- זמן התחלה וסיום מדויקים
- אין warnings

### 2.2 אירוע עם משך זמן (duration)
```json
{
  "action": "parseNlp",
  "text": "פגישה היום 14:00 שעתיים",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- סיום: 16:00 (14:00 + 2 שעות)

### 2.3 אירוע עם ביטוי עברי למשך
```json
{
  "action": "parseNlp",
  "text": "ישיבה מחר 10:00 חצי שעה",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- משך: 30 דקות
- סיום: 10:30

### 2.4 משכים נוספים
- "רבע שעה" → 15 דקות
- "שעה" → 60 דקות
- "שעתיים" → 120 דקות
- "שלושת רבעי שעה" → 45 דקות
- "¾ שעה" → 45 דקות

### 2.5 אירוע עם חלק יום (part-of-day heuristics)
```json
{
  "action": "parseNlp",
  "text": "פגישה מחר בבוקר",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- זמן התחלה: 09:00
- warning: `DEFAULT_TIME_INFERRED`

**חלקי יום נתמכים:**
- "בבוקר" → 09:00
- "בצהריים" / "צהריים" → 12:30
- "אחר הצהריים" / "אחרי הצהריים" → 15:00
- "בערב" → 19:00
- "בלילה" → 21:00

### 2.6 אירוע כל היום (all-day)
```json
{
  "action": "parseNlp",
  "text": "חופש מחר כל היום",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- `allDay: true`
- זמן: 00:00 עד 23:59:59

```json
{
  "action": "parseNlp",
  "text": "כנס מחרתיים יום מלא",
  "parseOnly": true
}
```

### 2.7 תאריכים נתמכים
- "היום"
- "מחר"
- "מחרתיים"
- "אתמול" / "שלשום"

### 2.8 אירוע עם צבע
```json
{
  "action": "parseNlp",
  "text": "פגישה חשובה היום 14:00 אדום",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- `event.color: "red"`

**צבעים נתמכים:**
- אדום, כחול, ירוק, צהוב, כתום, סגול, ורוד, חום

### 2.9 אירוע עם תזכורות
```json
{
  "action": "parseNlp",
  "text": "פגישה היום 14:00 תזכורת 10 דקות",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- `event.reminders: [10]`

### 2.10 אירוע עם מיקום
```json
{
  "action": "parseNlp",
  "text": "פגישה היום 14:00 במיקום משרד",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- `event.location: "משרד"`

### 2.11 אירוע עם אורחים
```json
{
  "action": "parseNlp",
  "text": "פגישה היום 14:00 dan@example.com",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- `event.guests: ["dan@example.com"]`

### 2.12 אירוע חוזר
```json
{
  "action": "parseNlp",
  "text": "ישיבת צוות כל שבוע היום 10:00",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- `event.recurrence: "RRULE:FREQ=WEEKLY"`
- warning: `RECURRENCE_DETECTED`

**תבניות חזרה:**
- "כל יום" → DAILY
- "כל שבוע" → WEEKLY
- "כל חודש" → MONTHLY
- "כל שנה" → YEARLY

---

## 3. עדכון אירועים (Update Events)

### 3.1 עדכון בסיסי (fuzzy match)
```json
{
  "action": "parseNlp",
  "text": "עדכן פגישה עם דני מחר 15:00",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- חיפוש אירוע עם כותרת דומה ל-"פגישה עם דני"
- אם נמצא אחד: `success: true`, `operation: "update"`
- אם נמצאו כמה: error עם `candidates` (disambiguation)
- warning: `FUZZY_MATCH`

### 3.2 disambiguation (פירוט)
אם נמצאו מספר אירועים:

**תוצאה מצופה:**
```json
{
  "ok": false,
  "error": "נמצאו 3 אירועים תואמים. אנא דייק יותר.",
  "candidates": [
    {"id": "...", "title": "...", "start": "...", "end": "..."},
    ...
  ],
  "warnings": ["DISAMBIGUATION_REQUIRED"]
}
```

### 3.3 עדכון אירוע חוזר (חסום)
```json
{
  "action": "parseNlp",
  "text": "עדכן ישיבת צוות שבועית",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- error: "עדכון אירוע חוזר חסום. אנא ערוך ידנית ב-Google Calendar."
- warning: `RECURRING_UPDATE_BLOCKED`

### 3.4 עדכון עם הוספת אורח
```json
{
  "action": "parseNlp",
  "text": "עדכן פגישה עם דני הזמן sarah@example.com",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- `changes.addGuests: ["sarah@example.com"]`

### 3.5 עדכון עם הסרת אורח
```json
{
  "action": "parseNlp",
  "text": "עדכן פגישה הסר אורח john@example.com",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- `changes.removeGuests: ["john@example.com"]`

---

## 4. מחיקת אירועים (Delete Events)

### 4.1 מחיקה בסיסית
```json
{
  "action": "parseNlp",
  "text": "מחק פגישה עם דני",
  "parseOnly": true
}
```

**תוצאה מצופה:**
- חיפוש fuzzy
- אם נמצא אחד: `success: true`, `operation: "delete"`
- אם נמצאו כמה: disambiguation

### 4.2 מחיקת אירוע חוזר
אם האירוע הוא חוזר:

**תוצאה מצופה:**
- warning: `RECURRING_EVENT`
- המחיקה תבוצע (מופע בודד או כל הסדרה תלוי ב-Calendar API)

---

## 5. הצעת משבצות זמן (Suggest Slots)

```json
{
  "action": "suggestSlots",
  "options": {
    "date": "2025-01-20",
    "duration": 60,
    "count": 5
  }
}
```

**תוצאה מצופה:**
- מערך `slots` עם עד 5 משבצות פנויות
- כל slot עם `start`, `end`, `label` (פורמט HH:MM–HH:MM)
- חיפוש בטווח 08:00-20:00

---

## 6. parseOnly Mode

כל פקודה ניתנת לבדיקה עם `parseOnly: true` - במצב זה:
- הפקודה מנותחת
- **אין** שינויים ביומן
- מוחזרת תצוגה מקדימה
- message: "תצוגה מקדימה - לא בוצעו שינויים"

---

## 7. Warning Codes (קודי אזהרה)

| Code | משמעות |
|------|--------|
| `DEFAULT_TIME_INFERRED` | זמן הוסק מהיוריסטיקה (חלק יום) |
| `FUZZY_MATCH` | התאמה מטושטשת לאירוע קיים |
| `DISAMBIGUATION_REQUIRED` | נמצאו מספר אירועים תואמים - יש לדייק |
| `RECURRING_EVENT` | אירוע חוזר |
| `RECURRING_UPDATE_BLOCKED` | עדכון אירוע חוזר חסום |
| `RECURRENCE_DETECTED` | זוהתה תבנית חזרה ביצירת אירוע |

---

## 8. תאימות לאחור (Backward Compatibility)

כל הפעולות הקיימות נשמרות:
- `selfTest` ✅
- `findEvents` ✅
- `createEvent` ✅
- `updateEvent` ✅
- `deleteEvent` ✅
- `parseNlp` ✅ (משודרג ל-v2)
- `suggestSlots` ✅ (חדש)

---

## 9. בדיקות ידניות מומלצות

1. **בדיקת selfTest**: וודא `progressPercent: 100` ו-`completed: true`
2. **יצירה בסיסית**: "פגישה היום 14:00-15:00"
3. **משך עברי**: "ישיבה מחר 10:00 חצי שעה"
4. **חלק יום**: "פגישה מחרתיים בבוקר" → וודא warning
5. **כל היום**: "חופש היום כל היום"
6. **צבע**: "פגישה היום 14:00 אדום"
7. **חזרה**: "ישיבה כל שבוע היום 10:00"
8. **עדכון**: יצור אירוע ואז "עדכן פגישה..."
9. **מחיקה**: "מחק פגישה..."
10. **suggestSlots**: וודא החזרת משבצות פנויות

---

## 10. הערות חשובות

- כל ההודעות בעברית (חוץ מקודי warning באנגלית)
- parseOnly מבטיח אי-שינוי היומן
- fuzzy matching עובד גם עבור update וגם delete
- אירועים חוזרים: יצירה נתמכת, עדכון חסום
- אורחים: תומך בהוספה והסרה
- משבצות זמן: חיפוש בטווח 08:00-20:00

