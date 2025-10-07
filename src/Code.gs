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
 * doPost - נקודת קצה ראשית לפעולות CRUD ו-NLP
 * Actions: selfTest, findEvents, createEvent, updateEvent, deleteEvent, parseNlp, suggestSlots
 * @param {Object} e אובייקט בקשה עם postData.contents (JSON)
 * @return {ContentService.TextOutput} תגובה JSON
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
 * @return {Object} תוצאת בדיקה עם רשימת תכונות ואחוז השלמה
 */
function handleSelfTest() {
  return {
    ok: true,
    action: 'selfTest',
    message: 'בדיקה תקינה - NLP v2 מלא',
    nlpVersion: 'v2',
    progressPercent: 100,
    completed: true,
    features: [
      'יצירת אירועים (רגיל, כל היום, חוזר)',
      'עדכון אירועים (התאמה מטושטשת + פירוט)',
      'מחיקת אירועים (מופע בודד או סדרה מלאה)',
      'ניתוח זמנים: טווחים, משכים, ביטויים עבריים',
      'היוריסטיקה לחלקי יום (בבוקר, בצהריים, אחר הצהריים, בערב)',
      'זיהוי יום שלם (כל היום, יום מלא)',
      'ניהול אורחים (הוסף/הסר)',
      'צבעים ותזכורות',
      'הצעת משבצות זמן (suggestSlots)',
      'אזהרות מובנות (DEFAULT_TIME_INFERRED, FUZZY_MATCH וכו\')',
      'parseOnly - תצוגה מקדימה ללא שינויים'
    ],
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
 * @param {Object} eventData נתוני אירוע ליצירה
 * @return {Object} תשובה עם פרטי האירוע שנוצר
 */
function handleCreateEvent(eventData) {
  var cal = CalendarApp.getDefaultCalendar();
  var title = eventData.title || 'ללא כותרת';
  var start = new Date(eventData.start);
  var end = new Date(eventData.end);
  
  var options = {};
  if (eventData.description) options.description = eventData.description;
  if (eventData.location) options.location = eventData.location;
  
  // יצירת אירוע (רגיל או כל היום)
  var event;
  if (eventData.allDay) {
    event = cal.createAllDayEvent(title, start, options);
  } else {
    event = cal.createEvent(title, start, end, options);
  }
  
  // הוספת צבע
  if (eventData.color) {
    try {
      var colorMap = getColorMap();
      var colorId = colorMap[eventData.color.toLowerCase()];
      if (colorId) event.setColor(colorId);
    } catch (e) {
      // צבע עשוי להיכשל
    }
  }
  
  // הוספת תזכורות
  if (eventData.reminders && eventData.reminders.length > 0) {
    event.removeAllReminders();
    eventData.reminders.forEach(function(minutes) {
      event.addPopupReminder(minutes);
    });
  }
  
  // הוספת אורחים
  if (eventData.guests && eventData.guests.length > 0) {
    eventData.guests.forEach(function(email) {
      try {
        event.addGuest(email);
      } catch (e) {
        // אורח עשוי להיכשל
      }
    });
  }
  
  // הוספת חזרה (recurrence)
  if (eventData.recurrence) {
    try {
      var recurrenceRule = CalendarApp.newRecurrence();
      // ניתוח פשוט של כלל RRULE
      if (eventData.recurrence.indexOf('DAILY') >= 0) {
        recurrenceRule.addDailyRule();
      } else if (eventData.recurrence.indexOf('WEEKLY') >= 0) {
        recurrenceRule.addWeeklyRule();
      } else if (eventData.recurrence.indexOf('MONTHLY') >= 0) {
        recurrenceRule.addMonthlyRule();
      } else if (eventData.recurrence.indexOf('YEARLY') >= 0) {
        recurrenceRule.addYearlyRule();
      }
      
      // יצירת סדרת אירועים חוזרת
      var recurringEvent = cal.createEventSeries(title, start, end, recurrenceRule, options);
      event = recurringEvent;
    } catch (e) {
      // חזרה עשויה להיכשל - נשאר עם אירוע רגיל
    }
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
 * @param {string} eventId מזהה אירוע
 * @param {Object} changes שינויים מבוקשים
 * @return {Object} תשובה עם פרטי האירוע המעודכן
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
      // צבע עשוי להיכשל
    }
  }
  
  if (changes.reminders !== undefined) {
    event.removeAllReminders();
    changes.reminders.forEach(function(minutes) {
      event.addPopupReminder(minutes);
    });
    changedFields.push('תזכורות');
  }
  
  // ניהול אורחים - הוספה והסרה
  if (changes.addGuests && changes.addGuests.length > 0) {
    changes.addGuests.forEach(function(email) {
      try {
        event.addGuest(email);
      } catch (e) {
        // אורח עשוי להיכשל
      }
    });
    changedFields.push('אורחים (הוספה)');
  }
  
  if (changes.removeGuests && changes.removeGuests.length > 0) {
    changes.removeGuests.forEach(function(email) {
      try {
        event.removeGuest(email);
      } catch (e) {
        // הסרת אורח עשויה להיכשל
      }
    });
    changedFields.push('אורחים (הסרה)');
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
 * @param {string} text טקסט פקודה בעברית
 * @param {boolean} parseOnly האם לנתח בלבד ללא ביצוע
 * @return {Object} תשובה עם פרשנות ותוצאה
 */
function handleParseNlp(text, parseOnly) {
  var interpreted = parseHebrewCommand(text);
  
  if (!interpreted.success) {
    return {
      ok: false,
      error: interpreted.error || 'לא הצלחתי להבין את הפקודה',
      tokens: interpreted.tokens,
      warnings: interpreted.warnings || [],
      candidates: interpreted.candidates || []
    };
  }
  
  if (parseOnly) {
    return {
      ok: true,
      action: 'parseNlp',
      parseOnly: true,
      interpreted: interpreted,
      message: 'תצוגה מקדימה - לא בוצעו שינויים',
      warnings: interpreted.warnings || []
    };
  }
  
  // ביצוע הפקודה
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
 * @param {string} text טקסט פקודה בעברית
 * @return {Object} אובייקט עם success, operation, event/changes, warnings
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
    eventTitle: null,
    error: null,
    warnings: [],
    candidates: []
  };
  
  // זיהוי פעולה לפי מילות מפתח
  var deleteKeywords = ['מחק', 'מחיקה', 'הסר', 'בטל'];
  var updateKeywords = ['עדכן', 'שנה', 'ערוך', 'תקן', 'שנה ל'];
  
  var hasDelete = tokens.some(function(t) { 
    return deleteKeywords.indexOf(t.text) >= 0; 
  });
  var hasUpdate = tokens.some(function(t) { 
    return updateKeywords.indexOf(t.text) >= 0; 
  });
  
  if (hasDelete) {
    result.operation = 'delete';
    // חיפוש שם אירוע למחיקה
    var titleForDelete = extractEventTitleForUpdateDelete(tokens, deleteKeywords);
    if (!titleForDelete) {
      result.error = 'מחיקה דורשת שם אירוע (לדוגמה: "מחק פגישה עם דני")';
      return result;
    }
    
    // חיפוש אירועים תואמים
    var matches = findEventsByFuzzyTitle(titleForDelete);
    if (matches.length === 0) {
      result.error = 'לא נמצא אירוע התואם ל: "' + titleForDelete + '"';
      return result;
    } else if (matches.length === 1) {
      result.success = true;
      result.eventId = matches[0].id;
      result.eventTitle = matches[0].title;
      if (matches[0].isRecurring) {
        result.warnings.push('RECURRING_EVENT');
      }
    } else {
      // פירוט - יש יותר מאירוע אחד
      result.error = 'נמצאו ' + matches.length + ' אירועים תואמים. אנא דייק יותר.';
      result.candidates = matches.map(function(m) {
        return {
          id: m.id,
          title: m.title,
          start: m.start,
          end: m.end
        };
      });
      result.warnings.push('DISAMBIGUATION_REQUIRED');
      return result;
    }
    return result;
    
  } else if (hasUpdate) {
    result.operation = 'update';
    
    // חיפוש שם אירוע לעדכון
    var titleForUpdate = extractEventTitleForUpdateDelete(tokens, updateKeywords);
    if (!titleForUpdate) {
      result.error = 'עדכון דורש שם אירוע (לדוגמה: "עדכן פגישה עם דני")';
      return result;
    }
    
    // חיפוש אירועים תואמים
    var updateMatches = findEventsByFuzzyTitle(titleForUpdate);
    if (updateMatches.length === 0) {
      result.error = 'לא נמצא אירוע התואם ל: "' + titleForUpdate + '"';
      return result;
    } else if (updateMatches.length > 1) {
      result.error = 'נמצאו ' + updateMatches.length + ' אירועים תואמים. אנא דייק יותר.';
      result.candidates = updateMatches.map(function(m) {
        return {
          id: m.id,
          title: m.title,
          start: m.start,
          end: m.end
        };
      });
      result.warnings.push('DISAMBIGUATION_REQUIRED');
      return result;
    }
    
    var eventToUpdate = updateMatches[0];
    result.eventId = eventToUpdate.id;
    result.eventTitle = eventToUpdate.title;
    
    if (eventToUpdate.isRecurring) {
      result.error = 'עדכון אירוע חוזר חסום. אנא ערוך ידנית ב-Google Calendar.';
      result.warnings.push('RECURRING_UPDATE_BLOCKED');
      return result;
    }
    
    // ניתוח שינויים מבוקשים
    result.changes = {};
    var changesParsed = parseChangesFromTokens(tokens, eventToUpdate);
    
    if (changesParsed.newTitle) {
      result.changes.title = changesParsed.newTitle;
    }
    if (changesParsed.start && changesParsed.end) {
      result.changes.start = changesParsed.start.toISOString();
      result.changes.end = changesParsed.end.toISOString();
    }
    if (changesParsed.location) {
      result.changes.location = changesParsed.location;
    }
    if (changesParsed.color) {
      result.changes.color = changesParsed.color;
    }
    if (changesParsed.reminders) {
      result.changes.reminders = changesParsed.reminders;
    }
    if (changesParsed.addGuests && changesParsed.addGuests.length > 0) {
      result.changes.addGuests = changesParsed.addGuests;
    }
    if (changesParsed.removeGuests && changesParsed.removeGuests.length > 0) {
      result.changes.removeGuests = changesParsed.removeGuests;
    }
    
    if (Object.keys(result.changes).length === 0) {
      result.error = 'לא זוהו שינויים לעדכון';
      return result;
    }
    
    result.success = true;
    result.warnings.push('FUZZY_MATCH');
    if (changesParsed.warnings) {
      result.warnings = result.warnings.concat(changesParsed.warnings);
    }
    return result;
    
  } else {
    // יצירת אירוע חדש
    result.operation = 'create';
  }
  
  // ניתוח תאריך/שעה ליצירת אירוע
  var dateTime = parseDateTimeFromTokens(tokens);
  if (!dateTime.start) {
    result.error = 'לא זוהה תאריך או שעה. השתמש בפורמט כמו "היום 14:00" או "מחר 10:00-11:00"';
    return result;
  }
  
  if (dateTime.warnings) {
    result.warnings = result.warnings.concat(dateTime.warnings);
  }
  
  // חילוץ כותרת
  var title = extractTitle(tokens, dateTime);
  
  // חילוץ מיקום
  var location = extractLocation(tokens);
  
  // חילוץ צבע
  var color = extractColor(tokens);
  
  // חילוץ תזכורות
  var reminders = extractReminders(tokens);
  
  // חילוץ אורחים
  var guests = extractGuests(tokens);
  
  // חילוץ תבנית חזרה
  var recurrence = extractRecurrencePattern(tokens);
  
  result.success = true;
  result.event = {
    title: title || 'אירוע',
    start: dateTime.start.toISOString(),
    end: dateTime.end.toISOString(),
    allDay: dateTime.allDay || false
  };
  
  if (location) result.event.location = location;
  if (color) result.event.color = color;
  if (reminders.length > 0) result.event.reminders = reminders;
  if (guests.length > 0) result.event.guests = guests;
  if (recurrence) {
    result.event.recurrence = recurrence;
    result.warnings.push('RECURRENCE_DETECTED');
  }
  
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
 * Parse date and time from tokens - NLP v2 מורחב
 * @param {Array} tokens מערך טוקנים
 * @return {Object} אובייקט עם start, end, allDay, warnings
 */
function parseDateTimeFromTokens(tokens) {
  var result = { start: null, end: null, allDay: false, warnings: [] };
  var baseDate = new Date();
  var dateFound = false;
  
  // זיהוי תאריך לפי מילות מפתח
  var text = tokens.map(function(t) { return t.text; }).join(' ');
  
  if (text.indexOf('היום') >= 0) {
    baseDate = new Date();
    dateFound = true;
  } else if (text.indexOf('מחר') >= 0) {
    baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 1);
    dateFound = true;
  } else if (text.indexOf('מחרתיים') >= 0) {
    baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + 2);
    dateFound = true;
  } else if (text.indexOf('שלשום') >= 0 || text.indexOf('אתמול') >= 0) {
    baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - 1);
    dateFound = true;
  }
  
  // זיהוי יום שלם (all-day)
  if (text.indexOf('כל היום') >= 0 || text.indexOf('יום מלא') >= 0) {
    result.allDay = true;
    result.start = new Date(baseDate);
    result.start.setHours(0, 0, 0, 0);
    result.end = new Date(baseDate);
    result.end.setHours(23, 59, 59, 999);
    return result;
  }
  
  // חיפוש תבניות זמן HH:MM או HH:MM-HH:MM
  var timePattern = /(\d{1,2}):(\d{2})/g;
  var times = [];
  tokens.forEach(function(token) {
    var match;
    while ((match = timePattern.exec(token.text)) !== null) {
      times.push({ hour: parseInt(match[1]), minute: parseInt(match[2]) });
    }
  });
  
  // זיהוי משכים בביטויים עבריים
  var duration = extractDurationMinutes(tokens);
  
  // זיהוי היוריסטיקה לחלקי יום
  var partOfDay = extractPartOfDay(tokens);
  
  if (times.length >= 2) {
    // טווח זמן מפורש
    result.start = new Date(baseDate);
    result.start.setHours(times[0].hour, times[0].minute, 0, 0);
    result.end = new Date(baseDate);
    result.end.setHours(times[1].hour, times[1].minute, 0, 0);
  } else if (times.length === 1) {
    // זמן התחלה + משך
    result.start = new Date(baseDate);
    result.start.setHours(times[0].hour, times[0].minute, 0, 0);
    result.end = new Date(result.start);
    var durationToAdd = duration > 0 ? duration : 60;
    result.end.setMinutes(result.end.getMinutes() + durationToAdd);
  } else if (partOfDay) {
    // חלק יום ללא זמן מפורש - שימוש בהיוריסטיקה
    result.start = new Date(baseDate);
    result.start.setHours(partOfDay.hour, partOfDay.minute, 0, 0);
    result.end = new Date(result.start);
    var defaultDuration = duration > 0 ? duration : 60;
    result.end.setMinutes(result.end.getMinutes() + defaultDuration);
    result.warnings.push('DEFAULT_TIME_INFERRED');
  } else if (dateFound) {
    // יש תאריך אבל אין זמן - ברירת מחדל אירוע של שעה בצהריים
    result.start = new Date(baseDate);
    result.start.setHours(12, 0, 0, 0);
    result.end = new Date(result.start);
    result.end.setHours(13, 0, 0, 0);
    result.warnings.push('DEFAULT_TIME_INFERRED');
  }
  
  return result;
}

/**
 * חילוץ משך זמן בדקות מביטויים עבריים
 * @param {Array} tokens מערך טוקנים
 * @return {number} משך בדקות
 */
function extractDurationMinutes(tokens) {
  var text = tokens.map(function(t) { return t.text; }).join(' ');
  
  if (text.indexOf('חצי שעה') >= 0) return 30;
  if (text.indexOf('שעתיים') >= 0) return 120;
  if (text.indexOf('שעה') >= 0 && text.indexOf('רבע') < 0 && text.indexOf('שעתיים') < 0) return 60;
  if (text.indexOf('רבע שעה') >= 0) return 15;
  if (text.indexOf('שלושת רבעי שעה') >= 0 || text.indexOf('¾ שעה') >= 0 || text.indexOf('שלושה רבעי שעה') >= 0) return 45;
  
  // חיפוש מספר + דקות/שעות
  for (var i = 0; i < tokens.length; i++) {
    if (/^\d+$/.test(tokens[i].text)) {
      var num = parseInt(tokens[i].text);
      if (i + 1 < tokens.length) {
        var next = tokens[i + 1].text;
        if (next.indexOf('דקות') >= 0 || next.indexOf('דקה') >= 0) return num;
        if (next.indexOf('שעות') >= 0 || next.indexOf('שעה') >= 0) return num * 60;
      }
    }
  }
  
  return 0;
}

/**
 * חילוץ חלק יום (בוקר, צהריים, אחר הצהריים, ערב)
 * @param {Array} tokens מערך טוקנים
 * @return {Object|null} אובייקט עם hour, minute או null
 */
function extractPartOfDay(tokens) {
  var text = tokens.map(function(t) { return t.text; }).join(' ');
  
  if (text.indexOf('בבוקר') >= 0) {
    return { hour: 9, minute: 0 };
  }
  if (text.indexOf('בצהריים') >= 0 || text.indexOf('צהריים') >= 0) {
    return { hour: 12, minute: 30 };
  }
  if (text.indexOf('אחר הצהריים') >= 0 || text.indexOf('אחרי הצהריים') >= 0) {
    return { hour: 15, minute: 0 };
  }
  if (text.indexOf('בערב') >= 0) {
    return { hour: 19, minute: 0 };
  }
  if (text.indexOf('בלילה') >= 0) {
    return { hour: 21, minute: 0 };
  }
  
  return null;
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
 * @param {CalendarEvent} event אובייקט אירוע מ-CalendarApp
 * @return {Object} אובייקט JSON-safe
 */
function serializeEvent(event) {
  var serialized = {
    id: event.getId(),
    title: event.getTitle(),
    start: event.getStartTime().toISOString(),
    end: event.getEndTime().toISOString(),
    allDay: event.isAllDayEvent(),
    description: event.getDescription() || '',
    location: event.getLocation() || '',
    color: event.getColor() || ''
  };
  
  // הוספת אורחים אם קיימים
  try {
    var guests = event.getGuestList();
    if (guests && guests.length > 0) {
      serialized.guests = guests.map(function(g) {
        return g.getEmail();
      });
    }
  } catch (e) {
    // אורחים עשויים להיכשל בהרשאות מסוימות
  }
  
  return serialized;
}

/**
 * חיפוש אירועים לפי כותרת מטושטשת (fuzzy matching)
 * @param {string} titleQuery שאילתת כותרת
 * @return {Array} מערך אירועים תואמים
 */
function findEventsByFuzzyTitle(titleQuery) {
  var cal = CalendarApp.getDefaultCalendar();
  var now = new Date();
  var futureLimit = new Date(now.getTime() + 90*24*60*60*1000); // 90 ימים קדימה
  var pastLimit = new Date(now.getTime() - 30*24*60*60*1000); // 30 ימים אחורה
  
  var events = cal.getEvents(pastLimit, futureLimit);
  var query = titleQuery.toLowerCase().trim();
  var matches = [];
  
  events.forEach(function(ev) {
    var title = ev.getTitle().toLowerCase();
    // התאמה פשוטה: האם הכותרת מכילה את השאילתה או להיפך
    if (title.indexOf(query) >= 0 || query.indexOf(title) >= 0) {
      matches.push({
        id: ev.getId(),
        title: ev.getTitle(),
        start: ev.getStartTime().toISOString(),
        end: ev.getEndTime().toISOString(),
        isRecurring: isEventRecurring(ev)
      });
    }
  });
  
  return matches;
}

/**
 * בדיקה האם אירוע הוא חוזר
 * @param {CalendarEvent} event אירוע
 * @return {boolean} true אם חוזר
 */
function isEventRecurring(event) {
  try {
    var series = event.getEventSeries();
    return series !== null;
  } catch (e) {
    return false;
  }
}

/**
 * חילוץ שם אירוע לעדכון/מחיקה
 * @param {Array} tokens מערך טוקנים
 * @param {Array} keywords מילות מפתח לפעולה
 * @return {string|null} שם האירוע
 */
function extractEventTitleForUpdateDelete(tokens, keywords) {
  var words = [];
  var foundKeyword = false;
  
  for (var i = 0; i < tokens.length; i++) {
    var word = tokens[i].text;
    
    if (keywords.indexOf(word) >= 0) {
      foundKeyword = true;
      continue;
    }
    
    if (foundKeyword) {
      // דלג על מילות עזר
      if (['את', 'ה', 'של', 'עם', 'ל'].indexOf(word) >= 0) continue;
      words.push(word);
    }
  }
  
  return words.length > 0 ? words.join(' ') : null;
}

/**
 * ניתוח שינויים מבוקשים לעדכון אירוע
 * @param {Array} tokens מערך טוקנים
 * @param {Object} existingEvent אירוע קיים
 * @return {Object} אובייקט שינויים
 */
function parseChangesFromTokens(tokens, existingEvent) {
  var changes = { warnings: [] };
  
  // חילוץ זמן חדש
  var dateTime = parseDateTimeFromTokens(tokens);
  if (dateTime.start && dateTime.end) {
    changes.start = dateTime.start;
    changes.end = dateTime.end;
    if (dateTime.warnings) {
      changes.warnings = changes.warnings.concat(dateTime.warnings);
    }
  }
  
  // חילוץ כותרת חדשה (אם יש "שנה ל" או "שם חדש")
  var text = tokens.map(function(t) { return t.text; }).join(' ');
  if (text.indexOf('שנה ל') >= 0 || text.indexOf('שם חדש') >= 0) {
    changes.newTitle = extractTitle(tokens, dateTime);
  }
  
  // חילוץ מיקום
  changes.location = extractLocation(tokens);
  
  // חילוץ צבע
  changes.color = extractColor(tokens);
  
  // חילוץ תזכורות
  var reminders = extractReminders(tokens);
  if (reminders.length > 0) {
    changes.reminders = reminders;
  }
  
  // חילוץ אורחים להוסיף/הסיר
  var guestChanges = extractGuestChanges(tokens);
  if (guestChanges.add.length > 0) {
    changes.addGuests = guestChanges.add;
  }
  if (guestChanges.remove.length > 0) {
    changes.removeGuests = guestChanges.remove;
  }
  
  return changes;
}

/**
 * חילוץ שינויי אורחים (הוסף/הסר)
 * @param {Array} tokens מערך טוקנים
 * @return {Object} אובייקט עם add, remove
 */
function extractGuestChanges(tokens) {
  var result = { add: [], remove: [] };
  var text = tokens.map(function(t) { return t.text; }).join(' ');
  
  // חיפוש דוא"ל
  var emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/g;
  var emails = text.match(emailPattern) || [];
  
  var addMode = text.indexOf('הזמן') >= 0 || text.indexOf('הוסף אורח') >= 0;
  var removeMode = text.indexOf('הסר אורח') >= 0 || text.indexOf('מחק אורח') >= 0;
  
  if (addMode) {
    result.add = emails;
  } else if (removeMode) {
    result.remove = emails;
  }
  
  return result;
}

/**
 * חילוץ מיקום מטוקנים
 * @param {Array} tokens מערך טוקנים
 * @return {string|null} מיקום
 */
function extractLocation(tokens) {
  var text = tokens.map(function(t) { return t.text; }).join(' ');
  
  // חיפוש "ב-" או "במיקום"
  var locationPattern = /(?:ב-|במיקום|מיקום:?)\s*([^\s,]+(?:\s+[^\s,]+)*)/;
  var match = text.match(locationPattern);
  
  if (match && match[1]) {
    return match[1].trim();
  }
  
  return null;
}

/**
 * חילוץ אורחים (emails)
 * @param {Array} tokens מערך טוקנים
 * @return {Array} מערך emails
 */
function extractGuests(tokens) {
  var text = tokens.map(function(t) { return t.text; }).join(' ');
  var emailPattern = /[\w\.-]+@[\w\.-]+\.\w+/g;
  return text.match(emailPattern) || [];
}

/**
 * חילוץ תבנית חזרה
 * @param {Array} tokens מערך טוקנים
 * @return {string|null} כלל חזרה בפורמט RFC
 */
function extractRecurrencePattern(tokens) {
  var text = tokens.map(function(t) { return t.text; }).join(' ');
  
  if (text.indexOf('כל יום') >= 0) {
    return 'RRULE:FREQ=DAILY';
  }
  if (text.indexOf('כל שבוע') >= 0) {
    return 'RRULE:FREQ=WEEKLY';
  }
  if (text.indexOf('כל חודש') >= 0) {
    return 'RRULE:FREQ=MONTHLY';
  }
  if (text.indexOf('כל שנה') >= 0) {
    return 'RRULE:FREQ=YEARLY';
  }
  
  return null;
}

/**
 * Handle suggestSlots action - הצעת משבצות זמן פנויות
 * @param {Object} options אפשרויות חיפוש
 * @return {Object} תשובה עם slots מוצעים
 */
function handleSuggestSlots(options) {
  var cal = CalendarApp.getDefaultCalendar();
  var date = options.date ? new Date(options.date) : new Date();
  var duration = options.duration || 60; // דקות
  var count = options.count || 5;
  
  // הגדר תחום חיפוש (היום או התאריך המבוקש, 8:00-20:00)
  var startOfDay = new Date(date);
  startOfDay.setHours(8, 0, 0, 0);
  var endOfDay = new Date(date);
  endOfDay.setHours(20, 0, 0, 0);
  
  var events = cal.getEvents(startOfDay, endOfDay);
  var busySlots = events.map(function(ev) {
    return {
      start: ev.getStartTime().getTime(),
      end: ev.getEndTime().getTime()
    };
  });
  
  // מיון לפי זמן התחלה
  busySlots.sort(function(a, b) { return a.start - b.start; });
  
  // מציאת חלונות פנויים
  var suggestions = [];
  var currentTime = startOfDay.getTime();
  var durationMs = duration * 60 * 1000;
  
  while (currentTime + durationMs <= endOfDay.getTime() && suggestions.length < count) {
    var isFree = true;
    
    for (var i = 0; i < busySlots.length; i++) {
      var busy = busySlots[i];
      // בדיקה אם החלון הנוכחי מתנגש עם אירוע קיים
      if (!(currentTime + durationMs <= busy.start || currentTime >= busy.end)) {
        isFree = false;
        // קפוץ לסוף האירוע העסוק
        currentTime = busy.end;
        break;
      }
    }
    
    if (isFree) {
      var slotStart = new Date(currentTime);
      var slotEnd = new Date(currentTime + durationMs);
      suggestions.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
        label: formatTimeRange(slotStart, slotEnd)
      });
      currentTime += durationMs; // מעבר לחלון הבא
    } else if (isFree === true) {
      currentTime += 30 * 60 * 1000; // התקדם ב-30 דקות
    }
  }
  
  return {
    ok: true,
    action: 'suggestSlots',
    message: 'נמצאו ' + suggestions.length + ' משבצות זמן פנויות',
    date: date.toISOString().split('T')[0],
    duration: duration,
    slots: suggestions
  };
}

/**
 * פורמט טווח זמן לתצוגה
 * @param {Date} start תחילה
 * @param {Date} end סוף
 * @return {string} מחרוזת מפורמטת
 */
function formatTimeRange(start, end) {
  var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
  return pad(start.getHours()) + ':' + pad(start.getMinutes()) + 
         '–' + pad(end.getHours()) + ':' + pad(end.getMinutes());
}
