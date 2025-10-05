function doGet(e) {
  var mode = (e && e.parameter && e.parameter.mode) || 'info';
  var payload;
  if (mode === 'selftest') {
    payload = { ok: true, now: new Date().toISOString(), user: Session.getActiveUser().getEmail() || null };
  } else if (mode === 'events') {
    var cal = CalendarApp.getDefaultCalendar();
    var now = new Date();
    var until = new Date(now.getTime() + 7*24*60*60*1000);
    var evs = cal.getEvents(now, until).slice(0, 10).map(function(ev){
      return {
        title: ev.getTitle(),
        start: ev.getStartTime(),
        end: ev.getEndTime(),
        allDay: ev.isAllDayEvent()
      };
    });
    payload = { count: evs.length, events: evs };
  } else {
    payload = { info: "Use ?mode=selftest or ?mode=events" };
  }
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result;
    
    switch(action) {
      case 'create':
        result = createEvent(data);
        break;
      case 'update':
        result = updateEvent(data);
        break;
      case 'delete':
        result = deleteEvent(data);
        break;
      case 'move':
        result = moveEvent(data);
        break;
      case 'duplicate':
        result = duplicateEvent(data);
        break;
      case 'color':
        result = setEventColor(data);
        break;
      case 'reminders':
        result = setReminders(data);
        break;
      case 'attendees':
        result = manageAttendees(data);
        break;
      case 'search':
        result = searchEvents(data);
        break;
      case 'recurring':
        result = createRecurringEvent(data);
        break;
      case 'nlp':
        result = parseNaturalLanguage(data);
        break;
      default:
        result = { success: false, message: 'פעולה לא נתמכת: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'שגיאה: ' + err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// יצירת אירוע חדש
function createEvent(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var title = data.title;
  var startTime = new Date(data.startTime);
  var endTime = new Date(data.endTime);
  var options = {};
  
  if (data.description) options.description = data.description;
  if (data.location) options.location = data.location;
  if (data.guests) options.guests = data.guests;
  if (data.sendInvites !== undefined) options.sendInvites = data.sendInvites;
  
  var event = cal.createEvent(title, startTime, endTime, options);
  
  // הוספת תזכורות
  if (data.reminders) {
    event.removeAllReminders();
    data.reminders.forEach(function(minutes) {
      event.addPopupReminder(minutes);
    });
  }
  
  // הגדרת צבע
  if (data.color) {
    event.setColor(data.color);
  }
  
  return {
    success: true,
    message: 'האירוע "' + title + '" נוצר בהצלחה ביום ' + formatDate(startTime),
    eventId: event.getId(),
    event: serializeEvent(event)
  };
}

// עדכון אירוע קיים
function updateEvent(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var eventId = data.eventId;
  var event = cal.getEventById(eventId);
  
  if (!event) {
    return { success: false, message: 'אירוע לא נמצא עם מזהה: ' + eventId };
  }
  
  if (data.title) event.setTitle(data.title);
  if (data.description !== undefined) event.setDescription(data.description);
  if (data.location !== undefined) event.setLocation(data.location);
  if (data.startTime && data.endTime) {
    event.setTime(new Date(data.startTime), new Date(data.endTime));
  }
  
  if (data.reminders) {
    event.removeAllReminders();
    data.reminders.forEach(function(minutes) {
      event.addPopupReminder(minutes);
    });
  }
  
  if (data.color) {
    event.setColor(data.color);
  }
  
  return {
    success: true,
    message: 'האירוע "' + event.getTitle() + '" עודכן בהצלחה',
    event: serializeEvent(event)
  };
}

// מחיקת אירוע
function deleteEvent(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var eventId = data.eventId;
  var event = cal.getEventById(eventId);
  
  if (!event) {
    return { success: false, message: 'אירוע לא נמצא עם מזהה: ' + eventId };
  }
  
  var title = event.getTitle();
  event.deleteEvent();
  
  return {
    success: true,
    message: 'האירוע "' + title + '" נמחק בהצלחה'
  };
}

// העברת אירוע לזמן אחר
function moveEvent(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var eventId = data.eventId;
  var event = cal.getEventById(eventId);
  
  if (!event) {
    return { success: false, message: 'אירוע לא נמצא עם מזהה: ' + eventId };
  }
  
  var newStart = new Date(data.newStartTime);
  var currentDuration = event.getEndTime() - event.getStartTime();
  var newEnd = new Date(newStart.getTime() + currentDuration);
  
  event.setTime(newStart, newEnd);
  
  return {
    success: true,
    message: 'האירוע "' + event.getTitle() + '" הועבר ליום ' + formatDate(newStart),
    event: serializeEvent(event)
  };
}

// שכפול אירוע
function duplicateEvent(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var eventId = data.eventId;
  var event = cal.getEventById(eventId);
  
  if (!event) {
    return { success: false, message: 'אירוע לא נמצא עם מזהה: ' + eventId };
  }
  
  var newStart = data.newStartTime ? new Date(data.newStartTime) : event.getStartTime();
  var duration = event.getEndTime() - event.getStartTime();
  var newEnd = new Date(newStart.getTime() + duration);
  
  var newEvent = cal.createEvent(
    event.getTitle(),
    newStart,
    newEnd,
    {
      description: event.getDescription(),
      location: event.getLocation()
    }
  );
  
  return {
    success: true,
    message: 'האירוע "' + event.getTitle() + '" שוכפל בהצלחה ליום ' + formatDate(newStart),
    eventId: newEvent.getId(),
    event: serializeEvent(newEvent)
  };
}

// שינוי צבע אירוע
function setEventColor(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var eventId = data.eventId;
  var event = cal.getEventById(eventId);
  
  if (!event) {
    return { success: false, message: 'אירוע לא נמצא עם מזהה: ' + eventId };
  }
  
  event.setColor(data.color);
  
  return {
    success: true,
    message: 'צבע האירוע "' + event.getTitle() + '" שונה בהצלחה',
    event: serializeEvent(event)
  };
}

// הגדרת תזכורות
function setReminders(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var eventId = data.eventId;
  var event = cal.getEventById(eventId);
  
  if (!event) {
    return { success: false, message: 'אירוע לא נמצא עם מזהה: ' + eventId };
  }
  
  event.removeAllReminders();
  
  if (data.reminders && data.reminders.length > 0) {
    data.reminders.forEach(function(minutes) {
      event.addPopupReminder(minutes);
    });
  }
  
  return {
    success: true,
    message: 'תזכורות לאירוע "' + event.getTitle() + '" עודכנו בהצלחה',
    event: serializeEvent(event)
  };
}

// ניהול משתתפים
function manageAttendees(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var eventId = data.eventId;
  var event = cal.getEventById(eventId);
  
  if (!event) {
    return { success: false, message: 'אירוע לא נמצא עם מזהה: ' + eventId };
  }
  
  if (data.addGuests) {
    data.addGuests.forEach(function(email) {
      event.addGuest(email);
    });
  }
  
  if (data.removeGuests) {
    data.removeGuests.forEach(function(email) {
      event.removeGuest(email);
    });
  }
  
  return {
    success: true,
    message: 'משתתפים לאירוע "' + event.getTitle() + '" עודכנו בהצלחה',
    event: serializeEvent(event)
  };
}

// חיפוש אירועים
function searchEvents(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var query = data.query;
  var startDate = data.startDate ? new Date(data.startDate) : new Date();
  var endDate = data.endDate ? new Date(data.endDate) : new Date(startDate.getTime() + 30*24*60*60*1000);
  
  var events = cal.getEvents(startDate, endDate);
  var results = [];
  
  events.forEach(function(event) {
    var title = event.getTitle().toLowerCase();
    var desc = event.getDescription().toLowerCase();
    var loc = event.getLocation().toLowerCase();
    var q = query.toLowerCase();
    
    if (title.indexOf(q) >= 0 || desc.indexOf(q) >= 0 || loc.indexOf(q) >= 0) {
      results.push(serializeEvent(event));
    }
  });
  
  return {
    success: true,
    message: 'נמצאו ' + results.length + ' אירועים עבור "' + query + '"',
    count: results.length,
    events: results
  };
}

// יצירת אירוע חוזר
function createRecurringEvent(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var title = data.title;
  var startTime = new Date(data.startTime);
  var endTime = new Date(data.endTime);
  var recurrence = CalendarApp.newRecurrence();
  
  // הגדרת סוג החזרה
  switch(data.recurrenceType) {
    case 'daily':
      recurrence.addDailyRule().interval(data.interval || 1);
      break;
    case 'weekly':
      recurrence.addWeeklyRule().interval(data.interval || 1);
      if (data.weekDays) {
        data.weekDays.forEach(function(day) {
          recurrence.addWeeklyRule().onlyOnWeekday(day);
        });
      }
      break;
    case 'monthly':
      recurrence.addMonthlyRule().interval(data.interval || 1);
      break;
    case 'yearly':
      recurrence.addYearlyRule();
      break;
  }
  
  if (data.until) {
    recurrence.until(new Date(data.until));
  }
  
  var options = {
    description: data.description || '',
    location: data.location || ''
  };
  
  var eventSeries = cal.createEventSeries(title, startTime, endTime, recurrence, options);
  
  return {
    success: true,
    message: 'סדרת אירועים "' + title + '" נוצרה בהצלחה',
    seriesId: eventSeries.getId()
  };
}

// ניתוח שפה טבעית בעברית
function parseNaturalLanguage(data) {
  var text = data.text;
  var result = {};
  
  // זיהוי פעולה
  if (text.match(/צור|תיצור|תוסיף|הוסף|חדש/)) {
    result.action = 'create';
  } else if (text.match(/מחק|תמחק|הסר|תסיר/)) {
    result.action = 'delete';
  } else if (text.match(/עדכן|תעדכן|שנה|תשנה|ערוך/)) {
    result.action = 'update';
  } else if (text.match(/העבר|תעביר|הזז|תזיז/)) {
    result.action = 'move';
  } else if (text.match(/שכפל|תשכפל|העתק/)) {
    result.action = 'duplicate';
  } else if (text.match(/חפש|תחפש|מצא|תמצא|הצג/)) {
    result.action = 'search';
  }
  
  // חילוץ כותרת (בין מרכאות או אחרי "בשם" או "קרא")
  var titleMatch = text.match(/["']([^"']+)["']|בשם\s+(\S+)|קרא\s+(\S+)/);
  if (titleMatch) {
    result.title = titleMatch[1] || titleMatch[2] || titleMatch[3];
  }
  
  // חילוץ תאריך
  var today = new Date();
  if (text.match(/היום/)) {
    result.date = today;
  } else if (text.match(/מחר/)) {
    result.date = new Date(today.getTime() + 24*60*60*1000);
  } else if (text.match(/מחרתיים/)) {
    result.date = new Date(today.getTime() + 2*24*60*60*1000);
  }
  
  // חילוץ שעה
  var timeMatch = text.match(/(\d{1,2}):(\d{2})|בשעה\s+(\d{1,2})/);
  if (timeMatch) {
    var hour = parseInt(timeMatch[1] || timeMatch[3]);
    var minute = parseInt(timeMatch[2] || 0);
    if (result.date) {
      result.date.setHours(hour, minute, 0, 0);
    }
  }
  
  // חילוץ משך זמן
  var durationMatch = text.match(/(\d+)\s+(שעות|שעה|דקות|דקה)/);
  if (durationMatch) {
    var amount = parseInt(durationMatch[1]);
    var unit = durationMatch[2];
    var minutes = 0;
    
    if (unit.match(/שעה|שעות/)) {
      minutes = amount * 60;
    } else {
      minutes = amount;
    }
    
    result.duration = minutes;
  }
  
  // חילוץ מיקום
  var locationMatch = text.match(/ב(משרד|בית|[^\s]+)(?:\s|$)/);
  if (locationMatch) {
    result.location = locationMatch[1];
  }
  
  return {
    success: true,
    message: 'הפקודה פוענחה: ' + result.action,
    parsed: result,
    originalText: text
  };
}

// פונקציות עזר

function serializeEvent(event) {
  return {
    id: event.getId(),
    title: event.getTitle(),
    description: event.getDescription(),
    location: event.getLocation(),
    startTime: event.getStartTime(),
    endTime: event.getEndTime(),
    allDay: event.isAllDayEvent(),
    color: event.getColor(),
    creators: event.getCreators(),
    guestList: event.getGuestList().map(function(g) {
      return {
        email: g.getEmail(),
        name: g.getName(),
        status: g.getGuestStatus()
      };
    })
  };
}

function formatDate(date) {
  var days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  var months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
  
  var dayName = days[date.getDay()];
  var day = date.getDate();
  var month = months[date.getMonth()];
  var year = date.getFullYear();
  var hours = ('0' + date.getHours()).slice(-2);
  var minutes = ('0' + date.getMinutes()).slice(-2);
  
  return dayName + ' ' + day + ' ' + month + ' ' + year + ' בשעה ' + hours + ':' + minutes;
}
