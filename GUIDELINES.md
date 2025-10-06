# מדריך תפעול - יומן חכם (App1: Google Calendar Smart Editor)

## תיאור כללי
אפליקציית PWA לניהול יומן גוגל עם יכולות CRUD מלאות ופירוש פקודות בעברית בשפה טבעית.

## דרישות מקדימות
1. חשבון Google עם גישה ל-Google Calendar
2. הפעלת Google Apps Script
3. אישור הרשאות לקריאה וכתיבה ביומן

## התקנה ופריסה

### שלב 1: פריסת Apps Script Backend
1. פתח את [Google Apps Script](https://script.google.com)
2. צור פרוייקט חדש או פתח פרוייקט קיים
3. העתק את התוכן של `src/Code.gs` לקובץ Code.gs בפרוייקט
4. העתק את התוכן של `src/appsscript.json` לקובץ appsscript.json
5. לחץ על Deploy > New deployment
6. בחר "Web app" כסוג הפריסה
7. הגדר:
   - Execute as: User accessing the web app
   - Who has access: Anyone
8. לחץ Deploy וקבל את ה-Web App URL
9. אשר את ההרשאות הנדרשות

### שלב 2: הגדרת Frontend
1. ערוך את `index.html`
2. חפש את השורה:
   ```javascript
   const SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
   ```
3. החלף את ה-URL ב-Web App URL שקיבלת בשלב 1

### שלב 3: פריסת PWA
1. העלה את הקבצים (index.html, sw.js, manifest.webmanifest, icons/) לשרת web או GitHub Pages
2. וודא ש-HTTPS מופעל (נדרש ל-PWA)
3. גש לכתובת האפליקציה בדפדפן
4. התקן את האפליקציה למסך הבית (Install / Add to Home Screen)

## הרשאות נדרשות
האפליקציה דורשת את ההרשאות הבאות:
- `https://www.googleapis.com/auth/calendar` - גישה מלאה ליומן
- `https://www.googleapis.com/auth/calendar.events` - ניהול אירועים
- `https://www.googleapis.com/auth/userinfo.email` - זיהוי משתמש
- `https://www.googleapis.com/auth/script.external_request` - קריאות רשת

## תכונות עיקריות

### 1. פקודות בעברית (Natural Language Processing)
הזן פקודות בעברית בשפה טבעית:
- **יצירת אירועים**: "צור פגישה מחר ב-10:00", "קבע פגישה עם דני היום בשעה 14:30"
- **חיפוש אירועים**: "הצג אירועים היום", "מצא אירועים מחר"
- תמיכה במילות מפתח: היום, מחר, מחרתיים, שבוע הבא
- זיהוי אוטומטי של שעות בפורמט XX:XX

### 2. יצירת אירוע ידנית
מילוי טופס מפורט:
- כותרת אירוע (חובה)
- תאריך ושעת התחלה (חובה)
- תאריך ושעת סיום (חובה)
- תיאור אירוע (אופציונלי)

### 3. צפייה ברשימת אירועים
- צפייה באירועי היום
- צפייה באירועי השבוע
- רענון ידני של הרשימה
- הצגת פרטים מלאים לכל אירוע

### 4. עריכת אירועים
- לחיצה על כפתור "ערוך" באירוע
- עדכון כל שדות האירוע
- שמירה אוטומטית ליומן

### 5. מחיקת אירועים
- לחיצה על כפתור "מחק"
- אישור המחיקה
- מחיקה מיידית מהיומן

## API Reference

### Endpoints

#### doGet (Legacy - backward compatibility)
```
GET ?mode=selftest
GET ?mode=events
```

#### doPost (JSON API)
```
POST /
Content-Type: application/json
```

### Actions

#### 1. selfTest
בדיקת תקינות המערכת
```json
{
  "action": "selfTest"
}
```

Response:
```json
{
  "ok": true,
  "message": "המערכת פועלת תקין",
  "now": "2024-01-01T12:00:00.000Z",
  "user": "user@example.com"
}
```

#### 2. findEvents
חיפוש אירועים
```json
{
  "action": "findEvents",
  "startDate": "2024-01-01T00:00:00.000Z",
  "endDate": "2024-01-08T00:00:00.000Z"
}
```

Response:
```json
{
  "ok": true,
  "message": "נמצאו X אירועים",
  "count": X,
  "events": [
    {
      "id": "event_id",
      "title": "כותרת",
      "start": "2024-01-01T10:00:00.000Z",
      "end": "2024-01-01T11:00:00.000Z",
      "allDay": false,
      "description": "תיאור"
    }
  ]
}
```

#### 3. createEvent
יצירת אירוע חדש
```json
{
  "action": "createEvent",
  "title": "פגישה חשובה",
  "startDate": "2024-01-01T10:00:00.000Z",
  "endDate": "2024-01-01T11:00:00.000Z",
  "description": "תיאור אופציונלי"
}
```

Response:
```json
{
  "ok": true,
  "message": "האירוע \"פגישה חשובה\" נוצר בהצלחה",
  "event": {
    "id": "event_id",
    "title": "פגישה חשובה",
    "start": "2024-01-01T10:00:00.000Z",
    "end": "2024-01-01T11:00:00.000Z"
  }
}
```

#### 4. updateEvent
עדכון אירוע קיים
```json
{
  "action": "updateEvent",
  "eventId": "event_id",
  "title": "כותרת חדשה",
  "startDate": "2024-01-01T10:00:00.000Z",
  "endDate": "2024-01-01T11:00:00.000Z",
  "description": "תיאור חדש"
}
```

Response:
```json
{
  "ok": true,
  "message": "האירוע עודכן בהצלחה",
  "event": {...}
}
```

#### 5. deleteEvent
מחיקת אירוע
```json
{
  "action": "deleteEvent",
  "eventId": "event_id"
}
```

Response:
```json
{
  "ok": true,
  "message": "האירוע \"כותרת\" נמחק בהצלחה"
}
```

#### 6. getEvent
קבלת פרטי אירוע בודד
```json
{
  "action": "getEvent",
  "eventId": "event_id"
}
```

Response:
```json
{
  "ok": true,
  "message": "האירוע נמצא",
  "event": {...}
}
```

#### 7. text (Natural Language)
פירוש פקודה בעברית
```json
{
  "action": "text",
  "text": "צור פגישה מחר ב-10:00"
}
```

Response:
```json
{
  "ok": true,
  "message": "האירוע נוצר בהצלחה",
  "event": {...}
}
```

## טיפים ושימוש יומיומי

### פקודות עברית מומלצות
- "צור פגישה מחר ב-14:00" - יוצר פגישה של שעה
- "קבע פגישה עם הצוות היום ב-16:30" - כולל שם במערכת
- "הצג אירועים היום" - מציג את כל האירועים של היום
- "הוסף פגישה מחרתיים בשעה 9:00" - לעוד יומיים

### מקרי קצה וטיפול בשגיאות
- **אין חיבור לאינטרנט**: האפליקציה תציג הודעת שגיאה מתאימה
- **אירוע לא נמצא**: הודעה "האירוע לא נמצא"
- **פקודה לא מובנת**: "לא זוהתה כותרת לאירוע" או הודעה מתאימה
- **הרשאות חסרות**: יש לאשר מחדש את ההרשאות ב-Apps Script

### אופטימיזציה וביצועים
- השתמש בטעינת "היום" או "השבוע" במקום רענון כללי
- השרת מטמון (Service Worker) משפר את הביצועים ומאפשר שימוש offline בממשק
- API calls מבוצעים בזמן אמת ללא cache

## אבטחה ופרטיות
- כל הפעולות מבוצעות בהקשר של המשתמש המחובר
- אין שמירת מידע על שרת צד שלישי
- הגישה ליומן מתבצעת ישירות דרך Google Calendar API
- ה-Service Worker מטמון רק assets סטטיים, לא נתוני משתמש

## פתרון בעיות

### האפליקציה לא מתחברת ל-Apps Script
1. וודא שה-SCRIPT_URL נכון ב-index.html
2. בדוק שה-Apps Script deployed כ-"Anyone" access
3. נסה לפתוח את ה-SCRIPT_URL ישירות בדפדפן ולאשר הרשאות

### פקודות עברית לא עובדות
1. וודא שהטקסט כולל מילות מפתח מוכרות (צור, הצג, קבע, היום, מחר)
2. בדוק שהפורמט של השעה הוא XX:XX
3. נסה להשתמש בטופס הידני במקום

### Service Worker לא עובד
1. וודא שהאתר מוגש דרך HTTPS
2. נקה את ה-cache של הדפדפן
3. בדוק ב-DevTools > Application > Service Workers

## עדכונים והרחבות עתידיות
- תמיכה בהתראות push
- סנכרון רקע של אירועים
- תמיכה ביומנים משותפים
- אינטגרציה עם שירותי לוח שנה נוספים
- הרחבת מילון העברית ב-NLP

## תמיכה
לשאלות ובעיות, פתח Issue ב-GitHub Repository.

---
**גרסה**: 4.0
**עדכון אחרון**: ינואר 2024
**מחבר**: יניב מזרחי
