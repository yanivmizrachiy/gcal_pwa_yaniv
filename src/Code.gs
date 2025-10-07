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
 * Parse Hebrew natural language command - NLP v2
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
    error: null,
    disambiguate: null,
    warnings: []
  };
  
  // Detect operation keywords
  var deleteKeywords = ['מחק', 'מחיקה', 'הסר', 'בטל'];
  var updateKeywords = ['עדכן', 'שנה', 'ערוך', 'תקן', 'העבר', 'הזז', 'דחה'];
  
  var hasDelete = tokens.some(function(t) { 
    return deleteKeywords.indexOf(t.text) >= 0; 
  });
  var hasUpdate = tokens.some(function(t) { 
    return updateKeywords.indexOf(t.text) >= 0; 
  });
  
  if (hasDelete) {
    result.operation = 'delete';
    return parseDeleteCommand(text, tokens, result);
  } else if (hasUpdate) {
    result.operation = 'update';
    return parseUpdateCommand(text, tokens, result);
  } else {
    result.operation = 'create';
    return parseCreateCommand(text, tokens, result);
  }
}

/**
 * Parse create command
 */
function parseCreateCommand(text, tokens, result) {
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
 * Parse delete command with fuzzy event matching
 */
function parseDeleteCommand(text, tokens, result) {
  // Try to extract explicit eventId (Calendar event IDs contain '@')
  var eventIdMatch = text.match(/[a-z0-9_]+@google\.com/i);
  if (eventIdMatch) {
    result.eventId = eventIdMatch[0];
    result.success = true;
    
    // Check if user wants to delete entire series
    if (text.indexOf('כל הסדרה') >= 0 || text.indexOf('כל הסידרה') >= 0) {
      result.warnings.push('מחיקת כל הסדרה אינה נתמכת בשלב זה - נמחק מופע בודד בלבד');
    }
    
    return result;
  }
  
  // Extract title query from text
  var titleQuery = extractTitleForModification(text, tokens);
  
  if (!titleQuery) {
    result.error = 'לא זוהה שם אירוע למחיקה';
    return result;
  }
  
  // Fuzzy search for matching events
  var candidates = findEventsByFuzzyTitle(titleQuery, 30);
  
  if (candidates.length === 0) {
    result.error = 'לא מצאתי אירוע תואם';
    return result;
  }
  
  if (candidates.length > 1) {
    // Return disambiguation object
    result.disambiguate = {
      query: titleQuery,
      candidates: candidates.slice(0, 5).map(function(c) {
        return {
          id: c.event.getId(),
          title: c.event.getTitle(),
          start: c.event.getStartTime().toISOString(),
          end: c.event.getEndTime().toISOString(),
          score: c.score
        };
      })
    };
    result.error = 'נמצאו מספר אירועים תואמים. אנא בחר אחד מהרשימה או ציין שם מדויק יותר';
    return result;
  }
  
  // Single match found
  result.eventId = candidates[0].event.getId();
  result.success = true;
  
  // Add warning for recurring events
  var event = candidates[0].event;
  if (event.isRecurringEvent()) {
    result.warnings.push('נמחק מופע יחיד. למחיקת כל הסדרה כתוב: מחק את כל הסדרה של ' + event.getTitle());
  }
  
  return result;
}

/**
 * Parse update command with fuzzy event matching
 */
function parseUpdateCommand(text, tokens, result) {
  // Check if user is trying to modify recurrence
  if (text.indexOf('כל שבוע') >= 0 || text.indexOf('כל יום') >= 0 || 
      text.indexOf('חוזר') >= 0 || text.indexOf('תדירות') >= 0) {
    result.error = 'עדכון חזרתיות אינו נתמך בשלב זה';
    return result;
  }
  
  // Try to extract explicit eventId
  var eventIdMatch = text.match(/[a-z0-9_]+@google\.com/i);
  var titleQuery;
  
  if (eventIdMatch) {
    result.eventId = eventIdMatch[0];
  } else {
    // Extract title query for fuzzy matching
    titleQuery = extractTitleForModification(text, tokens);
    
    if (!titleQuery) {
      result.error = 'לא זוהה שם אירוע לעדכון';
      return result;
    }
    
    // Fuzzy search for matching events
    var candidates = findEventsByFuzzyTitle(titleQuery, 30);
    
    if (candidates.length === 0) {
      result.error = 'לא מצאתי אירוע תואם';
      return result;
    }
    
    if (candidates.length > 1) {
      // Return disambiguation object
      result.disambiguate = {
        query: titleQuery,
        candidates: candidates.slice(0, 5).map(function(c) {
          return {
            id: c.event.getId(),
            title: c.event.getTitle(),
            start: c.event.getStartTime().toISOString(),
            end: c.event.getEndTime().toISOString(),
            score: c.score
          };
        })
      };
      result.error = 'נמצאו מספר אירועים תואמים. אנא בחר אחד מהרשימה או ציין שם מדויק יותר';
      return result;
    }
    
    result.eventId = candidates[0].event.getId();
  }
  
  // Detect what fields to update
  result.changes = detectUpdateFields(text, tokens);
  
  if (Object.keys(result.changes).length === 0) {
    result.error = 'לא זוהו שינויים לביצוע';
    return result;
  }
  
  result.success = true;
  return result;
}

/**
 * Extract title query for update/delete operations
 * Removes operation keywords and field modification phrases
 */
function extractTitleForModification(text, tokens) {
  var operationWords = ['מחק', 'מחיקה', 'הסר', 'בטל', 'עדכן', 'שנה', 'ערוך', 'תקן', 'העבר', 'הזז', 'דחה'];
  var modificationWords = ['את', 'ל', 'של', 'ב', 'עם', 'זמן', 'כותרת', 'מיקום', 'צבע', 'תזכורת', 'תזכורות', 'אורחים'];
  
  var words = [];
  
  tokens.forEach(function(token) {
    var txt = token.text;
    
    // Skip operation keywords
    if (operationWords.indexOf(txt) >= 0) return;
    
    // Skip modification keywords
    if (modificationWords.indexOf(txt) >= 0) return;
    
    // Skip time patterns
    if (/\d{1,2}:\d{2}/.test(txt)) return;
    
    // Skip pure numbers
    if (/^\d+$/.test(txt)) return;
    
    // Skip color keywords
    if (extractColor([token])) return;
    
    words.push(txt);
  });
  
  return words.join(' ').trim();
}

/**
 * Detect which fields to update from command text
 */
function detectUpdateFields(text, tokens) {
  var changes = {};
  
  // Check for time reschedule: "העבר ל", "דחה ל", "הזז ל" + date/time
  if (text.indexOf('העבר') >= 0 || text.indexOf('דחה') >= 0 || text.indexOf('הזז') >= 0) {
    var dateTime = parseDateTimeFromTokens(tokens);
    if (dateTime.start && dateTime.end) {
      changes.start = dateTime.start.toISOString();
      changes.end = dateTime.end.toISOString();
    }
  } else {
    // Check for standalone time range after update verb
    var timePattern = /(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/;
    var timeMatch = text.match(timePattern);
    if (timeMatch) {
      var today = new Date();
      var start = new Date(today);
      start.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
      var end = new Date(today);
      end.setHours(parseInt(timeMatch[3]), parseInt(timeMatch[4]), 0, 0);
      
      changes.start = start.toISOString();
      changes.end = end.toISOString();
    }
  }
  
  // Check for title change: "שנה כותרת ל", "שם חדש", "לכותרת"
  if (text.indexOf('כותרת') >= 0 || text.indexOf('שם') >= 0) {
    var titleMatch = text.match(/כותרת\s+ל?[\s:]*(.+?)(?:\s+ב|\s+ל|\s+מיקום|$)/);
    if (!titleMatch) {
      titleMatch = text.match(/שם\s+(?:חדש\s+)?ל?[\s:]*(.+?)(?:\s+ב|\s+ל|\s+מיקום|$)/);
    }
    if (titleMatch && titleMatch[1]) {
      changes.title = titleMatch[1].trim();
    }
  }
  
  // Check for location: "מיקום", "למיקום", "ב" + location
  if (text.indexOf('מיקום') >= 0) {
    var locMatch = text.match(/מיקום\s+ל?[\s:]*(.+?)(?:\s+צבע|\s+תזכורת|$)/);
    if (locMatch && locMatch[1]) {
      changes.location = locMatch[1].trim();
    }
  } else if (text.indexOf(' ב') >= 0) {
    var locMatch2 = text.match(/\sב([^\s].+?)(?:\s+צבע|\s+תזכורת|$)/);
    if (locMatch2 && locMatch2[1]) {
      changes.location = locMatch2[1].trim();
    }
  }
  
  // Check for color
  var color = extractColor(tokens);
  if (color) {
    changes.color = color;
  }
  
  // Check for reminders
  var reminders = extractReminders(tokens);
  if (reminders.length > 0) {
    changes.reminders = reminders;
  }
  
  // TODO: Guest additions/removals (Phase A skeleton, not fully implemented)
  
  return changes;
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

/**
 * Normalize Hebrew text for fuzzy matching
 * Removes diacritics (niqqud), trims punctuation, lowercase
 */
function normalizeHebrew(text) {
  if (!text) return '';
  
  // Remove Hebrew diacritics/niqqud (U+0591 to U+05C7)
  var normalized = text.replace(/[\u0591-\u05C7]/g, '');
  
  // Remove punctuation and special chars, keep only letters, numbers, spaces
  normalized = normalized.replace(/[^\u0590-\u05FF\w\s]/g, ' ');
  
  // Normalize whitespace and trim
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Lowercase (for mixed content)
  normalized = normalized.toLowerCase();
  
  return normalized;
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns early if distance exceeds threshold
 */
function levenshteinDistance(str1, str2, maxDistance) {
  var len1 = str1.length;
  var len2 = str2.length;
  
  // Early exit if length difference exceeds maxDistance
  if (Math.abs(len1 - len2) > maxDistance) {
    return maxDistance + 1;
  }
  
  if (len1 === 0) return len2;
  if (len2 === 0) return len1;
  
  var matrix = [];
  
  // Initialize first column
  for (var i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  
  // Initialize first row
  for (var j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (var i = 1; i <= len1; i++) {
    var minInRow = matrix[i][0];
    
    for (var j = 1; j <= len2; j++) {
      var cost = str1.charAt(i - 1) === str2.charAt(j - 1) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
      
      if (matrix[i][j] < minInRow) {
        minInRow = matrix[i][j];
      }
    }
    
    // Early exit if minimum in current row exceeds maxDistance
    if (minInRow > maxDistance) {
      return maxDistance + 1;
    }
  }
  
  return matrix[len1][len2];
}

/**
 * Calculate similarity score between two strings (0..1)
 * Uses token overlap + Levenshtein ratio
 */
function calculateSimilarity(query, target) {
  var normQuery = normalizeHebrew(query);
  var normTarget = normalizeHebrew(target);
  
  if (!normQuery || !normTarget) return 0;
  if (normQuery === normTarget) return 1;
  
  // Token-based scoring
  var queryTokens = normQuery.split(/\s+/);
  var targetTokens = normTarget.split(/\s+/);
  
  var sharedTokens = 0;
  var maxSharedTokenLen = 0;
  
  queryTokens.forEach(function(qt) {
    targetTokens.forEach(function(tt) {
      if (qt === tt && qt.length >= 2) {
        sharedTokens++;
        if (qt.length > maxSharedTokenLen) {
          maxSharedTokenLen = qt.length;
        }
      }
    });
  });
  
  var tokenScore = sharedTokens / Math.max(queryTokens.length, targetTokens.length);
  
  // Levenshtein-based scoring (with early termination)
  var maxLen = Math.max(normQuery.length, normTarget.length);
  var maxDistance = Math.ceil(maxLen * 0.5); // Allow 50% edits
  var distance = levenshteinDistance(normQuery, normTarget, maxDistance);
  
  var levScore = distance > maxDistance ? 0 : (1 - distance / maxLen);
  
  // Combined score (weighted)
  var combinedScore = tokenScore * 0.6 + levScore * 0.4;
  
  return {
    score: combinedScore,
    maxSharedTokenLen: maxSharedTokenLen
  };
}

/**
 * Find events matching a fuzzy title query within a time window
 * Returns candidates sorted by similarity score
 */
function findEventsByFuzzyTitle(titleQuery, windowDays) {
  if (!windowDays) windowDays = 30;
  
  var cal = CalendarApp.getDefaultCalendar();
  var now = new Date();
  var timeMin = new Date(now.getTime() - windowDays * 24 * 60 * 60 * 1000);
  var timeMax = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);
  
  var events = cal.getEvents(timeMin, timeMax);
  
  var candidates = [];
  
  events.forEach(function(event) {
    var title = event.getTitle();
    var simResult = calculateSimilarity(titleQuery, title);
    
    // Threshold: score >= 0.55 AND at least one shared token >= 3 chars
    if (simResult.score >= 0.55 && simResult.maxSharedTokenLen >= 3) {
      candidates.push({
        event: event,
        score: simResult.score,
        timeDelta: Math.abs(event.getStartTime().getTime() - now.getTime())
      });
    }
  });
  
  // Sort by score (desc), then by time delta (asc, prefer future over past if tie)
  candidates.sort(function(a, b) {
    if (Math.abs(a.score - b.score) > 0.01) {
      return b.score - a.score; // Higher score first
    }
    // For ties, prefer events in the future
    var aFuture = a.event.getStartTime().getTime() >= now.getTime() ? 1 : 0;
    var bFuture = b.event.getStartTime().getTime() >= now.getTime() ? 1 : 0;
    if (aFuture !== bFuture) {
      return bFuture - aFuture; // Future events first
    }
    // Then prefer nearer in time
    return a.timeDelta - b.timeDelta;
  });
  
  return candidates;
}
