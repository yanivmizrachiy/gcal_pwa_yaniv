/**
 * Handle GET requests
 * @param {Object} e - Event object with parameters
 * @returns {TextOutput} JSON response
 */
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
  } else if (mode === 'today') {
    var cal = CalendarApp.getDefaultCalendar();
    var now = new Date();
    var startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    var endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    var evs = cal.getEvents(startOfDay, endOfDay).map(function(ev){
      return {
        title: ev.getTitle(),
        start: ev.getStartTime(),
        end: ev.getEndTime(),
        allDay: ev.isAllDayEvent()
      };
    });
    payload = { count: evs.length, events: evs };
  } else {
    payload = { info: "Use ?mode=selftest or ?mode=events or ?mode=today" };
  }
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle POST requests
 * @param {Object} e - Event object with postData
 * @returns {TextOutput} JSON response
 */
function doPost(e) {
  try {
    var postData = e && e.postData && e.postData.contents;
    if (!postData) {
      return createErrorResponse('', 'חסרים נתונים בבקשה');
    }
    
    var request = JSON.parse(postData);
    var action = request.action || '';
    
    if (action === 'selfTest') {
      return handleSelfTest();
    } else if (action === 'findEvents') {
      return handleFindEvents(request);
    } else {
      return createErrorResponse(action, 'פעולה לא נתמכת: ' + action);
    }
  } catch (err) {
    return createErrorResponse('', 'שגיאה בעיבוד הבקשה: ' + err.message);
  }
}

/**
 * Handle selfTest action
 * @returns {TextOutput} JSON response
 */
function handleSelfTest() {
  var payload = {
    ok: true,
    action: 'selfTest',
    message: 'בדיקה תקינה',
    now: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Handle findEvents action with date range and optional filter
 * @param {Object} request - Request object with timeMin, timeMax, maxResults, q
 * @returns {TextOutput} JSON response
 */
function handleFindEvents(request) {
  try {
    // Validate required parameters
    if (!request.timeMin || !request.timeMax) {
      return createErrorResponse('findEvents', 'חובה לספק timeMin ו-timeMax בפורמט ISO');
    }
    
    // Parse dates
    var timeMin = new Date(request.timeMin);
    var timeMax = new Date(request.timeMax);
    
    if (isNaN(timeMin.getTime()) || isNaN(timeMax.getTime())) {
      return createErrorResponse('findEvents', 'תאריכים לא תקינים - נדרש פורמט ISO');
    }
    
    // Validate and set maxResults
    var maxResults = parseInt(request.maxResults) || 50;
    if (maxResults < 1) maxResults = 50;
    if (maxResults > 200) maxResults = 200;
    
    // Get calendar events
    var cal = CalendarApp.getDefaultCalendar();
    var events = cal.getEvents(timeMin, timeMax);
    
    // Apply text filter if provided
    var q = request.q || '';
    if (q) {
      var qLower = q.toLowerCase();
      events = events.filter(function(ev) {
        var title = (ev.getTitle() || '').toLowerCase();
        var desc = (ev.getDescription() || '').toLowerCase();
        var loc = (ev.getLocation() || '').toLowerCase();
        return title.indexOf(qLower) >= 0 || 
               desc.indexOf(qLower) >= 0 || 
               loc.indexOf(qLower) >= 0;
      });
    }
    
    // Limit results
    events = events.slice(0, maxResults);
    
    // Map events to response format (NO getHtmlLink - it doesn't exist)
    var items = events.map(function(ev) {
      var allDay = ev.isAllDayEvent();
      return {
        id: ev.getId(),
        summary: ev.getTitle(),
        start: {
          dateTime: ev.getStartTime().toISOString()
        },
        end: {
          dateTime: ev.getEndTime().toISOString()
        },
        location: ev.getLocation() || null,
        allDay: allDay
      };
    });
    
    var payload = {
      ok: true,
      action: 'findEvents',
      count: items.length,
      items: items,
      message: 'נמצאו ' + items.length + ' אירועים'
    };
    
    return ContentService.createTextOutput(JSON.stringify(payload))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return createErrorResponse('findEvents', 'שגיאה בחיפוש אירועים: ' + err.message);
  }
}

/**
 * Create uniform error response
 * @param {string} action - Action name
 * @param {string} errorMsg - Error message
 * @returns {TextOutput} JSON error response
 */
function createErrorResponse(action, errorMsg) {
  var payload = {
    ok: false,
    action: action,
    error: errorMsg
  };
  return ContentService.createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
