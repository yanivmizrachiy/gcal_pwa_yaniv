# דוגמאות שימוש - יומן חכם של יניב

## דוגמאות מעשיות לשימוש ב-API

### 1. יצירת פגישה פשוטה

```javascript
// יצירת פגישה למחר בשעה 10:00
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(10, 0, 0, 0);

const endTime = new Date(tomorrow);
endTime.setHours(11, 0, 0, 0);

const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'create',
    title: 'פגישת תכנון שבועי',
    startTime: tomorrow.toISOString(),
    endTime: endTime.toISOString(),
    description: 'תכנון משימות השבוע',
    location: 'חדר ישיבות A'
  })
});

const result = await response.json();
// תוצאה: "האירוע "פגישת תכנון שבועי" נוצר בהצלחה..."
```

---

### 2. יצירת פגישה עם משתתפים ותזכורות

```javascript
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'create',
    title: 'פגישת לקוחות חשובה',
    startTime: '2025-01-25T14:00:00.000Z',
    endTime: '2025-01-25T15:30:00.000Z',
    description: 'סקירת פרויקט Q1',
    location: 'משרד ראשי, קומה 3',
    guests: 'client1@example.com,client2@example.com,manager@example.com',
    sendInvites: true,
    reminders: [10, 30, 60], // תזכורות: 10 דקות, 30 דקות, שעה
    color: '5' // צהוב (בננה)
  })
});
```

---

### 3. חיפוש כל הפגישות עם לקוח מסוים

```javascript
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'search',
    query: 'אקמה',
    startDate: '2025-01-01T00:00:00.000Z',
    endDate: '2025-12-31T23:59:59.000Z'
  })
});

const result = await response.json();
console.log(`נמצאו ${result.count} אירועים`);
result.events.forEach(event => {
  console.log(`- ${event.title} ב-${event.startTime}`);
});
```

---

### 4. העברת פגישה ליום אחר

```javascript
// מציאת האירוע תחילה
const searchResponse = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'search',
    query: 'פגישת תכנון'
  })
});

const searchResult = await searchResponse.json();
const eventId = searchResult.events[0].id;

// העברה ליום אחר
const newDate = new Date('2025-01-26T10:00:00.000Z');

const moveResponse = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'move',
    eventId: eventId,
    newStartTime: newDate.toISOString()
  })
});
```

---

### 5. שכפול אירוע שבועי

```javascript
// שכפול אותה פגישה לשבוע הבא
const duplicateResponse = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'duplicate',
    eventId: 'original_event_id',
    newStartTime: '2025-01-27T10:00:00.000Z'
  })
});
```

---

### 6. יצירת ספורט יומי חוזר

```javascript
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'recurring',
    title: 'ספורט בוקר 🏃',
    startTime: '2025-01-20T07:00:00.000Z',
    endTime: '2025-01-20T08:00:00.000Z',
    recurrenceType: 'daily',
    interval: 1,
    until: '2025-12-31T23:59:59.000Z',
    description: 'ריצה וחיזוק שרירים',
    location: 'פארק הירקון',
    reminders: [15], // תזכורת רבע שעה לפני
    color: '10' // ירוק (בזיליקום)
  })
});
```

---

### 7. יצירת פגישת סטנדאפ שבועית

```javascript
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'recurring',
    title: 'Stand-up Meeting',
    startTime: '2025-01-20T09:00:00.000Z',
    endTime: '2025-01-20T09:15:00.000Z',
    recurrenceType: 'weekly',
    interval: 1,
    weekDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
    until: '2025-06-30T23:59:59.000Z',
    description: 'עדכונים יומיים מהצוות',
    location: 'Zoom',
    guests: 'team@example.com',
    reminders: [5]
  })
});
```

---

### 8. שינוי צבע לפי סוג אירוע

```javascript
// צביעת כל פגישות הלקוחות באדום
const searchResponse = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'search',
    query: 'לקוח'
  })
});

const events = (await searchResponse.json()).events;

// צביעה של כל אחד
for (const event of events) {
  await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'color',
      eventId: event.id,
      color: '11' // אדום (עגבניה)
    })
  });
}
```

---

### 9. הוספת משתתפים לאירוע קיים

```javascript
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'attendees',
    eventId: 'event_id_here',
    addGuests: [
      'newperson@example.com',
      'another@example.com'
    ]
  })
});
```

---

### 10. עדכון תזכורות לכל האירועים החשובים

```javascript
// חיפוש אירועים חשובים
const searchResponse = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'search',
    query: 'חשוב'
  })
});

const events = (await searchResponse.json()).events;

// הוספת תזכורות נוספות
for (const event of events) {
  await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'reminders',
      eventId: event.id,
      reminders: [5, 15, 30, 60, 1440] // 5 דק', 15 דק', 30 דק', שעה, יום
    })
  });
}
```

---

### 11. שימוש ב-NLP - יצירת אירוע בשפה טבעית

```javascript
// פקודה פשוטה בעברית
const nlpResponse = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'nlp',
    text: 'צור פגישה בשם "דיון טכני" מחר בשעה 14:00 למשך שעה וחצי במשרד'
  })
});

const parsed = await nlpResponse.json();

// עכשיו ניתן להשתמש בתוצאה ליצירת האירוע בפועל
if (parsed.success && parsed.parsed.action === 'create') {
  const createResponse = await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'create',
      title: parsed.parsed.title,
      startTime: parsed.parsed.date,
      endTime: new Date(parsed.parsed.date.getTime() + parsed.parsed.duration * 60000),
      location: parsed.parsed.location
    })
  });
}
```

---

### 12. מחיקת כל פגישות הדמו

```javascript
// חיפוש אירועי דמו
const searchResponse = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'search',
    query: 'דמו'
  })
});

const events = (await searchResponse.json()).events;

// מחיקה של כולם
for (const event of events) {
  await fetch(SCRIPT_URL, {
    method: 'POST',
    body: JSON.stringify({
      action: 'delete',
      eventId: event.id
    })
  });
  console.log(`נמחק: ${event.title}`);
}
```

---

### 13. תזמון אוטומטי של הפסקות

```javascript
// יצירת הפסקת קפה חוזרת כל יום
const response = await fetch(SCRIPT_URL, {
  method: 'POST',
  body: JSON.stringify({
    action: 'recurring',
    title: '☕ הפסקת קפה',
    startTime: '2025-01-20T10:30:00.000Z',
    endTime: '2025-01-20T10:45:00.000Z',
    recurrenceType: 'daily',
    interval: 1,
    until: '2025-12-31T23:59:59.000Z',
    color: '6', // כתום (טנג'רינה)
    reminders: [5]
  })
});
```

---

### 14. סנכרון עם מערכת חיצונית

```javascript
// דוגמה לסנכרון עם מערכת CRM
async function syncCRMToCalendar(crmMeetings) {
  for (const meeting of crmMeetings) {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'create',
        title: `[CRM] ${meeting.clientName}`,
        startTime: meeting.scheduledTime,
        endTime: meeting.endTime,
        description: `
          לקוח: ${meeting.clientName}
          סטטוס: ${meeting.status}
          הערות: ${meeting.notes}
        `,
        location: meeting.location,
        guests: meeting.participants.join(','),
        color: '11' // אדום ללקוחות
      })
    });
    
    const result = await response.json();
    if (result.success) {
      // שמירת ה-event ID ב-CRM
      await saveToCRM(meeting.id, result.eventId);
    }
  }
}
```

---

### 15. דוח אירועים לשבוע הקרוב

```javascript
async function getWeeklyReport() {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);
  
  const response = await fetch(SCRIPT_URL, {
    method: 'GET',
    url: SCRIPT_URL + '?mode=events'
  });
  
  const result = await response.json();
  
  console.log(`=== דוח שבועי ===`);
  console.log(`סה"כ ${result.count} אירועים השבוע הקרוב:\n`);
  
  result.events.forEach((event, i) => {
    const date = new Date(event.start);
    console.log(`${i+1}. ${event.title}`);
    console.log(`   תאריך: ${date.toLocaleDateString('he-IL')}`);
    console.log(`   שעה: ${date.toLocaleTimeString('he-IL')}\n`);
  });
}
```

---

## טיפים לשימוש

1. **שמירת Event IDs**: שמור את ה-event ID שמוחזר לכל אירוע לצורך עדכונים עתיديים
2. **טיפול בשגיאות**: תמיד בדוק את `result.success` לפני שימוש בתוצאה
3. **Rate Limiting**: Google Apps Script יש מגבלות - אל תשלח יותר מדי בקשות בבת אחת
4. **אזור זמן**: השתמש ב-ISO 8601 עם Z בסוף לזמן UTC
5. **צבעים**: השתמש בצבעים עקביים לסוגי אירועים שונים
6. **תזכורות**: הוסף תזכורות מרובות לאירועים חשובים
7. **NLP**: השתמש ב-NLP לפקודות מהירות, אבל לבקשות מורכבות השתמש ב-API הישיר

---

**גרסה:** 2.0.0  
**עדכון אחרון:** 19 ינואר 2025
