# 📅 יומן חכם של יניב

> Progressive Web App (PWA) לניהול חכם של יומן Google עם תמיכה מלאה בעברית

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](status.json)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Hebrew](https://img.shields.io/badge/language-עברית-orange.svg)](README.md)

## ✨ תכונות עיקריות

### 🎯 ניהול מלא של היומן
- ✅ **CRUD מלא**: יצירה, קריאה, עדכון ומחיקה של אירועים
- 🔄 **העברה ושכפול**: העבר או שכפל אירועים בקלות
- 🎨 **ניהול צבעים**: 11 צבעים שונים לסיווג אירועים
- ⏰ **תזכורות חכמות**: הגדר מספר תזכורות לכל אירוע
- 👥 **ניהול משתתפים**: הוסף או הסר משתתפים בקלות
- 🔍 **חיפוש מתקדם**: חפש אירועים לפי טקסט, תאריך או מיקום
- 🔁 **אירועים חוזרים**: צור סדרות יומיות, שבועיות, חודשיות או שנתיות

### 🗣️ ניתוח שפה טבעית (NLP)
המערכת מבינה פקודות בעברית!

```
"צור פגישה בשם 'דיון טכני' מחר בשעה 14:00 למשך שעתיים במשרד"
```

הפקודות הנתמכות:
- **יצירה**: צור, תיצור, תוסיף, הוסף
- **מחיקה**: מחק, תמחק, הסר
- **עדכון**: עדכן, שנה, ערוך
- **העברה**: העבר, הזז
- **שכפול**: שכפל, העתק
- **חיפוש**: חפש, מצא, הצג

### 📱 PWA - Progressive Web App
- 📲 התקנה למסך הבית (Android & iOS)
- 🔌 עבודה offline עם Service Worker
- ⚡ מהירות וחוויית משתמש מעולה
- 🌐 ממשק מותאם למובייל ודסקטופ

### 🔐 אבטחה והרשאות
- 🔒 OAuth 2.0 של Google
- ✅ גישה מלאה ליומן Google (קריאה וכתיבה)
- 🛡️ כל הפעולות מאובטחות
- 👤 עובד עם החשבון האישי של המשתמש

## 🚀 התחלה מהירה

### התקנה ושימוש

1. **גש לאפליקציה**: פתח את [הקישור לאפליקציה](https://yanivmizrachiy.github.io/gcal_pwa_yaniv/)

2. **התקן PWA**:
   - **Android**: לחץ על "התקן" או "Add to Home Screen"
   - **iOS**: Safari → Share → "Add to Home Screen"

3. **אשר הרשאות**: אשר גישה ליומן Google שלך

4. **התחל להשתמש**: כל הפעולות מתבצעות על היומן האמיתי שלך!

## 📖 תיעוד

### קבצי תיעוד זמינים:
- 📘 [**API_DOCUMENTATION.md**](API_DOCUMENTATION.md) - תיעוד מלא של ה-API
- 📗 [**EXAMPLES.md**](EXAMPLES.md) - 15 דוגמאות מעשיות לשימוש
- 📊 [**status.json**](status.json) - מצב הפרויקט והתקדמות

## 🛠️ מבנה הפרויקט

```
gcal_pwa_yaniv/
├── index.html              # עמוד ראשי של ה-PWA
├── sw.js                   # Service Worker למצב offline
├── manifest.webmanifest    # הגדרות PWA
├── src/
│   ├── Code.gs            # Google Apps Script - לוגיקה עיקרית
│   └── appsscript.json    # הגדרות הרשאות
├── icons/                 # אייקונים ל-PWA
├── API_DOCUMENTATION.md   # תיעוד API
├── EXAMPLES.md           # דוגמאות שימוש
├── status.json           # מצב ותיעוד התקדמות
└── README.md            # המסמך הזה
```

## 🔌 שימוש ב-API

### יצירת אירוע פשוט

```javascript
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'create',
    title: 'פגישה חשובה',
    startTime: '2025-01-20T10:00:00.000Z',
    endTime: '2025-01-20T11:00:00.000Z',
    description: 'דיון על הפרויקט החדש',
    location: 'משרד ראשי'
  })
});

const result = await response.json();
// { success: true, message: "האירוע נוצר בהצלחה...", eventId: "..." }
```

### חיפוש אירועים

```javascript
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'search',
    query: 'פגישה',
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-01-31T23:59:59.000Z'
  })
});

const result = await response.json();
// { success: true, count: 5, events: [...] }
```

### NLP - שפה טבעית

```javascript
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'nlp',
    text: 'צור אירוע בשם "ספורט" מחר בשעה 7:00 למשך שעה'
  })
});

const result = await response.json();
// { success: true, parsed: { action: "create", title: "ספורט", ... } }
```

לדוגמאות נוספות, ראה [EXAMPLES.md](EXAMPLES.md).

## 🎨 צבעים זמינים

| מספר | שם        | צבע                      |
|------|-----------|--------------------------|
| 1    | Lavender  | 💜 סגול בהיר             |
| 2    | Sage      | 💚 ירוק חכלילי           |
| 3    | Grape     | 💜 סגול ענבים            |
| 4    | Flamingo  | 🩷 ורוד                  |
| 5    | Banana    | 💛 צהוב                  |
| 6    | Tangerine | 🧡 כתום                  |
| 7    | Peacock   | 💙 כחול טווס             |
| 8    | Graphite  | 🖤 אפור כהה              |
| 9    | Blueberry | 💙 כחול אוכמניות         |
| 10   | Basil     | 💚 ירוק בזיליקום         |
| 11   | Tomato    | ❤️ אדום עגבניה           |

## 📊 API Endpoints

### GET Endpoints
- `?mode=selftest` - בדיקת תקינות
- `?mode=events` - קבלת אירועים קרובים
- `?mode=info` - מידע כללי

### POST Actions
- `create` - יצירת אירוע חדש
- `update` - עדכון אירוע קיים
- `delete` - מחיקת אירוע
- `move` - העברת אירוע
- `duplicate` - שכפול אירוע
- `color` - שינוי צבע
- `reminders` - ניהול תזכורות
- `attendees` - ניהול משתתפים
- `search` - חיפוש אירועים
- `recurring` - אירוע חוזר
- `nlp` - ניתוח שפה טבעית

## 🔧 פיתוח

### דרישות מקדימות
- חשבון Google
- Google Apps Script
- גישה ל-Google Calendar API

### העלאת שינויים ל-Google Apps Script

1. התחבר ל-[Google Apps Script](https://script.google.com/)
2. צור פרויקט חדש או פתח את הקיים
3. העתק את התוכן מ-`src/Code.gs`
4. העתק את ההגדרות מ-`src/appsscript.json`
5. פרסם כ-Web App
6. עדכן את ה-URL ב-`index.html`

### Workflows

הפרויקט כולל GitHub Actions workflows:
- **pages.yml** - פרסום ל-GitHub Pages
- **gas-deploy.yml** - העלאה אוטומטית ל-Google Apps Script
- **issue-commands.yml** - ניהול באמצעות Issues

## 🌟 תכונות מתקדמות

### אירועים חוזרים
צור אירועים חוזרים עם דפוסים מורכבים:
```javascript
{
  action: 'recurring',
  title: 'Stand-up יומי',
  recurrenceType: 'weekly',
  weekDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
  interval: 1
}
```

### ניהול משתתפים
הוסף או הסר משתתפים בקלות:
```javascript
{
  action: 'attendees',
  eventId: 'abc123',
  addGuests: ['user1@example.com', 'user2@example.com'],
  removeGuests: ['olduser@example.com']
}
```

### תזכורות מרובות
הגדר מספר תזכורות לאירוע:
```javascript
{
  action: 'reminders',
  eventId: 'abc123',
  reminders: [5, 15, 30, 60, 1440] // דקות, שעות, יום
}
```

## ⚠️ הערות חשובות

1. **זהירות**: כל הפעולות מתבצעות על היומן האמיתי שלך!
2. **אין מצב דמו**: המערכת עובדת ישירות עם Google Calendar
3. **הרשאות**: וודא שאישרת את כל ההרשאות הנדרשות
4. **Rate Limits**: Google יש מגבלות - אל תשלח יותר מדי בקשות בבת אחת
5. **אזור זמן**: כל התאריכים ב-Asia/Jerusalem

## 📈 סטטוס הפרויקט

- ✅ **התקדמות**: 100%
- 📦 **גרסה**: 2.0.0
- 📅 **עדכון אחרון**: 19 ינואר 2025
- 🚀 **סטטוס**: Production Ready

לפרטים מלאים, ראה [status.json](status.json).

## 🤝 תרומה

רוצה לתרום לפרויקט? נשמח!

1. Fork את הריפו
2. צור branch חדש (`git checkout -b feature/amazing-feature`)
3. Commit השינויים (`git commit -m 'Add amazing feature'`)
4. Push ל-branch (`git push origin feature/amazing-feature`)
5. פתח Pull Request

## 📝 רישיון

הפרויקט הזה מפורסם תחת רישיון MIT - ראה את קובץ LICENSE לפרטים.

## 💬 תמיכה

יש שאלות או בעיות?
- 🐛 פתח [Issue](https://github.com/yanivmizrachiy/gcal_pwa_yaniv/issues)
- 📧 פנה למפתח
- 📖 קרא את [התיעוד המלא](API_DOCUMENTATION.md)

## 🙏 תודות

- Google Calendar API
- Google Apps Script
- כל התורמים לפרויקט

---

<div align="center">
  <strong>נוצר עם ❤️ ועברית 🇮🇱</strong>
  <br>
  <sub>יומן חכם של יניב - ניהול יומן Google בצורה החכמה ביותר</sub>
</div>
