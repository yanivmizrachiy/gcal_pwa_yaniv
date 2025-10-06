# יומן חכם – עורך Google Calendar עם עברית

[![PWA](https://img.shields.io/badge/PWA-Ready-blue.svg)](https://developers.google.com/web/progressive-web-apps/)
[![Hebrew](https://img.shields.io/badge/Language-Hebrew-green.svg)](.)

אפליקציית PWA מתקדמת לניהול יומן Google Calendar עם תמיכה מלאה ב-CRUD ופענוח פקודות בעברית בשפה טבעית.

## ✨ תכונות

- 📅 **ניהול מלא של אירועים**: יצירה, צפייה, עריכה ומחיקה
- 🗣️ **עברית טבעית**: הזן פקודות כמו "צור פגישה מחר ב-10:00"
- 📱 **PWA מלא**: התקנה למסך הבית, עבודה offline
- 🌙 **עיצוב כהה**: ממשק משתמש מודרני RTL בעברית
- ⚡ **מהיר ויעיל**: Service Worker לביצועים מיטביים
- 🔒 **מאובטח**: כל הפעולות בהקשר המשתמש שלך

## 🚀 התחלה מהירה

### דרישות מוקדמות
- חשבון Google
- גישה ל-Google Calendar
- דפדפן מודרני (Chrome, Firefox, Safari, Edge)

### שלב 1: הגדרת Apps Script
1. פתח [Google Apps Script](https://script.google.com)
2. צור פרוייקט חדש
3. העתק את `src/Code.gs` ו-`src/appsscript.json`
4. Deploy > New deployment > Web app
5. הגדר Execute as: "User accessing" ו-Who has access: "Anyone"
6. העתק את ה-Web App URL

### שלב 2: הגדרת האפליקציה
1. ערוך את `index.html`
2. עדכן את `SCRIPT_URL` עם ה-URL שקיבלת
3. העלה את הקבצים לשרת HTTPS (GitHub Pages מומלץ)

### שלב 3: התקנה
1. פתח את האפליקציה בדפדפן
2. לחץ על "התקן" או בחר Add to Home Screen
3. אשר הרשאות Google Calendar

## 📖 שימוש

### פקודות עברית
```
צור פגישה מחר ב-10:00
קבע פגישה עם הצוות היום בשעה 14:30
הצג אירועים היום
הוסף פגישה מחרתיים ב-9:00
```

### ממשק ידני
- **יצירת אירוע**: מלא טופס עם כל הפרטים
- **צפייה באירועים**: לחץ "היום" או "השבוע"
- **עריכה**: לחץ על "ערוך" באירוע
- **מחיקה**: לחץ על "מחק" ואשר

## 🔧 API

האפליקציה תומכת ב-JSON API מלא:

```javascript
// יצירת אירוע
POST /
{
  "action": "createEvent",
  "title": "פגישה",
  "startDate": "2024-01-01T10:00:00.000Z",
  "endDate": "2024-01-01T11:00:00.000Z"
}

// פקודה בעברית
POST /
{
  "action": "text",
  "text": "צור פגישה מחר ב-14:00"
}
```

לתיעוד מלא, ראה [GUIDELINES.md](GUIDELINES.md)

## 🛠️ טכנולוגיות

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Google Apps Script
- **APIs**: Google Calendar API
- **PWA**: Service Worker, Web Manifest
- **NLP**: Hebrew heuristic parser

## 📋 מבנה הפרוייקט

```
.
├── index.html              # ממשק משתמש ראשי
├── sw.js                   # Service Worker
├── manifest.webmanifest    # PWA Manifest
├── src/
│   ├── Code.gs            # Apps Script Backend
│   └── appsscript.json    # הגדרות Apps Script
├── icons/                 # אייקונים
├── GUIDELINES.md          # מדריך תפעול מלא
└── README.md             # מסמך זה
```

## 🔐 אבטחה

- כל הפעולות מבוצעות דרך Google OAuth 2.0
- אין שמירת נתונים בשרת צד שלישי
- הרשאות מינימליות נדרשות
- כל משתמש רואה רק את היומן שלו

## 🐛 פתרון בעיות

### האפליקציה לא מתחברת
- ✅ בדוק את ה-SCRIPT_URL ב-index.html
- ✅ ודא ש-Apps Script deployed כראוי
- ✅ אשר הרשאות ב-Apps Script

### פקודות עברית לא עובדות
- ✅ השתמש במילות מפתח: צור, הצג, היום, מחר
- ✅ פורמט שעה: XX:XX
- ✅ נסה את הטופס הידני

### Service Worker לא עובד
- ✅ ודא HTTPS
- ✅ נקה cache
- ✅ בדוק DevTools > Application > Service Workers

## 📝 רישיון

MIT License - ראה קובץ LICENSE לפרטים

## 🤝 תרומה

Pull Requests מתקבלים בברכה! לשינויים גדולים, אנא פתח Issue קודם.

## 👨‍💻 מחבר

**יניב מזרחי**

## 🙏 תודות

תודה לכל התורמים והמשתמשים של האפליקציה!

---

**גרסה**: 4.0  
**עדכון אחרון**: ינואר 2024
