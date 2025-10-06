/**
 * Legacy doGet endpoint for backward compatibility.
 * Supports modes: selftest, today, events
 * @param {Object} e - Event object with parameters
 * @returns {TextOutput} JSON response
 */
function doGet(e) {
  var mode = (e && e.parameter && e.parameter.mode) || 'info';
  var payload;
  
  if (mode === 'selftest') {
    payload = { ok: true, now: new Date().toISOString(), user: Session.getActiveUser().getEmail() || null };
  } else if (mode === 'today') {
    // Show today's events
    var cal = CalendarApp.getDefaultCalendar();
    var now = new Date();
    var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    var endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    var evs = cal.getEvents(startOfDay, endOfDay).slice(0, 20).map(function(ev){
      return {
        id: ev.getId(),
        title: ev.getTitle(),
        start: ev.getStartTime().toISOString(),
        end: ev.getEndTime().toISOString(),
        allDay: ev.isAllDayEvent()
      };
    });
    payload = { count: evs.length, events: evs };
  } else if (mode === 'events') {
    // Show next 7 days
    var cal = CalendarApp.getDefaultCalendar();
    var now = new Date();
    var until = new Date(now.getTime() + 7*24*60*60*1000);
    var evs = cal.getEvents(now, until).slice(0, 20).map(function(ev){
      return {
        id: ev.getId(),
        title: ev.getTitle(),
        start: ev.getStartTime().toISOString(),
        end: ev.getEndTime().toISOString(),
        allDay: ev.isAllDayEvent()
      };
    });
    payload = { count: evs.length, events: evs };
  } else {
    payload = { info: "Use ?mode=selftest or ?mode=today or ?mode=events" };
  }
  
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Main POST endpoint for JSON API actions.
 * Supports: selfTest, findEvents, createEvent, updateEvent, deleteEvent, parseText
 * @param {Object} e - Event object with postData
 * @returns {TextOutput} JSON response
 */
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action;
    var result;
    
    switch(action) {
      case 'selfTest':
        result = handleSelfTest();
        break;
      case 'findEvents':
        result = handleFindEvents(payload.options || {});
        break;
      case 'createEvent':
        result = handleCreateEvent(payload.options || {});
        break;
      case 'updateEvent':
        result = handleUpdateEvent(payload.options || {});
        break;
      case 'deleteEvent':
        result = handleDeleteEvent(payload.options || {});
        break;
      case 'parseText':
        result = handleParseText(payload.options || {});
        break;
      default:
        result = { ok: false, error: 'Unknown action: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ 
      ok: false, 
      error: err.toString() 
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Handle selfTest action - returns system capabilities
 * @returns {Object} System status and capabilities
 */
function handleSelfTest() {
  return {
    ok: true,
    now: new Date().toISOString(),
    user: Session.getActiveUser().getEmail() || null,
    capabilities: {
      nlpVersion: 'v1',
      supportedActions: ['findEvents', 'createEvent', 'updateEvent', 'deleteEvent', 'parseText'],
      hebrewNLP: true,
      parseOnlyDraft: 'v2-draft'
    }
  };
}

/**
 * Handle findEvents action
 * @param {Object} options - Search options (timeMin, timeMax, q, maxResults)
 * @returns {Object} Events list
 */
function handleFindEvents(options) {
  var cal = CalendarApp.getDefaultCalendar();
  var timeMin = options.timeMin ? new Date(options.timeMin) : new Date();
  var timeMax = options.timeMax ? new Date(options.timeMax) : new Date(timeMin.getTime() + 7*24*60*60*1000);
  var maxResults = options.maxResults || 50;
  var searchQuery = options.q || null;
  
  var events = cal.getEvents(timeMin, timeMax);
  
  // Filter by search query if provided
  if (searchQuery) {
    events = events.filter(function(ev) {
      return ev.getTitle().indexOf(searchQuery) >= 0 || 
             (ev.getDescription() && ev.getDescription().indexOf(searchQuery) >= 0);
    });
  }
  
  var results = events.slice(0, maxResults).map(function(ev){
    return {
      id: ev.getId(),
      title: ev.getTitle(),
      description: ev.getDescription() || '',
      start: ev.getStartTime().toISOString(),
      end: ev.getEndTime().toISOString(),
      allDay: ev.isAllDayEvent(),
      location: ev.getLocation() || ''
    };
  });
  
  return { ok: true, count: results.length, events: results };
}

/**
 * Handle createEvent action
 * @param {Object} options - Event details (title, start, end, description, location, allDay)
 * @returns {Object} Created event details
 */
function handleCreateEvent(options) {
  var cal = CalendarApp.getDefaultCalendar();
  var title = options.title || 'אירוע חדש';
  var start = new Date(options.start);
  var end = options.end ? new Date(options.end) : new Date(start.getTime() + 60*60*1000);
  var description = options.description || '';
  var location = options.location || '';
  var allDay = options.allDay || false;
  
  var event;
  if (allDay) {
    event = cal.createAllDayEvent(title, start, {
      description: description,
      location: location
    });
  } else {
    event = cal.createEvent(title, start, end, {
      description: description,
      location: location
    });
  }
  
  return {
    ok: true,
    event: {
      id: event.getId(),
      title: event.getTitle(),
      start: event.getStartTime().toISOString(),
      end: event.getEndTime().toISOString(),
      allDay: event.isAllDayEvent()
    }
  };
}

/**
 * Handle updateEvent action
 * @param {Object} options - Event ID and fields to update
 * @returns {Object} Updated event details
 */
function handleUpdateEvent(options) {
  var cal = CalendarApp.getDefaultCalendar();
  var eventId = options.id;
  
  if (!eventId) {
    return { ok: false, error: 'Event ID required' };
  }
  
  var event = cal.getEventById(eventId);
  if (!event) {
    return { ok: false, error: 'Event not found' };
  }
  
  // Update fields if provided
  if (options.title !== undefined) {
    event.setTitle(options.title);
  }
  if (options.description !== undefined) {
    event.setDescription(options.description);
  }
  if (options.location !== undefined) {
    event.setLocation(options.location);
  }
  if (options.start && options.end) {
    event.setTime(new Date(options.start), new Date(options.end));
  }
  
  return {
    ok: true,
    event: {
      id: event.getId(),
      title: event.getTitle(),
      start: event.getStartTime().toISOString(),
      end: event.getEndTime().toISOString(),
      allDay: event.isAllDayEvent()
    }
  };
}

/**
 * Handle deleteEvent action
 * @param {Object} options - Event ID to delete
 * @returns {Object} Success status
 */
function handleDeleteEvent(options) {
  var cal = CalendarApp.getDefaultCalendar();
  var eventId = options.id;
  
  if (!eventId) {
    return { ok: false, error: 'Event ID required' };
  }
  
  var event = cal.getEventById(eventId);
  if (!event) {
    return { ok: false, error: 'Event not found' };
  }
  
  event.deleteEvent();
  
  return { ok: true, message: 'Event deleted successfully' };
}

/**
 * Handle parseText action - Hebrew NLP v1 with parseOnly draft for v2
 * Parses natural language text (Hebrew focus) into event structure
 * @param {Object} options - Text to parse and mode (execute or parseOnly)
 * @returns {Object} Parsed event structure or execution result
 */
function handleParseText(options) {
  var text = options.text || '';
  var parseOnly = options.parseOnly || false;
  
  if (!text) {
    return { ok: false, error: 'Text required' };
  }
  
  // Hebrew NLP v1 - Basic pattern matching
  var parsed = parseHebrewNLP(text);
  
  if (parseOnly) {
    // Return v2-draft token structure for future enhancements
    return {
      ok: true,
      parseOnly: true,
      version: 'v2-draft',
      tokens: parsed.tokens || [],
      intent: parsed.intent,
      event: parsed.event
    };
  }
  
  // Execute the parsed action (v1)
  if (parsed.intent === 'create') {
    return handleCreateEvent(parsed.event);
  } else if (parsed.intent === 'update') {
    return handleUpdateEvent(parsed.event);
  } else if (parsed.intent === 'delete') {
    return handleDeleteEvent(parsed.event);
  } else {
    return { ok: false, error: 'Could not understand the command', parsed: parsed };
  }
}

/**
 * Parse Hebrew natural language text into event structure (NLP v1)
 * Supports basic Hebrew commands for create/update/delete
 * @param {String} text - Hebrew text to parse
 * @returns {Object} Parsed structure with intent and event details
 */
function parseHebrewNLP(text) {
  var result = {
    intent: 'unknown',
    event: {},
    tokens: []
  };
  
  var textLower = text.toLowerCase();
  var tokens = text.split(/\s+/);
  result.tokens = tokens;
  
  // Detect intent - Create
  if (textLower.match(/צור|יצירה|חדש|הוסף|תזכורת/)) {
    result.intent = 'create';
    
    // Extract title - everything after create keyword
    var titleMatch = text.match(/(?:צור|יצירה|חדש|הוסף|תזכורת)\s+(.+?)(?:\s+ב(?:תאריך)?|\s+מ|$)/i);
    if (titleMatch) {
      result.event.title = titleMatch[1].trim();
    }
    
    // Extract date/time
    var dateInfo = extractDateTime(text);
    result.event.start = dateInfo.start;
    result.event.end = dateInfo.end;
    result.event.allDay = dateInfo.allDay;
  }
  // Detect intent - Update
  else if (textLower.match(/עדכן|שנה|ערוך/)) {
    result.intent = 'update';
    
    // For update, we'd need event ID - look for patterns or use last event
    // Simplified: extract new title
    var titleMatch = text.match(/(?:עדכן|שנה|ערוך)\s+(.+?)(?:\s+ל|$)/i);
    if (titleMatch) {
      result.event.title = titleMatch[1].trim();
    }
  }
  // Detect intent - Delete
  else if (textLower.match(/מחק|הסר|בטל/)) {
    result.intent = 'delete';
    
    // Extract title to find and delete
    var titleMatch = text.match(/(?:מחק|הסר|בטל)\s+(.+)/i);
    if (titleMatch) {
      result.event.searchTitle = titleMatch[1].trim();
    }
  }
  
  return result;
}

/**
 * Extract date and time information from Hebrew text
 * @param {String} text - Text containing date/time references
 * @returns {Object} start, end, allDay flags
 */
function extractDateTime(text) {
  var now = new Date();
  var start = new Date();
  var end = new Date(start.getTime() + 60*60*1000); // Default 1 hour
  var allDay = false;
  
  var textLower = text.toLowerCase();
  
  // Today patterns
  if (textLower.match(/היום|עכשיו/)) {
    start = new Date();
    end = new Date(start.getTime() + 60*60*1000);
  }
  // Tomorrow patterns
  else if (textLower.match(/מחר/)) {
    start = new Date(now.getTime() + 24*60*60*1000);
    start.setHours(9, 0, 0, 0);
    end = new Date(start.getTime() + 60*60*1000);
    allDay = true;
  }
  // Next week
  else if (textLower.match(/שבוע הבא/)) {
    start = new Date(now.getTime() + 7*24*60*60*1000);
    start.setHours(9, 0, 0, 0);
    end = new Date(start.getTime() + 60*60*1000);
    allDay = true;
  }
  
  // Time patterns (24h format)
  var timeMatch = text.match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    start.setHours(parseInt(timeMatch[1]), parseInt(timeMatch[2]), 0, 0);
    end = new Date(start.getTime() + 60*60*1000);
    allDay = false;
  }
  
  // Specific date patterns (DD/MM or DD/MM/YYYY)
  var dateMatch = text.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
  if (dateMatch) {
    var day = parseInt(dateMatch[1]);
    var month = parseInt(dateMatch[2]) - 1; // 0-indexed
    var year = dateMatch[3] ? parseInt(dateMatch[3]) : now.getFullYear();
    if (year < 100) year += 2000;
    
    start = new Date(year, month, day, 9, 0, 0, 0);
    end = new Date(start.getTime() + 60*60*1000);
    allDay = true;
  }
  
  return {
    start: start.toISOString(),
    end: end.toISOString(),
    allDay: allDay
  };
}
