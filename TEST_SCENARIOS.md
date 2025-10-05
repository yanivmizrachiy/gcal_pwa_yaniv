# תרחישי בדיקה - מערכת יומן חכם

## סקירה
קובץ זה מכיל תרחישי בדיקה לוודא שכל הפונקציונליות עובדת כראוי.

## בדיקות GET

### 1. בדיקת תקינות המערכת
```bash
# Request
GET YOUR_SCRIPT_URL?mode=selftest

# Expected Response
{
  "ok": true,
  "now": "2024-01-15T10:30:00.000Z",
  "user": "user@example.com"
}
```

### 2. שליפת אירועים
```bash
# Request
GET YOUR_SCRIPT_URL?mode=events

# Expected Response
{
  "count": 5,
  "events": [
    {
      "id": "...",
      "title": "...",
      "start": "...",
      "end": "...",
      "allDay": false,
      "location": "",
      "description": "",
      "color": ""
    }
  ]
}
```

## בדיקות CREATE (יצירה)

### 1. יצירת אירוע פשוט
```json
POST YOUR_SCRIPT_URL
{
  "command": "צור אירוע פגישה עם דני מחר בשעה 10:00"
}

Expected: success: true, message: "האירוע 'פגישה עם דני' נוצר בהצלחה..."
```

### 2. יצירת אירוע עם צבע
```json
POST YOUR_SCRIPT_URL
{
  "command": "צור אירוע 'פגישת צוות' ביום שני בשעה 9:00 צבע כחול"
}

Expected: success: true, הודעה כוללת "צבע כחול"
```

### 3. יצירת אירוע עם תזכורת
```json
POST YOUR_SCRIPT_URL
{
  "command": "צור אירוע 'רופא שיניים' ב-15/01/2024 בשעה 14:00 תזכורת 30 דקות"
}

Expected: success: true, הודעה כוללת "תזכורות: 30 דקות"
```

### 4. יצירת אירוע עם מיקום
```json
POST YOUR_SCRIPT_URL
{
  "command": "צור אירוע 'פגישה חשובה' מחר בשעה 11:00 במשרד הראשי"
}

Expected: success: true, הודעה כוללת "מיקום: משרד הראשי" או "במשרד"
```

### 5. יצירת אירוע עם משתתפים
```json
POST YOUR_SCRIPT_URL
{
  "action": "CREATE",
  "title": "פגישת תכנון",
  "startTime": "2024-01-16T10:00:00.000Z",
  "guests": ["user1@example.com", "user2@example.com"]
}

Expected: success: true, הודעה כוללת "משתתפים: 2"
```

### 6. יצירת אירוע כל היום
```json
POST YOUR_SCRIPT_URL
{
  "command": "צור אירוע כל היום חופשה ביום שישי"
}

Expected: success: true, אירוע כל היום
```

### 7. יצירת אירוע מפורט מאוד
```json
POST YOUR_SCRIPT_URL
{
  "action": "CREATE",
  "title": "פגישת רבעון",
  "startTime": "2024-01-20T09:00:00.000Z",
  "endTime": "2024-01-20T11:00:00.000Z",
  "location": "חדר ישיבות A",
  "description": "סקירה רבעונית",
  "color": "כחול",
  "reminders": [15, 30],
  "guests": ["manager@example.com"]
}

Expected: success: true, כל הפרטים בהודעה
```

## בדיקות UPDATE (עדכון)

### 1. עדכון זמן
```json
POST YOUR_SCRIPT_URL
{
  "command": "עדכן את האירוע 'פגישה עם דני' לשעה 11:00"
}

Expected: success: true, message: "...עודכן בהצלחה. שינויים: זמן"
```

### 2. עדכון צבע
```json
POST YOUR_SCRIPT_URL
{
  "action": "UPDATE",
  "searchTitle": "פגישה עם דני",
  "color": "אדום"
}

Expected: success: true, שינויים כוללים "צבע"
```

### 3. עדכון כותרת
```json
POST YOUR_SCRIPT_URL
{
  "action": "UPDATE",
  "eventId": "EVENT_ID_HERE",
  "title": "פגישה עם דני - מעודכן"
}

Expected: success: true, שינויים כוללים "כותרת"
```

### 4. עדכון מיקום
```json
POST YOUR_SCRIPT_URL
{
  "command": "עדכן את האירוע פגישה מיקום משרד חדש"
}

Expected: success: true, שינויים כוללים "מיקום"
```

## בדיקות DELETE (מחיקה)

### 1. מחיקה לפי כותרת
```json
POST YOUR_SCRIPT_URL
{
  "command": "מחק את האירוע 'פגישה עם דני'"
}

Expected: success: true, message: "האירוע '...' נמחק בהצלחה"
```

### 2. מחיקה לפי מזהה
```json
POST YOUR_SCRIPT_URL
{
  "action": "DELETE",
  "eventId": "EVENT_ID_HERE"
}

Expected: success: true, אירוע נמחק
```

## בדיקות MOVE (העברה)

### 1. העברה ליום אחר
```json
POST YOUR_SCRIPT_URL
{
  "command": "העבר את האירוע 'פגישה עם דני' למחר"
}

Expected: success: true, message: "...הועבר ל-..."
```

### 2. העברה לשעה אחרת
```json
POST YOUR_SCRIPT_URL
{
  "action": "MOVE",
  "eventId": "EVENT_ID_HERE",
  "startTime": "2024-01-16T14:00:00.000Z"
}

Expected: success: true, זמן חדש בהודעה
```

## בדיקות DUPLICATE (שכפול)

### 1. שכפול לשבוע הבא
```json
POST YOUR_SCRIPT_URL
{
  "command": "שכפל את האירוע 'פגישת צוות' לשבוע הבא"
}

Expected: success: true, אירוע חדש נוצר
```

### 2. שכפול עם תאריך ספציפי
```json
POST YOUR_SCRIPT_URL
{
  "action": "DUPLICATE",
  "eventId": "EVENT_ID_HERE",
  "startTime": "2024-01-25T10:00:00.000Z"
}

Expected: success: true, message: "...שוכפל ל-..."
```

## בדיקות CHANGE_COLOR (שינוי צבע)

### 1. שינוי צבע בפקודה
```json
POST YOUR_SCRIPT_URL
{
  "command": "שנה צבע האירוע 'פגישה עם דני' לכחול"
}

Expected: success: true, message: "צבע האירוע...שונה ל-כחול"
```

### 2. שינוי צבע לפי מזהה
```json
POST YOUR_SCRIPT_URL
{
  "action": "CHANGE_COLOR",
  "eventId": "EVENT_ID_HERE",
  "color": "ירוק"
}

Expected: success: true, צבע שונה
```

## בדיקות ADD_REMINDER (הוספת תזכורת)

### 1. הוספת תזכורת אחת
```json
POST YOUR_SCRIPT_URL
{
  "command": "הוסף תזכורת 15 דקות לאירוע 'פגישה עם דני'"
}

Expected: success: true, message: "תזכורות נוספו...15 דקות"
```

### 2. הוספת תזכורות מרובות
```json
POST YOUR_SCRIPT_URL
{
  "action": "ADD_REMINDER",
  "eventId": "EVENT_ID_HERE",
  "reminders": [10, 20, 30]
}

Expected: success: true, כל התזכורות בהודעה
```

## בדיקות ADD_GUEST (הוספת משתתף)

### 1. הוספת משתתף אחד
```json
POST YOUR_SCRIPT_URL
{
  "command": "הוסף משתתף dani@example.com לאירוע פגישה"
}

Expected: success: true, message: "משתתפים נוספו...dani@example.com"
```

### 2. הוספת משתתפים מרובים
```json
POST YOUR_SCRIPT_URL
{
  "action": "ADD_GUEST",
  "eventId": "EVENT_ID_HERE",
  "guests": ["user1@example.com", "user2@example.com"]
}

Expected: success: true, כל המשתתפים בהודעה
```

## בדיקות NLP (זיהוי טבעי)

### 1. זיהוי "מחר"
```json
POST YOUR_SCRIPT_URL
{
  "command": "צור אירוע בדיקה מחר בשעה 10:00"
}

Expected: success: true, תאריך מחר
```

### 2. זיהוי יום בשבוע
```json
POST YOUR_SCRIPT_URL
{
  "command": "צור אירוע בדיקה ביום רביעי בשעה 14:00"
}

Expected: success: true, יום רביעי הקרוב
```

### 3. זיהוי תאריך מספרי
```json
POST YOUR_SCRIPT_URL
{
  "command": "צור אירוע בדיקה ב-15/01/2024 בשעה 16:00"
}

Expected: success: true, תאריך 15/01/2024
```

### 4. זיהוי חודש בעברית
```json
POST YOUR_SCRIPT_URL
{
  "command": "צור אירוע בדיקה ב-20 בינואר בשעה 10:00"
}

Expected: success: true, 20 בינואר
```

## בדיקות שגיאות

### 1. פעולה לא מזוהה
```json
POST YOUR_SCRIPT_URL
{
  "command": "משהו שלא ברור"
}

Expected: success: false, message: "לא זוהתה פעולה..."
```

### 2. אירוע לא נמצא
```json
POST YOUR_SCRIPT_URL
{
  "command": "מחק את האירוע 'לא קיים בכלל'"
}

Expected: success: false, message: "האירוע לא נמצא..."
```

### 3. חסרה כותרת
```json
POST YOUR_SCRIPT_URL
{
  "action": "CREATE",
  "startTime": "2024-01-16T10:00:00.000Z"
}

Expected: success: false, message: "חסרה כותרת לאירוע..."
```

### 4. חסר זמן ליצירה
```json
POST YOUR_SCRIPT_URL
{
  "action": "CREATE",
  "title": "פגישה ללא זמן"
}

Expected: success: false, message: "חסר תאריך או שעה..."
```

### 5. צבע לא תקין
```json
POST YOUR_SCRIPT_URL
{
  "action": "CHANGE_COLOR",
  "eventId": "EVENT_ID_HERE",
  "color": "צבע שלא קיים"
}

Expected: success: false, message: "צבע לא תקין. צבעים זמינים:..."
```

## בדיקות Edge Cases

### 1. אירוע בשעה חצות
```json
POST YOUR_SCRIPT_URL
{
  "action": "CREATE",
  "title": "אירוע חצות",
  "startTime": "2024-01-16T00:00:00.000Z"
}

Expected: success: true
```

### 2. אירוע ארוך מאוד
```json
POST YOUR_SCRIPT_URL
{
  "action": "CREATE",
  "title": "כנס",
  "startTime": "2024-01-16T08:00:00.000Z",
  "endTime": "2024-01-16T18:00:00.000Z"
}

Expected: success: true
```

### 3. כותרת ארוכה
```json
POST YOUR_SCRIPT_URL
{
  "action": "CREATE",
  "title": "פגישה ארוכה מאוד עם הרבה מילים כדי לבדוק שהמערכת מטפלת בכותרות ארוכות",
  "startTime": "2024-01-16T10:00:00.000Z"
}

Expected: success: true
```

### 4. תווים מיוחדים בכותרת
```json
POST YOUR_SCRIPT_URL
{
  "action": "CREATE",
  "title": "פגישה @ משרד #1 - חשוב!",
  "startTime": "2024-01-16T10:00:00.000Z"
}

Expected: success: true
```

## רצף בדיקה מומלץ

1. **הכנה**:
   - בדוק selftest
   - שלוף אירועים קיימים

2. **יצירה**:
   - צור אירוע פשוט
   - צור אירוע עם כל הפרמטרים
   - שמור את ה-eventId

3. **עדכון**:
   - עדכן את האירוע שנוצר
   - בדוק שינויים שונים

4. **פעולות נוספות**:
   - העבר את האירוע
   - שכפל את האירוע
   - שנה צבע
   - הוסף תזכורת
   - הוסף משתתף

5. **מחיקה**:
   - מחק את האירוע שנוצר
   - ודא שנמחק

6. **בדיקות שגיאות**:
   - בדוק טיפול בשגיאות שונות
   - ודא הודעות ברורות

## כלי בדיקה

### cURL
```bash
# GET
curl "YOUR_SCRIPT_URL?mode=selftest"

# POST
curl -X POST "YOUR_SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d '{"command":"צור אירוע בדיקה מחר בשעה 10:00"}'
```

### Postman
1. צור collection חדש
2. הוסף request לכל תרחיש בדיקה
3. הגדר environment variables
4. הרץ את כל ה-collection

### JavaScript (Console)
```javascript
async function testCreate() {
  const response = await fetch('YOUR_SCRIPT_URL', {
    method: 'POST',
    body: JSON.stringify({
      command: "צור אירוע בדיקה מחר בשעה 10:00"
    })
  });
  const result = await response.json();
  console.log(result);
}

testCreate();
```

## דוח בדיקה

| תרחיש | סטטוס | הערות |
|-------|-------|-------|
| GET selftest | ✅/❌ | |
| GET events | ✅/❌ | |
| CREATE פשוט | ✅/❌ | |
| CREATE מלא | ✅/❌ | |
| UPDATE | ✅/❌ | |
| DELETE | ✅/❌ | |
| MOVE | ✅/❌ | |
| DUPLICATE | ✅/❌ | |
| CHANGE_COLOR | ✅/❌ | |
| ADD_REMINDER | ✅/❌ | |
| ADD_GUEST | ✅/❌ | |
| NLP - מחר | ✅/❌ | |
| NLP - יום בשבוע | ✅/❌ | |
| שגיאות | ✅/❌ | |

---

**הערה:** החלף `YOUR_SCRIPT_URL` עם כתובת ה-URL האמיתית של ה-Apps Script שלך.
