/**
 * Legacy doGet handler for backward compatibility
 * Supports modes: selftest, events
 */
function doGet(e) {
  try {
    var mode = (e && e.parameter && e.parameter.mode) || 'info';
    var payload;
    
    if (mode === 'selftest') {
      payload = { 
        ok: true, 
        now: new Date().toISOString(), 
        user: Session.getActiveUser().getEmail() || null,
        scopes: ['calendar', 'external_request', 'userinfo.email']
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
          allDay: ev.isAllDayEvent()
        };
      });
      payload = { ok: true, count: evs.length, events: evs };
    } else {
      payload = { 
        ok: false, 
        error: "Unknown mode: " + mode,
        info: "Use ?mode=selftest or ?mode=events" 
      };
    }
    
    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: err.message || String(err)
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Main POST handler for JSON API
 * Actions: selfTest, findEvents, createEvent, updateEvent, deleteEvent, getEvent, text, parseOnly
 */
function doPost(e) {
  try {
    var body = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    var action = body.action || '';
    
    var response;
    switch (action) {
      case 'selfTest':
        response = handleSelfTest();
        break;
      case 'findEvents':
        response = handleFindEvents(body);
        break;
      case 'createEvent':
        response = handleCreateEvent(body);
        break;
      case 'updateEvent':
        response = handleUpdateEvent(body);
        break;
      case 'deleteEvent':
        response = handleDeleteEvent(body);
        break;
      case 'getEvent':
        response = handleGetEvent(body);
        break;
      case 'text':
        response = handleTextNLP(body);
        break;
      case 'parseOnly':
        response = handleParseOnly(body);
        break;
      default:
        response = {
          ok: false,
          action: action,
          error: 'Unknown action: ' + action,
          availableActions: ['selfTest', 'findEvents', 'createEvent', 'updateEvent', 'deleteEvent', 'getEvent', 'text', 'parseOnly']
        };
    }
    
    return ContentService.createTextOutput(JSON.stringify(response))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      ok: false,
      error: err.message || String(err),
      stack: err.stack
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Self-test action
 */
function handleSelfTest() {
  return {
    ok: true,
    action: 'selfTest',
    message: 'Service operational',
    timestamp: new Date().toISOString(),
    user: Session.getActiveUser().getEmail() || null,
    calendarAccess: true
  };
}

/**
 * Find events action
 * Options: timeMin, timeMax, q (search query), maxResults (default 100, max 200)
 */
function handleFindEvents(body) {
  var cal = CalendarApp.getDefaultCalendar();
  var options = body.options || {};
  
  var timeMin = options.timeMin ? new Date(options.timeMin) : new Date();
  var timeMax = options.timeMax ? new Date(options.timeMax) : new Date(timeMin.getTime() + 7*24*60*60*1000);
  var maxResults = Math.min(options.maxResults || 100, 200);
  var searchQuery = options.q || '';
  
  var events = cal.getEvents(timeMin, timeMax);
  
  if (searchQuery) {
    var lowerQuery = searchQuery.toLowerCase();
    events = events.filter(function(ev) {
      var title = ev.getTitle().toLowerCase();
      var desc = (ev.getDescription() || '').toLowerCase();
      var loc = (ev.getLocation() || '').toLowerCase();
      return title.indexOf(lowerQuery) >= 0 || 
             desc.indexOf(lowerQuery) >= 0 || 
             loc.indexOf(lowerQuery) >= 0;
    });
  }
  
  events = events.slice(0, maxResults);
  
  var eventList = events.map(function(ev) {
    return serializeEvent(ev);
  });
  
  return {
    ok: true,
    action: 'findEvents',
    message: 'Found ' + eventList.length + ' event(s)',
    count: eventList.length,
    events: eventList
  };
}

/**
 * Create event action
 * Required: summary, start, end
 * Optional: location, description, attendees[], reminders[], color
 */
function handleCreateEvent(body) {
  if (!body.summary || !body.start || !body.end) {
    return {
      ok: false,
      action: 'createEvent',
      error: 'Missing required fields: summary, start, end'
    };
  }
  
  var cal = CalendarApp.getDefaultCalendar();
  var startTime = new Date(body.start);
  var endTime = new Date(body.end);
  
  var event = cal.createEvent(body.summary, startTime, endTime, {
    location: body.location || '',
    description: body.description || ''
  });
  
  // Add attendees if provided
  if (body.attendees && Array.isArray(body.attendees)) {
    var guests = body.attendees.filter(function(a) { return a && a.email; });
    guests.forEach(function(guest) {
      event.addGuest(guest.email);
    });
  }
  
  // Add reminders if provided
  if (body.reminders && Array.isArray(body.reminders)) {
    event.removeAllReminders();
    body.reminders.forEach(function(reminder) {
      if (reminder.method === 'popup' || reminder.method === 'email') {
        event.addPopupReminder(reminder.minutes || 10);
      }
    });
  }
  
  // Set color if provided
  if (body.color) {
    try {
      event.setColor(body.color);
    } catch (e) {
      // Color setting might fail, ignore
    }
  }
  
  return {
    ok: true,
    action: 'createEvent',
    message: 'Event created: ' + body.summary,
    event: serializeEvent(event)
  };
}

/**
 * Update event action
 * Required: id
 * Optional: summary, start, end, location, description, attendees (with replace/merge mode), reminders, color
 */
function handleUpdateEvent(body) {
  if (!body.id) {
    return {
      ok: false,
      action: 'updateEvent',
      error: 'Missing required field: id'
    };
  }
  
  var cal = CalendarApp.getDefaultCalendar();
  var event = cal.getEventById(body.id);
  
  if (!event) {
    return {
      ok: false,
      action: 'updateEvent',
      error: 'Event not found: ' + body.id
    };
  }
  
  // Update fields if provided
  if (body.summary) event.setTitle(body.summary);
  if (body.location !== undefined) event.setLocation(body.location);
  if (body.description !== undefined) event.setDescription(body.description);
  
  if (body.start && body.end) {
    event.setTime(new Date(body.start), new Date(body.end));
  } else if (body.start) {
    var duration = event.getEndTime().getTime() - event.getStartTime().getTime();
    var newStart = new Date(body.start);
    event.setTime(newStart, new Date(newStart.getTime() + duration));
  } else if (body.end) {
    var newEnd = new Date(body.end);
    event.setTime(event.getStartTime(), newEnd);
  }
  
  // Handle attendees
  if (body.attendees) {
    var mode = body.attendeesMode || 'replace';
    if (mode === 'replace') {
      var currentGuests = event.getGuestList();
      currentGuests.forEach(function(guest) {
        event.removeGuest(guest.getEmail());
      });
    }
    body.attendees.forEach(function(att) {
      if (att && att.email) {
        event.addGuest(att.email);
      }
    });
  }
  
  // Handle reminders (always replace)
  if (body.reminders) {
    event.removeAllReminders();
    body.reminders.forEach(function(reminder) {
      if (reminder.method === 'popup' || reminder.method === 'email') {
        event.addPopupReminder(reminder.minutes || 10);
      }
    });
  }
  
  // Set color if provided
  if (body.color) {
    try {
      event.setColor(body.color);
    } catch (e) {
      // Color setting might fail, ignore
    }
  }
  
  return {
    ok: true,
    action: 'updateEvent',
    message: 'Event updated: ' + event.getTitle(),
    event: serializeEvent(event)
  };
}

/**
 * Delete event action
 * Required: id
 */
function handleDeleteEvent(body) {
  if (!body.id) {
    return {
      ok: false,
      action: 'deleteEvent',
      error: 'Missing required field: id'
    };
  }
  
  var cal = CalendarApp.getDefaultCalendar();
  var event = cal.getEventById(body.id);
  
  if (!event) {
    return {
      ok: false,
      action: 'deleteEvent',
      error: 'Event not found: ' + body.id
    };
  }
  
  var title = event.getTitle();
  event.deleteEvent();
  
  return {
    ok: true,
    action: 'deleteEvent',
    message: 'Event deleted: ' + title,
    id: body.id
  };
}

/**
 * Get single event action
 * Required: id
 */
function handleGetEvent(body) {
  if (!body.id) {
    return {
      ok: false,
      action: 'getEvent',
      error: 'Missing required field: id'
    };
  }
  
  var cal = CalendarApp.getDefaultCalendar();
  var event = cal.getEventById(body.id);
  
  if (!event) {
    return {
      ok: false,
      action: 'getEvent',
      error: 'Event not found: ' + body.id
    };
  }
  
  return {
    ok: true,
    action: 'getEvent',
    message: 'Event retrieved',
    event: serializeEvent(event)
  };
}

/**
 * Hebrew NLP v1 - Heuristic parsing with calendar mutation
 * Parses text like "פגישה עם דני מחר בשעה 15:00"
 */
function handleTextNLP(body) {
  if (!body.text) {
    return {
      ok: false,
      action: 'text',
      error: 'Missing required field: text'
    };
  }
  
  var parsed = parseHebrewText(body.text);
  
  if (!parsed.valid) {
    return {
      ok: false,
      action: 'text',
      error: 'Could not parse text',
      message: 'Unable to extract event information from text',
      parsed: parsed
    };
  }
  
  // Create the event
  var cal = CalendarApp.getDefaultCalendar();
  var event = cal.createEvent(parsed.summary, parsed.start, parsed.end, {
    location: parsed.location || '',
    description: parsed.description || ''
  });
  
  return {
    ok: true,
    action: 'text',
    message: 'Event created from text: ' + parsed.summary,
    parsed: parsed,
    event: serializeEvent(event)
  };
}

/**
 * Hebrew NLP v2 - Tokenization only, no calendar mutation
 */
function handleParseOnly(body) {
  if (!body.text) {
    return {
      ok: false,
      action: 'parseOnly',
      error: 'Missing required field: text'
    };
  }
  
  var parsed = parseHebrewText(body.text);
  
  return {
    ok: true,
    action: 'parseOnly',
    message: 'Text parsed successfully',
    parsed: parsed,
    tokens: tokenizeHebrewText(body.text)
  };
}

/**
 * Parse Hebrew text to extract event information
 * Supports relative dates (היום, מחר, מחרתיים) and times
 */
function parseHebrewText(text) {
  var result = {
    valid: false,
    summary: '',
    start: null,
    end: null,
    location: '',
    description: ''
  };
  
  // Extract summary (first part before temporal markers)
  var summaryMatch = text.match(/^([^0-9]+?)(?=\s+(היום|מחר|מחרתיים|ב|ביום|בשעה))/);
  if (summaryMatch) {
    result.summary = summaryMatch[1].trim();
  } else {
    // Take first 5 words as summary
    var words = text.split(/\s+/);
    result.summary = words.slice(0, Math.min(5, words.length)).join(' ');
  }
  
  // Parse date
  var now = new Date();
  var startDate = new Date(now);
  
  if (text.indexOf('היום') >= 0) {
    // Today
    startDate = new Date(now);
  } else if (text.indexOf('מחר') >= 0) {
    // Tomorrow
    startDate = new Date(now.getTime() + 24*60*60*1000);
  } else if (text.indexOf('מחרתיים') >= 0) {
    // Day after tomorrow
    startDate = new Date(now.getTime() + 2*24*60*60*1000);
  }
  
  // Parse time (format: HH:MM or just HH)
  var timeMatch = text.match(/(\d{1,2}):?(\d{2})?/);
  if (timeMatch) {
    var hours = parseInt(timeMatch[1], 10);
    var minutes = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
    startDate.setHours(hours, minutes, 0, 0);
  } else {
    // Default to 09:00 if no time specified
    startDate.setHours(9, 0, 0, 0);
  }
  
  result.start = startDate;
  // Default duration: 1 hour
  result.end = new Date(startDate.getTime() + 60*60*1000);
  
  // Extract location (after "ב" or "במקום")
  var locationMatch = text.match(/ב([א-ת\s]+?)(?=\s|$)/);
  if (locationMatch) {
    result.location = locationMatch[1].trim();
  }
  
  result.valid = !!(result.summary && result.start && result.end);
  
  return result;
}

/**
 * Tokenize Hebrew text for NLP analysis
 */
function tokenizeHebrewText(text) {
  var tokens = [];
  var words = text.split(/\s+/);
  
  words.forEach(function(word, idx) {
    var token = {
      index: idx,
      text: word,
      type: 'unknown'
    };
    
    // Classify token type
    if (/^\d{1,2}:\d{2}$/.test(word)) {
      token.type = 'time';
    } else if (/^\d+$/.test(word)) {
      token.type = 'number';
    } else if (['היום', 'מחר', 'מחרתיים'].indexOf(word) >= 0) {
      token.type = 'date_relative';
    } else if (/^[א-ת]+$/.test(word)) {
      token.type = 'hebrew_word';
    } else if (word === 'ב' || word.indexOf('ב') === 0) {
      token.type = 'preposition';
    }
    
    tokens.push(token);
  });
  
  return tokens;
}

/**
 * Serialize Calendar Event to JSON-friendly object
 */
function serializeEvent(event) {
  var guests = event.getGuestList().map(function(g) {
    return {
      email: g.getEmail(),
      name: g.getName() || '',
      status: g.getGuestStatus().toString()
    };
  });
  
  return {
    id: event.getId(),
    title: event.getTitle(),
    start: event.getStartTime().toISOString(),
    end: event.getEndTime().toISOString(),
    allDay: event.isAllDayEvent(),
    location: event.getLocation() || '',
    description: event.getDescription() || '',
    color: event.getColor() || '',
    attendees: guests,
    created: event.getDateCreated().toISOString(),
    updated: event.getLastUpdated().toISOString()
  };
}
