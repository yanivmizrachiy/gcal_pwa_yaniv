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
        id: ev.getId(),
        title: ev.getTitle(),
        start: ev.getStartTime(),
        end: ev.getEndTime(),
        allDay: ev.isAllDayEvent(),
        color: ev.getColor()
      };
    });
    payload = { count: evs.length, events: evs };
  } else {
    payload = { info: "Use ?mode=selftest or ?mode=events" };
  }
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var payload;
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    
    if (action === 'selfTest') {
      payload = { ok: true, now: new Date().toISOString(), user: Session.getActiveUser().getEmail() || null, message: 'בדיקה עברה בהצלחה' };
    } else if (action === 'findEvents') {
      payload = handleFindEvents(data);
    } else if (action === 'createEvent') {
      payload = handleCreateEvent(data);
    } else if (action === 'updateEvent') {
      payload = handleUpdateEvent(data);
    } else if (action === 'deleteEvent') {
      payload = handleDeleteEvent(data);
    } else if (action === 'getEvent') {
      payload = handleGetEvent(data);
    } else if (action === 'text') {
      payload = handleNLPv1(data);
    } else if (action === 'parseOnly') {
      payload = handleNLPv2ParseOnly(data);
    } else {
      payload = { error: true, message: 'פעולה לא מוכרת: ' + action };
    }
  } catch (err) {
    payload = { error: true, message: 'שגיאה: ' + err.toString() };
  }
  
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleFindEvents(data) {
  var cal = CalendarApp.getDefaultCalendar();
  var startDate = data.startDate ? new Date(data.startDate) : new Date();
  var endDate = data.endDate ? new Date(data.endDate) : new Date(startDate.getTime() + 7*24*60*60*1000);
  var query = data.query || '';
  
  var events = cal.getEvents(startDate, endDate);
  if (query) {
    events = events.filter(function(ev) {
      return ev.getTitle().indexOf(query) >= 0;
    });
  }
  
  var evs = events.slice(0, 50).map(function(ev){
    return {
      id: ev.getId(),
      title: ev.getTitle(),
      start: ev.getStartTime(),
      end: ev.getEndTime(),
      allDay: ev.isAllDayEvent(),
      color: ev.getColor(),
      description: ev.getDescription()
    };
  });
  
  return { ok: true, count: evs.length, events: evs, message: 'נמצאו ' + evs.length + ' אירועים' };
}

function handleCreateEvent(data) {
  if (!data.title) {
    return { error: true, message: 'חסר כותרת לאירוע' };
  }
  
  var cal = CalendarApp.getDefaultCalendar();
  var title = data.title;
  var startTime = data.start ? new Date(data.start) : new Date();
  var endTime = data.end ? new Date(data.end) : new Date(startTime.getTime() + 60*60*1000);
  var description = data.description || '';
  
  var event;
  if (data.allDay) {
    var startDay = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
    var endDay = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate());
    event = cal.createAllDayEvent(title, startDay, endDay, {description: description});
  } else {
    event = cal.createEvent(title, startTime, endTime, {description: description});
  }
  
  if (data.color) {
    event.setColor(data.color);
  }
  
  return { 
    ok: true, 
    message: 'אירוע נוצר בהצלחה: ' + title,
    event: {
      id: event.getId(),
      title: event.getTitle(),
      start: event.getStartTime(),
      end: event.getEndTime()
    }
  };
}

function handleUpdateEvent(data) {
  if (!data.eventId) {
    return { error: true, message: 'חסר מזהה אירוע' };
  }
  
  var cal = CalendarApp.getDefaultCalendar();
  var event = cal.getEventById(data.eventId);
  
  if (!event) {
    return { error: true, message: 'אירוע לא נמצא' };
  }
  
  if (data.title) event.setTitle(data.title);
  if (data.description !== undefined) event.setDescription(data.description);
  if (data.start && data.end) {
    event.setTime(new Date(data.start), new Date(data.end));
  }
  if (data.color) event.setColor(data.color);
  
  return { 
    ok: true, 
    message: 'אירוע עודכן בהצלחה',
    event: {
      id: event.getId(),
      title: event.getTitle(),
      start: event.getStartTime(),
      end: event.getEndTime()
    }
  };
}

function handleDeleteEvent(data) {
  if (!data.eventId) {
    return { error: true, message: 'חסר מזהה אירוע' };
  }
  
  var cal = CalendarApp.getDefaultCalendar();
  var event = cal.getEventById(data.eventId);
  
  if (!event) {
    return { error: true, message: 'אירוע לא נמצא' };
  }
  
  var title = event.getTitle();
  event.deleteEvent();
  
  return { ok: true, message: 'אירוע נמחק בהצלחה: ' + title };
}

function handleGetEvent(data) {
  if (!data.eventId) {
    return { error: true, message: 'חסר מזהה אירוע' };
  }
  
  var cal = CalendarApp.getDefaultCalendar();
  var event = cal.getEventById(data.eventId);
  
  if (!event) {
    return { error: true, message: 'אירוע לא נמצא' };
  }
  
  return { 
    ok: true,
    event: {
      id: event.getId(),
      title: event.getTitle(),
      start: event.getStartTime(),
      end: event.getEndTime(),
      allDay: event.isAllDayEvent(),
      color: event.getColor(),
      description: event.getDescription()
    }
  };
}

function handleNLPv1(data) {
  var text = data.text || '';
  if (!text) {
    return { error: true, message: 'חסר טקסט לפענוח' };
  }
  
  var result = parseHebrewNLP(text);
  
  if (result.error) {
    return result;
  }
  
  if (data.execute) {
    var cal = CalendarApp.getDefaultCalendar();
    var event = cal.createEvent(result.title, result.start, result.end, {description: result.description || ''});
    if (result.color) {
      event.setColor(result.color);
    }
    return { 
      ok: true, 
      message: 'אירוע נוצר בהצלחה מטקסט: ' + result.title,
      parsed: result,
      event: {
        id: event.getId(),
        title: event.getTitle(),
        start: event.getStartTime(),
        end: event.getEndTime()
      }
    };
  } else {
    return { ok: true, message: 'טקסט פוענח בהצלחה', parsed: result };
  }
}

function parseHebrewNLP(text) {
  var tokens = text.trim().split(/\s+/);
  var result = {
    title: '',
    start: null,
    end: null,
    color: null,
    description: ''
  };
  
  var now = new Date();
  var baseDate = new Date(now);
  var startTime = null;
  var endTime = null;
  var titleParts = [];
  
  for (var i = 0; i < tokens.length; i++) {
    var token = tokens[i];
    
    if (token === 'היום') {
      baseDate = new Date(now);
    } else if (token === 'מחר') {
      baseDate = new Date(now.getTime() + 24*60*60*1000);
    } else if (token === 'ראשון' || token === 'שני' || token === 'שלישי' || 
               token === 'רביעי' || token === 'חמישי' || token === 'שישי' || token === 'שבת') {
      if (i + 1 < tokens.length && tokens[i+1] === 'הבא') {
        baseDate = getNextWeekday(token, now);
        i++;
      }
    } else if (token === 'צבע' && i + 1 < tokens.length) {
      var colorName = tokens[i+1];
      result.color = mapHebrewColor(colorName);
      i++;
    } else if (token.match(/^\d{1,2}:\d{2}$/)) {
      if (!startTime) {
        startTime = token;
      } else if (!endTime) {
        endTime = token;
      }
    } else if (token === '–' || token === '-') {
      continue;
    } else {
      titleParts.push(token);
    }
  }
  
  result.title = titleParts.join(' ');
  
  if (!result.title) {
    return { error: true, message: 'לא נמצאה כותרת לאירוע' };
  }
  
  if (startTime) {
    var timeParts = startTime.split(':');
    result.start = new Date(baseDate);
    result.start.setHours(parseInt(timeParts[0]), parseInt(timeParts[1]), 0, 0);
  } else {
    result.start = new Date(baseDate);
    result.start.setHours(9, 0, 0, 0);
  }
  
  if (endTime) {
    var timeParts2 = endTime.split(':');
    result.end = new Date(baseDate);
    result.end.setHours(parseInt(timeParts2[0]), parseInt(timeParts2[1]), 0, 0);
  } else {
    result.end = new Date(result.start.getTime() + 60*60*1000);
  }
  
  return result;
}

function getNextWeekday(dayName, from) {
  var daysMap = {
    'ראשון': 0,
    'שני': 1,
    'שלישי': 2,
    'רביעי': 3,
    'חמישי': 4,
    'שישי': 5,
    'שבת': 6
  };
  
  var targetDay = daysMap[dayName];
  if (targetDay === undefined) return from;
  
  var current = from.getDay();
  var daysAhead = targetDay - current;
  if (daysAhead <= 0) daysAhead += 7;
  
  return new Date(from.getTime() + daysAhead * 24*60*60*1000);
}

function mapHebrewColor(colorName) {
  var colorMap = {
    'אדום': CalendarApp.EventColor.RED,
    'כחול': CalendarApp.EventColor.BLUE,
    'ירוק': CalendarApp.EventColor.GREEN,
    'צהוב': CalendarApp.EventColor.YELLOW,
    'כתום': CalendarApp.EventColor.ORANGE,
    'סגול': CalendarApp.EventColor.PALE_BLUE,
    'ורוד': CalendarApp.EventColor.PALE_RED
  };
  
  return colorMap[colorName] || null;
}

function handleNLPv2ParseOnly(data) {
  var text = data.text || '';
  if (!text) {
    return { error: true, message: 'חסר טקסט לפענוח' };
  }
  
  var tokens = tokenizeHebrew(text);
  
  return { 
    ok: true, 
    message: 'טוקניזציה הושלמה (NLP v2 טיוטה)',
    tokens: tokens,
    note: 'זוהי גרסה מוקדמת – רק טוקניזציה בסיסית'
  };
}

function tokenizeHebrew(text) {
  var tokens = [];
  var words = text.trim().split(/\s+/);
  
  for (var i = 0; i < words.length; i++) {
    var word = words[i];
    var token = { text: word, type: 'UNKNOWN' };
    
    if (word === 'היום' || word === 'מחר') {
      token.type = 'DATE_REF';
    } else if (word.match(/^(ראשון|שני|שלישי|רביעי|חמישי|שישי|שבת)$/)) {
      token.type = 'WEEKDAY';
    } else if (word === 'הבא') {
      token.type = 'MODIFIER';
    } else if (word.match(/^\d{1,2}:\d{2}$/)) {
      token.type = 'TIME';
    } else if (word === 'צבע') {
      token.type = 'ATTRIBUTE';
    } else if (word.match(/^(אדום|כחול|ירוק|צהוב|כתום|סגול|ורוד)$/)) {
      token.type = 'COLOR';
    } else if (word === '–' || word === '-') {
      token.type = 'SEPARATOR';
    } else {
      token.type = 'TEXT';
    }
    
    tokens.push(token);
  }
  
  return tokens;
}
