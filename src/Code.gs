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
 * Handle createEvent action
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
 */
function handleDeleteEvent(eventId) {
  var cal = CalendarApp.getDefaultCalendar();
  var event = cal.getEventById(eventId);
  
  if (!event) {
    return { ok: false, error: 'אירוע לא נמצא' };
  }
  
  var title = event.getTitle();
  var isRecurring = false;
  var warnings = [];
  
  // Check if event is part of a recurring series
  try {
    var series = event.getEventSeries();
    if (series) {
      isRecurring = true;
    }
  } catch (e) {
    // Not a recurring event or error checking
    isRecurring = false;
  }
  
  // Delete the event (for recurring, this deletes only the instance)
  event.deleteEvent();
  
  var result = {
    ok: true,
    action: 'deleteEvent',
    message: 'האירוע נמחק בהצלחה: ' + title
  };
  
  // Add warning if it was a recurring event instance
  if (isRecurring) {
    warnings.push({
      type: 'SERIES_INSTANCE_DELETE',
      message: 'נמחק רק מופע יחיד. למחיקת כל הסדרה כתוב: מחק את כל הסדרה של ' + title
    });
    result.warnings = warnings;
  }
  
  return result;
}

/**
 * Handle parseNlp action - Hebrew Natural Language Processing v2
 */
function handleParseNlp(text, parseOnly) {
  var interpreted = parseHebrewCommand(text);
  
  // Handle disambiguation case
  if (interpreted.needDisambiguation) {
    return {
      ok: false,
      needDisambiguation: true,
      candidates: interpreted.candidates,
      error: interpreted.error,
      message: 'נדרשת בחירה מבין מספר אירועים'
    };
  }
  
  if (!interpreted.success) {
    var response = {
      ok: false,
      error: interpreted.error || 'לא הצלחתי להבין את הפקודה',
      tokens: interpreted.tokens
    };
    
    // Include warnings if any
    if (interpreted.warnings && interpreted.warnings.length > 0) {
      response.warnings = interpreted.warnings;
    }
    
    return response;
  }
  
  if (parseOnly) {
    var previewResponse = {
      ok: true,
      action: 'parseNlp',
      parseOnly: true,
      interpreted: interpreted,
      message: 'תצוגה מקדימה - לא בוצעו שינויים'
    };
    
    // Include warnings in preview
    if (interpreted.warnings && interpreted.warnings.length > 0) {
      previewResponse.warnings = interpreted.warnings;
    }
    
    return previewResponse;
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
  
  // Merge warnings from interpretation and execution
  var allWarnings = [];
  if (interpreted.warnings && interpreted.warnings.length > 0) {
    allWarnings = allWarnings.concat(interpreted.warnings);
  }
  if (result.warnings && result.warnings.length > 0) {
    allWarnings = allWarnings.concat(result.warnings);
  }
  
  if (allWarnings.length > 0) {
    result.warnings = allWarnings;
  }
  
  return result;
}

/**
 * Normalize Hebrew text for fuzzy matching
 * - Remove niqqud (vowel marks)
 * - Convert to lowercase
 * - Trim whitespace
 */
function normalizeHebrew(str) {
  if (!str) return '';
  // Remove Hebrew niqqud marks (U+0591 to U+05C7)
  var normalized = str.replace(/[\u0591-\u05C7]/g, '');
  return normalized.toLowerCase().trim();
}

/**
 * Tokenize text for fuzzy matching
 * - Normalize text
 * - Split into words
 * - Filter out tokens < 2 chars
 * - Remove common stop words
 */
function tokenizeForFuzzy(str) {
  var normalized = normalizeHebrew(str);
  var stopWords = ['את', 'של', 'על', 'אל', 'עם', 'לא', 'כל', 'או', 'גם', 'זה', 'זו', 'היא', 'הוא', 'יש', 'לי', 'מה', 'מי', 'כי'];
  
  var tokens = normalized.split(/\s+/).filter(function(token) {
    return token.length >= 2 && stopWords.indexOf(token) === -1;
  });
  
  return tokens;
}

/**
 * Calculate Levenshtein distance between two strings
 * Returns -1 if distance exceeds maxThreshold (early exit optimization)
 */
function levenshteinDistance(a, b, maxThreshold) {
  if (!a || !b) return (maxThreshold !== undefined && Math.max(a.length, b.length) > maxThreshold) ? -1 : Math.max(a.length, b.length);
  
  var aLen = a.length;
  var bLen = b.length;
  
  // Early exit if length difference exceeds threshold
  if (maxThreshold !== undefined && Math.abs(aLen - bLen) > maxThreshold) {
    return -1;
  }
  
  // Create matrix
  var matrix = [];
  for (var i = 0; i <= aLen; i++) {
    matrix[i] = [i];
  }
  for (var j = 0; j <= bLen; j++) {
    matrix[0][j] = j;
  }
  
  // Fill matrix
  for (var i = 1; i <= aLen; i++) {
    var minInRow = i;
    for (var j = 1; j <= bLen; j++) {
      var cost = (a.charAt(i - 1) === b.charAt(j - 1)) ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
      minInRow = Math.min(minInRow, matrix[i][j]);
    }
    
    // Early exit if entire row exceeds threshold
    if (maxThreshold !== undefined && minInRow > maxThreshold) {
      return -1;
    }
  }
  
  return matrix[aLen][bLen];
}

/**
 * Score similarity between input tokens and candidate event title
 * Returns score between 0 and 1
 */
function scoreTitleSimilarity(inputTokens, candidateTitle) {
  var candidateNorm = normalizeHebrew(candidateTitle);
  var candidateTokens = tokenizeForFuzzy(candidateTitle);
  
  // Find shared tokens
  var sharedTokenChars = 0;
  var longestSharedToken = 0;
  
  inputTokens.forEach(function(inToken) {
    candidateTokens.forEach(function(candToken) {
      // Check if tokens share substring of at least 3 chars
      for (var i = 0; i < inToken.length - 2; i++) {
        var substring = inToken.substring(i, i + 3);
        if (candToken.indexOf(substring) >= 0) {
          var matchLen = 3;
          // Extend match as far as possible
          while (i + matchLen < inToken.length && candToken.indexOf(inToken.substring(i, i + matchLen + 1)) >= 0) {
            matchLen++;
          }
          sharedTokenChars += matchLen;
          longestSharedToken = Math.max(longestSharedToken, matchLen);
        }
      }
    });
  });
  
  // Calculate total characters in input
  var totalChars = inputTokens.join('').length;
  if (totalChars === 0) return 0;
  
  // Calculate token-based score (0..1)
  var tokenScore = sharedTokenChars / totalChars;
  
  // Calculate Levenshtein ratio
  var inputJoined = inputTokens.join(' ');
  var levDist = levenshteinDistance(inputJoined, candidateNorm, 12);
  var maxLen = Math.max(inputJoined.length, candidateNorm.length);
  var levRatio = (levDist === -1) ? 0 : (1 - (levDist / maxLen));
  
  // Weighted combination: 60% token overlap, 40% Levenshtein
  var score = tokenScore * 0.6 + levRatio * 0.4;
  
  return {
    score: score,
    longestSharedToken: longestSharedToken
  };
}

/**
 * Find candidate events matching query tokens within time window
 * Window: (now - 30 days) to (now + 60 days)
 * Prefilter: Only consider events with at least one token substring match (>=3 chars) OR Levenshtein <= 12
 */
function findCandidateEvents(queryTokens, windowStart, windowEnd, prefilterMax) {
  var cal = CalendarApp.getDefaultCalendar();
  var events = cal.getEvents(windowStart, windowEnd);
  
  var candidates = [];
  var queryJoined = queryTokens.join(' ');
  
  for (var i = 0; i < events.length && i < prefilterMax; i++) {
    var event = events[i];
    var title = event.getTitle();
    var titleNorm = normalizeHebrew(title);
    
    // Prefilter: Check if title contains at least one token substring >= 3 chars
    var hasSubstringMatch = false;
    for (var j = 0; j < queryTokens.length; j++) {
      var token = queryTokens[j];
      if (token.length >= 3 && titleNorm.indexOf(token.substring(0, 3)) >= 0) {
        hasSubstringMatch = true;
        break;
      }
    }
    
    // Or check Levenshtein distance
    var levDist = -1;
    if (!hasSubstringMatch) {
      levDist = levenshteinDistance(queryJoined, titleNorm, 12);
      if (levDist !== -1 && levDist <= 12) {
        hasSubstringMatch = true;
      }
    }
    
    if (hasSubstringMatch) {
      var scoreResult = scoreTitleSimilarity(queryTokens, title);
      candidates.push({
        event: event,
        title: title,
        start: event.getStartTime(),
        end: event.getEndTime(),
        score: scoreResult.score,
        longestSharedToken: scoreResult.longestSharedToken
      });
    }
  }
  
  return candidates;
}

/**
 * Select best candidates from scored list
 * Returns top candidates sorted by score (desc) then time proximity to now (asc)
 */
function selectBestCandidates(candidates, limit) {
  if (!limit) limit = 6;
  var now = new Date();
  
  // Sort by score (desc), then by time proximity to now (asc)
  candidates.sort(function(a, b) {
    if (Math.abs(a.score - b.score) > 0.001) {
      return b.score - a.score; // Higher score first
    }
    // Same score, sort by proximity to now
    var aDist = Math.abs(a.start.getTime() - now.getTime());
    var bDist = Math.abs(b.start.getTime() - now.getTime());
    return aDist - bDist;
  });
  
  return candidates.slice(0, limit);
}

/**
 * Parse Hebrew natural language command - NLP v2
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
    warnings: [],
    needDisambiguation: false,
    candidates: null
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
    // Extract query for fuzzy matching (all text tokens except operation keywords)
    var queryWords = [];
    tokens.forEach(function(t) {
      if (deleteKeywords.indexOf(t.text) === -1 && t.type === 'text') {
        queryWords.push(t.text);
      }
    });
    
    if (queryWords.length === 0) {
      result.error = 'מחיקה דורשת זיהוי אירוע ספציפי';
      return result;
    }
    
    // Fuzzy match
    var queryTokens = tokenizeForFuzzy(queryWords.join(' '));
    var now = new Date();
    var windowStart = new Date(now.getTime() - 30*24*60*60*1000); // 30 days ago
    var windowEnd = new Date(now.getTime() + 60*24*60*60*1000);   // 60 days ahead
    
    var candidates = findCandidateEvents(queryTokens, windowStart, windowEnd, 500);
    var bestCandidates = selectBestCandidates(candidates, 6);
    
    // Check if we have a clear winner
    if (bestCandidates.length === 0) {
      result.error = 'לא מצאתי אירוע תואם למחיקה';
      return result;
    }
    
    var primary = bestCandidates[0];
    // Accept if score >= 0.55 AND longest shared token >= 3
    if (primary.score >= 0.55 && primary.longestSharedToken >= 3) {
      // Check if there are other candidates also above threshold
      var aboveThreshold = bestCandidates.filter(function(c) {
        return c.score >= 0.55 && c.longestSharedToken >= 3;
      });
      
      if (aboveThreshold.length > 1) {
        // Need disambiguation
        result.needDisambiguation = true;
        result.candidates = aboveThreshold.map(function(c) {
          return {
            id: c.event.getId(),
            title: c.title,
            start: c.start.toISOString(),
            end: c.end.toISOString(),
            score: c.score
          };
        });
        result.error = 'מצאתי מספר אירועים תואמים. אנא בחר אירוע ספציפי.';
        return result;
      }
      
      // Single match - proceed
      result.success = true;
      result.eventId = primary.event.getId();
      return result;
    } else {
      result.error = 'לא מצאתי אירוע תואם למחיקה';
      return result;
    }
    
  } else if (hasUpdate) {
    result.operation = 'update';
    
    // Check for recurrence modification attempts
    var recurrenceKeywords = ['חזר', 'חוזר', 'חזרת', 'חוזרת'];
    var hasRecurrenceAttempt = tokens.some(function(t) {
      return recurrenceKeywords.indexOf(t.text) >= 0;
    });
    
    // Also check for "כל" + weekday pattern
    var weekdays = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    for (var i = 0; i < tokens.length - 1; i++) {
      if (tokens[i].text === 'כל') {
        for (var w = 0; w < weekdays.length; w++) {
          if (tokens[i + 1].text.indexOf(weekdays[w]) >= 0) {
            hasRecurrenceAttempt = true;
            break;
          }
        }
      }
    }
    
    if (hasRecurrenceAttempt) {
      result.error = 'שינוי חזרתיות אינו נתמך בעדכון בשלב זה';
      return result;
    }
    
    // Extract query for fuzzy matching
    var queryWords = [];
    tokens.forEach(function(t) {
      if (updateKeywords.indexOf(t.text) === -1 && t.type === 'text') {
        queryWords.push(t.text);
      }
    });
    
    if (queryWords.length === 0) {
      result.error = 'עדכון דורש זיהוי אירוע ספציפי';
      return result;
    }
    
    // Fuzzy match
    var queryTokens = tokenizeForFuzzy(queryWords.join(' '));
    var now = new Date();
    var windowStart = new Date(now.getTime() - 30*24*60*60*1000);
    var windowEnd = new Date(now.getTime() + 60*24*60*60*1000);
    
    var candidates = findCandidateEvents(queryTokens, windowStart, windowEnd, 500);
    var bestCandidates = selectBestCandidates(candidates, 6);
    
    if (bestCandidates.length === 0) {
      result.error = 'לא מצאתי אירוע תואם לעדכון';
      return result;
    }
    
    var primary = bestCandidates[0];
    if (primary.score >= 0.55 && primary.longestSharedToken >= 3) {
      var aboveThreshold = bestCandidates.filter(function(c) {
        return c.score >= 0.55 && c.longestSharedToken >= 3;
      });
      
      if (aboveThreshold.length > 1) {
        result.needDisambiguation = true;
        result.candidates = aboveThreshold.map(function(c) {
          return {
            id: c.event.getId(),
            title: c.title,
            start: c.start.toISOString(),
            end: c.end.toISOString(),
            score: c.score
          };
        });
        result.error = 'מצאתי מספר אירועים תואמים. אנא בחר אירוע ספציפי.';
        return result;
      }
      
      // Single match - now parse what to update
      result.eventId = primary.event.getId();
      result.changes = {};
      
      // Extract guests to add/remove
      var guestsAdd = [];
      var guestsRemove = [];
      var addVerbs = ['הוסף', 'הוספת', 'לצרף'];
      var removeVerbs = ['הסר', 'הורד', 'מחק'];
      
      var inAddContext = false;
      var inRemoveContext = false;
      
      for (var i = 0; i < tokens.length; i++) {
        var token = tokens[i].text;
        
        // Check for add verbs
        if (addVerbs.indexOf(token) >= 0) {
          inAddContext = true;
          inRemoveContext = false;
          continue;
        }
        
        // Check for remove verbs
        if (removeVerbs.indexOf(token) >= 0) {
          inRemoveContext = true;
          inAddContext = false;
          continue;
        }
        
        // Extract emails
        if ((inAddContext || inRemoveContext) && token.indexOf('@') >= 0) {
          // Basic email validation
          var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(token)) {
            if (inAddContext) {
              guestsAdd.push(token);
            } else if (inRemoveContext) {
              guestsRemove.push(token);
            }
          } else {
            result.warnings.push({
              type: 'GUEST_EMAIL_INVALID',
              message: 'כתובת דוא"ל לא תקינה: ' + token
            });
          }
        }
      }
      
      // Neutralize duplicates between add and remove
      var neutralized = [];
      guestsAdd = guestsAdd.filter(function(email) {
        if (guestsRemove.indexOf(email) >= 0) {
          neutralized.push(email);
          return false;
        }
        return true;
      });
      guestsRemove = guestsRemove.filter(function(email) {
        return neutralized.indexOf(email) === -1;
      });
      
      if (neutralized.length > 0) {
        result.warnings.push({
          type: 'GUEST_DUPLICATE_NEUTRALIZED',
          message: 'דוא"ל מופיע גם בהוספה וגם בהסרה, מבוטל: ' + neutralized.join(', ')
        });
      }
      
      if (guestsAdd.length > 0) {
        result.changes.guestsAdd = guestsAdd;
      }
      if (guestsRemove.length > 0) {
        result.changes.guestsRemove = guestsRemove;
      }
      
      // Parse other changes (title, time, etc) - for now just indicate success
      result.success = true;
      return result;
    } else {
      result.error = 'לא מצאתי אירוע תואם לעדכון';
      return result;
    }
    
  } else {
    result.operation = 'create';
  }
  
  // Parse date/time
  var dateTime = parseDateTimeFromTokens(tokens);
  if (!dateTime.start || !dateTime.end) {
    result.error = 'לא זוהה תאריך או שעה';
    return result;
  }
  
  // Extract title (words not matching other patterns)
  var title = extractTitle(tokens, dateTime);
  
  // Extract color
  var color = extractColor(tokens);
  
  // Extract reminders
  var reminders = extractReminders(tokens);
  
  result.success = true;
  result.event = {
    title: title || 'אירוע',
    start: dateTime.start.toISOString(),
    end: dateTime.end.toISOString(),
    color: color,
    reminders: reminders
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
 * Parse date and time from tokens
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
