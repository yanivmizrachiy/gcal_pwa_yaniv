# הנחיות תפעול – יומן חכם (יניב)

## סקירה כללית
אפליקציית PWA לניהול יומן Google עם תמיכה בעברית ומנתח שפה טבעית (NLP). 
האפליקציה מאפשרת יצירה, קריאה, עדכון ומחיקה (CRUD) של אירועים בקלנדר של Google.

## ארכיטקטורה

### רכיבי המערכת
1. **Frontend (PWA)**: `index.html` - ממשק משתמש עברי עם תמיכה RTL
2. **Backend**: Google Apps Script (`src/Code.gs`) - API לניהול יומן
3. **Service Worker**: `sw.js` - מנהל cache ותמיכה offline
4. **הגדרות**: `src/appsscript.json` - הרשאות OAuth ותצורה

### זרימת נתונים
```
משתמש → UI (index.html) → fetch POST → Apps Script API → Google Calendar
                                                    ↓
                                          תשובה JSON עברית
```

## פריסה (Deployment)

### שלב 1: פריסת Apps Script
1. פתח את Google Apps Script Editor
2. העתק את `src/Code.gs` ו-`src/appsscript.json`
3. Deploy → New deployment:
   - Type: Web app
   - Execute as: User accessing
   - Who has access: Anyone
4. העתק את ה-Deployment URL (מסתיים ב-`/exec`)
5. עדכן את `API_URL` ב-`index.html` עם ה-URL החדש

### שלב 2: פריסת PWA
1. העלה את הקבצים (`index.html`, `sw.js`, `manifest.webmanifest`, `icons/`) לשרת web או GitHub Pages
2. ודא HTTPS (חובה ל-Service Worker)
3. בדוק שה-manifest וה-icons נגישים

### שלב 3: אימות הרשאות
- בפעם הראשונה: המשתמש יתבקש לאשר גישה ליומן Google
- הרשאות נדרשות: `https://www.googleapis.com/auth/calendar`

## תחזוקה

### עדכון Apps Script
```bash
# ערוך את src/Code.gs
# העלה לעורך Apps Script
# Deploy → Manage deployments → Edit → Version: New version
```

### עדכון Frontend
```bash
# ערוך את index.html / sw.js
# עדכן את גרסת ה-cache ב-sw.js (C='yaniv-vX')
# העלה לשרת
```

### ניטור ותקלות

#### בדיקת תקינות Backend
```bash
curl "https://script.google.com/.../exec?mode=selftest"
# תשובה: {"ok":true,"now":"...","user":"..."}
```

#### שגיאות נפוצות

1. **"אין חיבור לאינטרנט"**
   - בדוק חיבור רשת
   - Service Worker מציג הודעה זו כאשר fetch נכשל

2. **"פעולה לא מוכרת"**
   - בדוק ש-`action` נשלח נכון ב-POST request
   - Actions זמינים: selfTest, findEvents, createEvent, updateEvent, deleteEvent, getEvent, text, parseOnly

3. **"אירוע לא נמצא"**
   - Event ID לא חוקי או האירוע נמחק
   - Event IDs מתחלפים אחרי עדכוני Calendar

4. **שגיאות הרשאות (403)**
   - משתמש לא אישר גישה ליומן
   - צריך לעשות Re-deploy עם הרשאות מעודכנות

#### Logs
- Apps Script: Executions → View execution log
- Browser: Console (F12) לשגיאות Frontend
- Service Worker: Application → Service Workers → Console

## אבטחה

### OAuth Scopes
- `calendar`: גישה מלאה לקריאה וכתיבה ביומן
- `userinfo.email`: זיהוי משתמש
- `script.external_request`: קריאות HTTP (עתידיות)

### Best Practices
1. **אל תשמור credentials ב-Frontend**
2. **השתמש ב-HTTPS בלבד**
3. **אמת קלט מהמשתמש לפני שליחה ל-API**
4. **מגבל API calls** - כרגע אין הגבלה, שקול rate limiting

## ביצועים

### אופטימיזציות קיימות
- Cache של static assets (HTML, JS, manifest, icons)
- Network-first לקריאות API (תמיד מקבל נתונים עדכניים)
- Compression של תשובות JSON

### המלצות
- שמור אירועים שנטענו ב-localStorage לטעינה מהירה
- הוסף pagination לרשימת אירועים (כרגע מוגבל ל-50)
- שקול Web Push Notifications לתזכורות

## API Reference (מקוצר)

### POST /exec
```json
{
  "action": "createEvent",
  "title": "פגישה חשובה",
  "start": "2024-01-15T10:00:00.000Z",
  "end": "2024-01-15T11:00:00.000Z",
  "description": "...",
  "color": "1"
}
```

### תשובה
```json
{
  "ok": true,
  "message": "אירוע נוצר בהצלחה: פגישה חשובה",
  "event": { "id": "...", "title": "...", ... }
}
```

ראה `docs/NLP_SPEC.md` לתיעוד מלא של NLP API.

## תמיכה

### קבצי עזרה
- `docs/NLP_SPEC.md` - מפרט NLP עברית
- `docs/NLP_V2_DRAFT.md` - תכנון NLP v2
- `README.md` - מידע כללי על הפרויקט

### Troubleshooting Checklist
- [ ] Apps Script deployed לגרסה אחרונה?
- [ ] `API_URL` ב-`index.html` מעודכן?
- [ ] Service Worker רשום בהצלחה? (בדוק ב-DevTools)
- [ ] הרשאות OAuth אושרו?
- [ ] Cache נוקה? (Application → Clear storage)

## שדרוגים עתידיים
1. **NLP v2**: מנתח מתקדם יותר עם תמיכה ביותר צורות
2. **חזרות**: תמיכה באירועים חוזרים (recurring events)
3. **תזכורות**: Web Push Notifications
4. **שיתוף**: אפשרות לשתף אירועים עם משתמשים אחרים
5. **ניתוח חכם**: הצעות לזמנים פנויים

---

**גרסה**: 1.0  
**תאריך עדכון אחרון**: 2024  
**מתחזק**: Yaniv
