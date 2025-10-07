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
        response = handleSuggestSlots(payload.options || {});
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
 * Handle createEvent action (NLP v2 - with all-day, series, guests support)
 */
function handleCreateEvent(eventData) {
  var cal = CalendarApp.getDefaultCalendar();
  var title = eventData.title || 'ללא כותרת';
  var start = new Date(eventData.start);
  var end = new Date(eventData.end);
  
  var options = {};
  if (eventData.description) options.description = eventData.description;
  if (eventData.location) options.location = eventData.location;
  
  var event;
  var messageDetails = [];
  
  // Create event based on type
  if (eventData.allDay && eventData.recurrence) {
    // All-day recurring event
    var recurrence = buildRecurrenceRule(eventData.recurrence, start);
    event = cal.createAllDayEventSeries(title, start, recurrence, options);
    messageDetails.push('כל היום');
    messageDetails.push('חוזר');
  } else if (eventData.allDay) {
    // All-day single event
    event = cal.createAllDayEvent(title, start, options);
    messageDetails.push('כל היום');
  } else if (eventData.recurrence) {
    // Regular recurring event
    var recurrence = buildRecurrenceRule(eventData.recurrence, start);
    event = cal.createEventSeries(title, start, end, recurrence, options);
    messageDetails.push('חוזר');
  } else {
    // Regular single event
    event = cal.createEvent(title, start, end, options);
  }
  
  // Set color if provided
  if (eventData.color) {
    try {
      var colorMap = getColorMap();
      var colorId = colorMap[eventData.color.toLowerCase()];
      if (colorId) {
        event.setColor(colorId);
        messageDetails.push('צבע: ' + eventData.color);
      }
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
    messageDetails.push('תזכורות: ' + eventData.reminders.join(','));
  }
  
  // Add guests if provided
  if (eventData.guests && eventData.guests.length > 0) {
    eventData.guests.forEach(function(email) {
      try {
        event.addGuest(email);
      } catch (e) {
        // Guest addition may fail, continue
      }
    });
    messageDetails.push('משתתפים: ' + eventData.guests.length);
  }
  
  var serialized = serializeEvent(event);
  
  var message = 'האירוע נוצר בהצלחה: ' + title;
  if (messageDetails.length > 0) {
    message += ' (' + messageDetails.join(', ') + ')';
  }
  
  return {
    ok: true,
    action: 'createEvent',
    message: message,
    event: serialized
  };
}

/**
 * Build CalendarApp recurrence rule from parsed recurrence object
 */
function buildRecurrenceRule(recurrence, startDate) {
  var rule;
  
  if (recurrence.type === 'daily') {
    rule = CalendarApp.newRecurrence().addDailyRule();
  } else if (recurrence.type === 'weekly' && recurrence.weekday !== undefined) {
    var weekdayEnum = [
      CalendarApp.Weekday.SUNDAY,
      CalendarApp.Weekday.MONDAY,
      CalendarApp.Weekday.TUESDAY,
      CalendarApp.Weekday.WEDNESDAY,
      CalendarApp.Weekday.THURSDAY,
      CalendarApp.Weekday.FRIDAY,
      CalendarApp.Weekday.SATURDAY
    ];
    rule = CalendarApp.newRecurrence().addWeeklyRule().onlyOnWeekday(weekdayEnum[recurrence.weekday]);
  } else {
    // Default to weekly
    rule = CalendarApp.newRecurrence().addWeeklyRule();
  }
  
  // Add end condition if specified
  if (recurrence.until) {
    rule.until(new Date(recurrence.until));
  } else if (recurrence.times) {
    rule.times(recurrence.times);
  }
  
  return rule;
}

/**
 * Handle updateEvent action (NLP v2 - with guest management)
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
  
  // Add guests (NLP v2)
  if (changes.guestsAdd && changes.guestsAdd.length > 0) {
    changes.guestsAdd.forEach(function(email) {
      try {
        event.addGuest(email);
      } catch (e) {
        // Guest addition may fail
      }
    });
    changedFields.push('משתתפים נוספו: ' + changes.guestsAdd.length);
  }
  
  // Remove guests (NLP v2)
  if (changes.guestsRemove && changes.guestsRemove.length > 0) {
    changes.guestsRemove.forEach(function(email) {
      try {
        event.removeGuest(email);
      } catch (e) {
        // Guest removal may fail
      }
    });
    changedFields.push('משתתפים הוסרו: ' + changes.guestsRemove.length);
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
 * Handle suggestSlots action - Find free time slots (NLP v2)
 */
function handleSuggestSlots(options) {
  var cal = CalendarApp.getDefaultCalendar();
  
  // Parse options with defaults
  var durationMinutes = options.durationMinutes || 60;
  var now = new Date();
  var timeMin = options.timeMin ? new Date(options.timeMin) : now;
  var timeMax = options.timeMax ? new Date(options.timeMax) : new Date(now.getTime() + 7*24*60*60*1000);
  var maxSuggestions = options.maxSuggestions || 3;
  var partOfDay = options.partOfDay || null;
  
  // Parse Hebrew part-of-day synonyms
  if (partOfDay) {
    if (partOfDay.indexOf('בוקר') >= 0) partOfDay = 'morning';
    else if (partOfDay.indexOf('צהריים') >= 0 || partOfDay.indexOf('צהרים') >= 0) partOfDay = 'noon';
    else if (partOfDay.indexOf('אחר') >= 0 && partOfDay.indexOf('צהריים') >= 0) partOfDay = 'afternoon';
    else if (partOfDay.indexOf('ערב') >= 0) partOfDay = 'evening';
  }
  
  // Get all events in time range
  var events = cal.getEvents(timeMin, timeMax);
  
  // Build busy intervals
  var busyIntervals = [];
  events.forEach(function(event) {
    busyIntervals.push({
      start: event.getStartTime(),
      end: event.getEndTime()
    });
  });
  
  // Sort busy intervals by start time
  busyIntervals.sort(function(a, b) {
    return a.start.getTime() - b.start.getTime();
  });
  
  // Find free slots
  var freeSlots = [];
  var currentTime = new Date(timeMin);
  
  // Iterate through each day in the range
  while (currentTime < timeMax && freeSlots.length < maxSuggestions) {
    var dayStart = new Date(currentTime);
    dayStart.setHours(0, 0, 0, 0);
    var dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);
    
    // Define part-of-day ranges for this day
    var ranges = getPartOfDayRanges(dayStart, partOfDay);
    
    // Check each range
    ranges.forEach(function(range) {
      if (freeSlots.length >= maxSuggestions) return;
      
      var slotStart = range.start;
      
      // Look for free slots within this range
      while (slotStart < range.end && freeSlots.length < maxSuggestions) {
        var slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);
        
        // Check if slot extends beyond range
        if (slotEnd > range.end) break;
        
        // Check if slot conflicts with busy intervals
        var isFree = true;
        for (var i = 0; i < busyIntervals.length; i++) {
          var busy = busyIntervals[i];
          if (slotStart < busy.end && slotEnd > busy.start) {
            // Conflict found, move to after this busy interval
            isFree = false;
            slotStart = new Date(busy.end);
            break;
          }
        }
        
        if (isFree && slotStart >= timeMin) {
          freeSlots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            lengthMinutes: durationMinutes
          });
          // Move to next potential slot (15 min increments)
          slotStart = new Date(slotStart.getTime() + 15 * 60 * 1000);
        }
      }
    });
    
    // Move to next day
    currentTime.setDate(currentTime.getDate() + 1);
    currentTime.setHours(0, 0, 0, 0);
  }
  
  return {
    ok: true,
    action: 'suggestSlots',
    message: 'נמצאו ' + freeSlots.length + ' חלונות זמן פנויים',
    suggestions: freeSlots,
    count: freeSlots.length
  };
}

/**
 * Get part-of-day time ranges for a given date
 */
function getPartOfDayRanges(dayStart, partOfDay) {
  var ranges = [];
  
  if (!partOfDay || partOfDay === 'morning') {
    var morningStart = new Date(dayStart);
    morningStart.setHours(8, 0, 0, 0);
    var morningEnd = new Date(dayStart);
    morningEnd.setHours(12, 0, 0, 0);
    ranges.push({ start: morningStart, end: morningEnd });
  }
  
  if (!partOfDay || partOfDay === 'noon') {
    var noonStart = new Date(dayStart);
    noonStart.setHours(12, 0, 0, 0);
    var noonEnd = new Date(dayStart);
    noonEnd.setHours(14, 0, 0, 0);
    ranges.push({ start: noonStart, end: noonEnd });
  }
  
  if (!partOfDay || partOfDay === 'afternoon') {
    var afternoonStart = new Date(dayStart);
    afternoonStart.setHours(14, 0, 0, 0);
    var afternoonEnd = new Date(dayStart);
    afternoonEnd.setHours(18, 0, 0, 0);
    ranges.push({ start: afternoonStart, end: afternoonEnd });
  }
  
  if (!partOfDay || partOfDay === 'evening') {
    var eveningStart = new Date(dayStart);
    eveningStart.setHours(18, 0, 0, 0);
    var eveningEnd = new Date(dayStart);
    eveningEnd.setHours(22, 0, 0, 0);
    ranges.push({ start: eveningStart, end: eveningEnd });
  }
  
  return ranges;
}

/**
 * Handle parseNlp action - Hebrew Natural Language Processing v2
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
 * Parse Hebrew natural language command - NLP v2 (Enhanced)
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
  
  // Check for all-day event
  var allDay = detectAllDay(tokens, text);
  
  // Parse date/time
  var dateTime = parseDateTimeFromTokens(tokens);
  
  // For all-day events, we need at least a date
  if (allDay) {
    if (!dateTime.start) {
      result.error = 'לא זוהה תאריך';
      return result;
    }
    // Set to full day
    dateTime.start.setHours(0, 0, 0, 0);
    dateTime.end = new Date(dateTime.start);
    dateTime.end.setDate(dateTime.end.getDate() + 1);
    dateTime.end.setHours(0, 0, 0, 0);
  } else {
    // Regular event needs start and end times
    if (!dateTime.start || !dateTime.end) {
      result.error = 'לא זוהה תאריך או שעה';
      return result;
    }
  }
  
  // Parse duration if specified
  var durationMinutes = parseDurationPhrase(tokens, text);
  if (durationMinutes && !allDay) {
    // Override end time with duration
    dateTime.end = new Date(dateTime.start);
    dateTime.end.setMinutes(dateTime.end.getMinutes() + durationMinutes);
  }
  
  // Extract title (words not matching other patterns)
  var title = extractTitle(tokens, dateTime);
  
  // Extract color
  var color = extractColor(tokens);
  
  // Extract reminders
  var reminders = extractReminders(tokens);
  
  // Parse guests
  var guests = parseGuests(text);
  
  // Parse recurrence
  var recurrence = parseRecurrence(tokens, dateTime.start, text);
  
  // Validate recurrence
  if (recurrence) {
    // Check for unsupported patterns (multiple weekdays not supported in Phase A)
    if (recurrence.type === 'weekly' && recurrence.weekday === undefined && !recurrence.times) {
      result.error = 'דפוס חזרה לא נתמך - יש לציין יום בשבוע ספציפי';
      result.success = false;
      return result;
    }
  }
  
  result.success = true;
  result.event = {
    title: title || 'אירוע',
    start: dateTime.start.toISOString(),
    end: dateTime.end.toISOString(),
    color: color,
    reminders: reminders,
    guests: guests || [],
    allDay: allDay,
    durationMinutes: durationMinutes,
    recurrence: recurrence
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
 * Classify token type (NLP v2 - enhanced)
 */
function classifyToken(word) {
  // Time pattern: HH:MM or HH:MM-HH:MM
  if (/^\d{1,2}:\d{2}/.test(word)) return 'time';
  
  // Date keywords and patterns
  var dateKeywords = ['היום', 'מחר', 'מחרתיים', 'שלשום', 'יום', 'ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  if (dateKeywords.some(function(kw) { return word.indexOf(kw) >= 0; })) return 'date';
  
  // Date patterns: DD.MM, DD/MM, DD.MM.YYYY
  if (/^\d{1,2}[\.\/]\d{1,2}(?:[\.\/]\d{2,4})?$/.test(word)) return 'date';
  
  // Color keywords (expanded)
  var colorKeywords = ['אדום', 'כחול', 'תכלת', 'ירוק', 'צהוב', 'כתום', 'סגול', 'ורוד', 'חום', 'אפור', 'שחור'];
  if (colorKeywords.some(function(kw) { return word.indexOf(kw) >= 0; })) return 'color';
  
  // Reminder keywords
  if (word.indexOf('תזכורת') >= 0 || word.indexOf('תזכורות') >= 0) return 'reminder';
  
  // Duration keywords
  if (word.indexOf('דקות') >= 0 || word.indexOf('דק\'') >= 0 || word.indexOf('דק') >= 0 || word === 'שעה' || word === 'שעתיים' || word === 'חצי') return 'duration';
  
  // Numbers (for reminders, duration)
  if (/^\d+$/.test(word)) return 'number';
  
  return 'text';
}

/**
 * Parse date and time from tokens (NLP v2 - enhanced)
 */
function parseDateTimeFromTokens(tokens) {
  var result = { start: null, end: null };
  var baseDate = new Date();
  var foundExplicitDate = false;
  
  // Look for explicit date patterns first: DD.MM, DD/MM, DD.MM.YYYY, DD/MM/YYYY
  for (var i = 0; i < tokens.length; i++) {
    var word = tokens[i].text;
    var dateMatch = word.match(/^(\d{1,2})[\.\/](\d{1,2})(?:[\.\/](\d{2,4}))?$/);
    if (dateMatch) {
      var day = parseInt(dateMatch[1]);
      var month = parseInt(dateMatch[2]) - 1; // 0-indexed
      var year = dateMatch[3] ? parseInt(dateMatch[3]) : baseDate.getFullYear();
      if (year < 100) year += 2000; // Handle 2-digit years
      baseDate = new Date(year, month, day);
      foundExplicitDate = true;
      break;
    }
  }
  
  // Look for weekday patterns (next occurrence)
  if (!foundExplicitDate) {
    for (var i = 0; i < tokens.length; i++) {
      var word = tokens[i].text;
      var weekday = parseWeekday(word);
      if (weekday !== null) {
        var today = new Date();
        var currentWeekday = today.getDay();
        var daysUntil = (weekday - currentWeekday + 7) % 7;
        if (daysUntil === 0) daysUntil = 7; // Next week if same day
        baseDate = new Date(today);
        baseDate.setDate(baseDate.getDate() + daysUntil);
        foundExplicitDate = true;
        break;
      }
    }
  }
  
  // Look for date keywords
  if (!foundExplicitDate) {
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
  }
  
  // Look for time patterns: HH:MM or HH:MM-HH:MM
  var timePattern = /(\d{1,2}):(\d{2})/g;
  var times = [];
  tokens.forEach(function(token) {
    var match;
    var text = token.text;
    while ((match = timePattern.exec(text)) !== null) {
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
  } else if (foundExplicitDate || tokens.some(function(t) { return t.type === 'date'; })) {
    // Date found but no time - set to start of day for all-day processing
    result.start = new Date(baseDate);
    result.start.setHours(0, 0, 0, 0);
  }
  
  return result;
}

/**
 * Extract title from tokens (NLP v2 - enhanced)
 */
function extractTitle(tokens, dateTime) {
  var titleWords = [];
  var skipTypes = ['time', 'date', 'color', 'reminder', 'number', 'duration'];
  var skipWords = ['תזכורת', 'תזכורות', 'צבע', 'כל', 'עם', 'משתתפים', 'עד', 'פעמים'];
  
  tokens.forEach(function(token) {
    if (skipTypes.indexOf(token.type) >= 0) return;
    if (skipWords.some(function(sw) { return token.text.indexOf(sw) >= 0; })) return;
    if (/^\d+$/.test(token.text)) return;
    if (/\d{1,2}:\d{2}/.test(token.text)) return;
    if (/@/.test(token.text)) return; // Skip emails
    titleWords.push(token.text);
  });
  
  return titleWords.join(' ');
}

/**
 * Extract color from tokens (NLP v2 - expanded)
 */
function extractColor(tokens) {
  var colorMap = getExpandedHebrewColorMap();
  
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
 * Extract reminders from tokens (NLP v2 - enhanced)
 */
function extractReminders(tokens) {
  var reminders = [];
  var inReminderContext = false;
  
  for (var i = 0; i < tokens.length; i++) {
    if (tokens[i].text.indexOf('תזכורת') >= 0 || tokens[i].text.indexOf('תזכורות') >= 0) {
      inReminderContext = true;
      
      // Check for attached number: "תזכורת10"
      var match = tokens[i].text.match(/(\d+)/);
      if (match) {
        reminders.push(parseInt(match[1]));
      }
      continue;
    }
    
    if (inReminderContext) {
      // Look for standalone numbers
      if (tokens[i].type === 'number') {
        reminders.push(parseInt(tokens[i].text));
      }
      
      // Look for comma-separated numbers: "30,10,5"
      var nums = tokens[i].text.split(',');
      nums.forEach(function(n) {
        if (/^\d+$/.test(n.trim())) {
          reminders.push(parseInt(n.trim()));
        }
      });
      
      // Look for "15 דקות" pattern
      if (/^\d+$/.test(tokens[i].text) && i + 1 < tokens.length && 
          tokens[i + 1].text.indexOf('דק') >= 0) {
        // Already captured
      }
    }
  }
  
  return reminders;
}

/**
 * Parse duration phrase from tokens (NLP v2)
 */
function parseDurationPhrase(tokens, text) {
  var durationMinutes = null;
  
  // Check for patterns
  for (var i = 0; i < tokens.length; i++) {
    var word = tokens[i].text;
    
    // "חצי שעה"
    if (word === 'חצי' && i + 1 < tokens.length && tokens[i + 1].text === 'שעה') {
      durationMinutes = 30;
      break;
    }
    
    // "שעה" or "שעתיים" or pattern like "45 דקות" or "90 דק'"
    if (word === 'שעה') {
      durationMinutes = 60;
    } else if (word === 'שעתיים') {
      durationMinutes = 120;
    } else if (word.indexOf('דקות') >= 0 || word.indexOf('דק\'') >= 0 || word.indexOf('דק') >= 0) {
      // Look for number before this token
      if (i > 0 && /^\d+$/.test(tokens[i - 1].text)) {
        durationMinutes = parseInt(tokens[i - 1].text);
        break;
      }
      // Or number attached: "45דקות"
      var match = word.match(/^(\d+)/);
      if (match) {
        durationMinutes = parseInt(match[1]);
        break;
      }
    }
  }
  
  return durationMinutes;
}

/**
 * Detect all-day event from tokens (NLP v2)
 */
function detectAllDay(tokens, text) {
  // Check for explicit all-day phrases
  for (var i = 0; i < tokens.length; i++) {
    var word = tokens[i].text;
    if (word === 'כל' && i + 1 < tokens.length && tokens[i + 1].text === 'היום') {
      return true;
    }
    if (word === 'יום' && i + 1 < tokens.length && tokens[i + 1].text === 'מלא') {
      return true;
    }
  }
  
  // Check if there's a date but no time tokens
  var hasDate = tokens.some(function(t) { return t.type === 'date'; });
  var hasTime = tokens.some(function(t) { return t.type === 'time'; });
  
  return hasDate && !hasTime;
}

/**
 * Parse guest emails from text (NLP v2)
 */
function parseGuests(text) {
  var guests = [];
  var emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  var matches = text.match(emailRegex);
  
  if (matches) {
    guests = matches;
  }
  
  return guests;
}

/**
 * Parse Hebrew weekday name to number (0=Sunday, 6=Saturday)
 */
function parseWeekday(word) {
  var weekdayMap = {
    'ראשון': 0,
    'שני': 1,
    'שלישי': 2,
    'רביעי': 3,
    'חמישי': 4,
    'שישי': 5,
    'שבת': 6
  };
  
  for (var day in weekdayMap) {
    if (word.indexOf(day) >= 0) {
      return weekdayMap[day];
    }
  }
  
  return null;
}

/**
 * Parse recurrence pattern from tokens (NLP v2)
 */
function parseRecurrence(tokens, baseDate, text) {
  var recurrence = null;
  
  for (var i = 0; i < tokens.length; i++) {
    var word = tokens[i].text;
    
    // "כל יום" - daily
    if (word === 'כל' && i + 1 < tokens.length && tokens[i + 1].text === 'יום') {
      // Check if next token is a weekday (e.g., "כל יום שני")
      if (i + 2 < tokens.length) {
        var weekday = parseWeekday(tokens[i + 2].text);
        if (weekday !== null) {
          recurrence = { type: 'weekly', weekday: weekday };
        } else {
          recurrence = { type: 'daily' };
        }
      } else {
        recurrence = { type: 'daily' };
      }
      break;
    }
    
    // "כל שני", "כל שלישי", etc. - weekly
    if (word === 'כל') {
      if (i + 1 < tokens.length) {
        var wd = parseWeekday(tokens[i + 1].text);
        if (wd !== null) {
          recurrence = { type: 'weekly', weekday: wd };
          break;
        }
      }
    }
  }
  
  // Parse end date if recurrence found
  if (recurrence) {
    // Look for "עד" patterns
    for (var j = 0; j < tokens.length; j++) {
      if (tokens[j].text === 'עד') {
        // "עד סוף דצמבר", "עד 31.12", "עד 31/12", "עד 31/12/2025"
        if (j + 1 < tokens.length) {
          var nextToken = tokens[j + 1].text;
          
          // Check for "סוף חודש"
          if (nextToken === 'סוף' && j + 2 < tokens.length) {
            var month = parseHebrewMonth(tokens[j + 2].text);
            if (month !== null) {
              var year = baseDate.getFullYear();
              var untilDate = new Date(year, month + 1, 0); // Last day of month
              recurrence.until = untilDate.toISOString();
            }
          }
          
          // Check for date patterns: DD.MM, DD/MM, DD/MM/YYYY, DD.MM.YYYY
          var dateMatch = nextToken.match(/^(\d{1,2})[\.\/](\d{1,2})(?:[\.\/](\d{2,4}))?$/);
          if (dateMatch) {
            var day = parseInt(dateMatch[1]);
            var mon = parseInt(dateMatch[2]) - 1; // 0-indexed
            var yr = dateMatch[3] ? parseInt(dateMatch[3]) : baseDate.getFullYear();
            if (yr < 100) yr += 2000; // Handle 2-digit years
            var untilDate = new Date(yr, mon, day, 23, 59, 59);
            recurrence.until = untilDate.toISOString();
          }
        }
        break;
      }
      
      // "ל-5 פעמים" or "5 פעמים"
      if (tokens[j].text === 'פעמים') {
        if (j > 0) {
          var prevText = tokens[j - 1].text;
          var timesMatch = prevText.match(/^ל?-?(\d+)$/);
          if (timesMatch) {
            recurrence.times = parseInt(timesMatch[1]);
          } else if (/^\d+$/.test(prevText)) {
            recurrence.times = parseInt(prevText);
          }
        }
      }
    }
  }
  
  return recurrence;
}

/**
 * Parse Hebrew month name to number (0-indexed)
 */
function parseHebrewMonth(word) {
  var monthMap = {
    'ינואר': 0,
    'פברואר': 1,
    'מרץ': 2,
    'מרס': 2,
    'אפריל': 3,
    'מאי': 4,
    'יוני': 5,
    'יולי': 6,
    'אוגוסט': 7,
    'ספטמבר': 8,
    'אוקטובר': 9,
    'נובמבר': 10,
    'דצמבר': 11
  };
  
  for (var month in monthMap) {
    if (word.indexOf(month) >= 0) {
      return monthMap[month];
    }
  }
  
  return null;
}

/**
 * Expand color mapping with synonyms (NLP v2)
 */
function getExpandedHebrewColorMap() {
  return {
    'אדום': 'red',
    'כחול': 'blue',
    'תכלת': 'blue',
    'ירוק': 'green',
    'צהוב': 'yellow',
    'כתום': 'orange',
    'סגול': 'purple',
    'ורוד': 'pink',
    'חום': 'brown',
    'אפור': 'gray',
    'שחור': 'gray'
  };
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
    'purple': CalendarApp.EventColor.PURPLE,
    'pink': CalendarApp.EventColor.PALE_RED,
    'brown': CalendarApp.EventColor.GRAY,
    'gray': CalendarApp.EventColor.GRAY
  };
}

/**
 * Serialize CalendarEvent to JSON-safe object (NLP v2 - with guests & recurrence)
 */
function serializeEvent(event) {
  var result = {
    id: event.getId(),
    title: event.getTitle(),
    start: event.getStartTime().toISOString(),
    end: event.getEndTime().toISOString(),
    allDay: event.isAllDayEvent(),
    description: event.getDescription() || '',
    location: event.getLocation() || '',
    color: event.getColor() || ''
  };
  
  // Add guests (attendees)
  try {
    var guests = event.getGuestList();
    if (guests && guests.length > 0) {
      result.guests = guests.map(function(guest) {
        return guest.getEmail();
      });
    } else {
      result.guests = [];
    }
  } catch (e) {
    result.guests = [];
  }
  
  // Add recurrence summary if applicable
  try {
    var eventSeries = event.getEventSeries();
    if (eventSeries) {
      var recurrenceText = 'חוזר';
      result.recurrenceText = recurrenceText;
    }
  } catch (e) {
    // Not a recurring event
  }
  
  return result;
}
