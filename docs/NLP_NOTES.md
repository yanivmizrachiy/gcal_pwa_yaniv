# NLP v2 – תיעוד מפורט (NLP Version 2 – Detailed Documentation)

## מטרות (Objectives)

NLP v2 נועד לספק ניתוח שפה טבעית מתקדם עבור העורך החכם של יומן Google (App1). המערכת תתמוך בעברית בעיקר, עם הבהרות באנגלית במקום הצורך.

**יעדים עיקריים:**
- ניתוח פקודות בעברית לפעולות יומן
- תמיכה בביטויי תאריך וזמן גמישים
- זיהוי אירועים קיימים ותמיכה בעדכונים
- מנגנון בטיחות למניעת פעולות לא רצויות
- זרימת אישור למשתמש (confirmation flow)

---

## ביטויי תאריך וזמן נתמכים (Supported Date/Time Expressions)

### תאריכים יחסיים (Relative Dates)
- **"היום"** – today
- **"מחר"** – tomorrow
- **"מחרתיים"** – day after tomorrow
- **"אתמול"** – yesterday
- **"בעוד X ימים"** – in X days
- **"בעוד X שבועות"** – in X weeks
- **"בעוד X חודשים"** – in X months

### ימים בשבוע (Weekdays)
- **יום + "הבא"** – next [weekday]
  - דוגמאות: "יום ראשון הבא", "יום שני הבא", "יום שלישי הבא", וכו׳

### שעות ודקות (Hours and Minutes)
- **"בעוד X שעות"** – in X hours
- **"בעוד X דקות"** – in X minutes
- **"בשעה HH:MM"** – at HH:MM
- **"מ-HH:MM עד HH:MM"** – from HH:MM to HH:MM (time range)

### משך אירוע (Event Duration)
- **זמן יחיד → משך ברירת מחדל** – single time → default duration (e.g., 1 hour)
- **טווח זמן מפורש** – explicit time range

### אירועים לכל היום (All-Day Events)
- **"כל היום"** – all day
- **"יום שלם"** – full day

### חלקי יום (Time Slots)
- **"בבוקר"** – in the morning (e.g., 9:00-12:00)
- **"בצהריים"** – at noon (e.g., 12:00-14:00)
- **"אחר הצהריים"** – in the afternoon (e.g., 14:00-17:00)
- **"בערב"** – in the evening (e.g., 18:00-21:00)
- **"בלילה"** – at night (e.g., 21:00-23:00)

---

## פעלי פעולה (Operation Verbs)

המערכת תזהה את הפעולות הבאות:

1. **יצירה (Create)**
   - "צור", "יצור", "הוסף", "תוסיף", "קבע"
   
2. **עדכון (Update)**
   - "עדכן", "שנה", "תקן"
   
3. **העברה (Move)**
   - "העבר", "הזז", "דחה"
   
4. **שכפול (Duplicate)**
   - "שכפל", "העתק"
   
5. **מחיקה (Delete)**
   - "מחק", "בטל", "הסר"
   
6. **משתתפים (Attendees)**
   - "הוסף משתתף", "הסר משתתף", "הזמן", "בטל הזמנה"
   
7. **צבע (Color)**
   - "שנה צבע ל-", "צבע"
   
8. **תזכורות (Reminders)**
   - "הוסף תזכורת", "הסר תזכורת", "שנה תזכורת"

---

## היוריסטיקה לזיהוי אירועים (Event Matching Heuristic)

כאשר פקודה מתייחסת לאירוע קיים (למשל, "עדכן את הפגישה עם דני"), המערכת תשתמש בהיוריסטיקה לזיהוי האירוע המתאים ביותר.

### מערכת ניקוד (Scoring System)
- **התאמת כותרת מדויקת** – 100 נקודות
- **התאמת כותרת חלקית** – 50-80 נקודות (לפי אחוז התאמה)
- **התאמת משתתף** – 30 נקודות
- **התאמת תאריך קרוב** – 20-40 נקודות (ככל שקרוב יותר, יותר נקודות)
- **התאמת צבע** – 10 נקודות

### זיהוי עמימות (Ambiguity Detection)
אם יש שני אירועים או יותר עם ניקוד דומה (הפרש < 20 נקודות), המערכת תסמן את הפקודה כ-**עמימה (ambiguous)**.

### חוקי safeToExecute
פקודה תסומן כ-**בטוחה לביצוע** רק אם:
- האירוע התואם מזוהה בבירור (ניקוד גבוה, לא עמימות)
- הפעולה אינה מסוכנת (למשל, מחיקה תמיד תדרוש אישור)
- אין אזהרות קריטיות

---

## מבנה האובייקט המפורש v2 (Interpreted Object Shape v2)

```javascript
{
  "nlpVersion": "v2-draft",
  "action": "create" | "update" | "move" | "duplicate" | "delete" | "addAttendee" | "removeAttendee" | "changeColor" | "changeReminders",
  "tokens": {
    // Tokenized components of the command
    "verb": "צור",
    "title": "פגישה עם דני",
    "dateKeywords": ["מחר"],
    "timeRange": "14:00-15:00",
    "colorPhrase": "צבע כחול",
    "attendees": ["danny@example.com"],
    "allDay": false
  },
  "event": {
    "title": "פגישה עם דני",
    "start": "2024-01-15T14:00:00+02:00",
    "end": "2024-01-15T15:00:00+02:00",
    "allDay": false,
    "color": "9" // Color ID for blue
  },
  "eventMatch": {
    // Only for update/move/delete/duplicate actions
    "matchedEvent": {
      "id": "event123",
      "title": "פגישה עם דני",
      "start": "2024-01-14T14:00:00+02:00"
    },
    "score": 150,
    "ambiguous": false,
    "candidates": [] // Other potential matches
  },
  "attendees": {
    "add": ["danny@example.com"],
    "remove": []
  },
  "reminders": {
    "mode": "default" | "custom" | "none",
    "custom": [
      { "method": "email", "minutes": 30 },
      { "method": "popup", "minutes": 10 }
    ]
  },
  "warnings": [
    // Array of warning messages in Hebrew
    "לא נמצא אירוע תואם בבירור"
  ],
  "safeToExecute": true | false,
  "needsConfirmation": true | false,
  "rawInput": "צור פגישה עם דני מחר בשעה 14:00"
}
```

---

## זרימת אישור (Confirmation Flow)

### needsConfirmation
המערכת תסמן פקודה כדורשת אישור במקרים הבאים:
- פעולת מחיקה
- עדכון או העברה של אירוע עם זיהוי עמום
- שינוי משמעותי (למשל, העברת אירוע בשבוע שלם)
- כל פעולה עם `safeToExecute: false`

### פעולת parseOnly
פעולה חדשה ב-API: `"action": "parseOnly"`
- **תפקיד:** מבצעת ניתוח NLP ומחזירה אובייקט מפורש **מבלי** לבצע שינויים ביומן
- **שימוש:** מאפשר לממשק המשתמש להציג תצוגה מקדימה ולבקש אישור מהמשתמש
- **תגובה:** אובייקט מפורש v2 מלא

---

## תכונות עתידיות (Future Backlog)

### 1. קישור ישיר לאירוע (htmlLink)
הוספת שדה `htmlLink` לאובייקט המפורש, המכיל קישור ישיר לאירוע ב-Google Calendar.

### 2. תזכורות מתקדמות (Advanced Reminders)
- תמיכה בתזכורות מותנות (למשל, "תזכיר לי רק אם יש גשם")
- תזכורות חוזרות (למשל, "תזכיר לי כל יום בשעה 8:00")

### 3. מטמון ביצועים (Performance Caching)
- שמירת תוצאות ניתוח לפקודות נפוצות
- מטמון אירועים לשיפור מהירות זיהוי

### 4. למידה אישית (Personalized Learning)
- התאמת ההיוריסטיקה לפי הרגלי המשתמש
- זיהוי דפוסי שמות וביטויים ייחודיים למשתמש

---

## הערות טכניות (Technical Notes)

### תאימות לאחור (Backward Compatibility)
- פעולת "text" הקיימת תמשיך לעבוד כמו קודם (NLP v1)
- כל התגובות יכללו שדה `nlpVersion` להבחנה בין גרסאות
- פונקציות CRUD קיימות לא יימחקו ולא ישונו

### תיעוד קוד (Code Documentation)
- כל הפונקציות החדשות יכללו JSDoc headers באנגלית
- כל ההודעות למשתמש יישארו בעברית

### בדיקות (Testing)
- יש להוסיף בדיקות יחידה לכל פונקציית ניתוח
- יש לבדוק תרחישי קצה (למשל, קלט ריק, פקודות לא חוקיות)

---

## דוגמאות שימוש (Usage Examples)

### דוגמה 1: יצירת אירוע
**קלט:**
```
"צור פגישה עם דני מחר בשעה 14:00"
```

**פלט (parseOnly):**
```json
{
  "nlpVersion": "v2-draft",
  "action": "create",
  "tokens": {
    "verb": "צור",
    "title": "פגישה עם דני",
    "dateKeywords": ["מחר"],
    "timeRange": "14:00-15:00"
  },
  "event": {
    "title": "פגישה עם דני",
    "start": "2024-01-15T14:00:00+02:00",
    "end": "2024-01-15T15:00:00+02:00",
    "allDay": false
  },
  "safeToExecute": true,
  "needsConfirmation": false,
  "rawInput": "צור פגישה עם דני מחר בשעה 14:00"
}
```

### דוגמה 2: עדכון אירוע עמום
**קלט:**
```
"עדכן את הפגישה ל-16:00"
```

**פלט (parseOnly):**
```json
{
  "nlpVersion": "v2-draft",
  "action": "update",
  "eventMatch": {
    "ambiguous": true,
    "candidates": [
      { "id": "ev1", "title": "פגישה עם דני", "score": 50 },
      { "id": "ev2", "title": "פגישה עם רונית", "score": 48 }
    ]
  },
  "warnings": ["נמצאו מספר אירועים תואמים"],
  "safeToExecute": false,
  "needsConfirmation": true,
  "rawInput": "עדכן את הפגישה ל-16:00"
}
```

---

## סיכום (Summary)

NLP v2 מספק מערכת ניתוח שפה טבעית מתקדמת ובטוחה לניהול יומן Google. המערכת מתמקדת בעברית, תומכת בביטויי תאריך וזמן גמישים, וכוללת מנגנוני בטיחות ואישור למניעת טעויות.

**שלבים הבאים:**
1. ✅ תיעוד מפורט (מסמך זה)
2. 🔄 scaffolding ופונקציות placeholder
3. ⏳ מימוש ניתוח בסיסי (tokenization)
4. ⏳ מימוש היוריסטיקה לזיהוי אירועים
5. ⏳ בדיקות ואימות
6. ⏳ שילוב מלא ב-production

---

**תאריך עדכון:** 2024
**גרסה:** Draft v0.1
