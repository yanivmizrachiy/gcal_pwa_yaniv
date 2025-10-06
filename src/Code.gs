// doGet: retain selftest/events legacy modes for backward compatibility
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
        id: ev.getId(),
        title: ev.getTitle(),
        start: ev.getStartTime(),
        end: ev.getEndTime(),
        allDay: ev.isAllDayEvent(),
        description: ev.getDescription() || ''
      };
    });
    payload = { count: evs.length, events: evs };
  } else {
    payload = { info: "Use ?mode=selftest or ?mode=events" };
  }
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// doPost: JSON API with full CRUD + Hebrew NLP
function doPost(e) {
  try {
    var params = JSON.parse(e.postData.contents);
    var action = params.action;
    var result;
    
    switch(action) {
      case 'selfTest':
        result = handleSelfTest();
        break;
      case 'findEvents':
        result = handleFindEvents(params);
        break;
      case 'createEvent':
        result = handleCreateEvent(params);
        break;
      case 'updateEvent':
        result = handleUpdateEvent(params);
        break;
      case 'deleteEvent':
        result = handleDeleteEvent(params);
        break;
      case 'getEvent':
        result = handleGetEvent(params);
        break;
      case 'text':
        result = handleNaturalLanguage(params);
        break;
      default:
        result = { ok: false, message: 'פעולה לא מוכרת: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      message: 'שגיאה: ' + err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// Handler functions
function handleSelfTest() {
  return {
    ok: true,
    message: 'המערכת פועלת תקין',
    now: new Date().toISOString(),
    user: Session.getActiveUser().getEmail() || null
  };
}

function handleFindEvents(params) {
  var cal = CalendarApp.getDefaultCalendar();
  var startDate = params.startDate ? new Date(params.startDate) : new Date();
  var endDate = params.endDate ? new Date(params.endDate) : new Date(startDate.getTime() + 7*24*60*60*1000);
  
  var events = cal.getEvents(startDate, endDate);
  var results = events.map(function(ev) {
    return {
      id: ev.getId(),
      title: ev.getTitle(),
      start: ev.getStartTime().toISOString(),
      end: ev.getEndTime().toISOString(),
      allDay: ev.isAllDayEvent(),
      description: ev.getDescription() || ''
    };
  });
  
  return {
    ok: true,
    message: 'נמצאו ' + results.length + ' אירועים',
    events: results,
    count: results.length
  };
}

function handleCreateEvent(params) {
  if (!params.title) {
    return { ok: false, message: 'חסר כותרת לאירוע' };
  }
  
  var cal = CalendarApp.getDefaultCalendar();
  var startDate = params.startDate ? new Date(params.startDate) : new Date();
  var endDate = params.endDate ? new Date(params.endDate) : new Date(startDate.getTime() + 60*60*1000);
  
  var options = {};
  if (params.description) {
    options.description = params.description;
  }
  
  var event = cal.createEvent(params.title, startDate, endDate, options);
  
  return {
    ok: true,
    message: 'האירוע "' + params.title + '" נוצר בהצלחה',
    event: {
      id: event.getId(),
      title: event.getTitle(),
      start: event.getStartTime().toISOString(),
      end: event.getEndTime().toISOString()
    }
  };
}

function handleUpdateEvent(params) {
  if (!params.eventId) {
    return { ok: false, message: 'חסר מזהה אירוע' };
  }
  
  try {
    var cal = CalendarApp.getDefaultCalendar();
    var event = cal.getEventById(params.eventId);
    
    if (!event) {
      return { ok: false, message: 'האירוע לא נמצא' };
    }
    
    if (params.title) {
      event.setTitle(params.title);
    }
    if (params.startDate) {
      var start = new Date(params.startDate);
      var currentEnd = event.getEndTime();
      event.setTime(start, currentEnd);
    }
    if (params.endDate) {
      var currentStart = event.getStartTime();
      var end = new Date(params.endDate);
      event.setTime(currentStart, end);
    }
    if (params.description !== undefined) {
      event.setDescription(params.description);
    }
    
    return {
      ok: true,
      message: 'האירוע עודכן בהצלחה',
      event: {
        id: event.getId(),
        title: event.getTitle(),
        start: event.getStartTime().toISOString(),
        end: event.getEndTime().toISOString()
      }
    };
  } catch(err) {
    return { ok: false, message: 'שגיאה בעדכון: ' + err.message };
  }
}

function handleDeleteEvent(params) {
  if (!params.eventId) {
    return { ok: false, message: 'חסר מזהה אירוע' };
  }
  
  try {
    var cal = CalendarApp.getDefaultCalendar();
    var event = cal.getEventById(params.eventId);
    
    if (!event) {
      return { ok: false, message: 'האירוע לא נמצא' };
    }
    
    var title = event.getTitle();
    event.deleteEvent();
    
    return {
      ok: true,
      message: 'האירוע "' + title + '" נמחק בהצלחה'
    };
  } catch(err) {
    return { ok: false, message: 'שגיאה במחיקה: ' + err.message };
  }
}

function handleGetEvent(params) {
  if (!params.eventId) {
    return { ok: false, message: 'חסר מזהה אירוע' };
  }
  
  try {
    var cal = CalendarApp.getDefaultCalendar();
    var event = cal.getEventById(params.eventId);
    
    if (!event) {
      return { ok: false, message: 'האירוע לא נמצא' };
    }
    
    return {
      ok: true,
      message: 'האירוע נמצא',
      event: {
        id: event.getId(),
        title: event.getTitle(),
        start: event.getStartTime().toISOString(),
        end: event.getEndTime().toISOString(),
        allDay: event.isAllDayEvent(),
        description: event.getDescription() || ''
      }
    };
  } catch(err) {
    return { ok: false, message: 'שגיאה בקבלת אירוע: ' + err.message };
  }
}

// Hebrew Natural Language Parser (heuristic)
function handleNaturalLanguage(params) {
  if (!params.text) {
    return { ok: false, message: 'חסר טקסט' };
  }
  
  var text = params.text.trim();
  var parsed = parseHebrewCommand(text);
  
  if (!parsed.success) {
    return { ok: false, message: parsed.message };
  }
  
  // Execute the parsed command
  return executeNaturalLanguageCommand(parsed);
}

function parseHebrewCommand(text) {
  var lower = text;
  
  // Default values
  var action = null;
  var title = null;
  var startDate = new Date();
  var duration = 1; // hours
  
  // Check for action keywords
  if (lower.indexOf('צור') >= 0 || lower.indexOf('יצירת') >= 0 || lower.indexOf('הוסף') >= 0 || lower.indexOf('קבע') >= 0) {
    action = 'create';
  } else if (lower.indexOf('מצא') >= 0 || lower.indexOf('חפש') >= 0 || lower.indexOf('הצג') >= 0 || lower.indexOf('רשימה') >= 0) {
    action = 'find';
  } else if (lower.indexOf('מחק') >= 0 || lower.indexOf('בטל') >= 0) {
    action = 'delete';
  } else {
    // Default to create if title-like content exists
    action = 'create';
  }
  
  // Parse time keywords
  var now = new Date();
  if (lower.indexOf('היום') >= 0) {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
  } else if (lower.indexOf('מחר') >= 0) {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0);
  } else if (lower.indexOf('מחרתיים') >= 0 || lower.indexOf('מחרותיים') >= 0) {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 2, 9, 0, 0);
  } else if (lower.indexOf('שבוע הבא') >= 0) {
    startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 7, 9, 0, 0);
  }
  
  // Try to extract time from text (e.g., "ב-10:00", "בשעה 14:30")
  var timeMatch = lower.match(/ב[־\-]?(\d{1,2})[:\.](\d{2})/);
  if (!timeMatch) {
    timeMatch = lower.match(/בשעה\s+(\d{1,2})[:\.](\d{2})/);
  }
  if (timeMatch) {
    var hour = parseInt(timeMatch[1]);
    var minute = parseInt(timeMatch[2]);
    startDate.setHours(hour, minute, 0, 0);
  }
  
  // Extract title (remove command words)
  title = text
    .replace(/צור|יצירת|הוסף|קבע|מצא|חפש|הצג|רשימה|מחק|בטל/g, '')
    .replace(/היום|מחר|מחרתיים|מחרותיים|שבוע הבא/g, '')
    .replace(/ב[־\-]?\d{1,2}[:\.]\d{2}/g, '')
    .replace(/בשעה\s+\d{1,2}[:\.]\d{2}/g, '')
    .trim();
  
  if (action === 'create' && !title) {
    return { success: false, message: 'לא זוהתה כותרת לאירוע' };
  }
  
  if (action === 'find') {
    return {
      success: true,
      action: 'find',
      startDate: startDate,
      endDate: new Date(startDate.getTime() + 7*24*60*60*1000)
    };
  }
  
  var endDate = new Date(startDate.getTime() + duration * 60 * 60 * 1000);
  
  return {
    success: true,
    action: action,
    title: title,
    startDate: startDate,
    endDate: endDate
  };
}

function executeNaturalLanguageCommand(parsed) {
  if (parsed.action === 'find') {
    return handleFindEvents({
      startDate: parsed.startDate.toISOString(),
      endDate: parsed.endDate.toISOString()
    });
  } else if (parsed.action === 'create') {
    return handleCreateEvent({
      title: parsed.title,
      startDate: parsed.startDate.toISOString(),
      endDate: parsed.endDate.toISOString()
    });
  } else {
    return { ok: false, message: 'פעולה לא נתמכת: ' + parsed.action };
  }
}
