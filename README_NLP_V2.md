# Smart Hebrew Calendar - NLP v2 עברית

## תיאור
יומן חכם Google Calendar עם עיבוד שפה טבעית (NLP) בעברית גרסה 2.
מערכת מלאה ליצירה, עדכון ומחיקת אירועים בשפה טבעית.

## 🎯 תכונות עיקריות

### 1. יצירת אירועים חכמה
```
"פגישה עם דני מחר 14:00-15:00"
"ישיבת צוות היום 10:00 שעתיים"
"חופש מחרתיים כל היום"
"ישיבה כל שבוע היום 10:00"
```

### 2. עדכון אירועים (Fuzzy Matching)
```
"עדכן פגישה עם דני מחר 15:00"
"עדכן ישיבה הזמן sarah@example.com"
```

### 3. מחיקת אירועים
```
"מחק פגישה עם דני"
"הסר ישיבת צוות"
```

### 4. הצעת משבצות זמן
```javascript
{
  "action": "suggestSlots",
  "options": {
    "date": "2025-01-20",
    "duration": 60,
    "count": 5
  }
}
```

## 📅 ניתוח תאריכים וזמנים

### תאריכים נתמכים
- **היום** - היום הנוכחי
- **מחר** - מחר
- **מחרתיים** - מחרתיים
- **אתמול** - אתמול

### פורמטי זמן
- **HH:MM** - שעה בודדת (+ משך ברירת מחדל)
- **HH:MM-HH:MM** - טווח זמן מלא
- **כל היום** או **יום מלא** - אירוע של יום שלם

### משכי זמן בעברית
- **חצי שעה** → 30 דקות
- **שעה** → 60 דקות
- **שעתיים** → 120 דקות
- **רבע שעה** → 15 דקות
- **שלושת רבעי שעה** / **¾ שעה** → 45 דקות
- **[מספר] דקות** → מספר דקות
- **[מספר] שעות** → מספר שעות

### חלקי יום (Time-of-Day Heuristics)
כאשר לא מצוין זמן מדויק:
- **בבוקר** → 09:00 (+ warning: DEFAULT_TIME_INFERRED)
- **בצהריים** / **צהריים** → 12:30
- **אחר הצהריים** / **אחרי הצהריים** → 15:00
- **בערב** → 19:00
- **בלילה** → 21:00

## 🎨 תכונות נוספות

### צבעים
```
"פגישה חשובה היום 14:00 אדום"
```
נתמכים: אדום, כחול, ירוק, צהוב, כתום, סגול, ורוד, חום

### תזכורות
```
"פגישה היום 14:00 תזכורת 10 דקות"
```

### מיקום
```
"פגישה היום 14:00 במיקום משרד"
"ישיבה מחר 10:00 ב-תל אביב"
```

### אורחים
```
"פגישה היום 14:00 dan@example.com sarah@test.com"
"עדכן פגישה הזמן john@example.com"
"עדכן פגישה הסר אורח old@example.com"
```

### אירועים חוזרים
```
"ישיבה כל יום היום 10:00"
"פגישה כל שבוע מחר 14:00"
"דיווח כל חודש היום 9:00"
```

**שים לב:** עדכון אירועים חוזרים חסום. יש לערוך ידנית ב-Google Calendar.

## ⚙️ API Endpoints

### POST /exec

#### selfTest
```javascript
{
  "action": "selfTest"
}
```

**תשובה:**
```json
{
  "ok": true,
  "action": "selfTest",
  "message": "בדיקה תקינה - NLP v2 מלא",
  "nlpVersion": "v2",
  "progressPercent": 100,
  "completed": true,
  "features": [/* 11 תכונות */],
  "now": "2025-01-20T10:30:00.000Z"
}
```

#### parseNlp (תצוגה מקדימה)
```javascript
{
  "action": "parseNlp",
  "text": "פגישה עם דני מחר 14:00 שעתיים",
  "parseOnly": true  // לא מבצע שינויים
}
```

#### parseNlp (ביצוע)
```javascript
{
  "action": "parseNlp",
  "text": "פגישה עם דני מחר 14:00 שעתיים",
  "parseOnly": false  // מבצע את הפעולה
}
```

#### createEvent (ישיר)
```javascript
{
  "action": "createEvent",
  "event": {
    "title": "פגישה חשובה",
    "start": "2025-01-21T14:00:00.000Z",
    "end": "2025-01-21T16:00:00.000Z",
    "location": "משרד",
    "color": "red",
    "reminders": [10, 30],
    "guests": ["dan@example.com"]
  }
}
```

#### updateEvent
```javascript
{
  "action": "updateEvent",
  "eventId": "event_id_here",
  "changes": {
    "title": "כותרת חדשה",
    "start": "2025-01-21T15:00:00.000Z",
    "addGuests": ["new@example.com"],
    "removeGuests": ["old@example.com"]
  }
}
```

#### deleteEvent
```javascript
{
  "action": "deleteEvent",
  "eventId": "event_id_here"
}
```

#### findEvents
```javascript
{
  "action": "findEvents",
  "options": {
    "timeMin": "2025-01-20T00:00:00.000Z",
    "timeMax": "2025-01-27T00:00:00.000Z",
    "maxResults": 50,
    "q": "פגישה"  // חיפוש טקסט
  }
}
```

#### suggestSlots
```javascript
{
  "action": "suggestSlots",
  "options": {
    "date": "2025-01-21",
    "duration": 60,  // דקות
    "count": 5       // מספר הצעות
  }
}
```

## ⚠️ קודי אזהרה (Warning Codes)

| קוד | משמעות | דוגמה |
|-----|--------|-------|
| `DEFAULT_TIME_INFERRED` | זמן הוסק מהיוריסטיקה | "פגישה מחר בבוקר" |
| `FUZZY_MATCH` | התאמה מטושטשת נמצאה | עדכון אירוע לפי שם חלקי |
| `DISAMBIGUATION_REQUIRED` | נמצאו מספר אירועים תואמים | יש לדייק את השם |
| `RECURRING_EVENT` | אירוע חוזר | מחיקת אירוע חוזר |
| `RECURRING_UPDATE_BLOCKED` | עדכון אירוע חוזר חסום | יש לערוך ידנית |
| `RECURRENCE_DETECTED` | תבנית חזרה זוהתה | "כל שבוע", "כל יום" |

## 🔍 Fuzzy Matching & Disambiguation

### איך זה עובד?
כאשר מבקשים לעדכן או למחוק אירוע לפי שם:

```javascript
{"action": "parseNlp", "text": "עדכן פגישה עם דני מחר 15:00"}
```

המערכת:
1. מחפשת אירועים עם כותרת דומה ל-"פגישה עם דני"
2. **אם נמצא אחד:** מבצעת את העדכון
3. **אם נמצאו כמה:** מחזירה רשימת מועמדים (candidates) לפירוט

### דוגמה לפירוט:
```json
{
  "ok": false,
  "error": "נמצאו 3 אירועים תואמים. אנא דייק יותר.",
  "candidates": [
    {
      "id": "abc123",
      "title": "פגישה עם דני - נושא A",
      "start": "2025-01-21T14:00:00.000Z",
      "end": "2025-01-21T15:00:00.000Z"
    },
    {
      "id": "def456",
      "title": "פגישה עם דני - נושא B",
      "start": "2025-01-22T10:00:00.000Z",
      "end": "2025-01-22T11:00:00.000Z"
    }
  ],
  "warnings": ["DISAMBIGUATION_REQUIRED"]
}
```

במקרה זה, יש לדייק את הפקודה:
```
"עדכן פגישה עם דני נושא A מחר 15:00"
```

## 📖 דוגמאות מלאות

### דוגמה 1: יצירת אירוע פשוט
```javascript
{
  "action": "parseNlp",
  "text": "פגישה עם דני מחר 14:00-15:00"
}
```

**תוצאה:**
```json
{
  "ok": true,
  "action": "createEvent",
  "message": "האירוע נוצר בהצלחה: פגישה עם דני",
  "event": {
    "id": "...",
    "title": "פגישה עם דני",
    "start": "2025-01-21T14:00:00.000Z",
    "end": "2025-01-21T15:00:00.000Z"
  }
}
```

### דוגמה 2: אירוע עם היוריסטיקת זמן
```javascript
{
  "action": "parseNlp",
  "text": "ישיבת צוות מחרתיים בבוקר",
  "parseOnly": true
}
```

**תוצאה:**
```json
{
  "ok": true,
  "action": "parseNlp",
  "parseOnly": true,
  "interpreted": {
    "success": true,
    "operation": "create",
    "event": {
      "title": "ישיבת צוות",
      "start": "2025-01-22T09:00:00.000Z",
      "end": "2025-01-22T10:00:00.000Z"
    },
    "warnings": ["DEFAULT_TIME_INFERRED"]
  },
  "message": "תצוגה מקדימה - לא בוצעו שינויים"
}
```

### דוגמה 3: אירוע כל היום
```javascript
{
  "action": "parseNlp",
  "text": "חופש מחר כל היום"
}
```

**תוצאה:**
```json
{
  "ok": true,
  "action": "createEvent",
  "message": "האירוע נוצר בהצלחה: חופש",
  "event": {
    "id": "...",
    "title": "חופש",
    "start": "2025-01-21T00:00:00.000Z",
    "end": "2025-01-21T23:59:59.999Z",
    "allDay": true
  }
}
```

### דוגמה 4: אירוע עם משך זמן עברי
```javascript
{
  "action": "parseNlp",
  "text": "פגישה היום 14:00 חצי שעה אדום"
}
```

**תוצאה:**
אירוע בן 30 דקות (14:00-14:30) בצבע אדום.

### דוגמה 5: אירוע חוזר
```javascript
{
  "action": "parseNlp",
  "text": "ישיבת צוות כל שבוע היום 10:00 שעה"
}
```

**תוצאה:**
```json
{
  "ok": true,
  "action": "createEvent",
  "message": "האירוע נוצר בהצלחה: ישיבת צוות",
  "event": {
    "id": "...",
    "title": "ישיבת צוות",
    "start": "2025-01-20T10:00:00.000Z",
    "end": "2025-01-20T11:00:00.000Z",
    "recurrence": "RRULE:FREQ=WEEKLY"
  },
  "warnings": ["RECURRENCE_DETECTED"]
}
```

## 📚 תיעוד נוסף

- **[NLP_V2_TEST_EXAMPLES.md](./NLP_V2_TEST_EXAMPLES.md)** - דוגמאות בדיקה מקיפות
- **[NLP_V2_IMPLEMENTATION_SUMMARY.md](./NLP_V2_IMPLEMENTATION_SUMMARY.md)** - תיעוד טכני מלא

## 🔧 התקנה ופריסה

### דרישות
- Google Apps Script
- Google Calendar API
- חשבון Google

### הגדרה
1. העתק את `src/Code.gs` ל-Google Apps Script Project
2. פרסם כ-Web App (Deploy as web app)
3. הגדר הרשאות ל-Google Calendar
4. השתמש ב-URL שנוצר כ-API endpoint

### שימוש ב-Frontend
ראה `/frontend` לדוגמה מלאה של PWA עם React/Next.js.

## 🎓 טיפים לשימוש

### ✅ עושים נכון:
```
"פגישה עם דני מחר 14:00-15:00"  // ברור ומדויק
"ישיבה היום 10:00 שעתיים"       // משך זמן מוגדר
"חופש כל היום מחר"              // יום שלם
```

### ❌ נמנעים:
```
"פגישה"  // חסר זמן
"עדכן משהו"  // לא ברור מה
"מחר בערך"  // לא מדויק מספיק
```

### 💡 עצות:
- השתמש ב-`parseOnly: true` לבדיקת פקודה לפני ביצוע
- בעדכון/מחיקה - ציין שם מדויק מספיק למניעת disambiguation
- שים לב ל-warnings בתשובה
- אירועים חוזרים: יצירה נתמכת, עדכון ידני בלבד

## 📊 סטטוס

- **גרסה:** NLP v2 (Phase A Complete)
- **אחוז השלמה:** 100%
- **בדיקות:** 38/38 עברו בהצלחה
- **מוכן לייצור:** ✅ כן

## 🤝 תרומה

תרומות מתקבלות בברכה! אנא צור Pull Request או פתח Issue.

## 📄 רישיון

MIT License - ראה קובץ LICENSE לפרטים.

---

**נוצר על ידי:** Yaniv Mizrachiy  
**תאריך:** ינואר 2025  
**Repository:** [github.com/yanivmizrachiy/gcal_pwa_yaniv](https://github.com/yanivmizrachiy/gcal_pwa_yaniv)
