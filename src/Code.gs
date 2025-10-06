// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Color mapping for Hebrew color names and hex values to Google Calendar color IDs
 */
function mapColorToId(colorInput) {
  if (!colorInput) return null;
  var colorInput = colorInput.toLowerCase();
  var colorMap = {
    'אדום': '11', 'red': '11',
    'כתום': '6', 'orange': '6',
    'צהוב': '5', 'yellow': '5',
    'ירוק': '10', 'green': '10',
    'כחול': '9', 'blue': '9',
    'סגול': '3', 'purple': '3',
    'ורוד': '4', 'pink': '4',
    'אפור': '8', 'gray': '8', 'grey': '8'
  };
  return colorMap[colorInput] || colorInput;
}

/**
 * Parse Hebrew date phrases into Date objects
 */
function parseHebrewDate(text) {
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  if (/היום/.test(text)) {
    return today;
  }
  if (/מחר/.test(text)) {
    return new Date(today.getTime() + 24*60*60*1000);
  }
  if (/מחרתיים/.test(text)) {
    return new Date(today.getTime() + 2*24*60*60*1000);
  }
  
  // Days of the week
  var dayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  for (var i = 0; i < dayNames.length; i++) {
    var pattern = new RegExp(dayNames[i] + '\\s*(הבא|הקרוב)?');
    if (pattern.test(text)) {
      var currentDay = now.getDay();
      var targetDay = i;
      var daysAhead = (targetDay - currentDay + 7) % 7;
      if (daysAhead === 0 && /הבא|הקרוב/.test(text)) daysAhead = 7;
      if (daysAhead === 0) daysAhead = 7;
      return new Date(today.getTime() + daysAhead * 24*60*60*1000);
    }
  }
  
  // Date patterns like DD/MM or DD.MM
  var dateMatch = text.match(/(\d{1,2})[\/\.](\d{1,2})/);
  if (dateMatch) {
    var day = parseInt(dateMatch[1], 10);
    var month = parseInt(dateMatch[2], 10) - 1;
    var year = now.getFullYear();
    var date = new Date(year, month, day);
    if (date < today) date.setFullYear(year + 1);
    return date;
  }
  
  return null;
}

/**
 * Parse time range from Hebrew text (e.g., "10:00-11:30" or "10:00–11:30")
 */
function parseTimeRange(text) {
  var timePattern = /(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})/;
  var match = text.match(timePattern);
  if (match) {
    return {
      startHour: parseInt(match[1], 10),
      startMin: parseInt(match[2], 10),
      endHour: parseInt(match[3], 10),
      endMin: parseInt(match[4], 10)
    };
  }
  return null;
}

/**
 * Format event for output with all details
 */
function formatEvent(ev) {
  var attendees = [];
  try {
    var guests = ev.getGuestList();
    for (var i = 0; i < guests.length; i++) {
      attendees.push({
        email: guests[i].getEmail(),
        responseStatus: guests[i].getGuestStatus().toString()
      });
    }
  } catch(e) {}
  
  var reminders = { popup: [], email: [] };
  try {
    var popups = ev.getPopupReminders();
    for (var i = 0; i < popups.length; i++) {
      reminders.popup.push(popups[i]);
    }
    var emails = ev.getEmailReminders();
    for (var i = 0; i < emails.length; i++) {
      reminders.email.push(emails[i]);
    }
  } catch(e) {}
  
  var result = {
    id: ev.getId(),
    summary: ev.getTitle(),
    start: ev.getStartTime().toISOString(),
    end: ev.getEndTime().toISOString(),
    allDay: ev.isAllDayEvent(),
    location: ev.getLocation() || '',
    description: ev.getDescription() || '',
    htmlLink: '',
    attendees: attendees,
    reminders: reminders,
    created: ev.getDateCreated().toISOString(),
    lastModified: ev.getLastUpdated().toISOString()
  };
  
  try {
    result.colorId = ev.getColor() || '';
  } catch(e) {}
  
  return result;
}

/**
 * Get Hebrew message for action
 */
function getHebrewMessage(action, details) {
  var messages = {
    created: 'נוצר אירוע: "' + details.summary + '" ב-' + details.date,
    updated: 'עודכן אירוע: "' + details.summary + '"',
    deleted: 'נמחק אירוע: "' + details.summary + '"',
    found: 'נמצאו ' + details.count + ' אירועים',
    noEvents: 'לא נמצאו אירועים'
  };
  return messages[action] || 'הפעולה בוצעה בהצלחה';
}

// ============================================================================
// Main Handlers
// ============================================================================

function doGet(e) {
  var mode = (e && e.parameter && e.parameter.mode) || 'info';
  var payload;
  if (mode === 'selftest') {
    payload = { ok: true, now: new Date().toISOString(), user: Session.getActiveUser().getEmail() || null };
  } else if (mode === 'events') {
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
  } else {
    payload = { info: "Use ?mode=selftest or ?mode=events, or POST JSON with action field" };
  }
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var result;
    
    switch(action) {
      case 'selfTest':
        result = handleSelfTest();
        break;
      case 'findEvents':
        result = handleFindEvents(data);
        break;
      case 'createEvent':
        result = handleCreateEvent(data);
        break;
      case 'updateEvent':
        result = handleUpdateEvent(data);
        break;
      case 'deleteEvent':
        result = handleDeleteEvent(data);
        break;
      case 'text':
        result = handleTextCommand(data);
        break;
      default:
        result = { error: true, message: 'פעולה לא ידועה: ' + action };
    }
    
    return ContentService.createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({
      error: true,
      message: 'שגיאה: ' + err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================================================
// Action Handlers
// ============================================================================

function handleSelfTest() {
  var scopes = [
    'calendar.events',
    'userinfo.email',
    'script.external_request'
  ];
  
  return {
    ok: true,
    timestamp: new Date().toISOString(),
    user: Session.getActiveUser().getEmail() || 'anonymous',
    scopes: scopes.join(', '),
    message: 'המערכת פעילה ומוכנה לשימוש'
  };
}

function handleFindEvents(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var timeMin = data.timeMin ? new Date(data.timeMin) : new Date();
  var timeMax = data.timeMax ? new Date(data.timeMax) : new Date(timeMin.getTime() + 30*24*60*60*1000);
  var maxResults = data.maxResults || 50;
  var searchText = data.q || '';
  
  var events = cal.getEvents(timeMin, timeMax);
  
  // Filter by search text if provided
  if (searchText) {
    events = events.filter(function(ev) {
      var title = ev.getTitle().toLowerCase();
      var desc = (ev.getDescription() || '').toLowerCase();
      var loc = (ev.getLocation() || '').toLowerCase();
      var search = searchText.toLowerCase();
      return title.indexOf(search) >= 0 || desc.indexOf(search) >= 0 || loc.indexOf(search) >= 0;
    });
  }
  
  // Limit results
  events = events.slice(0, maxResults);
  
  var formatted = events.map(formatEvent);
  var count = formatted.length;
  
  return {
    ok: true,
    count: count,
    events: formatted,
    message: count > 0 ? getHebrewMessage('found', {count: count}) : getHebrewMessage('noEvents', {})
  };
}

function handleCreateEvent(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var summary = data.summary || 'אירוע חדש';
  var startTime = new Date(data.start);
  var endTime = new Date(data.end);
  var options = {};
  
  if (data.location) options.location = data.location;
  if (data.description) options.description = data.description;
  
  // Create event
  var event;
  if (data.allDay) {
    var startDate = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
    var endDate = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate());
    event = cal.createAllDayEvent(summary, startDate, endDate, options);
  } else {
    event = cal.createEvent(summary, startTime, endTime, options);
  }
  
  // Add attendees
  if (data.attendees && data.attendees.length > 0) {
    for (var i = 0; i < data.attendees.length; i++) {
      event.addGuest(data.attendees[i]);
    }
  }
  
  // Add reminders
  if (data.reminders && data.reminders.length > 0) {
    event.removeAllReminders();
    for (var i = 0; i < data.reminders.length; i++) {
      event.addPopupReminder(data.reminders[i]);
    }
  }
  
  // Set color
  if (data.color) {
    var colorId = mapColorToId(data.color);
    if (colorId) {
      try {
        event.setColor(colorId);
      } catch(e) {}
    }
  }
  
  var dateStr = startTime.toLocaleDateString('he-IL');
  return {
    ok: true,
    event: formatEvent(event),
    message: getHebrewMessage('created', {summary: summary, date: dateStr})
  };
}

function handleUpdateEvent(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var eventId = data.id;
  
  if (!eventId) {
    return { error: true, message: 'חסר מזהה אירוע' };
  }
  
  var event = cal.getEventById(eventId);
  if (!event) {
    return { error: true, message: 'אירוע לא נמצא' };
  }
  
  // Update fields
  if (data.summary) event.setTitle(data.summary);
  if (data.location !== undefined) event.setLocation(data.location);
  if (data.description !== undefined) event.setDescription(data.description);
  
  if (data.start && data.end) {
    event.setTime(new Date(data.start), new Date(data.end));
  }
  
  // Update attendees
  if (data.attendees) {
    if (data.attendeesReplace) {
      var existing = event.getGuestList();
      for (var i = 0; i < existing.length; i++) {
        event.removeGuest(existing[i].getEmail());
      }
    }
    for (var i = 0; i < data.attendees.length; i++) {
      event.addGuest(data.attendees[i]);
    }
  }
  
  // Update reminders
  if (data.reminders) {
    event.removeAllReminders();
    for (var i = 0; i < data.reminders.length; i++) {
      event.addPopupReminder(data.reminders[i]);
    }
  }
  
  // Update color
  if (data.color) {
    var colorId = mapColorToId(data.color);
    if (colorId) {
      try {
        event.setColor(colorId);
      } catch(e) {}
    }
  }
  
  return {
    ok: true,
    event: formatEvent(event),
    message: getHebrewMessage('updated', {summary: event.getTitle()})
  };
}

function handleDeleteEvent(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var eventId = data.id;
  
  if (!eventId) {
    return { error: true, message: 'חסר מזהה אירוע' };
  }
  
  var event = cal.getEventById(eventId);
  if (!event) {
    return { error: true, message: 'אירוע לא נמצא' };
  }
  
  var summary = event.getTitle();
  event.deleteEvent();
  
  return {
    ok: true,
    message: getHebrewMessage('deleted', {summary: summary})
  };
}

function handleTextCommand(data) {
  var text = data.text || '';
  
  // Parse date
  var date = parseHebrewDate(text);
  if (!date) {
    date = new Date();
  }
  
  // Parse time range
  var timeRange = parseTimeRange(text);
  
  var startTime, endTime;
  if (timeRange) {
    startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                         timeRange.startHour, timeRange.startMin);
    endTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                       timeRange.endHour, timeRange.endMin);
  } else {
    // Default 1 hour event starting at next hour
    var now = new Date();
    startTime = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 
                         now.getHours() + 1, 0);
    endTime = new Date(startTime.getTime() + 60*60*1000);
  }
  
  // Extract title (remove date/time info)
  var title = text;
  title = title.replace(/היום|מחר|מחרתיים/, '');
  title = title.replace(/ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת/g, '');
  title = title.replace(/הבא|הקרוב/g, '');
  title = title.replace(/\d{1,2}:\d{2}\s*[-–—]\s*\d{1,2}:\d{2}/, '');
  title = title.replace(/\d{1,2}[\/\.]\d{1,2}/, '');
  
  // Extract color
  var color = null;
  var colorMatch = text.match(/צבע[::\s]*(אדום|כתום|צהוב|ירוק|כחול|סגול|ורוד|אפור)/);
  if (colorMatch) {
    color = colorMatch[1];
    title = title.replace(/צבע[::\s]*(אדום|כתום|צהוב|ירוק|כחול|סגול|ורוד|אפור)/, '');
  }
  
  // Extract location
  var location = null;
  var locationMatch = text.match(/מקום[::\s]+([^\s]+(?:\s+[^\s]+)*?)(?=\s+צבע|\s*$)/);
  if (locationMatch) {
    location = locationMatch[1].trim();
    title = title.replace(/מקום[::\s]+[^\s]+(?:\s+[^\s]+)*/, '');
  }
  
  title = title.trim();
  if (!title) title = 'אירוע חדש';
  
  // Create the event
  var createData = {
    summary: title,
    start: startTime.toISOString(),
    end: endTime.toISOString(),
    allDay: false
  };
  
  if (color) createData.color = color;
  if (location) createData.location = location;
  
  return handleCreateEvent(createData);
}
