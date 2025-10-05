# ✅ רשימת בדיקות לפריסה (Deployment Checklist)

## שלב 1: העלאה ל-Google Apps Script

### 1.1 פתיחת הפרויקט
- [ ] התחבר ל-[Google Apps Script](https://script.google.com/)
- [ ] פתח את הפרויקט הקיים או צור חדש
- [ ] שם הפרויקט: "יומן חכם של יניב"

### 1.2 העלאת הקבצים
- [ ] פתח את `Code.gs` ב-Apps Script
- [ ] העתק את כל התוכן מ-`src/Code.gs` (485 שורות)
- [ ] הדבק והחלף את הקוד הישן
- [ ] שמור (Ctrl+S או File → Save)

### 1.3 עדכון הגדרות הפרויקט
- [ ] לחץ על אייקון ההגדרות (⚙️)
- [ ] לחץ על "Show appsscript.json in editor"
- [ ] החלף את התוכן עם `src/appsscript.json`
- [ ] ודא שהשדה `oauthScopes` כולל:
  ```json
  "https://www.googleapis.com/auth/calendar"
  ```
  (לא `calendar.readonly`)

---

## שלב 2: פרסום כ-Web App

### 2.1 פרסום ראשוני
- [ ] לחץ על "Deploy" → "New deployment"
- [ ] בחר "Web app" כסוג הפריסה
- [ ] הגדרות:
  - **Description**: "גרסה 2.0.0 - CRUD מלא + NLP"
  - **Execute as**: Me (המייל שלך)
  - **Who has access**: Anyone
- [ ] לחץ "Deploy"

### 2.2 אישור הרשאות
- [ ] יופיע חלון אישור הרשאות
- [ ] לחץ "Review permissions"
- [ ] בחר את חשבון Google שלך
- [ ] אשר את ההרשאות:
  - ✅ View and manage your calendars
  - ✅ Connect to an external service
  - ✅ Display and run third-party web content
- [ ] אם מופיעה אזהרה, לחץ "Advanced" → "Go to [App Name] (unsafe)"
- [ ] לחץ "Allow"

### 2.3 שמירת ה-URL
- [ ] העתק את ה-URL שמתקבל (מתחיל ב-`https://script.google.com/macros/s/...`)
- [ ] שמור ב-מקום בטוח - זה ה-URL שתשתמש בו ב-frontend

---

## שלב 3: בדיקות API

### 3.1 בדיקת GET - Selftest
```bash
curl "YOUR_SCRIPT_URL?mode=selftest"
```
**תוצאה צפויה:**
```json
{
  "ok": true,
  "now": "2025-01-19T...",
  "user": "your-email@gmail.com"
}
```

### 3.2 בדיקת GET - Events
```bash
curl "YOUR_SCRIPT_URL?mode=events"
```
**תוצאה צפויה:**
```json
{
  "count": X,
  "events": [...]
}
```

### 3.3 בדיקת POST - Create Event
```bash
curl -X POST YOUR_SCRIPT_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "title": "בדיקה - אירוע טסט",
    "startTime": "2025-01-25T10:00:00.000Z",
    "endTime": "2025-01-25T11:00:00.000Z",
    "description": "אירוע לבדיקת המערכת"
  }'
```
**תוצאה צפויה:**
```json
{
  "success": true,
  "message": "האירוע \"בדיקה - אירוע טסט\" נוצר בהצלחה...",
  "eventId": "...",
  "event": {...}
}
```

### 3.4 בדיקת החיפוש
```bash
curl -X POST YOUR_SCRIPT_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "search",
    "query": "בדיקה"
  }'
```
**תוצאה צפויה:**
```json
{
  "success": true,
  "count": 1,
  "events": [...]
}
```

### 3.5 בדיקת NLP
```bash
curl -X POST YOUR_SCRIPT_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "nlp",
    "text": "צור פגישה בשם \"דיון טכני\" מחר בשעה 14:00 למשך שעתיים במשרד"
  }'
```
**תוצאה צפויה:**
```json
{
  "success": true,
  "message": "הפקודה פוענחה: create",
  "parsed": {
    "action": "create",
    "title": "דיון טכני",
    ...
  }
}
```

### 3.6 בדיקת מחיקה (נקה אירוע הבדיקה)
- [ ] קבל את ה-eventId מהחיפוש
- [ ] מחק את אירוע הבדיקה:
```bash
curl -X POST YOUR_SCRIPT_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "delete",
    "eventId": "EVENT_ID_FROM_SEARCH"
  }'
```

---

## שלב 4: עדכון Frontend (אופציונלי)

### 4.1 עדכון ה-URL ב-index.html
אם ה-URL של הסקריפט השתנה:
- [ ] פתח את `index.html`
- [ ] מצא את השורה:
  ```html
  <iframe ... src="https://script.google.com/macros/s/..."></iframe>
  ```
- [ ] החלף עם ה-URL החדש
- [ ] שמור ו-commit

### 4.2 פרסום ל-GitHub Pages
- [ ] Push השינויים ל-GitHub
- [ ] GitHub Actions יפרסם אוטומטית ל-Pages
- [ ] או הפעל ידנית את workflow pages.yml

---

## שלב 5: בדיקות מתקדמות

### 5.1 בדיקות CRUD מלאות
- [ ] יצירת אירוע עם כל השדות (תיאור, מיקום, צבע, תזכורות)
- [ ] עדכון כל שדה באירוע
- [ ] העברת אירוע לזמן אחר
- [ ] שכפול אירוע
- [ ] שינוי צבע אירוע
- [ ] הוספה והסרה של משתתפים
- [ ] מחיקת אירוע

### 5.2 בדיקות אירועים חוזרים
- [ ] יצירת אירוע יומי
- [ ] יצירת אירוע שבועי עם ימים ספציפיים
- [ ] יצירת אירוע חודשי
- [ ] בדיקה ביומן Google שהאירועים נוצרו נכון

### 5.3 בדיקות NLP בעברית
- [ ] "צור פגישה בשם 'X' מחר בשעה 10"
- [ ] "מחק את האירוע 'X'"
- [ ] "חפש אירועים עם 'לקוח'"
- [ ] "העבר את 'X' ליום שישי"

### 5.4 בדיקות תזכורות
- [ ] הוספת תזכורות מרובות
- [ ] הסרת כל התזכורות
- [ ] עדכון תזכורות קיימות

---

## שלב 6: תיעוד ומעקב

### 6.1 עדכון status.json
- [ ] עדכן את שדה `lastUpdate`
- [ ] עדכן את `deployment.lastDeployment`
- [ ] הוסף הערות אם נדרש

### 6.2 יצירת Release ב-GitHub
- [ ] צור tag חדש: `v2.0.0`
- [ ] צור Release עם תיאור השינויים
- [ ] צרף את הקבצים החשובים

### 6.3 תיעוד בעיות
- [ ] רשום בעיות שנמצאו
- [ ] פתח Issues ב-GitHub
- [ ] תעדף תיקונים לגרסה הבאה

---

## שלב 7: בדיקות אבטחה

### 7.1 בדיקת הרשאות
- [ ] ודא שההרשאות מינימליות ונדרשות
- [ ] בדוק ש-OAuth scope הוא רק calendar ולא יותר
- [ ] ודא שאין גישה למידע רגיש מיותר

### 7.2 בדיקת קלט
- [ ] נסה לשלוח קלט לא תקין (null, undefined, etc.)
- [ ] בדוק שהמערכת מטפלת בשגיאות בצורה נכונה
- [ ] ודא שמוחזרות הודעות שגיאה ברורות בעברית

### 7.3 בדיקת Rate Limiting
- [ ] נסה לשלוח הרבה בקשות ברצף
- [ ] ודא שהמערכת לא קורסת
- [ ] בדוק שיש טיפול נכון במגבלות Google

---

## שלב 8: תיעוד למשתמשים

### 8.1 יצירת מדריך משתמש
- [ ] כתוב מדריך פשוט לשימוש בממשק
- [ ] הוסף צילומי מסך
- [ ] הסבר כיצד להשתמש ב-NLP

### 8.2 יצירת FAQ
- [ ] שאלות נפוצות
- [ ] פתרון בעיות נפוצות
- [ ] טיפים ותחביבים

---

## ✅ רשימת בדיקה מהירה

לפני הפרסום הסופי, ודא ש:

- [ ] ✅ כל הקוד הועלה ל-Google Apps Script
- [ ] ✅ ההרשאות עודכנו ל-`calendar` מלא
- [ ] ✅ הסקריפט פורסם כ-Web App
- [ ] ✅ כל ההרשאות אושרו
- [ ] ✅ בדיקות GET עבדו (selftest, events)
- [ ] ✅ בדיקות POST עבדו (create, update, delete, etc.)
- [ ] ✅ NLP מזהה פקודות בעברית
- [ ] ✅ כל התגובות בעברית וברורות
- [ ] ✅ אירועים מתווספים ליומן האמיתי
- [ ] ✅ התיעוד מעודכן (README, API_DOCS, EXAMPLES)
- [ ] ✅ status.json מעודכן ל-100%
- [ ] ✅ ה-URL החדש מעודכן ב-frontend (אם נדרש)

---

## 🎯 הצלחה!

אם כל הבדיקות עברו בהצלחה - המערכת מוכנה לשימוש!

**זכור:** כל הפעולות על היומן האמיתי של Google. אין דמו!

---

**גרסה:** 2.0.0  
**תאריך:** 19 ינואר 2025  
**סטטוס:** ✅ מוכן לפריסה
