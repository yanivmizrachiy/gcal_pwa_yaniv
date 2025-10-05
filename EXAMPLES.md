# דוגמאות שימוש - מערכת יומן חכם

## דוגמאות פקודות בעברית טבעית

### יצירת אירועים

#### פקודות פשוטות:
```
"צור אירוע פגישה עם דני מחר בשעה 10"
"הוסף פגישה ביום רביעי בשעה 14:00"
"צור אירוע כל היום טיול ביום שישי"
"הוסף תזכורת רופא שיניים ב-15/01/2024 בשעה 16:30"
```

#### פקודות מורכבות:
```
"צור אירוע 'פגישת צוות שבועית' ביום שני בשעה 9:00 צבע כחול במיקום חדר ישיבות תזכורת 15 דקות"
"הוסף אירוע 'מפגש עם לקוח חשוב' מחר בשעה 11:00 צבע אדום תזכורת חצי שעה"
"צור פגישה 'סיעור מוחות' ביום חמישי בשעה 15:00 במשרד הראשי עם תזכורת 30 דקות"
```

### עדכון אירועים

```
"עדכן את האירוע 'פגישה עם דני' לשעה 11:00"
"שנה את האירוע פגישה למחרתיים"
"ערוך את האירוע פגישת צוות צבע ירוק"
"שנה את המיקום של האירוע 'פגישה עם לקוח' למשרד"
```

### מחיקת אירועים

```
"מחק את האירוע 'פגישה עם דני'"
"הסר את הפגישה מחר בשעה 10"
"בטל את האירוע רופא שיניים"
```

### העברת אירועים

```
"העבר את האירוע 'פגישה עם דני' למחר"
"דחה את הפגישה ליום חמישי בשעה 14:00"
"הזז את האירוע לשבוע הבא"
```

### שכפול אירועים

```
"שכפל את האירוע 'פגישת צוות' לשבוע הבא"
"העתק את הפגישה למחרתיים"
"צור עותק של האירוע ביום ראשון"
```

## דוגמאות קוד JavaScript

### שימוש מה-Frontend

```javascript
// יצירת אירוע חדש
async function createEvent() {
  const response = await fetch('YOUR_SCRIPT_URL', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      command: "צור אירוע פגישה עם דני מחר בשעה 10:00 צבע כחול"
    })
  });
  
  const result = await response.json();
  console.log(result.message);
  // "האירוע 'פגישה עם דני' נוצר בהצלחה ב-שני 16/1/2024 בשעה 10:00, צבע כחול"
}

// עדכון אירוע קיים
async function updateEvent(eventId) {
  const response = await fetch('YOUR_SCRIPT_URL', {
    method: 'POST',
    body: JSON.stringify({
      action: "UPDATE",
      eventId: eventId,
      startTime: "2024-01-16T14:00:00.000Z",
      color: "אדום"
    })
  });
  
  const result = await response.json();
  if (result.success) {
    alert(result.message);
  }
}

// מחיקת אירוע
async function deleteEvent(eventId) {
  const response = await fetch('YOUR_SCRIPT_URL', {
    method: 'POST',
    body: JSON.stringify({
      command: "מחק את האירוע",
      eventId: eventId
    })
  });
  
  const result = await response.json();
  console.log(result);
}

// שליפת אירועים
async function getEvents() {
  const response = await fetch('YOUR_SCRIPT_URL?mode=events');
  const data = await response.json();
  
  data.events.forEach(event => {
    console.log(`${event.title} - ${event.start}`);
  });
}
```

### דוגמה מלאה: יצירת פגישה מפורטת

```javascript
async function createDetailedMeeting() {
  const meetingData = {
    title: "פגישת תכנון רבעונית",
    startTime: "2024-01-20T09:00:00.000Z",
    endTime: "2024-01-20T11:00:00.000Z",
    location: "משרד ראשי - חדר ישיבות A",
    description: "סקירה והצבת יעדים לרבעון הקרוב",
    color: "כחול",
    reminders: [15, 30, 60],
    guests: [
      "manager@company.com",
      "team.lead@company.com",
      "developer@company.com"
    ]
  };
  
  const response = await fetch('YOUR_SCRIPT_URL', {
    method: 'POST',
    body: JSON.stringify({
      action: "CREATE",
      ...meetingData
    })
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log("✅ " + result.message);
    console.log("🆔 Event ID:", result.eventId);
    return result.eventId;
  } else {
    console.error("❌ " + result.message);
  }
}
```

### דוגמה: עדכון מספר פרמטרים בו-זמנית

```javascript
async function updateMultipleParams(eventId) {
  const updates = {
    action: "UPDATE",
    eventId: eventId,
    title: "פגישת תכנון - מעודכן",
    startTime: "2024-01-20T10:00:00.000Z",
    color: "אדום",
    location: "משרד חדש",
    reminders: [10, 20]
  };
  
  const response = await fetch('YOUR_SCRIPT_URL', {
    method: 'POST',
    body: JSON.stringify(updates)
  });
  
  return await response.json();
}
```

### דוגמה: חיפוש ועדכון אירוע לפי כותרת

```javascript
async function findAndUpdate() {
  const response = await fetch('YOUR_SCRIPT_URL', {
    method: 'POST',
    body: JSON.stringify({
      command: "עדכן את האירוע 'פגישה עם דני' לשעה 15:00 צבע ירוק"
    })
  });
  
  const result = await response.json();
  return result;
}
```

## דוגמאות שימוש מ-HTML Form

```html
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>יצירת אירוע ביומן</title>
  <style>
    body { font-family: Arial; padding: 20px; }
    .form-group { margin-bottom: 15px; }
    label { display: block; margin-bottom: 5px; font-weight: bold; }
    input, select, textarea { width: 100%; padding: 8px; }
    button { padding: 10px 20px; background: #4285f4; color: white; border: none; cursor: pointer; }
  </style>
</head>
<body>
  <h1>יצירת אירוע חדש ביומן</h1>
  
  <form id="eventForm">
    <div class="form-group">
      <label>כותרת:</label>
      <input type="text" id="title" required>
    </div>
    
    <div class="form-group">
      <label>תאריך:</label>
      <input type="date" id="date" required>
    </div>
    
    <div class="form-group">
      <label>שעה:</label>
      <input type="time" id="time" value="09:00">
    </div>
    
    <div class="form-group">
      <label>צבע:</label>
      <select id="color">
        <option value="">ללא</option>
        <option value="כחול">כחול</option>
        <option value="ירוק">ירוק</option>
        <option value="אדום">אדום</option>
        <option value="כתום">כתום</option>
        <option value="סגול">סגול</option>
      </select>
    </div>
    
    <div class="form-group">
      <label>מיקום:</label>
      <input type="text" id="location">
    </div>
    
    <div class="form-group">
      <label>תזכורת (דקות):</label>
      <input type="number" id="reminder" value="15">
    </div>
    
    <button type="submit">צור אירוע</button>
  </form>
  
  <div id="result" style="margin-top: 20px; padding: 10px; display: none;"></div>
  
  <script>
    const SCRIPT_URL = 'YOUR_SCRIPT_URL_HERE';
    
    document.getElementById('eventForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('title').value;
      const date = document.getElementById('date').value;
      const time = document.getElementById('time').value;
      const color = document.getElementById('color').value;
      const location = document.getElementById('location').value;
      const reminder = document.getElementById('reminder').value;
      
      const startTime = new Date(`${date}T${time}:00`).toISOString();
      
      const data = {
        action: "CREATE",
        title: title,
        startTime: startTime,
        color: color,
        location: location,
        reminders: reminder ? [parseInt(reminder)] : []
      };
      
      try {
        const response = await fetch(SCRIPT_URL, {
          method: 'POST',
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        const resultDiv = document.getElementById('result');
        resultDiv.style.display = 'block';
        
        if (result.success) {
          resultDiv.style.background = '#d4edda';
          resultDiv.style.color = '#155724';
          resultDiv.innerHTML = '✅ ' + result.message;
          document.getElementById('eventForm').reset();
        } else {
          resultDiv.style.background = '#f8d7da';
          resultDiv.style.color = '#721c24';
          resultDiv.innerHTML = '❌ ' + result.message;
        }
      } catch (error) {
        console.error('Error:', error);
        alert('שגיאה בשליחת הבקשה');
      }
    });
  </script>
</body>
</html>
```

## דוגמאות לשימוש מתקדם

### 1. יצירת סדרת פגישות

```javascript
async function createMeetingSeries() {
  const dates = [
    "2024-01-15T10:00:00.000Z",
    "2024-01-22T10:00:00.000Z",
    "2024-01-29T10:00:00.000Z",
    "2024-02-05T10:00:00.000Z"
  ];
  
  const results = [];
  
  for (const date of dates) {
    const result = await fetch('YOUR_SCRIPT_URL', {
      method: 'POST',
      body: JSON.stringify({
        action: "CREATE",
        title: "פגישת צוות שבועית",
        startTime: date,
        color: "כחול",
        reminders: [15]
      })
    });
    
    results.push(await result.json());
  }
  
  return results;
}
```

### 2. העתקת כל אירועי יום למקום אחר

```javascript
async function moveAllDayEvents(sourceDate, targetDate) {
  // קבל את כל האירועים ביום מסוים
  const eventsResponse = await fetch('YOUR_SCRIPT_URL?mode=events');
  const eventsData = await eventsResponse.json();
  
  // סנן אירועים ליום הספציפי
  const dayEvents = eventsData.events.filter(e => {
    const eventDate = new Date(e.start).toDateString();
    return eventDate === new Date(sourceDate).toDateString();
  });
  
  // שכפל כל אירוע ליום החדש
  const results = [];
  for (const event of dayEvents) {
    const timeDiff = new Date(targetDate) - new Date(sourceDate);
    const newStart = new Date(new Date(event.start).getTime() + timeDiff);
    
    const result = await fetch('YOUR_SCRIPT_URL', {
      method: 'POST',
      body: JSON.stringify({
        action: "DUPLICATE",
        eventId: event.id,
        startTime: newStart.toISOString()
      })
    });
    
    results.push(await result.json());
  }
  
  return results;
}
```

### 3. עדכון בלתי תלוי - Queue System

```javascript
class CalendarQueue {
  constructor(scriptUrl) {
    this.scriptUrl = scriptUrl;
    this.queue = [];
    this.processing = false;
  }
  
  async add(command) {
    this.queue.push(command);
    if (!this.processing) {
      await this.process();
    }
  }
  
  async process() {
    this.processing = true;
    
    while (this.queue.length > 0) {
      const command = this.queue.shift();
      
      try {
        const response = await fetch(this.scriptUrl, {
          method: 'POST',
          body: JSON.stringify(command)
        });
        
        const result = await response.json();
        console.log(result.message);
        
        // המתן קצת בין בקשות
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error('Error processing command:', error);
      }
    }
    
    this.processing = false;
  }
}

// שימוש:
const queue = new CalendarQueue('YOUR_SCRIPT_URL');
queue.add({ command: "צור אירוע פגישה 1" });
queue.add({ command: "צור אירוע פגישה 2" });
queue.add({ command: "צור אירוע פגישה 3" });
```

## טיפים לשימוש

1. **שמור eventId**: תמיד שמור את ה-eventId שמוחזר - זה מקל על עדכונים עתידיים
2. **נסח בעברית ברורה**: ככל שהפקודה ברורה יותר, כך התוצאה תהיה טובה יותר
3. **השתמש בפרמטרים מפורשים**: למצבים מורכבים, העבר את הפרמטרים כ-JSON
4. **טיפול בשגיאות**: תמיד בדוק את `result.success` לפני שימוש בתוצאה
5. **זמנים ב-ISO**: השתמש בפורמט ISO 8601 לזמנים מדויקים

## פתרון בעיות נפוצות

### "האירוע לא נמצא"
- וודא שהכותרת מדויקת
- נסה לחפש עם eventId במקום כותרת
- בדוק שהאירוע קיים בטווח הזמן (30 יום אחורה, 90 יום קדימה)

### "חסרה כותרת לאירוע"
- ודא שהכותרת מוקפת במרכאות בפקודה
- או העבר את הכותרת כפרמטר `title` נפרד

### "לא זוהתה פעולה"
- השתמש בפעלים ברורים: צור, עדכן, מחק, העבר, שכפל
- או העבר `action` מפורש בבקשה
