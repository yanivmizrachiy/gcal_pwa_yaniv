/**
 * doGet - Legacy GET endpoint for backward compatibility
 * Modes: selftest, events, today
 */
function doGet(e) {
  try {
    var mode = (e && e.parameter && e.parameter.mode) || 'info';
    var payload;
    
    if (mode === 'selftest') {
      payload = { 
        ok: true, 
        mode: 'selftest',
        ts: new Date().toISOString(), 
        user: Session.getActiveUser().getEmail() || null 
      };
    } else if (mode === 'events') {
      // Next 14 days for backward compatibility
      var cal = CalendarApp.getDefaultCalendar();
      var now = new Date();
      var until = new Date(now.getTime() + 14*24*60*60*1000);
      var evs = cal.getEvents(now, until).slice(0, 50).map(function(ev){
        return serializeEvent(ev);
      });
      payload = { ok: true, count: evs.length, events: evs };
    } else if (mode === 'today') {
      // Today: midnight to +24h
      var cal = CalendarApp.getDefaultCalendar();
      var start = new Date();
      start.setHours(0, 0, 0, 0);
      var end = new Date(start.getTime() + 24*60*60*1000);
      var evs = cal.getEvents(start, end).map(function(ev){
        return serializeEvent(ev);
      });
      payload = { ok: true, count: evs.length, events: evs };
    } else {
      payload = { ok: false, error: "מצב לא נתמך", mode: mode };
    }
    
    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: "שגיאה: " + err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * doPost - Main API endpoint for CRUD operations and NLP
 * Actions: selfTest, findEvents, createEvent, updateEvent, deleteEvent, parseNlp
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var response;
    
    switch(action) {
      case 'selfTest':
        response = handleSelfTest();
        break;
      case 'findEvents':
        response = handleFindEvents(payload.options || {});
        break;
      case 'createEvent':
        response = handleCreateEvent(payload.event);
        break;
      case 'updateEvent':
        response = handleUpdateEvent(payload.eventId, payload.changes);
        break;
      case 'deleteEvent':
        response = handleDeleteEvent(payload.eventId);
        break;
      case 'parseNlp':
        response = handleParseNlp(payload.text, payload.parseOnly || false);
        break;
      default:
        response = { ok: false, error: "פעולה לא נתמכת: " + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: "שגיאה: " + err.message,
      stack: err.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle selfTest action
 */
function handleSelfTest() {
  return {
    ok: true,
    action: 'selfTest',
    message: 'בדיקה תקינה',
    nlpVersion: 'v2',
    now: new Date().toISOString()
  };
}

/**
 * Handle findEvents action
 */
function handleFindEvents(options) {
  var cal = CalendarApp.getDefaultCalendar();
  var timeMin = options.timeMin ? new Date(options.timeMin) : new Date();
  var timeMax = options.timeMax ? new Date(options.timeMax) : new Date(timeMin.getTime() + 14*24*60*60*1000);
  var maxResults = options.maxResults || 50;
  
  var events = cal.getEvents(timeMin, timeMax);
  
  // Filter by search query if provided
  if (options.q) {
    var query = options.q.toLowerCase();
    events = events.filter(function(ev) {
      return ev.getTitle().toLowerCase().indexOf(query) >= 0 ||
             (ev.getDescription() && ev.getDescription().toLowerCase().indexOf(query) >= 0);
    });
  }
  
  events = events.slice(0, maxResults).map(function(ev) {
    return serializeEvent(ev);
  });
  
  return {
    ok: true,
    action: 'findEvents',
    count: events.length,
    events: events
  };
}

/**
 * Handle createEvent action
 */
function handleCreateEvent(eventData) {
  var cal = CalendarApp.getDefaultCalendar();
  var title = eventData.title || 'ללא כותרת';
  var start = new Date(eventData.start);
  var end = new Date(eventData.end);
  
  var options = {};
  if (eventData.description) options.description = eventData.description;
  if (eventData.location) options.location = eventData.location;
  
  var event = cal.createEvent(title, start, end, options);
  
  // Set color if provided
  if (eventData.color) {
    try {
      var colorMap = getColorMap();
      var colorId = colorMap[eventData.color.toLowerCase()];
      if (colorId) event.setColor(colorId);
    } catch (e) {
      // Color setting may fail, continue anyway
    }
  }
  
  // Add reminders if provided
  if (eventData.reminders && eventData.reminders.length > 0) {
    event.removeAllReminders();
    eventData.reminders.forEach(function(minutes) {
      event.addPopupReminder(minutes);
    });
  }
  
  var serialized = serializeEvent(event);
  
  return {
    ok: true,
    action: 'createEvent',
    message: 'האירוע נוצר בהצלחה: ' + title,
    event: serialized
  };
}

/**
 * Handle updateEvent action
 */
function handleUpdateEvent(eventId, changes) {
  var cal = CalendarApp.getDefaultCalendar();
  var event = cal.getEventById(eventId);
  
  if (!event) {
    return { ok: false, error: 'אירוע לא נמצא' };
  }
  
  var changedFields = [];
  
  if (changes.title !== undefined) {
    event.setTitle(changes.title);
    changedFields.push('כותרת');
  }
  
  if (changes.start !== undefined && changes.end !== undefined) {
    event.setTime(new Date(changes.start), new Date(changes.end));
    changedFields.push('זמן');
  } else if (changes.start !== undefined) {
    var duration = event.getEndTime().getTime() - event.getStartTime().getTime();
    var newStart = new Date(changes.start);
    event.setTime(newStart, new Date(newStart.getTime() + duration));
    changedFields.push('זמן התחלה');
  } else if (changes.end !== undefined) {
    event.setTime(event.getStartTime(), new Date(changes.end));
    changedFields.push('זמן סיום');
  }
  
  if (changes.description !== undefined) {
    event.setDescription(changes.description);
    changedFields.push('תיאור');
  }
  
  if (changes.location !== undefined) {
    event.setLocation(changes.location);
    changedFields.push('מיקום');
  }
  
  if (changes.color !== undefined) {
    try {
      var colorMap = getColorMap();
      var colorId = colorMap[changes.color.toLowerCase()];
      if (colorId) {
        event.setColor(colorId);
        changedFields.push('צבע');
      }
    } catch (e) {
      // Color setting may fail
    }
  }
  
  if (changes.reminders !== undefined) {
    event.removeAllReminders();
    changes.reminders.forEach(function(minutes) {
      event.addPopupReminder(minutes);
    });
    changedFields.push('תזכורות');
  }
  
  var message = 'האירוע עודכן';
  if (changedFields.length > 0) {
    message += ' (שדות: ' + changedFields.join(', ') + ')';
  }
  
  return {
    ok: true,
    action: 'updateEvent',
    message: message,
    changedFields: changedFields,
    event: serializeEvent(event)
  };
}

/**
 * Handle deleteEvent action
 */
function handleDeleteEvent(eventId) {
  var cal = CalendarApp.getDefaultCalendar();
  var event = cal.getEventById(eventId);
  
  if (!event) {
    return { ok: false, error: 'אירוע לא נמצא' };
  }
  
  var title = event.getTitle();
  event.deleteEvent();
  
  return {
    ok: true,
    action: 'deleteEvent',
    message: 'האירוע נמחק בהצלחה: ' + title
  };
}

/**
 * Handle parseNlp action - Hebrew Natural Language Processing v1/v2
 */
function handleParseNlp(text, parseOnly) {
  // Try v2 parser first (Phase A)
  var interpreted = parseHebrewCommandV2(text);
  
  // Fallback to v1 if v2 fails
  if (!interpreted.success) {
    interpreted = parseHebrewCommand(text);
  }
  
  if (!interpreted.success) {
    return {
      ok: false,
      error: interpreted.error || 'לא הצלחתי להבין את הפקודה',
      tokens: interpreted.tokens
    };
  }
  
  if (parseOnly) {
    return {
      ok: true,
      action: 'parseNlp',
      parseOnly: true,
      interpreted: interpreted,
      message: 'תצוגה מקדימה - לא בוצעו שינויים'
    };
  }
  
  // Execute the command
  var result;
  if (interpreted.operation === 'create') {
    result = handleCreateEvent(interpreted.event);
    result.interpreted = interpreted;
  } else if (interpreted.operation === 'update') {
    result = handleUpdateEvent(interpreted.eventId, interpreted.changes);
    result.interpreted = interpreted;
  } else if (interpreted.operation === 'delete') {
    result = handleDeleteEvent(interpreted.eventId);
    result.interpreted = interpreted;
  } else {
    return { ok: false, error: 'פעולה לא נתמכת: ' + interpreted.operation };
  }
  
  return result;
}

/**
 * Parse Hebrew natural language command - NLP v1
 */
function parseHebrewCommand(text) {
  var tokens = tokenizeHebrew(text);
  var result = {
    success: false,
    tokens: tokens,
    operation: null,
    event: null,
    changes: null,
    eventId: null,
    error: null
  };
  
  // Detect operation keywords
  var deleteKeywords = ['מחק', 'מחיקה', 'הסר', 'בטל'];
  var updateKeywords = ['עדכן', 'שנה', 'ערוך', 'תקן'];
  
  var hasDelete = tokens.some(function(t) { 
    return deleteKeywords.indexOf(t.text) >= 0; 
  });
  var hasUpdate = tokens.some(function(t) { 
    return updateKeywords.indexOf(t.text) >= 0; 
  });
  
  if (hasDelete) {
    result.operation = 'delete';
    result.error = 'מחיקה דורשת זיהוי אירוע ספציפי';
    return result;
  } else if (hasUpdate) {
    result.operation = 'update';
    result.error = 'עדכון דורש זיהוי אירוע ספציפי';
    return result;
  } else {
    result.operation = 'create';
  }
  
  // Parse date/time
  var dateTime = parseDateTimeFromTokens(tokens);
  if (!dateTime.start || !dateTime.end) {
    result.error = 'לא זוהה תאריך או שעה';
    return result;
  }
  
  // Extract title (words not matching other patterns)
  var title = extractTitle(tokens, dateTime);
  
  // Extract color
  var color = extractColor(tokens);
  
  // Extract reminders
  var reminders = extractReminders(tokens);
  
  result.success = true;
  result.event = {
    title: title || 'אירוע',
    start: dateTime.start.toISOString(),
    end: dateTime.end.toISOString(),
    color: color,
    reminders: reminders
  };
  
  return result;
}

/**
 * Parse Hebrew natural language command - NLP v2 (Phase A)
 * Enhanced with: duration parsing, all-day detection, guest extraction, basic recurrence
 */
function parseHebrewCommandV2(text) {
  var tokens = tokenizeHebrew(text);
  var result = {
    success: false,
    tokens: tokens,
    operation: null,
    event: null,
    changes: null,
    eventId: null,
    error: null
  };
  
  // Detect operation keywords
  var deleteKeywords = ['מחק', 'מחיקה', 'הסר', 'בטל'];
  var updateKeywords = ['עדכן', 'שנה', 'ערוך', 'תקן'];
  
  var hasDelete = tokens.some(function(t) { 
    return deleteKeywords.indexOf(t.text) >= 0; 
  });
  var hasUpdate = tokens.some(function(t) { 
    return updateKeywords.indexOf(t.text) >= 0; 
  });
  
  if (hasDelete) {
    result.operation = 'delete';
    result.error = 'מחיקה דורשת זיהוי אירוע ספציפי';
    return result;
  } else if (hasUpdate) {
    result.operation = 'update';
    result.error = 'עדכון דורש זיהוי אירוע ספציפי';
    return result;
  } else {
    result.operation = 'create';
  }
  
  // Parse date/time with v2 enhancements
  var dateTime = parseDateTimeFromTokensV2(tokens, text);
  if (!dateTime.start || !dateTime.end) {
    result.error = 'לא זוהה תאריך או שעה';
    return result;
  }
  
  // Extract title (words not matching other patterns)
  var title = extractTitle(tokens, dateTime);
  
  // Extract color
  var color = extractColor(tokens);
  
  // Extract reminders
  var reminders = extractReminders(tokens);
  
  // V2: Extract guests (emails)
  var guests = extractGuests(text);
  
  // V2: Detect recurrence
  var recurrence = extractRecurrence(text);
  
  result.success = true;
  result.event = {
    title: title || 'אירוע',
    start: dateTime.start.toISOString(),
    end: dateTime.end.toISOString(),
    allDay: dateTime.allDay || false,
    color: color,
    reminders: reminders
  };
  
  // Add guests if any
  if (guests && guests.length > 0) {
    result.event.guests = guests;
  }
  
  // Add recurrence if detected
  if (recurrence) {
    result.event.recurrence = recurrence;
  }
  
  return result;
}

/**
 * Parse date/time with V2 enhancements: duration parsing and all-day detection
 */
function parseDateTimeFromTokensV2(tokens, fullText) {
  var result = { start: null, end: null, allDay: false };
  var baseDate = new Date();
  
  // Check for all-day keywords
  var allDayKeywords = ['כל היום', 'יום מלא'];
  var isAllDay = allDayKeywords.some(function(kw) {
    return fullText.indexOf(kw) >= 0;
  });
  
  // Look for date keywords
  for (var i = 0; i < tokens.length; i++) {
    var word = tokens[i].text;
    if (word === 'היום') {
      baseDate = new Date();
      break;
    } else if (word === 'מחר') {
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 1);
      break;
    } else if (word === 'מחרתיים') {
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 2);
      break;
    }
  }
  
  // Look for time patterns
  var timePattern = /(\d{1,2}):(\d{2})/g;
  var times = [];
  tokens.forEach(function(token) {
    var match;
    while ((match = timePattern.exec(token.text)) !== null) {
      times.push({ hour: parseInt(match[1]), minute: parseInt(match[2]) });
    }
  });
  
  // V2: Parse duration
  var duration = parseDuration(fullText);
  
  // If all-day flag or no times specified, create all-day event
  if (isAllDay || times.length === 0) {
    result.start = new Date(baseDate);
    result.start.setHours(0, 0, 0, 0);
    result.end = new Date(baseDate);
    result.end.setHours(23, 59, 59, 999);
    result.allDay = true;
  } else if (times.length >= 2) {
    // Two explicit times provided
    result.start = new Date(baseDate);
    result.start.setHours(times[0].hour, times[0].minute, 0, 0);
    result.end = new Date(baseDate);
    result.end.setHours(times[1].hour, times[1].minute, 0, 0);
  } else if (times.length === 1) {
    // One time + optional duration
    result.start = new Date(baseDate);
    result.start.setHours(times[0].hour, times[0].minute, 0, 0);
    result.end = new Date(result.start);
    
    if (duration > 0) {
      // Use parsed duration
      result.end.setMinutes(result.end.getMinutes() + duration);
    } else {
      // Default 1 hour
      result.end.setHours(result.start.getHours() + 1, result.start.getMinutes(), 0, 0);
    }
  }
  
  return result;
}

/**
 * V2: Parse duration from Hebrew text
 * Supports: 45 דקות, חצי שעה, שעה, שעתיים, 90 דק, 30 דק', 60 דקות
 * Returns duration in minutes, or 0 if not found
 */
function parseDuration(text) {
  // Common patterns
  if (text.indexOf('חצי שעה') >= 0) return 30;
  if (text.indexOf('שעתיים') >= 0) return 120;
  if (text.indexOf('שעה') >= 0 && text.indexOf('שעתיים') < 0) return 60;
  
  // Number + דקות/דקה/דק/דק'
  var minutePatterns = [
    /(\d+)\s*דקות/,
    /(\d+)\s*דקה/,
    /(\d+)\s*דק'/,
    /(\d+)\s*דק/
  ];
  
  for (var i = 0; i < minutePatterns.length; i++) {
    var match = text.match(minutePatterns[i]);
    if (match) {
      return parseInt(match[1]);
    }
  }
  
  return 0;
}

/**
 * V2: Extract guest emails from text
 * Finds all email addresses, deduplicates, caps at 20
 */
function extractGuests(text) {
  var emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  var matches = text.match(emailPattern);
  
  if (!matches) return [];
  
  // Deduplicate using object as set
  var uniqueEmails = {};
  matches.forEach(function(email) {
    uniqueEmails[email.toLowerCase()] = true;
  });
  
  // Convert back to array and cap at 20
  var emails = Object.keys(uniqueEmails);
  return emails.slice(0, 20);
}

/**
 * V2: Extract recurrence rules from text
 * Supports: "כל יום" (daily), "כל שני"/"כל יום שני" (weekly)
 * End conditions: "עד <date>"
 */
function extractRecurrence(text) {
  var recurrence = null;
  
  // Daily pattern
  if (text.indexOf('כל יום') >= 0) {
    recurrence = { frequency: 'DAILY' };
  }
  
  // Weekly pattern (Monday)
  if (text.indexOf('כל שני') >= 0 || text.indexOf('כל יום שני') >= 0) {
    recurrence = { frequency: 'WEEKLY', byDay: ['MO'] };
  }
  
  // Check for end date: "עד <date>"
  if (recurrence) {
    // Simple pattern for "עד" followed by date keywords
    if (text.indexOf('עד') >= 0) {
      // For now, just flag that there's an end condition
      // Full date parsing for end conditions would be Phase B
      recurrence.hasEndCondition = true;
    }
  }
  
  return recurrence;
}

/**
 * Tokenize Hebrew text
 */
function tokenizeHebrew(text) {
  var words = text.trim().split(/\s+/);
  return words.map(function(word, idx) {
    return {
      text: word,
      index: idx,
      type: classifyToken(word)
    };
  });
}

/**
 * Classify token type
 */
function classifyToken(word) {
  // Time pattern: HH:MM or HH:MM-HH:MM
  if (/^\d{1,2}:\d{2}/.test(word)) return 'time';
  
  // Date keywords
  var dateKeywords = ['היום', 'מחר', 'מחרתיים', 'שלשום', 'יום'];
  if (dateKeywords.some(function(kw) { return word.indexOf(kw) >= 0; })) return 'date';
  
  // Color keywords
  var colorKeywords = ['אדום', 'כחול', 'ירוק', 'צהוב', 'כתום', 'סגול', 'ורוד', 'חום'];
  if (colorKeywords.some(function(kw) { return word.indexOf(kw) >= 0; })) return 'color';
  
  // Reminder keywords
  if (word.indexOf('תזכורת') >= 0 || word.indexOf('תזכורות') >= 0) return 'reminder';
  
  // Numbers (for reminders)
  if (/^\d+$/.test(word)) return 'number';
  
  return 'text';
}

/**
 * Parse date and time from tokens
 */
function parseDateTimeFromTokens(tokens) {
  var result = { start: null, end: null };
  var baseDate = new Date();
  
  // Look for date keywords
  for (var i = 0; i < tokens.length; i++) {
    var word = tokens[i].text;
    if (word === 'היום') {
      baseDate = new Date();
      break;
    } else if (word === 'מחר') {
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 1);
      break;
    } else if (word === 'מחרתיים') {
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 2);
      break;
    }
  }
  
  // Look for time patterns
  var timePattern = /(\d{1,2}):(\d{2})/g;
  var times = [];
  tokens.forEach(function(token) {
    var match;
    while ((match = timePattern.exec(token.text)) !== null) {
      times.push({ hour: parseInt(match[1]), minute: parseInt(match[2]) });
    }
  });
  
  if (times.length >= 2) {
    result.start = new Date(baseDate);
    result.start.setHours(times[0].hour, times[0].minute, 0, 0);
    result.end = new Date(baseDate);
    result.end.setHours(times[1].hour, times[1].minute, 0, 0);
  } else if (times.length === 1) {
    result.start = new Date(baseDate);
    result.start.setHours(times[0].hour, times[0].minute, 0, 0);
    result.end = new Date(result.start);
    result.end.setHours(result.start.getHours() + 1, result.start.getMinutes(), 0, 0);
  }
  
  return result;
}

/**
 * Extract title from tokens
 */
function extractTitle(tokens, dateTime) {
  var titleWords = [];
  var skipTypes = ['time', 'date', 'color', 'reminder', 'number'];
  var skipWords = ['תזכורת', 'תזכורות', 'צבע'];
  
  tokens.forEach(function(token) {
    if (skipTypes.indexOf(token.type) >= 0) return;
    if (skipWords.some(function(sw) { return token.text.indexOf(sw) >= 0; })) return;
    if (/^\d+$/.test(token.text)) return;
    if (/\d{1,2}:\d{2}/.test(token.text)) return;
    titleWords.push(token.text);
  });
  
  return titleWords.join(' ');
}

/**
 * Extract color from tokens
 */
function extractColor(tokens) {
  var colorMap = {
    'אדום': 'red',
    'כחול': 'blue',
    'ירוק': 'green',
    'צהוב': 'yellow',
    'כתום': 'orange',
    'סגול': 'purple',
    'ורוד': 'pink',
    'חום': 'brown'
  };
  
  for (var i = 0; i < tokens.length; i++) {
    for (var hebrewColor in colorMap) {
      if (tokens[i].text.indexOf(hebrewColor) >= 0) {
        return colorMap[hebrewColor];
      }
    }
  }
  
  return null;
}

/**
 * Extract reminders from tokens
 */
function extractReminders(tokens) {
  var reminders = [];
  var inReminderContext = false;
  
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i].text.indexOf('תזכורת') >= 0) {
      inReminderContext = true;
      continue;
    }
    
    if (inReminderContext && tokens[i].type === 'number') {
      reminders.push(parseInt(tokens[i].text));
    }
    
    // Also look for comma-separated numbers after reminder keyword
    if (inReminderContext) {
      var nums = tokens[i].text.split(',');
      nums.forEach(function(n) {
        if (/^\d+$/.test(n)) {
          reminders.push(parseInt(n));
        }
      });
    }
  }
  
  return reminders;
}

/**
 * Get color ID map for Calendar API
 */
function getColorMap() {
  return {
    'red': CalendarApp.EventColor.RED,
    'blue': CalendarApp.EventColor.BLUE,
    'green': CalendarApp.EventColor.GREEN,
    'yellow': CalendarApp.EventColor.YELLOW,
    'orange': CalendarApp.EventColor.ORANGE,
    'purple': CalendarApp.EventColor.PALE_BLUE,
    'pink': CalendarApp.EventColor.PALE_RED,
    'brown': CalendarApp.EventColor.GRAY
  };
}

/**
 * Serialize CalendarEvent to JSON-safe object
 */
function serializeEvent(event) {
  return {
    id: event.getId(),
    title: event.getTitle(),
    start: event.getStartTime().toISOString(),
    end: event.getEndTime().toISOString(),
    allDay: event.isAllDayEvent(),
    description: event.getDescription() || '',
    location: event.getLocation() || '',
    color: event.getColor() || ''
  };
}
