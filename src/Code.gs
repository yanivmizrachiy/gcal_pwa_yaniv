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
      case 'suggestSlots':
        response = handleSuggestSlots(payload);
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
    now: new Date().toISOString(),
    progressPercent: 100,
    features: ['warnings-v2', 'timeofday-heuristics', 'duration-phrases', 'title-refinement', 'recurrence-validation']
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
 * Handle parseNlp action - Hebrew Natural Language Processing v1
 */
function handleParseNlp(text, parseOnly) {
  var interpreted = parseHebrewCommand(text);
  
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
 * Warning codes - רשימת קודי אזהרה
 * Centralized list of all warning codes
 */
var WARNING_CODES = {
  MISSING_TITLE: 'MISSING_TITLE',
  IGNORED_DURATION: 'IGNORED_DURATION',
  DEFAULT_TIME_INFERRED: 'DEFAULT_TIME_INFERRED',
  GUEST_EMAIL_INVALID: 'GUEST_EMAIL_INVALID',
  GUEST_LIST_TRUNCATED: 'GUEST_LIST_TRUNCATED',
  RECURRENCE_UNSUPPORTED: 'RECURRENCE_UNSUPPORTED',
  RECURRENCE_CONFLICT: 'RECURRENCE_CONFLICT',
  AMBIGUOUS_MATCH: 'AMBIGUOUS_MATCH',
  NO_MATCH: 'NO_MATCH',
  SERIES_INSTANCE_DELETE: 'SERIES_INSTANCE_DELETE'
};

/**
 * Helper: הוסף אזהרה למערך אזהרות
 * Add warning to warnings array
 */
function addWarning(warnings, code, message, context) {
  warnings.push({
    code: code,
    message: message,
    context: context || undefined
  });
}

/**
 * Parse recurrence from tokens - פענוח חזרתיות
 * @returns {object} { hasRecurrence, until, times, error }
 */
function parseRecurrence(tokens) {
  var result = {
    hasRecurrence: false,
    until: null,
    times: null,
    error: null
  };
  
  var textJoined = tokens.map(function(t) { return t.text; }).join(' ');
  
  // Look for recurrence indicators
  if (textJoined.indexOf('כל') >= 0) {
    result.hasRecurrence = true;
  }
  
  // Look for "עד" (until) - placeholder
  if (textJoined.indexOf('עד') >= 0) {
    result.until = 'detected';
  }
  
  // Look for "פעמים" (times) - placeholder
  if (textJoined.indexOf('פעמים') >= 0 || textJoined.indexOf('פעם') >= 0) {
    result.times = 'detected';
  }
  
  // Conflict: both until and times
  if (result.until && result.times) {
    result.error = WARNING_CODES.RECURRENCE_CONFLICT;
  }
  
  return result;
}

/**
 * Parse Hebrew natural language command - NLP v2
 */
function parseHebrewCommand(text) {
  var tokens = tokenizeHebrew(text);
  var warnings = [];
  var result = {
    success: false,
    tokens: tokens,
    operation: null,
    event: null,
    changes: null,
    eventId: null,
    error: null,
    warnings: warnings
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
  
  // Parse recurrence and validate
  var recurrence = parseRecurrence(tokens);
  if (recurrence.error) {
    result.success = false;
    result.error = 'חזרתיות לא תקינה: לא ניתן להגדיר גם "עד" וגם "פעמים"';
    return result;
  }
  
  // Parse date/time with warnings
  var dateTime = parseDateTimeFromTokens(tokens, warnings);
  if (!dateTime.start || !dateTime.end) {
    result.error = 'לא זוהה תאריך או שעה';
    return result;
  }
  
  // Extract title with warnings
  var title = extractTitle(tokens, dateTime, warnings);
  
  // Extract color
  var color = extractColor(tokens);
  
  // Extract reminders
  var reminders = extractReminders(tokens);
  
  result.success = true;
  result.event = {
    title: title,
    start: dateTime.start.toISOString(),
    end: dateTime.end.toISOString(),
    color: color,
    reminders: reminders
  };
  
  return result;
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
  
  // Part-of-day keywords
  var partOfDayKeywords = ['בבוקר', 'בוקר', 'בצהריים', 'צהריים', 'בערב', 'ערב'];
  if (partOfDayKeywords.some(function(kw) { return word.indexOf(kw) >= 0; })) return 'timeofday';
  if (word.indexOf('אחה"צ') >= 0) return 'timeofday';
  
  // Duration keywords
  var durationKeywords = ['שעה', 'שעתיים', 'דקות', 'דקה', 'רבע'];
  if (durationKeywords.some(function(kw) { return word.indexOf(kw) >= 0; })) return 'duration';
  
  // Color keywords
  var colorKeywords = ['אדום', 'כחול', 'ירוק', 'צהוב', 'כתום', 'סגול', 'ורוד', 'חום'];
  if (colorKeywords.some(function(kw) { return word.indexOf(kw) >= 0; })) return 'color';
  
  // Reminder keywords
  if (word.indexOf('תזכורת') >= 0 || word.indexOf('תזכורות') >= 0) return 'reminder';
  
  // Recurrence keywords
  var recurrenceKeywords = ['כל', 'עד', 'פעמים', 'פעם'];
  if (recurrenceKeywords.some(function(kw) { return word === kw; })) return 'recurrence';
  
  // Numbers (for reminders)
  if (/^\d+$/.test(word)) return 'number';
  
  return 'text';
}

/**
 * Parse date and time from tokens with warnings support
 */
function parseDateTimeFromTokens(tokens, warnings) {
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
  
  // Look for time patterns (HH:MM or HH:MM-HH:MM)
  var timePattern = /(\d{1,2}):(\d{2})/g;
  var times = [];
  tokens.forEach(function(token) {
    var match;
    while ((match = timePattern.exec(token.text)) !== null) {
      times.push({ hour: parseInt(match[1]), minute: parseInt(match[2]) });
    }
  });
  
  // Look for duration phrases
  var durationMinutes = null;
  var textJoined = tokens.map(function(t) { return t.text; }).join(' ');
  
  // Check for "רבע שעה" (15 minutes)
  if (textJoined.indexOf('רבע שעה') >= 0) {
    durationMinutes = 15;
  }
  // Check for "שלושת רבעי שעה" or "¾ שעה" (45 minutes)
  else if (textJoined.indexOf('שלושת רבעי שעה') >= 0 || textJoined.indexOf('¾ שעה') >= 0) {
    durationMinutes = 45;
  }
  // Check for "שעה" or "שעתיים" etc.
  else if (textJoined.indexOf('שעתיים') >= 0) {
    durationMinutes = 120;
  } else if (textJoined.indexOf('שעה') >= 0 && textJoined.indexOf('רבע') < 0) {
    durationMinutes = 60;
  }
  
  // Look for part-of-day tokens (check textJoined for multi-word phrases)
  var partOfDay = null;
  var defaultHour = null;
  var defaultMinute = 0;
  
  // Check multi-word phrases first
  if (textJoined.indexOf('אחר הצהריים') >= 0) {
    partOfDay = 'afternoon';
    defaultHour = 15;
    defaultMinute = 0;
  } else {
    // Check single-word tokens
    for (var j = 0; j < tokens.length; j++) {
      var token = tokens[j].text;
      if (token === 'בבוקר' || token === 'בוקר') {
        partOfDay = 'morning';
        defaultHour = 9;
        defaultMinute = 0;
        break;
      } else if (token === 'בצהריים' || token === 'צהריים') {
        partOfDay = 'noon';
        defaultHour = 12;
        defaultMinute = 30;
        break;
      } else if (token.indexOf('אחה"צ') >= 0) {
        partOfDay = 'afternoon';
        defaultHour = 15;
        defaultMinute = 0;
        break;
      } else if (token === 'בערב' || token === 'ערב') {
        partOfDay = 'evening';
        defaultHour = 19;
        defaultMinute = 0;
        break;
      }
    }
  }
  
  // Process time information
  if (times.length >= 2) {
    // Explicit time range provided
    result.start = new Date(baseDate);
    result.start.setHours(times[0].hour, times[0].minute, 0, 0);
    result.end = new Date(baseDate);
    result.end.setHours(times[1].hour, times[1].minute, 0, 0);
    
    // If duration phrase also provided, ignore it with warning
    if (durationMinutes !== null && warnings) {
      addWarning(warnings, WARNING_CODES.IGNORED_DURATION, 
        'משך הזמן התעלם בגלל טווח זמנים מפורש', 
        { durationMinutes: durationMinutes });
    }
  } else if (times.length === 1) {
    // Single time provided
    result.start = new Date(baseDate);
    result.start.setHours(times[0].hour, times[0].minute, 0, 0);
    result.end = new Date(result.start);
    
    // Use duration if provided, otherwise default to 60 minutes
    var duration = durationMinutes || 60;
    result.end.setTime(result.end.getTime() + duration * 60000);
  } else if (partOfDay !== null) {
    // No explicit time, but part-of-day provided
    result.start = new Date(baseDate);
    result.start.setHours(defaultHour, defaultMinute, 0, 0);
    result.end = new Date(result.start);
    
    // Use duration if provided, otherwise default to 60 minutes
    var duration = durationMinutes || 60;
    result.end.setTime(result.end.getTime() + duration * 60000);
    
    // Add warning about inferred time
    if (warnings) {
      var partOfDayHebrew = partOfDay === 'morning' ? 'בוקר' : 
                            partOfDay === 'noon' ? 'צהריים' :
                            partOfDay === 'afternoon' ? 'אחר הצהריים' : 'ערב';
      addWarning(warnings, WARNING_CODES.DEFAULT_TIME_INFERRED,
        'שעה הושלמה אוטומטית (' + partOfDayHebrew + '→' + defaultHour + ':' + (defaultMinute < 10 ? '0' : '') + defaultMinute + ')',
        { partOfDay: partOfDay, assignedStart: result.start.toISOString() });
    }
  }
  
  return result;
}

/**
 * Extract title from tokens with quoted segment support
 */
function extractTitle(tokens, dateTime, warnings) {
  var text = tokens.map(function(t) { return t.text; }).join(' ');
  
  // Check for quoted segment (double quotes)
  var quotedMatch = text.match(/"([^"]+)"/);
  if (quotedMatch && quotedMatch[1]) {
    return quotedMatch[1].trim();
  }
  
  // Functional tokens to strip
  var skipTypes = ['time', 'date', 'color', 'reminder', 'number', 'timeofday', 'duration', 'recurrence'];
  var skipWords = [
    // Operation verbs
    'צור', 'צרי', 'יצירה', 'הוסף', 'הוסיפי', 'הוספה',
    'עדכן', 'עדכני', 'עדכון', 'שנה', 'שני', 'שינוי', 'ערוך', 'ערכי', 'עריכה', 'תקן', 'תקני', 'תיקון',
    'מחק', 'מחקי', 'מחיקה', 'הסר', 'הסרי', 'הסרה', 'בטל', 'בטלי', 'ביטול',
    // Reminder words
    'תזכורת', 'תזכורות',
    // Color word
    'צבע',
    // Recurrence tokens
    'כל', 'עד', 'פעמים', 'פעם',
    // Part-of-day tokens
    'בבוקר', 'בוקר', 'בצהריים', 'צהריים', 'אחר', 'הצהריים', 'אחה"צ', 'בערב', 'ערב',
    // Duration words
    'שעה', 'שעתיים', 'דקות', 'דקה', 'רבע', 'שלושת', 'רבעי', '¾'
  ];
  
  var titleWords = [];
  tokens.forEach(function(token) {
    if (skipTypes.indexOf(token.type) >= 0) return;
    if (skipWords.some(function(sw) { return token.text.indexOf(sw) >= 0; })) return;
    if (/^\d+$/.test(token.text)) return;
    if (/\d{1,2}:\d{2}/.test(token.text)) return;
    if (token.text === '"') return; // Skip quote marks
    titleWords.push(token.text);
  });
  
  // Collapse multiple spaces
  var title = titleWords.join(' ').replace(/\s+/g, ' ').trim();
  
  // If empty, use default with warning
  if (!title) {
    title = 'אירוע';
    if (warnings) {
      addWarning(warnings, WARNING_CODES.MISSING_TITLE, 
        'כותרת חסרה - נוצרה כותרת ברירת מחדל', {});
    }
  }
  
  return title;
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

/**
 * Handle suggestSlots action
 */
function handleSuggestSlots(payload) {
  var startDate = payload.startDate ? new Date(payload.startDate) : new Date();
  var endDate = payload.endDate ? new Date(payload.endDate) : new Date(startDate.getTime() + 7*24*60*60*1000);
  var durationMinutes = payload.durationMinutes || 60;
  var calendarId = payload.calendarId || null;
  
  var slots = suggestSlots(startDate, endDate, durationMinutes, calendarId);
  
  return {
    ok: true,
    action: 'suggestSlots',
    slots: slots,
    count: slots.length
  };
}

/**
 * Suggest available time slots - הצע חלונות זמן פנויים
 * @param {Date} startDate - תאריך התחלה
 * @param {Date} endDate - תאריך סיום
 * @param {number} durationMinutes - משך פגישה מבוקש בדקות
 * @param {string} calendarId - מזהה לוח שנה (ברירת מחדל: ראשי)
 */
function suggestSlots(startDate, endDate, durationMinutes, calendarId) {
  var cal = calendarId ? CalendarApp.getCalendarById(calendarId) : CalendarApp.getDefaultCalendar();
  var events = cal.getEvents(startDate, endDate);
  
  // Collect busy intervals, treating all-day events as blocking the entire day
  var busyIntervals = [];
  
  for (var i = 0; i < events.length; i++) {
    var event = events[i];
    
    if (event.isAllDayEvent()) {
      // All-day event: block the entire calendar day(s)
      var allDayStart = new Date(event.getStartTime());
      allDayStart.setHours(0, 0, 0, 0);
      var allDayEnd = new Date(event.getEndTime());
      allDayEnd.setHours(23, 59, 59, 999);
      
      busyIntervals.push({
        start: allDayStart.getTime(),
        end: allDayEnd.getTime()
      });
    } else {
      busyIntervals.push({
        start: event.getStartTime().getTime(),
        end: event.getEndTime().getTime()
      });
    }
  }
  
  // Sort intervals by start time
  busyIntervals.sort(function(a, b) { return a.start - b.start; });
  
  // Merge overlapping/adjacent intervals
  var merged = [];
  for (var j = 0; j < busyIntervals.length; j++) {
    if (merged.length === 0) {
      merged.push(busyIntervals[j]);
    } else {
      var last = merged[merged.length - 1];
      // Merge if overlapping or adjacent (end === next.start)
      if (busyIntervals[j].start <= last.end) {
        last.end = Math.max(last.end, busyIntervals[j].end);
      } else {
        merged.push(busyIntervals[j]);
      }
    }
  }
  
  // Generate free slots
  var freeSlots = [];
  var searchStart = startDate.getTime();
  var searchEnd = endDate.getTime();
  var durationMs = durationMinutes * 60000;
  
  for (var k = 0; k < merged.length; k++) {
    var busyStart = merged[k].start;
    
    // Check if there's a gap before this busy interval
    if (searchStart + durationMs <= busyStart) {
      freeSlots.push({
        start: new Date(searchStart).toISOString(),
        end: new Date(busyStart).toISOString(),
        lengthMinutes: Math.floor((busyStart - searchStart) / 60000)
      });
    }
    
    searchStart = Math.max(searchStart, merged[k].end);
  }
  
  // Check for free time after the last busy interval
  if (searchStart + durationMs <= searchEnd) {
    freeSlots.push({
      start: new Date(searchStart).toISOString(),
      end: new Date(searchEnd).toISOString(),
      lengthMinutes: Math.floor((searchEnd - searchStart) / 60000)
    });
  }
  
  return freeSlots;
}
