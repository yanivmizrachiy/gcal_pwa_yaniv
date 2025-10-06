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
    payload = { info: "Use ?mode=selftest or ?mode=events" };
  }
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var payload;
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    
    if (action === 'selfTest') {
      payload = {
        ok: true,
        action: 'selfTest',
        message: 'בדיקה תקינה',
        now: new Date().toISOString()
      };
    } else if (action === 'findEvents') {
      payload = handleFindEvents(body.options || {});
    } else {
      payload = {
        ok: false,
        error: 'פעולה לא נתמכת: ' + (action || 'לא צוין'),
        action: action
      };
    }
  } catch (err) {
    payload = {
      ok: false,
      error: 'שגיאה בעיבוד הבקשה: ' + err.message
    };
  }
  
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function handleFindEvents(options) {
  try {
    var timeMin = options.timeMin ? new Date(options.timeMin) : null;
    var timeMax = options.timeMax ? new Date(options.timeMax) : null;
    
    if (!timeMin || isNaN(timeMin.getTime())) {
      return {
        ok: false,
        action: 'findEvents',
        error: 'timeMin חסר או לא תקין'
      };
    }
    
    if (!timeMax || isNaN(timeMax.getTime())) {
      return {
        ok: false,
        action: 'findEvents',
        error: 'timeMax חסר או לא תקין'
      };
    }
    
    var maxResults = options.maxResults || 50;
    if (maxResults > 200) {
      maxResults = 200;
    }
    
    var q = options.q ? options.q.toLowerCase() : null;
    
    var cal = CalendarApp.getDefaultCalendar();
    var events = cal.getEvents(timeMin, timeMax);
    
    var items = [];
    for (var i = 0; i < events.length && items.length < maxResults; i++) {
      var ev = events[i];
      var title = ev.getTitle() || '';
      var description = ev.getDescription() || '';
      var location = ev.getLocation() || '';
      
      if (q) {
        var searchText = (title + ' ' + description + ' ' + location).toLowerCase();
        if (searchText.indexOf(q) === -1) {
          continue;
        }
      }
      
      items.push({
        id: ev.getId(),
        summary: title,
        start: {
          dateTime: ev.getStartTime().toISOString()
        },
        end: {
          dateTime: ev.getEndTime().toISOString()
        },
        location: location,
        allDay: ev.isAllDayEvent()
      });
    }
    
    return {
      ok: true,
      action: 'findEvents',
      count: items.length,
      items: items,
      message: 'נמצאו ' + items.length + ' אירועים'
    };
  } catch (err) {
    return {
      ok: false,
      action: 'findEvents',
      error: 'שגיאה באחזור אירועים: ' + err.message
    };
  }
}
