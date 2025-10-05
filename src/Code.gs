/**
 * מערכת יומן חכם עם תמיכה מלאה ב-CRUD ו-NLP בעברית
 * Google Calendar Smart System with Full CRUD and Hebrew NLP
 */

// צבעי אירועים זמינים ב-Google Calendar
var COLORS = {
  'כחול': CalendarApp.EventColor.BLUE,
  'ירוק': CalendarApp.EventColor.GREEN,
  'אדום': CalendarApp.EventColor.RED,
  'כתום': CalendarApp.EventColor.ORANGE,
  'סגול': CalendarApp.EventColor.PALE_BLUE,
  'צהוב': CalendarApp.EventColor.YELLOW,
  'אפור': CalendarApp.EventColor.GRAY,
  'ורוד': CalendarApp.EventColor.PALE_RED,
  'טורקיז': CalendarApp.EventColor.CYAN,
  'ירוק בהיר': CalendarApp.EventColor.PALE_GREEN
};

// ימי השבוע בעברית
var DAYS_OF_WEEK = {
  'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3, 'חמישי': 4, 'שישי': 5, 'שבת': 6,
  'יום ראשון': 0, 'יום שני': 1, 'יום שלישי': 2, 'יום רביעי': 3, 'יום חמישי': 4, 'יום שישי': 5, 'יום שבת': 6
};

// חודשים בעברית
var MONTHS = {
  'ינואר': 0, 'פברואר': 1, 'מרץ': 2, 'מרס': 2, 'אפריל': 3, 'מאי': 4, 'יוני': 5, 
  'יולי': 6, 'אוגוסט': 7, 'ספטמבר': 8, 'אוקטובר': 9, 'נובמבר': 10, 'דצמבר': 11
};

/**
 * טיפול בבקשות GET - שליפת מידע
 */
function doGet(e) {
  var mode = (e && e.parameter && e.parameter.mode) || 'info';
  var payload;
  
  try {
    if (mode === 'selftest') {
      payload = { 
        ok: true, 
        now: new Date().toISOString(), 
        user: Session.getActiveUser().getEmail() || null 
      };
    } else if (mode === 'events') {
      var cal = CalendarApp.getDefaultCalendar();
      var now = new Date();
      var until = new Date(now.getTime() + 7*24*60*60*1000);
      var evs = cal.getEvents(now, until).slice(0, 10).map(function(ev){
        return {
          id: ev.getId(),
          title: ev.getTitle(),
          start: ev.getStartTime(),
          end: ev.getEndTime(),
          allDay: ev.isAllDayEvent(),
          location: ev.getLocation() || '',
          description: ev.getDescription() || '',
          color: ev.getColor() || ''
        };
      });
      payload = { count: evs.length, events: evs };
    } else {
      payload = { info: "Use ?mode=selftest or ?mode=events" };
    }
  } catch (error) {
    payload = { error: 'שגיאה: ' + error.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * טיפול בבקשות POST - עריכת אירועים
 */
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var command = data.command || '';
    var result = parseAndExecuteCommand(command, data);
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      message: 'שגיאה בעיבוד הבקשה: ' + error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * ניתוח וביצוע פקודה
 */
function parseAndExecuteCommand(command, data) {
  var cal = CalendarApp.getDefaultCalendar();
  
  // זיהוי סוג הפעולה
  var action = identifyAction(command, data);
  
  switch(action) {
    case 'CREATE':
      return createEvent(cal, command, data);
    case 'UPDATE':
      return updateEvent(cal, command, data);
    case 'DELETE':
      return deleteEvent(cal, command, data);
    case 'MOVE':
      return moveEvent(cal, command, data);
    case 'DUPLICATE':
      return duplicateEvent(cal, command, data);
    case 'CHANGE_COLOR':
      return changeEventColor(cal, command, data);
    case 'ADD_REMINDER':
      return addReminder(cal, command, data);
    case 'ADD_GUEST':
      return addGuest(cal, command, data);
    default:
      return { success: false, message: 'לא זוהתה פעולה. אנא נסה שוב עם פקודה ברורה יותר.' };
  }
}

/**
 * זיהוי סוג הפעולה מהטקסט
 */
function identifyAction(command, data) {
  if (data.action) return data.action.toUpperCase();
  
  var cmd = command.toLowerCase();
  
  // יצירה
  if (cmd.match(/צור|יצירת|הוסף|הוספת|אירוע חדש|פגישה חדשה|תזכורת חדשה/)) {
    return 'CREATE';
  }
  
  // עדכון
  if (cmd.match(/עדכן|עדכון|שנה|שינוי|ערוך|עריכה/)) {
    return 'UPDATE';
  }
  
  // מחיקה
  if (cmd.match(/מחק|מחיקה|מחיקת|הסר|הסרת|בטל|ביטול/)) {
    return 'DELETE';
  }
  
  // העברה
  if (cmd.match(/העבר|העברת|הזז|הזזת|דחה|דחיית/)) {
    return 'MOVE';
  }
  
  // שכפול
  if (cmd.match(/שכפל|שכפול|העתק|העתקה|דופליקציה/)) {
    return 'DUPLICATE';
  }
  
  // שינוי צבע
  if (cmd.match(/צבע|שנה צבע|צבוע/) && !cmd.match(/צור|הוסף/)) {
    return 'CHANGE_COLOR';
  }
  
  // תזכורת
  if (cmd.match(/תזכורת|תזכיר/) && !cmd.match(/צור|הוסף|חדש/)) {
    return 'ADD_REMINDER';
  }
  
  // משתתף
  if (cmd.match(/הוסף משתתף|משתתף חדש|הזמן|הזמנה/)) {
    return 'ADD_GUEST';
  }
  
  return 'UNKNOWN';
}

/**
 * יצירת אירוע חדש
 */
function createEvent(cal, command, data) {
  try {
    // ניתוח פרמטרים
    var params = parseEventParams(command, data);
    
    if (!params.title) {
      return { success: false, message: 'חסרה כותרת לאירוע. אנא ציין כותרת.' };
    }
    
    if (!params.startTime) {
      return { success: false, message: 'חסר תאריך או שעה לאירוע. אנא ציין מתי האירוע.' };
    }
    
    var event;
    if (params.allDay) {
      event = cal.createAllDayEvent(params.title, params.startTime, {
        location: params.location || '',
        description: params.description || ''
      });
    } else {
      var endTime = params.endTime || new Date(params.startTime.getTime() + 60*60*1000);
      event = cal.createEvent(params.title, params.startTime, endTime, {
        location: params.location || '',
        description: params.description || ''
      });
    }
    
    // הוספת צבע
    if (params.color && COLORS[params.color]) {
      event.setColor(COLORS[params.color]);
    }
    
    // הוספת תזכורות
    if (params.reminders && params.reminders.length > 0) {
      event.removeAllReminders();
      params.reminders.forEach(function(minutes) {
        event.addPopupReminder(minutes);
      });
    }
    
    // הוספת משתתפים
    if (params.guests && params.guests.length > 0) {
      params.guests.forEach(function(email) {
        event.addGuest(email);
      });
    }
    
    var message = "האירוע '" + params.title + "' נוצר בהצלחה";
    if (params.startTime) {
      message += ' ב-' + formatDate(params.startTime);
      if (!params.allDay && params.startTime) {
        message += ' בשעה ' + formatTime(params.startTime);
      }
    }
    if (params.color) message += ', צבע ' + params.color;
    if (params.location) message += ', מיקום: ' + params.location;
    if (params.reminders && params.reminders.length > 0) {
      message += ', תזכורות: ' + params.reminders.join(', ') + ' דקות';
    }
    if (params.guests && params.guests.length > 0) {
      message += ', משתתפים: ' + params.guests.length;
    }
    
    return { 
      success: true, 
      message: message,
      eventId: event.getId()
    };
  } catch (error) {
    return { success: false, message: 'שגיאה ביצירת אירוע: ' + error.toString() };
  }
}

/**
 * עדכון אירוע קיים
 */
function updateEvent(cal, command, data) {
  try {
    var event = findEvent(cal, command, data);
    if (!event) {
      return { success: false, message: 'האירוע לא נמצא. אנא ציין כותרת או מזהה מדויק יותר.' };
    }
    
    var params = parseEventParams(command, data);
    var changes = [];
    
    // עדכון כותרת
    if (params.title && params.title !== event.getTitle()) {
      event.setTitle(params.title);
      changes.push('כותרת');
    }
    
    // עדכון זמנים
    if (params.startTime) {
      var endTime = params.endTime || new Date(params.startTime.getTime() + (event.getEndTime().getTime() - event.getStartTime().getTime()));
      event.setTime(params.startTime, endTime);
      changes.push('זמן');
    }
    
    // עדכון מיקום
    if (params.location !== undefined) {
      event.setLocation(params.location);
      changes.push('מיקום');
    }
    
    // עדכון תיאור
    if (params.description !== undefined) {
      event.setDescription(params.description);
      changes.push('תיאור');
    }
    
    // עדכון צבע
    if (params.color && COLORS[params.color]) {
      event.setColor(COLORS[params.color]);
      changes.push('צבע');
    }
    
    // עדכון תזכורות
    if (params.reminders) {
      event.removeAllReminders();
      params.reminders.forEach(function(minutes) {
        event.addPopupReminder(minutes);
      });
      changes.push('תזכורות');
    }
    
    // הוספת משתתפים
    if (params.guests && params.guests.length > 0) {
      params.guests.forEach(function(email) {
        event.addGuest(email);
      });
      changes.push('משתתפים');
    }
    
    return { 
      success: true, 
      message: "האירוע '" + event.getTitle() + "' עודכן בהצלחה. שינויים: " + changes.join(', '),
      eventId: event.getId()
    };
  } catch (error) {
    return { success: false, message: 'שגיאה בעדכון אירוע: ' + error.toString() };
  }
}

/**
 * מחיקת אירוע
 */
function deleteEvent(cal, command, data) {
  try {
    var event = findEvent(cal, command, data);
    if (!event) {
      return { success: false, message: 'האירוע לא נמצא למחיקה.' };
    }
    
    var title = event.getTitle();
    event.deleteEvent();
    
    return { 
      success: true, 
      message: "האירוע '" + title + "' נמחק בהצלחה"
    };
  } catch (error) {
    return { success: false, message: 'שגיאה במחיקת אירוע: ' + error.toString() };
  }
}

/**
 * העברת אירוע
 */
function moveEvent(cal, command, data) {
  try {
    var event = findEvent(cal, command, data);
    if (!event) {
      return { success: false, message: 'האירוע לא נמצא להעברה.' };
    }
    
    var params = parseEventParams(command, data);
    if (!params.startTime) {
      return { success: false, message: 'לא צוין זמן חדש להעברת האירוע.' };
    }
    
    var duration = event.getEndTime().getTime() - event.getStartTime().getTime();
    var newEnd = new Date(params.startTime.getTime() + duration);
    event.setTime(params.startTime, newEnd);
    
    return { 
      success: true, 
      message: "האירוע '" + event.getTitle() + "' הועבר ל-" + formatDate(params.startTime) + " בשעה " + formatTime(params.startTime),
      eventId: event.getId()
    };
  } catch (error) {
    return { success: false, message: 'שגיאה בהעברת אירוע: ' + error.toString() };
  }
}

/**
 * שכפול אירוע
 */
function duplicateEvent(cal, command, data) {
  try {
    var event = findEvent(cal, command, data);
    if (!event) {
      return { success: false, message: 'האירוע לא נמצא לשכפול.' };
    }
    
    var params = parseEventParams(command, data);
    var newStartTime = params.startTime || new Date(event.getStartTime().getTime() + 7*24*60*60*1000);
    var duration = event.getEndTime().getTime() - event.getStartTime().getTime();
    var newEndTime = new Date(newStartTime.getTime() + duration);
    
    var newEvent = cal.createEvent(event.getTitle(), newStartTime, newEndTime, {
      location: event.getLocation(),
      description: event.getDescription()
    });
    
    if (event.getColor()) {
      newEvent.setColor(event.getColor());
    }
    
    return { 
      success: true, 
      message: "האירוע '" + event.getTitle() + "' שוכפל ל-" + formatDate(newStartTime),
      eventId: newEvent.getId()
    };
  } catch (error) {
    return { success: false, message: 'שגיאה בשכפול אירוע: ' + error.toString() };
  }
}

/**
 * שינוי צבע אירוע
 */
function changeEventColor(cal, command, data) {
  try {
    var event = findEvent(cal, command, data);
    if (!event) {
      return { success: false, message: 'האירוע לא נמצא.' };
    }
    
    var params = parseEventParams(command, data);
    if (!params.color || !COLORS[params.color]) {
      return { success: false, message: 'צבע לא תקין. צבעים זמינים: ' + Object.keys(COLORS).join(', ') };
    }
    
    event.setColor(COLORS[params.color]);
    
    return { 
      success: true, 
      message: "צבע האירוע '" + event.getTitle() + "' שונה ל-" + params.color,
      eventId: event.getId()
    };
  } catch (error) {
    return { success: false, message: 'שגיאה בשינוי צבע: ' + error.toString() };
  }
}

/**
 * הוספת תזכורת
 */
function addReminder(cal, command, data) {
  try {
    var event = findEvent(cal, command, data);
    if (!event) {
      return { success: false, message: 'האירוע לא נמצא.' };
    }
    
    var params = parseEventParams(command, data);
    if (!params.reminders || params.reminders.length === 0) {
      return { success: false, message: 'לא צוינו תזכורות להוספה.' };
    }
    
    params.reminders.forEach(function(minutes) {
      event.addPopupReminder(minutes);
    });
    
    return { 
      success: true, 
      message: "תזכורות נוספו לאירוע '" + event.getTitle() + "': " + params.reminders.join(', ') + " דקות",
      eventId: event.getId()
    };
  } catch (error) {
    return { success: false, message: 'שגיאה בהוספת תזכורת: ' + error.toString() };
  }
}

/**
 * הוספת משתתף
 */
function addGuest(cal, command, data) {
  try {
    var event = findEvent(cal, command, data);
    if (!event) {
      return { success: false, message: 'האירוע לא נמצא.' };
    }
    
    var params = parseEventParams(command, data);
    if (!params.guests || params.guests.length === 0) {
      return { success: false, message: 'לא צוינו משתתפים להוספה.' };
    }
    
    params.guests.forEach(function(email) {
      event.addGuest(email);
    });
    
    return { 
      success: true, 
      message: "משתתפים נוספו לאירוע '" + event.getTitle() + "': " + params.guests.join(', '),
      eventId: event.getId()
    };
  } catch (error) {
    return { success: false, message: 'שגיאה בהוספת משתתף: ' + error.toString() };
  }
}

/**
 * חיפוש אירוע לפי מזהה או טקסט
 */
function findEvent(cal, command, data) {
  // חיפוש לפי מזהה
  if (data.eventId) {
    try {
      return cal.getEventById(data.eventId);
    } catch (e) {
      return null;
    }
  }
  
  // חיפוש לפי כותרת
  var searchTitle = data.searchTitle || extractTitle(command);
  if (searchTitle) {
    var now = new Date();
    var past = new Date(now.getTime() - 30*24*60*60*1000);
    var future = new Date(now.getTime() + 90*24*60*60*1000);
    var events = cal.getEvents(past, future);
    
    for (var i = 0; i < events.length; i++) {
      if (events[i].getTitle().indexOf(searchTitle) >= 0) {
        return events[i];
      }
    }
  }
  
  return null;
}

/**
 * ניתוח פרמטרים מהטקסט והנתונים
 */
function parseEventParams(command, data) {
  var params = {};
  
  // כותרת
  params.title = data.title || extractTitle(command);
  
  // תאריך ושעה
  var dateTime = data.startTime ? new Date(data.startTime) : parseDateTime(command);
  if (dateTime) {
    params.startTime = dateTime;
  }
  
  if (data.endTime) {
    params.endTime = new Date(data.endTime);
  }
  
  // אירוע כל היום
  params.allDay = data.allDay || command.match(/כל היום|יום שלם/) ? true : false;
  
  // מיקום
  params.location = data.location || extractLocation(command);
  
  // תיאור
  params.description = data.description || '';
  
  // צבע
  params.color = data.color || extractColor(command);
  
  // תזכורות
  params.reminders = data.reminders || extractReminders(command);
  
  // משתתפים
  params.guests = data.guests || extractGuests(command);
  
  return params;
}

/**
 * חילוץ כותרת מהטקסט
 */
function extractTitle(command) {
  // חיפוש אחרי ציטוט
  var quoted = command.match(/["']([^"']+)["']/);
  if (quoted) return quoted[1];
  
  // חיפוש דפוסים נפוצים
  var patterns = [
    /(?:צור|הוסף|עדכן|שנה)\s+(?:אירוע|פגישה)?\s*['"]?([^'"]+?)['"]?\s+(?:ב|ל|מ|עד)/i,
    /(?:צור|הוסף)\s+['"]?([^'"]+?)['"]?\s*$/i,
    /אירוע\s+['"]?([^'"]+?)['"]?(?:\s+ב|\s+ל)/i
  ];
  
  for (var i = 0; i < patterns.length; i++) {
    var match = command.match(patterns[i]);
    if (match) return match[1].trim();
  }
  
  return null;
}

/**
 * ניתוח תאריך ושעה מטקסט בעברית
 */
function parseDateTime(command) {
  var now = new Date();
  var result = new Date(now);
  
  // היום
  if (command.match(/היום/)) {
    // כבר מוגדר ל-now
  }
  // מחר
  else if (command.match(/מחר/)) {
    result.setDate(result.getDate() + 1);
  }
  // מחרתיים
  else if (command.match(/מחרתיים/)) {
    result.setDate(result.getDate() + 2);
  }
  // יום ספציפי בשבוע
  else {
    for (var day in DAYS_OF_WEEK) {
      if (command.indexOf(day) >= 0) {
        var targetDay = DAYS_OF_WEEK[day];
        var currentDay = result.getDay();
        var daysToAdd = (targetDay - currentDay + 7) % 7;
        if (daysToAdd === 0) daysToAdd = 7; // שבוע הבא
        result.setDate(result.getDate() + daysToAdd);
        break;
      }
    }
  }
  
  // תאריך מספרי
  var dateMatch = command.match(/(\d{1,2})[\/\-.](\d{1,2})(?:[\/\-.](\d{2,4}))?/);
  if (dateMatch) {
    var day = parseInt(dateMatch[1]);
    var month = parseInt(dateMatch[2]) - 1;
    var year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    result = new Date(year, month, day);
  }
  
  // חודש בעברית
  for (var monthName in MONTHS) {
    if (command.indexOf(monthName) >= 0) {
      var dayMatch = command.match(/(\d{1,2})\s+(?:ב)?/.source + monthName);
      if (dayMatch) {
        result.setMonth(MONTHS[monthName]);
        result.setDate(parseInt(dayMatch[1]));
      }
      break;
    }
  }
  
  // שעה
  var timeMatch = command.match(/(?:בשעה|ב-|ב)\s*(\d{1,2})(?::(\d{2}))?/);
  if (timeMatch) {
    var hour = parseInt(timeMatch[1]);
    var minute = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    result.setHours(hour, minute, 0, 0);
  } else {
    result.setHours(9, 0, 0, 0); // ברירת מחדל: 9:00
  }
  
  return result;
}

/**
 * חילוץ מיקום
 */
function extractLocation(command) {
  var match = command.match(/(?:ב|במיקום|מיקום)\s+([^\s,]+(?:\s+[^\s,]+)?)/);
  return match ? match[1] : null;
}

/**
 * חילוץ צבע
 */
function extractColor(command) {
  for (var color in COLORS) {
    if (command.indexOf(color) >= 0) {
      return color;
    }
  }
  return null;
}

/**
 * חילוץ תזכורות
 */
function extractReminders(command) {
  var reminders = [];
  
  // תזכורת במספר דקות
  var matches = command.match(/תזכורת\s+(\d+)\s*דקות/g);
  if (matches) {
    matches.forEach(function(m) {
      var minutes = parseInt(m.match(/(\d+)/)[1]);
      reminders.push(minutes);
    });
  }
  
  // תזכורות סטנדרטיות
  if (command.match(/תזכורת\s+רבע שעה|15\s+דקות/)) reminders.push(15);
  if (command.match(/תזכורת\s+חצי שעה|30\s+דקות/)) reminders.push(30);
  if (command.match(/תזכורת\s+שעה/)) reminders.push(60);
  
  return reminders.length > 0 ? reminders : null;
}

/**
 * חילוץ משתתפים
 */
function extractGuests(command) {
  var guests = [];
  var emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/g;
  var matches = command.match(emailPattern);
  
  if (matches) {
    guests = matches;
  }
  
  return guests.length > 0 ? guests : null;
}

/**
 * עיצוב תאריך לעברית
 */
function formatDate(date) {
  var days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  return days[date.getDay()] + ' ' + date.getDate() + '/' + (date.getMonth() + 1) + '/' + date.getFullYear();
}

/**
 * עיצוב שעה
 */
function formatTime(date) {
  var hours = date.getHours();
  var minutes = date.getMinutes();
  return (hours < 10 ? '0' : '') + hours + ':' + (minutes < 10 ? '0' : '') + minutes;
}
