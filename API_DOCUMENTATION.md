# תיעוד API - יומן חכם של יניב

## סקירה כללית

המערכת מספקת API מלא לניהול אירועים ביומן Google האמיתי של יניב.
כל הפעולות מבוצעות על היומן האמיתי - אין מצב דמו.

## אנדפוינטים

### GET - קבלת מידע

#### מצבי הפעלה (modes):

1. **selftest** - בדיקת תקינות
   ```
   GET ?mode=selftest
   ```
   תשובה:
   ```json
   {
     "ok": true,
     "now": "2025-01-19T10:30:00.000Z",
     "user": "user@gmail.com"
   }
   ```

2. **events** - קבלת אירועים קרובים
   ```
   GET ?mode=events
   ```
   תשובה:
   ```json
   {
     "count": 5,
     "events": [
       {
         "title": "פגישה עם לקוח",
         "start": "2025-01-20T10:00:00.000Z",
         "end": "2025-01-20T11:00:00.000Z",
         "allDay": false
       }
     ]
   }
   ```

### POST - ביצוע פעולות

כל הבקשות POST שולחות JSON בגוף הבקשה עם שדה `action`.

---

## 1. יצירת אירוע חדש (CREATE)

### בקשה:
```json
{
  "action": "create",
  "title": "פגישה חשובה",
  "startTime": "2025-01-20T10:00:00.000Z",
  "endTime": "2025-01-20T11:00:00.000Z",
  "description": "פגישה עם הלקוח החשוב",
  "location": "משרד ראשי",
  "guests": "email1@example.com,email2@example.com",
  "sendInvites": true,
  "reminders": [10, 30],
  "color": "5"
}
```

### תשובה:
```json
{
  "success": true,
  "message": "האירוע \"פגישה חשובה\" נוצר בהצלחה ביום ראשון 20 ינואר 2025 בשעה 10:00",
  "eventId": "abc123...",
  "event": {
    "id": "abc123...",
    "title": "פגישה חשובה",
    "startTime": "2025-01-20T10:00:00.000Z",
    "endTime": "2025-01-20T11:00:00.000Z",
    ...
  }
}
```

### שדות אופציונליים:
- `description` - תיאור האירוע
- `location` - מיקום
- `guests` - רשימת אימיילים מופרדים בפסיק
- `sendInvites` - האם לשלוח הזמנות (boolean)
- `reminders` - מערך של דקות לפני האירוע [10, 30, 60]
- `color` - מספר צבע (1-11)

---

## 2. עדכון אירוע (UPDATE)

### בקשה:
```json
{
  "action": "update",
  "eventId": "abc123...",
  "title": "פגישה מעודכנת",
  "description": "תיאור חדש",
  "location": "מיקום חדש",
  "startTime": "2025-01-20T11:00:00.000Z",
  "endTime": "2025-01-20T12:00:00.000Z",
  "reminders": [15],
  "color": "7"
}
```

### תשובה:
```json
{
  "success": true,
  "message": "האירוע \"פגישה מעודכנת\" עודכן בהצלחה",
  "event": { ... }
}
```

**הערה:** כל השדות אופציונליים - רק השדות שנשלחים מתעדכנים.

---

## 3. מחיקת אירוע (DELETE)

### בקשה:
```json
{
  "action": "delete",
  "eventId": "abc123..."
}
```

### תשובה:
```json
{
  "success": true,
  "message": "האירוע \"פגישה חשובה\" נמחק בהצלחה"
}
```

---

## 4. העברת אירוע (MOVE)

### בקשה:
```json
{
  "action": "move",
  "eventId": "abc123...",
  "newStartTime": "2025-01-21T10:00:00.000Z"
}
```

### תשובה:
```json
{
  "success": true,
  "message": "האירוע \"פגישה חשובה\" הועבר ליום שני 21 ינואר 2025 בשעה 10:00",
  "event": { ... }
}
```

**הערה:** משך האירוע נשמר - רק התאריך והשעה משתנים.

---

## 5. שכפול אירוע (DUPLICATE)

### בקשה:
```json
{
  "action": "duplicate",
  "eventId": "abc123...",
  "newStartTime": "2025-01-22T10:00:00.000Z"
}
```

### תשובה:
```json
{
  "success": true,
  "message": "האירוע \"פגישה חשובה\" שוכפל בהצלחה ליום שלישי 22 ינואר 2025 בשעה 10:00",
  "eventId": "def456...",
  "event": { ... }
}
```

**הערה:** אם לא מצוין `newStartTime`, האירוע משוכפל לאותו הזמן.

---

## 6. שינוי צבע אירוע (COLOR)

### בקשה:
```json
{
  "action": "color",
  "eventId": "abc123...",
  "color": "8"
}
```

### צבעים זמינים:
- 1: לבנדר (Lavender)
- 2: חכלילי (Sage)
- 3: ענבים (Grape)
- 4: לבה (Flamingo)
- 5: בננה (Banana)
- 6: טנג'רינה (Tangerine)
- 7: טווס (Peacock)
- 8: גרפיט (Graphite)
- 9: אוכמנית (Blueberry)
- 10: בזיליקום (Basil)
- 11: עגבניה (Tomato)

### תשובה:
```json
{
  "success": true,
  "message": "צבע האירוע \"פגישה חשובה\" שונה בהצלחה",
  "event": { ... }
}
```

---

## 7. ניהול תזכורות (REMINDERS)

### בקשה:
```json
{
  "action": "reminders",
  "eventId": "abc123...",
  "reminders": [5, 15, 60]
}
```

### תשובה:
```json
{
  "success": true,
  "message": "תזכורות לאירוע \"פגישה חשובה\" עודכנו בהצלחה",
  "event": { ... }
}
```

**הערה:** 
- מספרים בדקות לפני האירוע
- שליחת מערך רק מחליפה את כל התזכורות הקיימות
- מערך ריק מוחק את כל התזכורות

---

## 8. ניהול משתתפים (ATTENDEES)

### בקשה:
```json
{
  "action": "attendees",
  "eventId": "abc123...",
  "addGuests": ["new1@example.com", "new2@example.com"],
  "removeGuests": ["old@example.com"]
}
```

### תשובה:
```json
{
  "success": true,
  "message": "משתתפים לאירוע \"פגישה חשובה\" עודכנו בהצלחה",
  "event": { ... }
}
```

---

## 9. חיפוש אירועים (SEARCH)

### בקשה:
```json
{
  "action": "search",
  "query": "פגישה",
  "startDate": "2025-01-01T00:00:00.000Z",
  "endDate": "2025-01-31T23:59:59.000Z"
}
```

### תשובה:
```json
{
  "success": true,
  "message": "נמצאו 3 אירועים עבור \"פגישה\"",
  "count": 3,
  "events": [
    { ... },
    { ... },
    { ... }
  ]
}
```

**הערה:**
- חיפוש בכותרת, תיאור ומיקום
- אם לא מצוין טווח תאריכים, מחפש 30 ימים קדימה
- החיפוש case-insensitive

---

## 10. יצירת אירוע חוזר (RECURRING)

### בקשה - אירוע יומי:
```json
{
  "action": "recurring",
  "title": "ספורט בוקר",
  "startTime": "2025-01-20T07:00:00.000Z",
  "endTime": "2025-01-20T08:00:00.000Z",
  "recurrenceType": "daily",
  "interval": 1,
  "until": "2025-12-31T23:59:59.000Z",
  "description": "ריצה בבוקר",
  "location": "פארק"
}
```

### בקשה - אירוע שבועי:
```json
{
  "action": "recurring",
  "title": "פגישת צוות",
  "startTime": "2025-01-20T10:00:00.000Z",
  "endTime": "2025-01-20T11:00:00.000Z",
  "recurrenceType": "weekly",
  "interval": 1,
  "weekDays": ["MONDAY", "WEDNESDAY"],
  "until": "2025-12-31T23:59:59.000Z"
}
```

### סוגי חזרה (recurrenceType):
- `daily` - יומי
- `weekly` - שבועי
- `monthly` - חודשי
- `yearly` - שנתי

### ימים בשבוע (weekDays):
`MONDAY`, `TUESDAY`, `WEDNESDAY`, `THURSDAY`, `FRIDAY`, `SATURDAY`, `SUNDAY`

### תשובה:
```json
{
  "success": true,
  "message": "סדרת אירועים \"ספורט בוקר\" נוצרה בהצלחה",
  "seriesId": "xyz789..."
}
```

---

## 11. ניתוח שפה טבעית (NLP)

### בקשה:
```json
{
  "action": "nlp",
  "text": "צור אירוע בשם 'פגישה עם דני' מחר בשעה 15:00 למשך שעתיים במשרד"
}
```

### תשובה:
```json
{
  "success": true,
  "message": "הפקודה פוענחה: create",
  "parsed": {
    "action": "create",
    "title": "פגישה עם דני",
    "date": "2025-01-21T15:00:00.000Z",
    "duration": 120,
    "location": "משרד"
  },
  "originalText": "צור אירוע בשם 'פגישה עם דני' מחר בשעה 15:00 למשך שעתיים במשרד"
}
```

### פעולות נתמכות בעברית:
- **יצירה**: צור, תיצור, תוסיף, הוסף, חדש
- **מחיקה**: מחק, תמחק, הסר, תסיר
- **עדכון**: עדכן, תעדכן, שנה, תשנה, ערוך
- **העברה**: העבר, תעביר, הזז, תזיז
- **שכפול**: שכפל, תשכפל, העתק
- **חיפוש**: חפש, תחפש, מצא, תמצא, הצג

### זיהוי תאריכים:
- **היום** - היום
- **מחר** - מחר
- **מחרתיים** - מחרתיים

### זיהוי שעות:
- `10:00` או `בשעה 10`
- פורמט 24 שעות

### זיהוי משך זמן:
- `2 שעות`, `שעה אחת`
- `30 דקות`, `דקה`

### זיהוי מיקום:
- `במשרד`, `בבית`, או כל מילה אחרי "ב"

---

## טיפול בשגיאות

### שגיאה כללית:
```json
{
  "success": false,
  "message": "שגיאה: אירוע לא נמצא עם מזהה: abc123"
}
```

### פעולה לא נתמכת:
```json
{
  "success": false,
  "message": "פעולה לא נתמכת: unknownAction"
}
```

---

## דוגמאות שימוש

### JavaScript/Fetch:
```javascript
const response = await fetch('YOUR_SCRIPT_URL', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    action: 'create',
    title: 'פגישה חשובה',
    startTime: '2025-01-20T10:00:00.000Z',
    endTime: '2025-01-20T11:00:00.000Z'
  })
});

const result = await response.json();
console.log(result.message); // "האירוע "פגישה חשובה" נוצר בהצלחה..."
```

### cURL:
```bash
curl -X POST YOUR_SCRIPT_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "create",
    "title": "פגישה חשובה",
    "startTime": "2025-01-20T10:00:00.000Z",
    "endTime": "2025-01-20T11:00:00.000Z"
  }'
```

---

## הערות חשובות

1. **כל הפעולות על היומן האמיתי** - אין מצב דמו!
2. **הרשאות** - המשתמש חייב לאשר גישה ליומן Google
3. **אזור זמן** - המערכת משתמשת ב-Asia/Jerusalem
4. **פורמט תאריכים** - ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
5. **קידוד** - כל התגובות בעברית UTF-8
6. **אבטחה** - כל פעולה דורשת אימות Google OAuth

---

## תמיכה

לשאלות או בעיות, צור issue בריפו או פנה למפתח.

**גרסה:** 2.0.0  
**עדכון אחרון:** 19 ינואר 2025
