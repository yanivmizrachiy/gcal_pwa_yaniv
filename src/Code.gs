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

/**
 * POST endpoint for handling text commands and NLP parsing.
 * Supports both v1 (existing "text" action) and v2 ("parseOnly" action).
 * 
 * @param {Object} e - Event object containing POST data
 * @returns {TextOutput} JSON response
 */
function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action || 'text';
    var rawInput = body.text || body.input || '';
    
    if (action === 'parseOnly') {
      // NLP v2: Parse the command and return interpreted object WITHOUT executing
      var interpreted = parseHebrewCommandV2(rawInput);
      interpreted.nlpVersion = 'v2-draft';
      interpreted.rawInput = rawInput;
      
      return ContentService.createTextOutput(JSON.stringify(interpreted))
        .setMimeType(ContentService.MimeType.JSON);
    } else if (action === 'text') {
      // TODO: Existing v1 behavior - keep unchanged for now
      // This will be the existing CRUD logic when implemented
      var response = {
        nlpVersion: 'v1',
        success: false,
        message: 'פעולת "text" טרם מומשה במלואה'
      };
      
      return ContentService.createTextOutput(JSON.stringify(response))
        .setMimeType(ContentService.MimeType.JSON);
    } else {
      throw new Error('פעולה לא נתמכת: ' + action);
    }
  } catch (err) {
    var errorResponse = {
      success: false,
      error: err.message || 'שגיאה לא ידועה',
      message: 'שגיאה בעיבוד הבקשה'
    };
    
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Parse a Hebrew command into a structured interpretation object (NLP v2).
 * This is a scaffolding function with basic tokenization.
 * 
 * @param {string} rawInput - The raw Hebrew command text
 * @returns {Object} Interpreted command object with tokens, action, event details, etc.
 */
function parseHebrewCommandV2(rawInput) {
  // TODO: Implement full NLP v2 parsing logic
  
  var interpreted = {
    tokens: {},
    warnings: [],
    safeToExecute: true,
    needsConfirmation: false
  };
  
  // Basic tokenization - detect common patterns
  var tokens = tokenizeBasicPatterns(rawInput);
  interpreted.tokens = tokens;
  
  // Determine action based on verb detection
  if (tokens.verb) {
    interpreted.action = mapVerbToAction(tokens.verb);
  } else {
    interpreted.action = 'unknown';
    interpreted.warnings.push('לא זוהה פועל פעולה');
    interpreted.safeToExecute = false;
  }
  
  // TODO: Build event object from tokens
  // TODO: For update/delete actions, call matchEventsHeuristic
  // TODO: Call computeSafety to determine safeToExecute and needsConfirmation
  
  return interpreted;
}

/**
 * Tokenize basic patterns in Hebrew text.
 * Detects date keywords, time ranges, color phrases, and common verbs.
 * 
 * @param {string} text - The input text to tokenize
 * @returns {Object} Object containing detected tokens
 */
function tokenizeBasicPatterns(text) {
  var tokens = {
    dateKeywords: [],
    timeRange: null,
    colorPhrase: null,
    verb: null,
    allDay: false
  };
  
  var normalized = text.trim();
  
  // Detect date keywords
  var dateKeywords = ['היום', 'מחר', 'מחרתיים', 'אתמול'];
  dateKeywords.forEach(function(keyword) {
    if (normalized.indexOf(keyword) !== -1) {
      tokens.dateKeywords.push(keyword);
    }
  });
  
  // Detect time range pattern: HH:MM–HH:MM or HH:MM-HH:MM
  var timeRangePattern = /(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/;
  var timeMatch = normalized.match(timeRangePattern);
  if (timeMatch) {
    tokens.timeRange = timeMatch[0];
  }
  
  // Detect color phrase
  if (normalized.indexOf('צבע') !== -1) {
    // Extract color phrase
    var colorMatch = normalized.match(/צבע\s+(\S+)/);
    if (colorMatch) {
      tokens.colorPhrase = 'צבע ' + colorMatch[1];
    }
  }
  
  // Detect all-day markers
  if (normalized.indexOf('כל היום') !== -1 || normalized.indexOf('יום שלם') !== -1) {
    tokens.allDay = true;
  }
  
  // Detect verbs (basic implementation)
  var createVerbs = ['צור', 'יצור', 'הוסף', 'תוסיף', 'קבע'];
  var updateVerbs = ['עדכן', 'שנה', 'תקן'];
  var deleteVerbs = ['מחק', 'בטל', 'הסר'];
  var moveVerbs = ['העבר', 'הזז', 'דחה'];
  
  createVerbs.forEach(function(v) {
    if (normalized.indexOf(v) !== -1) tokens.verb = v;
  });
  updateVerbs.forEach(function(v) {
    if (normalized.indexOf(v) !== -1) tokens.verb = v;
  });
  deleteVerbs.forEach(function(v) {
    if (normalized.indexOf(v) !== -1) tokens.verb = v;
  });
  moveVerbs.forEach(function(v) {
    if (normalized.indexOf(v) !== -1) tokens.verb = v;
  });
  
  return tokens;
}

/**
 * Map a detected Hebrew verb to a standard action type.
 * 
 * @param {string} verb - The detected Hebrew verb
 * @returns {string} The corresponding action type
 */
function mapVerbToAction(verb) {
  var createVerbs = ['צור', 'יצור', 'הוסף', 'תוסיף', 'קבע'];
  var updateVerbs = ['עדכן', 'שנה', 'תקן'];
  var deleteVerbs = ['מחק', 'בטל', 'הסר'];
  var moveVerbs = ['העבר', 'הזז', 'דחה'];
  var duplicateVerbs = ['שכפל', 'העתק'];
  
  if (createVerbs.indexOf(verb) !== -1) return 'create';
  if (updateVerbs.indexOf(verb) !== -1) return 'update';
  if (deleteVerbs.indexOf(verb) !== -1) return 'delete';
  if (moveVerbs.indexOf(verb) !== -1) return 'move';
  if (duplicateVerbs.indexOf(verb) !== -1) return 'duplicate';
  
  return 'unknown';
}

/**
 * Match existing calendar events based on a query using a scoring heuristic.
 * This is a placeholder function for future implementation.
 * 
 * @param {string} query - Search query (e.g., event title or description)
 * @param {Object} options - Optional search options (date range, etc.)
 * @returns {Object} Match result with score, ambiguous flag, and candidates
 */
function matchEventsHeuristic(query, options) {
  // TODO: Implement event matching logic
  // 1. Fetch events from calendar within a date range
  // 2. Score each event based on title match, date proximity, attendees, etc.
  // 3. Detect ambiguity (multiple events with similar scores)
  // 4. Return match result
  
  return {
    matchedEvent: null,
    score: 0,
    ambiguous: false,
    candidates: []
  };
}

/**
 * Compute safety flags for an interpreted command.
 * Determines if the command is safe to execute and if it needs user confirmation.
 * 
 * @param {Object} interpreted - The interpreted command object
 * @returns {Object} Object with safeToExecute and needsConfirmation flags
 */
function computeSafety(interpreted) {
  // TODO: Implement safety computation logic
  // Rules:
  // - Delete actions always need confirmation
  // - Ambiguous event matches need confirmation
  // - Commands with warnings may not be safe to execute
  
  var safeToExecute = true;
  var needsConfirmation = false;
  
  if (interpreted.action === 'delete') {
    needsConfirmation = true;
  }
  
  if (interpreted.eventMatch && interpreted.eventMatch.ambiguous) {
    safeToExecute = false;
    needsConfirmation = true;
  }
  
  if (interpreted.warnings && interpreted.warnings.length > 0) {
    safeToExecute = false;
  }
  
  return {
    safeToExecute: safeToExecute,
    needsConfirmation: needsConfirmation
  };
}
