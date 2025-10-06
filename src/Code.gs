// ========== Legacy doGet (GET endpoints) ==========
function doGet(e) {
  var mode = (e && e.parameter && e.parameter.mode) || 'info';
  var payload;
  
  if (mode === 'selftest') {
    payload = { ok: true, now: new Date().toISOString(), user: Session.getActiveUser().getEmail() || null };
  } else if (mode === 'events') {
    // Legacy: 7-day events
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
  } else if (mode === 'today') {
    // Legacy: today's events (0-24h)
    var cal = CalendarApp.getDefaultCalendar();
    var now = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    var end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    var evs = cal.getEvents(start, end).slice(0, 20).map(function(ev){
      return {
        title: ev.getTitle(),
        start: ev.getStartTime(),
        end: ev.getEndTime(),
        allDay: ev.isAllDayEvent()
      };
    });
    payload = { count: evs.length, events: evs };
  } else {
    // Unknown mode → JSON error
    payload = { ok: false, error: "מצב לא ידוע. השתמש ב: ?mode=selftest, ?mode=events, ?mode=today" };
  }
  
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

// ========== New doPost (POST endpoints for CRUD + NLP) ==========
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    
    if (action === 'selfTest') {
      return jsonResponse({ ok: true, now: new Date().toISOString(), user: Session.getActiveUser().getEmail() || null });
    }
    
    if (action === 'findEvents') {
      return handleFindEvents(body);
    }
    
    if (action === 'createEvent') {
      return handleCreateEvent(body);
    }
    
    if (action === 'updateEvent') {
      return handleUpdateEvent(body);
    }
    
    if (action === 'deleteEvent') {
      return handleDeleteEvent(body);
    }
    
    if (action === 'getEvent') {
      return handleGetEvent(body);
    }
    
    if (action === 'text') {
      // NLP v1: Parse and execute
      return handleTextNLP(body);
    }
    
    if (action === 'parseOnly') {
      // NLP v2-draft: Parse without mutation
      return handleParseOnly(body);
    }
    
    return jsonResponse({ ok: false, error: 'פעולה לא ידועה: ' + action });
    
  } catch (err) {
    Logger.log('doPost error: ' + err);
    return jsonResponse({ ok: false, error: 'שגיאת שרת: ' + err.message });
  }
}

// ========== CRUD Handlers ==========

function handleFindEvents(body) {
  try {
    var cal = CalendarApp.getDefaultCalendar();
    var start = body.start ? new Date(body.start) : new Date();
    var end = body.end ? new Date(body.end) : new Date(start.getTime() + 7*24*60*60*1000);
    var maxResults = Math.min(body.maxResults || 50, 200); // Cap at 200
    
    var events = cal.getEvents(start, end);
    var results = [];
    
    // Short-circuit mapping
    for (var i = 0; i < Math.min(events.length, maxResults); i++) {
      var ev = events[i];
      results.push({
        id: ev.getId(),
        title: ev.getTitle(),
        start: ev.getStartTime().toISOString(),
        end: ev.getEndTime().toISOString(),
        allDay: ev.isAllDayEvent(),
        description: ev.getDescription() || '',
        location: ev.getLocation() || ''
      });
    }
    
    return jsonResponse({ ok: true, count: results.length, events: results });
  } catch (err) {
    Logger.log('findEvents error: ' + err);
    return jsonResponse({ ok: false, error: 'שגיאה בחיפוש אירועים: ' + err.message });
  }
}

function handleCreateEvent(body) {
  try {
    if (!body.title) {
      return jsonResponse({ ok: false, error: 'חסר כותרת אירוע' });
    }
    
    if (!body.start) {
      return jsonResponse({ ok: false, error: 'חסרה תאריך/שעת התחלה' });
    }
    
    var cal = CalendarApp.getDefaultCalendar();
    var start = new Date(body.start);
    var end = body.end ? new Date(body.end) : new Date(start.getTime() + 60*60*1000); // Default 1 hour
    
    var options = {};
    if (body.description) options.description = body.description;
    if (body.location) options.location = body.location;
    
    var event = cal.createEvent(body.title, start, end, options);
    
    Logger.log('createEvent: ' + body.title.substring(0, 50));
    
    return jsonResponse({ 
      ok: true, 
      eventId: event.getId(),
      title: event.getTitle(),
      start: event.getStartTime().toISOString(),
      end: event.getEndTime().toISOString()
    });
  } catch (err) {
    Logger.log('createEvent error: ' + err);
    return jsonResponse({ ok: false, error: 'שגיאה ביצירת אירוע: ' + err.message });
  }
}

function handleUpdateEvent(body) {
  try {
    if (!body.eventId) {
      return jsonResponse({ ok: false, error: 'חסר מזהה אירוע' });
    }
    
    var cal = CalendarApp.getDefaultCalendar();
    var event = cal.getEventById(body.eventId);
    
    if (!event) {
      return jsonResponse({ ok: false, error: 'אירוע לא נמצא' });
    }
    
    if (body.title) event.setTitle(body.title);
    if (body.description !== undefined) event.setDescription(body.description);
    if (body.location !== undefined) event.setLocation(body.location);
    
    if (body.start && body.end) {
      var start = new Date(body.start);
      var end = new Date(body.end);
      event.setTime(start, end);
    } else if (body.start) {
      var start = new Date(body.start);
      var duration = event.getEndTime().getTime() - event.getStartTime().getTime();
      var end = new Date(start.getTime() + duration);
      event.setTime(start, end);
    }
    
    Logger.log('updateEvent: ' + body.eventId.substring(0, 30));
    
    return jsonResponse({ 
      ok: true, 
      eventId: event.getId(),
      title: event.getTitle(),
      start: event.getStartTime().toISOString(),
      end: event.getEndTime().toISOString()
    });
  } catch (err) {
    Logger.log('updateEvent error: ' + err);
    return jsonResponse({ ok: false, error: 'שגיאה בעדכון אירוע: ' + err.message });
  }
}

function handleDeleteEvent(body) {
  try {
    if (!body.eventId) {
      return jsonResponse({ ok: false, error: 'חסר מזהה אירוע' });
    }
    
    var cal = CalendarApp.getDefaultCalendar();
    var event = cal.getEventById(body.eventId);
    
    if (!event) {
      return jsonResponse({ ok: false, error: 'אירוע לא נמצא' });
    }
    
    var title = event.getTitle();
    event.deleteEvent();
    
    Logger.log('deleteEvent: ' + title.substring(0, 50));
    
    return jsonResponse({ ok: true, deleted: true, title: title });
  } catch (err) {
    Logger.log('deleteEvent error: ' + err);
    return jsonResponse({ ok: false, error: 'שגיאה במחיקת אירוע: ' + err.message });
  }
}

function handleGetEvent(body) {
  try {
    if (!body.eventId) {
      return jsonResponse({ ok: false, error: 'חסר מזהה אירוע' });
    }
    
    var cal = CalendarApp.getDefaultCalendar();
    var event = cal.getEventById(body.eventId);
    
    if (!event) {
      return jsonResponse({ ok: false, error: 'אירוע לא נמצא' });
    }
    
    return jsonResponse({ 
      ok: true,
      event: {
        id: event.getId(),
        title: event.getTitle(),
        start: event.getStartTime().toISOString(),
        end: event.getEndTime().toISOString(),
        allDay: event.isAllDayEvent(),
        description: event.getDescription() || '',
        location: event.getLocation() || ''
      }
    });
  } catch (err) {
    Logger.log('getEvent error: ' + err);
    return jsonResponse({ ok: false, error: 'שגיאה בקבלת אירוע: ' + err.message });
  }
}

// ========== Hebrew NLP v1 (text action - parse and execute) ==========

function handleTextNLP(body) {
  try {
    if (!body.text) {
      return jsonResponse({ ok: false, error: 'חסר טקסט' });
    }
    
    var parsed = parseHebrewNLP(body.text);
    
    if (!parsed.ok) {
      return jsonResponse({ ok: false, error: parsed.error });
    }
    
    // Execute the parsed action
    if (parsed.action === 'create') {
      var cal = CalendarApp.getDefaultCalendar();
      var event = cal.createEvent(parsed.title, parsed.start, parsed.end, {
        description: parsed.description || '',
        location: parsed.location || ''
      });
      
      Logger.log('NLP createEvent: ' + parsed.title.substring(0, 50));
      
      return jsonResponse({ 
        ok: true, 
        executed: true,
        eventId: event.getId(),
        title: event.getTitle(),
        start: event.getStartTime().toISOString(),
        end: event.getEndTime().toISOString(),
        parsed: parsed
      });
    }
    
    return jsonResponse({ ok: false, error: 'פעולת NLP לא נתמכת' });
    
  } catch (err) {
    Logger.log('textNLP error: ' + err);
    return jsonResponse({ ok: false, error: 'שגיאה ב-NLP: ' + err.message });
  }
}

// ========== Hebrew NLP v2-draft (parseOnly - no mutation) ==========

function handleParseOnly(body) {
  try {
    if (!body.text) {
      return jsonResponse({ ok: false, error: 'חסר טקסט' });
    }
    
    var parsed = parseHebrewNLP(body.text);
    
    return jsonResponse({ 
      ok: true,
      parsed: parsed,
      executed: false,
      message: 'ניתוח בלבד - לא בוצעה פעולה'
    });
    
  } catch (err) {
    Logger.log('parseOnly error: ' + err);
    return jsonResponse({ ok: false, error: 'שגיאה בניתוח: ' + err.message });
  }
}

// ========== Hebrew NLP Parser ==========

function parseHebrewNLP(text) {
  // Basic NLP v1 implementation
  // Tokens: היום, מחר, and basic time patterns
  
  var result = {
    ok: false,
    action: null,
    title: '',
    start: null,
    end: null,
    description: '',
    location: ''
  };
  
  var normalizedText = text.trim();
  
  // Extract date references
  var now = new Date();
  var targetDate = null;
  var timeStr = null;
  
  // Check for "היום" (today)
  if (normalizedText.indexOf('היום') !== -1) {
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    normalizedText = normalizedText.replace(/היום/g, '').trim();
  }
  
  // Check for "מחר" (tomorrow)
  if (normalizedText.indexOf('מחר') !== -1) {
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    normalizedText = normalizedText.replace(/מחר/g, '').trim();
  }
  
  // Extract time (HH:MM or H:MM format)
  var timeMatch = normalizedText.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    var hour = parseInt(timeMatch[1], 10);
    var minute = parseInt(timeMatch[2], 10);
    if (hour >= 0 && hour < 24 && minute >= 0 && minute < 60) {
      timeStr = timeMatch[0];
      if (!targetDate) {
        targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }
      targetDate.setHours(hour, minute, 0, 0);
      normalizedText = normalizedText.replace(timeMatch[0], '').trim();
    }
  }
  
  // If no date found, default to today
  if (!targetDate) {
    targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0);
  }
  
  // Extract location (after "ב-" or "ב")
  var locationMatch = normalizedText.match(/\bב[-]?([^\s,]+(?:\s+[^\s,]+)?)/);
  if (locationMatch) {
    result.location = locationMatch[1].trim();
    normalizedText = normalizedText.replace(locationMatch[0], '').trim();
  }
  
  // Remaining text is the title
  result.title = normalizedText || 'אירוע חדש';
  
  // Set start and end times (default 1 hour duration)
  result.start = targetDate;
  result.end = new Date(targetDate.getTime() + 60*60*1000);
  result.action = 'create';
  result.ok = true;
  
  return result;
}

// ========== Utility ==========

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
