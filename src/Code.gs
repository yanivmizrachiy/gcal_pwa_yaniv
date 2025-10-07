/**
 * Google Calendar Smart Assistant - Hebrew NLP v2
 * 
 * @fileoverview Google Apps Script backend for Hebrew calendar event management
 * @version 2.0.0
 * @author Yaniv Mizrachiy
 * @license MIT
 * 
 * PHASE A (NLP v2) - COMPLETE (100%)
 * ===================================
 * 
 * Features implemented:
 * ✓ Hebrew natural language parsing (NLP v2)
 * ✓ Event CRUD operations (Create, Read, Update, Delete)
 * ✓ Date/time extraction with Hebrew keywords (היום, מחר, מחרתיים)
 * ✓ Time range parsing (HH:MM format, single or dual times)
 * ✓ Title extraction with whitespace normalization
 * ✓ Color extraction (8 Hebrew color names)
 * ✓ Reminder extraction with minutes specification
 * ✓ Edge case handling:
 *   - Empty/whitespace titles → 'אירוע' with MISSING_TITLE warning
 *   - Extremely short queries (< 5 chars) → rejected with error
 *   - Duplicate warnings prevented via single-pass logic
 * ✓ Comprehensive JSDoc coverage for all functions
 * ✓ Hebrew error messages and user feedback
 * ✓ Legacy GET endpoint for backward compatibility
 * ✓ Production-ready Calendar API integration (no mocks)
 * 
 * API Endpoints:
 * - GET:  /exec?mode=selftest|events|today
 * - POST: /exec with action: selfTest|findEvents|createEvent|updateEvent|deleteEvent|parseNlp
 */

/**
 * doGet - Legacy GET endpoint for backward compatibility
 * 
 * @description Handles GET requests for basic calendar operations
 * @param {Object} e - Event object containing request parameters
 * @param {Object} e.parameter - Query parameters
 * @param {string} e.parameter.mode - Operation mode: 'selftest', 'events', or 'today'
 * @returns {ContentService.TextOutput} JSON response with operation results
 * 
 * Supported modes:
 * - selftest: System health check
 * - events: Next 14 days events (max 50)
 * - today: Today's events (midnight to +24h)
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
 * 
 * @description Handles POST requests for calendar CRUD operations and Hebrew NLP
 * @param {Object} e - Event object containing POST data
 * @param {string} e.postData.contents - JSON payload string
 * @returns {ContentService.TextOutput} JSON response with operation results
 * 
 * Supported actions:
 * - selfTest: System health check
 * - findEvents: Search and list events
 * - createEvent: Create new calendar event
 * - updateEvent: Update existing event
 * - deleteEvent: Delete event
 * - parseNlp: Parse Hebrew natural language and create event
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
 * 
 * @description Performs system health check and returns status information
 * @returns {Object} Status object with system information
 * @returns {boolean} returns.ok - Always true for successful test
 * @returns {string} returns.action - Action name 'selfTest'
 * @returns {string} returns.message - Success message in Hebrew
 * @returns {string} returns.nlpVersion - Current NLP version
 * @returns {string} returns.now - Current timestamp in ISO format
 */
function handleSelfTest() {
  return {
    ok: true,
    action: 'selfTest',
    message: 'בדיקה תקינה',
    nlpVersion: 'v2',
    progressPercent: 100,
    now: new Date().toISOString()
  };
}

/**
 * Handle findEvents action
 * 
 * @description Searches and retrieves calendar events within specified time range
 * @param {Object} options - Search options
 * @param {string} options.timeMin - Start time (ISO format), defaults to now
 * @param {string} options.timeMax - End time (ISO format), defaults to +14 days
 * @param {number} options.maxResults - Maximum results to return, defaults to 50
 * @param {string} options.q - Search query for title/description filtering
 * @returns {Object} Search results with events array
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
 * 
 * @description Creates a new calendar event with provided details
 * @param {Object} eventData - Event details
 * @param {string} eventData.title - Event title
 * @param {string} eventData.start - Start time (ISO format)
 * @param {string} eventData.end - End time (ISO format)
 * @param {string} [eventData.description] - Optional event description
 * @param {string} [eventData.location] - Optional event location
 * @param {string} [eventData.color] - Optional event color
 * @param {number[]} [eventData.reminders] - Optional reminder times in minutes
 * @returns {Object} Result with created event details
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
 * 
 * @description Updates an existing calendar event with specified changes
 * @param {string} eventId - Unique event identifier
 * @param {Object} changes - Fields to update
 * @param {string} [changes.title] - New title
 * @param {string} [changes.start] - New start time (ISO format)
 * @param {string} [changes.end] - New end time (ISO format)
 * @param {string} [changes.description] - New description
 * @param {string} [changes.location] - New location
 * @param {string} [changes.color] - New color
 * @param {number[]} [changes.reminders] - New reminder times in minutes
 * @returns {Object} Result with updated event details
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
 * 
 * @description Deletes a calendar event by ID
 * @param {string} eventId - Unique event identifier
 * @returns {Object} Result with deletion confirmation message
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
 * 
 * @description Parses Hebrew natural language text to extract event details
 * @param {string} text - Hebrew text to parse
 * @param {boolean} parseOnly - If true, only parse without creating event
 * @returns {Object} Parsed event details or execution result
 * 
 * Edge cases handled:
 * - Empty/whitespace-only titles default to 'אירוע' with MISSING_TITLE warning
 * - Extremely short queries (< 5 chars) rejected as too ambiguous
 * - Duplicate duration warnings prevented via single-pass extraction
 */
function handleParseNlp(text, parseOnly) {
  // Edge case: Extremely short queries (fuzzy threshold)
  if (!text || text.trim().length < 5) {
    return {
      ok: false,
      error: 'הטקסט קצר מדי - נדרשים לפחות 5 תווים',
      tokens: []
    };
  }
  
  var interpreted = parseHebrewCommand(text);
  
  if (!interpreted.success) {
    return {
      ok: false,
      error: interpreted.error || 'לא הצלחתי להבין את הפקודה',
      tokens: interpreted.tokens,
      warnings: interpreted.warnings || []
    };
  }
  
  if (parseOnly) {
    return {
      ok: true,
      action: 'parseNlp',
      parseOnly: true,
      interpreted: interpreted,
      warnings: interpreted.warnings || [],
      message: 'תצוגה מקדימה - לא בוצעו שינויים'
    };
  }
  
  // Execute the command
  var result;
  if (interpreted.operation === 'create') {
    result = handleCreateEvent(interpreted.event);
    result.interpreted = interpreted;
    result.warnings = interpreted.warnings || [];
  } else if (interpreted.operation === 'update') {
    result = handleUpdateEvent(interpreted.eventId, interpreted.changes);
    result.interpreted = interpreted;
    result.warnings = interpreted.warnings || [];
  } else if (interpreted.operation === 'delete') {
    result = handleDeleteEvent(interpreted.eventId);
    result.interpreted = interpreted;
    result.warnings = interpreted.warnings || [];
  } else {
    return { ok: false, error: 'פעולה לא נתמכת: ' + interpreted.operation };
  }
  
  return result;
}

/**
 * Parse Hebrew natural language command - NLP v2
 * 
 * @description Parses Hebrew text into structured event data with edge case handling
 * @param {string} text - Hebrew natural language text
 * @returns {Object} Parsed result with success status, event data, and warnings
 * 
 * Features:
 * - Operation detection (create/update/delete)
 * - Date/time extraction with Hebrew keywords
 * - Title extraction with whitespace normalization
 * - Color and reminder extraction
 * - Comprehensive warning system for edge cases
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
    warnings: []
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
    result.error = 'לא זוהה תאריך או שעה תקינים';
    return result;
  }
  
  // Extract title (words not matching other patterns)
  var title = extractTitle(tokens, dateTime);
  
  // Edge case: Empty or whitespace-only title
  var finalTitle = title;
  if (!title || title.trim().length === 0) {
    finalTitle = 'אירוע';
    // Only add warning once for missing title
    if (!result.warnings.some(function(w) { return w.indexOf('MISSING_TITLE') >= 0; })) {
      result.warnings.push('MISSING_TITLE: כותרת לא צוינה, נוצרה ברירת מחדל');
    }
  }
  
  // Extract color
  var color = extractColor(tokens);
  
  // Extract reminders
  var reminders = extractReminders(tokens);
  
  result.success = true;
  result.event = {
    title: finalTitle,
    start: dateTime.start.toISOString(),
    end: dateTime.end.toISOString(),
    color: color,
    reminders: reminders
  };
  
  return result;
}

/**
 * Tokenize Hebrew text
 * 
 * @description Splits Hebrew text into tokens with type classification
 * @param {string} text - Input text to tokenize
 * @returns {Array<Object>} Array of token objects with text, index, and type
 * @returns {string} returns[].text - Token text content
 * @returns {number} returns[].index - Token position in original text
 * @returns {string} returns[].type - Classified token type (time/date/color/reminder/number/text)
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
 * 
 * @description Determines the semantic type of a Hebrew word token
 * @param {string} word - Word to classify
 * @returns {string} Token type: 'time', 'date', 'color', 'reminder', 'number', or 'text'
 * 
 * Classification rules:
 * - time: HH:MM or HH:MM-HH:MM pattern
 * - date: Hebrew date keywords (היום, מחר, מחרתיים, etc.)
 * - color: Hebrew color names (אדום, כחול, ירוק, etc.)
 * - reminder: תזכורת or תזכורות keywords
 * - number: Pure numeric strings
 * - text: Default for all other tokens
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
 * 
 * @description Extracts start and end datetime from Hebrew tokens
 * @param {Array<Object>} tokens - Array of classified tokens
 * @returns {Object} DateTime object with start and end dates
 * @returns {Date|null} returns.start - Event start datetime
 * @returns {Date|null} returns.end - Event end datetime
 * 
 * Logic:
 * - Date: Hebrew keywords (היום=today, מחר=tomorrow, מחרתיים=day after tomorrow)
 * - Time: HH:MM patterns (two times = range, one time = +1 hour default)
 * - Returns null for both if no valid time found
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
 * 
 * @description Filters tokens to extract event title, excluding date/time/color/reminder tokens
 * @param {Array<Object>} tokens - Array of classified tokens
 * @param {Object} dateTime - Parsed date/time (unused but kept for API compatibility)
 * @returns {string} Extracted title or empty string if no title tokens found
 * 
 * Filters out:
 * - Tokens with types: time, date, color, reminder, number
 * - Skip words: תזכורת, תזכורות, צבע
 * - Pure numeric strings
 * - Time patterns (HH:MM)
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
 * 
 * @description Finds and maps Hebrew color name to English color identifier
 * @param {Array<Object>} tokens - Array of classified tokens
 * @returns {string|null} English color name or null if no color found
 * 
 * Supported colors:
 * - אדום → red, כחול → blue, ירוק → green, צהוב → yellow
 * - כתום → orange, סגול → purple, ורוד → pink, חום → brown
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
 * 
 * @description Extracts reminder times (in minutes) following תזכורת keyword
 * @param {Array<Object>} tokens - Array of classified tokens
 * @returns {Array<number>} Array of reminder times in minutes before event
 * 
 * Logic:
 * - Activates reminder context when תזכורת/תזכורות found
 * - Collects all subsequent numbers as reminder minutes
 * - Supports comma-separated numbers in single token
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
 * 
 * @description Maps English color names to Google Calendar EventColor constants
 * @returns {Object} Color mapping object
 * @returns {CalendarApp.EventColor} returns.red - Red event color
 * @returns {CalendarApp.EventColor} returns.blue - Blue event color
 * @returns {CalendarApp.EventColor} returns.green - Green event color
 * @returns {CalendarApp.EventColor} returns.yellow - Yellow event color
 * @returns {CalendarApp.EventColor} returns.orange - Orange event color
 * @returns {CalendarApp.EventColor} returns.purple - Purple (Pale Blue) event color
 * @returns {CalendarApp.EventColor} returns.pink - Pink (Pale Red) event color
 * @returns {CalendarApp.EventColor} returns.brown - Brown (Gray) event color
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
 * 
 * @description Converts Google CalendarEvent to plain object for JSON serialization
 * @param {CalendarApp.CalendarEvent} event - Calendar event to serialize
 * @returns {Object} Serialized event object
 * @returns {string} returns.id - Unique event identifier
 * @returns {string} returns.title - Event title
 * @returns {string} returns.start - Start time (ISO format)
 * @returns {string} returns.end - End time (ISO format)
 * @returns {boolean} returns.allDay - Whether event is all-day
 * @returns {string} returns.description - Event description (empty string if not set)
 * @returns {string} returns.location - Event location (empty string if not set)
 * @returns {string} returns.color - Event color (empty string if not set)
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
