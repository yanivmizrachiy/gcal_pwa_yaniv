# 🚀 מדריך התחלה מהירה - 5 דקות

## שלב 1: העלאת הקוד (2 דקות)

1. פתח [Google Apps Script](https://script.google.com)
2. לחץ על "New Project"
3. העתק את כל התוכן מ-`src/Code.gs` ← הדבק ב-Code.gs
4. לחץ על ⚙️ (Project Settings) בצד שמאל
5. סמן ✅ "Show appsscript.json in editor"
6. חזור ל-Editor
7. פתח את `appsscript.json` ← הדבק את התוכן מ-`src/appsscript.json`
8. 💾 שמור (Ctrl+S)

## שלב 2: פרסום (1 דקה)

1. לחץ על "Deploy" ▼ למעלה מימין
2. בחר "New deployment"
3. לחץ על ⚙️ ליד "Select type"
4. בחר "Web app"
5. הגדר:
   - **Description**: "Calendar Smart System"
   - **Execute as**: Me
   - **Who has access**: Anyone
6. לחץ "Deploy"
7. 📋 העתק את ה-URL (שמור אותו!)

## שלב 3: אישור הרשאות (1 דקה)

1. תקבל הודעה "Authorization required"
2. לחץ "Authorize access"
3. בחר את חשבון Google שלך
4. לחץ "Advanced"
5. לחץ "Go to [Your Project Name] (unsafe)" - זה בטוח!
6. לחץ "Allow"
7. ✅ מעולה! המערכת מורשית

## שלב 4: בדיקה ראשונה (1 דקה)

### בדיקה בדפדפן:
פתח את ה-URL שהעתקת וצמד אליו:
```
?mode=selftest
```

דוגמה:
```
https://script.google.com/macros/s/AKfyc.../exec?mode=selftest
```

אמור להופיע:
```json
{
  "ok": true,
  "now": "2024-01-15T10:30:00.000Z",
  "user": "your-email@gmail.com"
}
```

✅ עובד? מעולה! המשך ▼

### בדיקת יצירת אירוע:

פתח Console בדפדפן (F12) והדבק:

```javascript
fetch('YOUR_URL_HERE', {
  method: 'POST',
  body: JSON.stringify({
    command: "צור אירוע בדיקה מחר בשעה 10:00"
  })
})
.then(r => r.json())
.then(data => console.log(data))
```

החלף `YOUR_URL_HERE` ב-URL שלך!

אמור להופיע:
```json
{
  "success": true,
  "message": "האירוע 'בדיקה' נוצר בהצלחה ב-...",
  "eventId": "..."
}
```

🎉 **מזל טוב! המערכת עובדת!**

---

## 📝 כעת תוכל לנסות:

### יצירה:
```javascript
fetch('YOUR_URL', {
  method: 'POST',
  body: JSON.stringify({
    command: "צור אירוע 'פגישה עם דני' מחר בשעה 14:00 צבע כחול"
  })
})
```

### עדכון:
```javascript
fetch('YOUR_URL', {
  method: 'POST',
  body: JSON.stringify({
    command: "עדכן את האירוע 'פגישה עם דני' לשעה 15:00"
  })
})
```

### מחיקה:
```javascript
fetch('YOUR_URL', {
  method: 'POST',
  body: JSON.stringify({
    command: "מחק את האירוע 'בדיקה'"
  })
})
```

---

## 🎨 פקודות מהירות לניסוי

העתק ושלח אחת אחת:

```javascript
// 1. יצירה פשוטה
{"command": "צור אירוע פגישה היום בשעה 16:00"}

// 2. עם צבע
{"command": "צור אירוע פגישה חשובה מחר בשעה 10 צבע אדום"}

// 3. עם תזכורת
{"command": "צור אירוע רופא ביום רביעי בשעה 14:00 תזכורת 30 דקות"}

// 4. כל היום
{"command": "צור אירוע כל היום חופשה ביום שישי"}

// 5. מפורט
{
  "action": "CREATE",
  "title": "פגישת צוות",
  "startTime": "2024-01-20T09:00:00.000Z",
  "color": "כחול",
  "location": "משרד",
  "reminders": [15],
  "guests": ["team@example.com"]
}
```

---

## 🔗 עדכון ה-Frontend (אופציונלי)

אם יש לך את ה-PWA, עדכן את `index.html`:

```html
<iframe src="YOUR_NEW_URL_HERE"></iframe>
```

---

## 📚 מה הלאה?

קרא את התיעוד המלא:

1. **[README.md](README.md)** - סקירה כללית
2. **[API_DOCS.md](API_DOCS.md)** - תיעוד API מפורט
3. **[EXAMPLES.md](EXAMPLES.md)** - דוגמאות קוד
4. **[TEST_SCENARIOS.md](TEST_SCENARIOS.md)** - תרחישי בדיקה

---

## ❓ בעיות?

### "Authorization required" לא נעלם
**פתרון**: נסה מצב incognito או נקה cookies

### "האירוע לא נמצא"
**פתרון**: ודא שיש אירוע עם הכותרת הזו ביומן

### "לא זוהתה פעולה"
**פתרון**: השתמש בפעלים ברורים: צור, עדכן, מחק

### השרת לא עונה
**פתרון**: 
1. ודא שה-URL נכון
2. בדוק שה-deployment פעיל
3. נסה Deploy > Manage deployments > Edit

---

## 💡 טיפים

1. **שמור את ה-URL** במקום בטוח
2. **שמור eventId** של אירועים שאתה יוצר
3. **נסה בשלבים** - קודם פשוט, אחר כך מורכב
4. **בדוק ביומן** אחרי כל פעולה

---

## 🎯 סיימת!

עכשיו אתה יכול לנהל את היומן שלך עם פקודות בעברית! 🎉

**זמן התקנה כולל: ~5 דקות**

---

## 📞 עזרה נוספת

- 📖 [תיעוד מלא](README.md)
- 💬 [דוגמאות](EXAMPLES.md)
- 🐛 [פתרון בעיות](API_DOCS.md#טיפול-בשגיאות)
- 🔧 [GitHub Issues](https://github.com/yanivmizrachiy/gcal_pwa_yaniv/issues)

**בהצלחה! 🚀**
