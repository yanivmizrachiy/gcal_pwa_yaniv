/**
 * doGet - Legacy GET endpoint for backward compatibility
 * Modes: selftest, events, today
 */
function doGet(e) {
  try {
    var mode = (e && e.parameter && e.parameter.mode) || 'info';
    var payload;
    
    if (mode === 'selftest') {
      // Use the same response as POST selfTest for consistency
      payload = handleSelfTest();
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
 * Handle selfTest action - NLP v2
 */
function handleSelfTest() {
  var calendarAccess = true;
  var email = null;
  
  try {
    CalendarApp.getDefaultCalendar();
    email = Session.getActiveUser().getEmail();
  } catch (e) {
    calendarAccess = false;
  }
  
  return {
    ok: true,
    action: 'selfTest',
    nlpVersion: 'v2',
    progressPercent: 100,
    completed: true,
    features: [
      'duration',
      'guests',
      'recurrence-basic',
      'slot-finder',
      'warnings-v2',
      'fuzzy-disambiguation',
      'parse-only',
      'color',
      'reminders'
    ],
    warningsSample: [
      {
        code: 'MISSING_TITLE',
        message: 'כותרת לא זוהתה – הוגדרה ברירת מחדל'
      }
    ],
    calendarAccess: calendarAccess,
    ts: new Date().toISOString(),
    email: email
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
 * Handle parseNlp action - Hebrew Natural Language Processing v2
 */
function handleParseNlp(text, parseOnly) {
  // Early guard for parseOnly - must never mutate calendar
  if (parseOnly !== true && parseOnly !== false) {
    parseOnly = false;
  }
  
  var interpreted = parseHebrewCommandV2(text);
  var warnings = interpreted.warnings || [];
  
  if (!interpreted.success) {
    return {
      ok: false,
      action: 'parseNlp',
      parseOnly: parseOnly,
      error: interpreted.error || 'לא הצלחתי להבין את הפקודה',
      warnings: warnings
    };
  }
  
  // If disambiguation needed, return early
  if (interpreted.operation === 'disambiguation') {
    return {
      ok: true,
      action: 'parseNlp',
      parseOnly: parseOnly,
      operation: 'disambiguation',
      interpreted: interpreted,
      warnings: warnings,
      disambiguation: interpreted.disambiguation
    };
  }
  
  // If parseOnly, return interpretation without execution
  if (parseOnly) {
    return {
      ok: true,
      action: 'parseNlp',
      parseOnly: true,
      operation: interpreted.operation,
      interpreted: interpreted,
      warnings: warnings
    };
  }
  
  // Execute the command
  var result;
  try {
    if (interpreted.operation === 'create') {
      result = executeCreate(interpreted);
      result.action = 'parseNlp';
      result.parseOnly = false;
      result.operation = 'create';
      result.interpreted = interpreted;
      result.warnings = warnings;
    } else if (interpreted.operation === 'update') {
      result = executeUpdate(interpreted);
      result.action = 'parseNlp';
      result.parseOnly = false;
      result.operation = 'update';
      result.interpreted = interpreted;
      result.warnings = warnings;
    } else if (interpreted.operation === 'delete') {
      result = executeDelete(interpreted);
      result.action = 'parseNlp';
      result.parseOnly = false;
      result.operation = 'delete';
      result.interpreted = interpreted;
      result.warnings = warnings;
    } else {
      return { 
        ok: false, 
        action: 'parseNlp',
        parseOnly: false,
        error: 'פעולה לא נתמכת: ' + interpreted.operation,
        warnings: warnings
      };
    }
    
    return result;
  } catch (err) {
    return {
      ok: false,
      action: 'parseNlp',
      parseOnly: false,
      error: 'שגיאה בביצוע הפעולה: ' + err.message,
      warnings: warnings
    };
  }
}

// ============================================================================
// NLP v2 CORE ENGINE - Hebrew Natural Language Processing
// ============================================================================

/**
 * Parse Hebrew natural language command - NLP v2
 */
function parseHebrewCommandV2(text) {
  var ctx = {
    text: text,
    tokens: tokenize(text),
    warnings: [],
    consumedIndexes: []
  };
  
  // Detect operation
  var operation = detectOperation(ctx);
  
  if (operation === 'delete' || operation === 'update') {
    return handleUpdateOrDelete(ctx, operation);
  }
  
  // Default: create operation
  return handleCreate(ctx);
}

/**
 * Detect operation type from tokens
 */
function detectOperation(ctx) {
  var deleteKeywords = ['מחק', 'מחיקה', 'הסר', 'בטל'];
  var updateKeywords = ['עדכן', 'שנה', 'ערוך', 'תקן'];
  
  for (var i = 0; i < ctx.tokens.length; i++) {
    var word = ctx.tokens[i].text;
    if (deleteKeywords.indexOf(word) >= 0) return 'delete';
    if (updateKeywords.indexOf(word) >= 0) return 'update';
  }
  
  return 'create';
}

/**
 * Handle create operation
 */
function handleCreate(ctx) {
  var temporal = parseTemporal(ctx);
  var guests = parseGuests(ctx);
  var reminders = parseReminders(ctx);
  var recurrence = parseRecurrence(ctx);
  var color = parseColor(ctx);
  var title = inferTitle(ctx);
  
  // Generate warnings
  if (!title) {
    ctx.warnings.push({
      code: 'MISSING_TITLE',
      message: 'כותרת לא זוהתה – הוגדרה ברירת מחדל'
    });
    title = 'אירוע';
  }
  
  if (!temporal.start) {
    ctx.warnings.push({
      code: 'DEFAULT_TIME_INFERRED',
      message: 'זמן לא זוהה – הוגדר זמן ברירת מחדל'
    });
    temporal = getDefaultTemporal();
  }
  
  // Check for invalid guest emails
  if (guests.invalid.length > 0) {
    ctx.warnings.push({
      code: 'GUEST_EMAIL_INVALID',
      message: 'כתובת דוא״ל לא תקינה: ' + guests.invalid.join(', ')
    });
  }
  
  // Check for duplicate guests
  if (guests.duplicates.length > 0) {
    ctx.warnings.push({
      code: 'GUEST_DUP_CONFLICT',
      message: 'משתתפים כפולים זוהו: ' + guests.duplicates.join(', ')
    });
  }
  
  // Recurrence warning
  if (recurrence.detected) {
    ctx.warnings.push({
      code: 'RECURRENCE_UNSUPPORTED',
      message: 'תזמון חוזר זוהה אך לא נתמך כרגע – אירוע בודד ייוצר'
    });
  }
  
  return {
    success: true,
    operation: 'create',
    warnings: ctx.warnings,
    interpreted: {
      title: title,
      start: temporal.start,
      end: temporal.end,
      guests: guests.valid,
      reminders: reminders,
      color: color,
      recurrence: recurrence.detected ? recurrence : null
    },
    event: {
      title: title,
      start: temporal.start.toISOString(),
      end: temporal.end.toISOString(),
      color: color,
      reminders: reminders,
      guests: guests.valid
    }
  };
}

/**
 * Handle update or delete with fuzzy matching
 */
function handleUpdateOrDelete(ctx, operation) {
  // Extract query for event search
  var query = extractQueryForSearch(ctx);
  
  if (!query) {
    return {
      success: false,
      operation: operation,
      warnings: [{
        code: 'NO_MATCH',
        message: 'לא זוהה אירוע למחיקה/עדכון'
      }],
      error: operation === 'delete' ? 'מחיקה דורשת זיהוי אירוע ספציפי' : 'עדכון דורש זיהוי אירוע ספציפי'
    };
  }
  
  // Fuzzy find events
  var matches = fuzzyFindEvents(query);
  
  if (matches.length === 0) {
    return {
      success: false,
      operation: operation,
      warnings: [{
        code: 'NO_MATCH',
        message: 'לא נמצא אירוע התואם: ' + query
      }],
      error: 'לא נמצא אירוע התואם את החיפוש'
    };
  }
  
  if (matches.length > 1) {
    return {
      success: true,
      operation: 'disambiguation',
      warnings: [{
        code: 'AMBIGUOUS_MATCH',
        message: 'נמצאו מספר אירועים תואמים (' + matches.length + ') – נדרש בירור'
      }],
      disambiguation: matches.slice(0, 10)
    };
  }
  
  // Single match found
  var eventId = matches[0].id;
  
  if (operation === 'delete') {
    return {
      success: true,
      operation: 'delete',
      warnings: ctx.warnings,
      eventId: eventId,
      interpreted: {
        query: query,
        matchedEvent: matches[0]
      }
    };
  } else {
    // Update operation
    var changes = extractChangesForUpdate(ctx);
    return {
      success: true,
      operation: 'update',
      warnings: ctx.warnings,
      eventId: eventId,
      changes: changes,
      interpreted: {
        query: query,
        matchedEvent: matches[0],
        changes: changes
      }
    };
  }
}

/**
 * Tokenize text into classified tokens - v2
 */
function tokenize(text) {
  var words = text.trim().split(/\s+/);
  return words.map(function(word, idx) {
    return {
      text: word,
      index: idx,
      type: classifyTokenV2(word)
    };
  });
}

/**
 * Classify token type - v2 enhanced
 */
function classifyTokenV2(word) {
  // Email detection
  if (/@/.test(word) && /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(word)) {
    return 'email';
  }
  
  // Time pattern: HH:MM or HH:MM-HH:MM or HH-HH
  if (/^\d{1,2}:\d{2}/.test(word) || /^\d{1,2}-\d{1,2}$/.test(word)) return 'time';
  
  // Date keywords - extended
  var dateKeywords = ['היום', 'מחר', 'מחרתיים', 'אתמול', 'שלשום', 'יום',
                      'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת',
                      'ראשון הבא', 'שני הבא', 'הבא'];
  if (dateKeywords.some(function(kw) { return word.indexOf(kw) >= 0; })) return 'date';
  
  // Duration keywords
  var durationKeywords = ['דקות', 'שעה', 'שעות', 'חצי'];
  if (durationKeywords.some(function(kw) { return word.indexOf(kw) >= 0; })) return 'duration';
  
  // Recurrence keywords
  var recurrenceKeywords = ['כל', 'חוזר', 'קבוע'];
  if (recurrenceKeywords.some(function(kw) { return word.indexOf(kw) >= 0; })) return 'recurrence';
  
  // Color keywords
  var colorKeywords = ['אדום', 'כחול', 'ירוק', 'צהוב', 'כתום', 'סגול', 'ורוד', 'חום', 'צבע'];
  if (colorKeywords.some(function(kw) { return word.indexOf(kw) >= 0; })) return 'color';
  
  // Reminder/guest keywords
  if (word.indexOf('תזכורת') >= 0 || word.indexOf('תזכורות') >= 0) return 'reminder';
  if (word.indexOf('משתתפ') >= 0 || word.indexOf('אורח') >= 0) return 'guest-keyword';
  
  // Action keywords
  var actionKeywords = ['מחק', 'עדכן', 'שנה', 'הסר', 'בטל', 'ערוך', 'תקן', 'הוסף'];
  if (actionKeywords.indexOf(word) >= 0) return 'action';
  
  // Numbers
  if (/^\d+$/.test(word)) return 'number';
  
  return 'text';
}

/**
 * Parse temporal information (dates, times, durations)
 */
function parseTemporal(ctx) {
  var result = { start: null, end: null, duration: null };
  var baseDate = new Date();
  var dateFound = false;
  
  // Look for date keywords
  for (var i = 0; i < ctx.tokens.length; i++) {
    var word = ctx.tokens[i].text;
    
    if (word === 'היום') {
      baseDate = new Date();
      ctx.consumedIndexes.push(i);
      dateFound = true;
      break;
    } else if (word === 'מחר') {
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 1);
      ctx.consumedIndexes.push(i);
      dateFound = true;
      break;
    } else if (word === 'מחרתיים') {
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() + 2);
      ctx.consumedIndexes.push(i);
      dateFound = true;
      break;
    } else if (word === 'אתמול') {
      baseDate = new Date();
      baseDate.setDate(baseDate.getDate() - 1);
      ctx.consumedIndexes.push(i);
      dateFound = true;
      break;
    }
    
    // Weekday detection
    var weekdays = {
      'ראשון': 0, 'שני': 1, 'שלישי': 2, 'רביעי': 3,
      'חמישי': 4, 'שישי': 5, 'שבת': 6
    };
    
    for (var day in weekdays) {
      if (word.indexOf(day) >= 0) {
        var targetDay = weekdays[day];
        var today = new Date();
        var currentDay = today.getDay();
        var daysUntil = (targetDay - currentDay + 7) % 7;
        if (daysUntil === 0 && word.indexOf('הבא') >= 0) daysUntil = 7;
        if (daysUntil === 0) daysUntil = 7; // Next occurrence
        baseDate = new Date(today.getTime() + daysUntil * 24 * 60 * 60 * 1000);
        ctx.consumedIndexes.push(i);
        dateFound = true;
        break;
      }
    }
  }
  
  // Look for time patterns
  var times = [];
  for (var i = 0; i < ctx.tokens.length; i++) {
    var token = ctx.tokens[i];
    
    // HH:MM format
    var timeMatch = /(\d{1,2}):(\d{2})/.exec(token.text);
    if (timeMatch) {
      times.push({ hour: parseInt(timeMatch[1]), minute: parseInt(timeMatch[2]) });
      ctx.consumedIndexes.push(i);
      continue;
    }
    
    // HH-HH format (e.g., "10-11")
    var rangeMatch = /^(\d{1,2})-(\d{1,2})$/.exec(token.text);
    if (rangeMatch) {
      times.push({ hour: parseInt(rangeMatch[1]), minute: 0 });
      times.push({ hour: parseInt(rangeMatch[2]), minute: 0 });
      ctx.consumedIndexes.push(i);
      continue;
    }
    
    // Look for time connectors like "עד"
    if (token.text === 'עד' && i > 0 && i < ctx.tokens.length - 1) {
      ctx.consumedIndexes.push(i);
    }
  }
  
  // Parse duration
  var duration = parseDuration(ctx);
  
  // Build start/end times
  if (times.length >= 2) {
    result.start = new Date(baseDate);
    result.start.setHours(times[0].hour, times[0].minute, 0, 0);
    result.end = new Date(baseDate);
    result.end.setHours(times[1].hour, times[1].minute, 0, 0);
  } else if (times.length === 1) {
    result.start = new Date(baseDate);
    result.start.setHours(times[0].hour, times[0].minute, 0, 0);
    
    if (duration) {
      result.end = new Date(result.start.getTime() + duration * 60000);
    } else {
      result.end = new Date(result.start.getTime() + 60 * 60000); // Default 1 hour
    }
  } else if (dateFound) {
    // Date without time - default to 9:00-10:00
    result.start = new Date(baseDate);
    result.start.setHours(9, 0, 0, 0);
    result.end = new Date(result.start.getTime() + 60 * 60000);
  }
  
  result.duration = duration;
  return result;
}

/**
 * Parse duration from tokens
 */
function parseDuration(ctx) {
  for (var i = 0; i < ctx.tokens.length; i++) {
    var token = ctx.tokens[i];
    
    // "חצי שעה"
    if (token.text.indexOf('חצי') >= 0 && i + 1 < ctx.tokens.length && 
        ctx.tokens[i + 1].text.indexOf('שעה') >= 0) {
      ctx.consumedIndexes.push(i, i + 1);
      return 30;
    }
    
    // "שעה" alone
    if (token.text === 'שעה') {
      ctx.consumedIndexes.push(i);
      return 60;
    }
    
    // "N דקות" or "N שעות"
    if (token.type === 'number' && i + 1 < ctx.tokens.length) {
      var nextToken = ctx.tokens[i + 1];
      if (nextToken.text.indexOf('דקות') >= 0) {
        ctx.consumedIndexes.push(i, i + 1);
        return parseInt(token.text);
      }
      if (nextToken.text.indexOf('שעות') >= 0 || nextToken.text === 'שעה') {
        ctx.consumedIndexes.push(i, i + 1);
        return parseInt(token.text) * 60;
      }
    }
  }
  
  return null;
}

/**
 * Parse guests from tokens
 */
function parseGuests(ctx) {
  var valid = [];
  var invalid = [];
  var seen = {};
  var duplicates = [];
  
  for (var i = 0; i < ctx.tokens.length; i++) {
    if (ctx.tokens[i].type === 'email') {
      var email = ctx.tokens[i].text.replace(/;$/, '').replace(/,$/, '');
      
      // Basic email validation
      if (/@/.test(email) && /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(email)) {
        if (seen[email]) {
          duplicates.push(email);
        } else {
          valid.push(email);
          seen[email] = true;
        }
      } else {
        invalid.push(email);
      }
      
      ctx.consumedIndexes.push(i);
    }
  }
  
  return {
    valid: valid,
    invalid: invalid,
    duplicates: duplicates
  };
}

/**
 * Parse reminders from tokens
 */
function parseReminders(ctx) {
  var reminders = [];
  var inReminderContext = false;
  
  for (var i = 0; i < ctx.tokens.length; i++) {
    if (ctx.tokens[i].type === 'reminder') {
      inReminderContext = true;
      ctx.consumedIndexes.push(i);
      continue;
    }
    
    if (inReminderContext) {
      // Look for comma-separated numbers
      var nums = ctx.tokens[i].text.split(',');
      var foundNumber = false;
      
      nums.forEach(function(n) {
        if (/^\d+$/.test(n)) {
          reminders.push(parseInt(n));
          foundNumber = true;
        }
      });
      
      if (foundNumber) {
        ctx.consumedIndexes.push(i);
      } else {
        inReminderContext = false;
      }
    }
  }
  
  return reminders;
}

/**
 * Parse recurrence patterns
 */
function parseRecurrence(ctx) {
  var result = { detected: false, pattern: null };
  
  for (var i = 0; i < ctx.tokens.length; i++) {
    var token = ctx.tokens[i];
    
    if (token.text === 'כל' && i + 1 < ctx.tokens.length) {
      var nextToken = ctx.tokens[i + 1].text;
      
      if (nextToken === 'יום') {
        result.detected = true;
        result.pattern = 'daily';
        ctx.consumedIndexes.push(i, i + 1);
      } else if (nextToken === 'שבוע') {
        result.detected = true;
        result.pattern = 'weekly';
        ctx.consumedIndexes.push(i, i + 1);
      } else if (nextToken === 'חודש') {
        result.detected = true;
        result.pattern = 'monthly';
        ctx.consumedIndexes.push(i, i + 1);
      } else if (['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'].indexOf(nextToken) >= 0) {
        result.detected = true;
        result.pattern = 'weekday-' + nextToken;
        ctx.consumedIndexes.push(i, i + 1);
      }
    }
  }
  
  return result;
}

/**
 * Parse color from tokens
 */
function parseColor(ctx) {
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
  
  for (var i = 0; i < ctx.tokens.length; i++) {
    if (ctx.tokens[i].type === 'color') {
      for (var hebrewColor in colorMap) {
        if (ctx.tokens[i].text.indexOf(hebrewColor) >= 0) {
          ctx.consumedIndexes.push(i);
          return colorMap[hebrewColor];
        }
      }
    }
  }
  
  return null;
}

/**
 * Infer title from remaining tokens
 */
function inferTitle(ctx) {
  var titleWords = [];
  
  for (var i = 0; i < ctx.tokens.length; i++) {
    if (ctx.consumedIndexes.indexOf(i) >= 0) continue;
    if (ctx.tokens[i].type === 'action') continue;
    
    titleWords.push(ctx.tokens[i].text);
  }
  
  var title = titleWords.join(' ').trim();
  return title || null;
}

/**
 * Get default temporal values
 */
function getDefaultTemporal() {
  var start = new Date();
  start.setHours(start.getHours() + 1, 0, 0, 0);
  var end = new Date(start.getTime() + 60 * 60000);
  
  return { start: start, end: end, duration: 60 };
}

/**
 * Extract query string for event search (update/delete)
 */
function extractQueryForSearch(ctx) {
  var words = [];
  
  for (var i = 0; i < ctx.tokens.length; i++) {
    if (ctx.tokens[i].type === 'action') continue;
    words.push(ctx.tokens[i].text);
  }
  
  return words.join(' ').trim();
}

/**
 * Fuzzy find events by query
 */
function fuzzyFindEvents(query) {
  var cal = CalendarApp.getDefaultCalendar();
  var now = new Date();
  var future = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days
  var events = cal.getEvents(now, future);
  
  var matches = [];
  var queryLower = query.toLowerCase();
  
  for (var i = 0; i < events.length; i++) {
    var ev = events[i];
    var title = ev.getTitle().toLowerCase();
    
    if (title.indexOf(queryLower) >= 0) {
      matches.push({
        id: ev.getId(),
        title: ev.getTitle(),
        start: ev.getStartTime().toISOString(),
        end: ev.getEndTime().toISOString()
      });
    }
  }
  
  return matches;
}

/**
 * Extract changes for update operation
 */
function extractChangesForUpdate(ctx) {
  var changes = {};
  
  var temporal = parseTemporal(ctx);
  if (temporal.start) {
    changes.start = temporal.start.toISOString();
    changes.end = temporal.end.toISOString();
  }
  
  var color = parseColor(ctx);
  if (color) changes.color = color;
  
  var reminders = parseReminders(ctx);
  if (reminders.length > 0) changes.reminders = reminders;
  
  var title = inferTitle(ctx);
  if (title) changes.title = title;
  
  return changes;
}

/**
 * Execute create operation (NLP v2)
 */
function executeCreate(interpreted) {
  var cal = CalendarApp.getDefaultCalendar();
  var eventData = interpreted.event;
  
  var start = new Date(eventData.start);
  var end = new Date(eventData.end);
  
  var event = cal.createEvent(eventData.title, start, end);
  
  // Add guests
  if (eventData.guests && eventData.guests.length > 0) {
    eventData.guests.forEach(function(email) {
      try {
        event.addGuest(email);
      } catch (e) {
        // Guest add might fail
      }
    });
  }
  
  // Set color
  if (eventData.color) {
    try {
      var colorMap = getColorMap();
      var colorId = colorMap[eventData.color.toLowerCase()];
      if (colorId) event.setColor(colorId);
    } catch (e) {
      // Color setting may fail
    }
  }
  
  // Add reminders
  if (eventData.reminders && eventData.reminders.length > 0) {
    event.removeAllReminders();
    eventData.reminders.forEach(function(minutes) {
      event.addPopupReminder(minutes);
    });
  }
  
  return {
    ok: true,
    event: serializeEvent(event),
    changedFields: ['created']
  };
}

/**
 * Execute update operation (NLP v2)
 */
function executeUpdate(interpreted) {
  return handleUpdateEvent(interpreted.eventId, interpreted.changes);
}

/**
 * Execute delete operation (NLP v2)
 */
function executeDelete(interpreted) {
  return handleDeleteEvent(interpreted.eventId);
}

// ============================================================================
// LEGACY v1 FUNCTIONS - Kept for backward compatibility (not used by NLP v2)
// ============================================================================

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
