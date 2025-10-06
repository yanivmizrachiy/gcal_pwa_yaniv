# NLP Technical Documentation – Hebrew Calendar Smart Editor

## Overview
This document describes the Natural Language Processing (NLP) implementation for Hebrew language calendar commands in the Google Calendar Smart Editor.

## Architecture

### Version 1 (Current - Production)
**Status**: ✅ Deployed  
**Language Support**: Hebrew (עברית)  
**Approach**: Pattern-based matching with regex

### Version 2 (Draft - Future)
**Status**: 🚧 Draft/Planning  
**Language Support**: Hebrew + English  
**Approach**: Token-based parsing with enhanced context understanding

---

## NLP v1 Implementation

### Core Function: `parseHebrewNLP(text)`
**Location**: `src/Code.gs`  
**Input**: Hebrew natural language text  
**Output**: Parsed intent and event structure

```javascript
{
  intent: 'create' | 'update' | 'delete' | 'unknown',
  event: {
    title: string,
    start: ISO8601 string,
    end: ISO8601 string,
    allDay: boolean,
    description?: string,
    location?: string,
    searchTitle?: string  // For delete operations
  },
  tokens: string[]  // Array of words for v2-draft
}
```

### Supported Intents

#### 1. Create Intent (יצירה)
**Hebrew Keywords**: `צור`, `יצירה`, `חדש`, `הוסף`, `תזכורת`

**Pattern Detection**:
```javascript
/צור|יצירה|חדש|הוסף|תזכורת/i
```

**Title Extraction**:
```javascript
/(?:צור|יצירה|חדש|הוסף|תזכורת)\s+(.+?)(?:\s+ב(?:תאריך)?|\s+מ|$)/i
```

**Examples**:
- `צור פגישה עם דני` → title: "פגישה עם דני"
- `הוסף תזכורת לקנות חלב` → title: "לקנות חלב"
- `יצירה אירוע חשוב מחר` → title: "אירוע חשוב"

#### 2. Update Intent (עדכון)
**Hebrew Keywords**: `עדכן`, `שנה`, `ערוך`

**Pattern Detection**:
```javascript
/עדכן|שנה|ערוך/i
```

**Title Extraction**:
```javascript
/(?:עדכן|שנה|ערוך)\s+(.+?)(?:\s+ל|$)/i
```

**Examples**:
- `עדכן פגישה עם דני ל 15:00` → title: "פגישה עם דני"
- `שנה תזכורת חלב למחר` → title: "תזכורת חלב"

#### 3. Delete Intent (מחיקה)
**Hebrew Keywords**: `מחק`, `הסר`, `בטל`

**Pattern Detection**:
```javascript
/מחק|הסר|בטל/i
```

**Title Extraction**:
```javascript
/(?:מחק|הסר|בטל)\s+(.+)/i
```

**Examples**:
- `מחק פגישה עם דני` → searchTitle: "פגישה עם דני"
- `הסר תזכורת חלב` → searchTitle: "תזכורת חלב"
- `בטל פגישת צוות` → searchTitle: "פגישת צוות"

### Date/Time Extraction: `extractDateTime(text)`

#### Supported Time Expressions (Hebrew)

##### Relative Days
| Hebrew | English | Behavior |
|--------|---------|----------|
| `היום` | today | Current date, current time or 9:00 if all-day |
| `עכשיו` | now | Current date and time |
| `מחר` | tomorrow | Tomorrow 9:00, all-day |
| `שבוע הבא` | next week | +7 days, 9:00, all-day |

**Pattern Detection**:
```javascript
/היום|עכשיו/     // Today/now
/מחר/             // Tomorrow
/שבוע הבא/        // Next week
```

##### Time Formats
**24-Hour Format**: `HH:MM`

**Pattern Detection**:
```javascript
/(\d{1,2}):(\d{2})/
```

**Examples**:
- `14:00` → 2:00 PM
- `09:30` → 9:30 AM
- `23:45` → 11:45 PM

**Behavior**: When time is specified, `allDay` is set to `false` and duration defaults to 1 hour.

##### Date Formats
**DD/MM Format**: Day and month (current year assumed)  
**DD/MM/YYYY Format**: Full date

**Pattern Detection**:
```javascript
/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/
```

**Examples**:
- `25/12` → December 25, current year
- `01/01/2025` → January 1, 2025
- `15/8` → August 15, current year

**Behavior**: Date specified = all-day event at 9:00 AM (1 hour duration)

#### Default Behavior
- **No time specified**: All-day event
- **Default start time**: 9:00 AM (for all-day events)
- **Default duration**: 1 hour
- **Time zone**: Asia/Jerusalem (configured in `appsscript.json`)

### Complete Examples

#### Example 1: Simple Create
```
Input: "צור פגישה עם דני מחר בשעה 14:00"

Parsed:
{
  intent: "create",
  event: {
    title: "פגישה עם דני",
    start: "2024-12-26T14:00:00.000Z",  // Tomorrow 14:00
    end: "2024-12-26T15:00:00.000Z",    // +1 hour
    allDay: false
  }
}
```

#### Example 2: All-Day Event
```
Input: "הוסף תזכורת לקנות חלב מחר"

Parsed:
{
  intent: "create",
  event: {
    title: "לקנות חלב",
    start: "2024-12-26T09:00:00.000Z",  // Tomorrow 9:00
    end: "2024-12-26T10:00:00.000Z",    // +1 hour
    allDay: true
  }
}
```

#### Example 3: Specific Date
```
Input: "צור פגישת צוות ב-15/1/2025 בשעה 10:00"

Parsed:
{
  intent: "create",
  event: {
    title: "פגישת צוות",
    start: "2025-01-15T10:00:00.000Z",
    end: "2025-01-15T11:00:00.000Z",
    allDay: false
  }
}
```

---

## NLP v2 Draft (Future Enhancement)

### Planned Features

#### 1. Tokenization
Break down text into semantic tokens:
```javascript
{
  type: 'ACTION',    // צור, מחק, עדכן
  type: 'SUBJECT',   // פגישה, תזכורת
  type: 'PERSON',    // דני, הבוס
  type: 'TIME',      // מחר, 14:00
  type: 'DATE',      // 25/12
  type: 'LOCATION',  // במשרד, בזום
  type: 'MODIFIER'   // חשוב, דחוף
}
```

#### 2. Context Understanding
- Track previous commands for context
- Support pronouns: "עדכן אותו ל-15:00" (update it to 3pm)
- Multi-step commands: "צור 3 פגישות עם דני"

#### 3. Enhanced Time Parsing
- **Relative times**: "בעוד שעה", "בעוד 2 ימים"
- **Week days**: "ביום ראשון", "ביום שלישי הבא"
- **Month names**: "בינואר", "ביוני הבא"
- **Time ranges**: "בין 14:00 ל-16:00"

#### 4. Recurring Events
- **Daily**: "כל יום", "יומי"
- **Weekly**: "כל שבוע", "שבועי", "כל יום ראשון"
- **Monthly**: "כל חודש", "חודשי"

#### 5. Multi-Language Support
Support English commands alongside Hebrew:
```
"Create meeting with Danny tomorrow at 2pm"
"צור פגישה עם דני מחר ב-14:00"
```

### Implementation Approach (v2-draft)

```javascript
/**
 * Enhanced NLP v2 with tokenization
 * @param {string} text - Input text (Hebrew/English)
 * @returns {Object} Enhanced parsed structure
 */
function parseHebrewNLPv2(text) {
  // Step 1: Tokenize
  const tokens = tokenize(text);
  
  // Step 2: Identify entities
  const entities = {
    action: extractAction(tokens),
    subject: extractSubject(tokens),
    people: extractPeople(tokens),
    times: extractTimes(tokens),
    dates: extractDates(tokens),
    locations: extractLocations(tokens),
    modifiers: extractModifiers(tokens)
  };
  
  // Step 3: Build event structure
  const event = buildEventFromEntities(entities);
  
  // Step 4: Apply context from previous commands
  const contextualEvent = applyContext(event, getContext());
  
  return {
    version: 'v2',
    tokens: tokens,
    entities: entities,
    intent: entities.action,
    event: contextualEvent,
    confidence: calculateConfidence(entities)
  };
}
```

### Token Categories (v2)

#### Action Tokens (פעולות)
```javascript
const ACTIONS = {
  create: ['צור', 'יצירה', 'חדש', 'הוסף', 'תזכורת', 'create', 'add', 'new'],
  update: ['עדכן', 'שנה', 'ערוך', 'update', 'change', 'edit', 'modify'],
  delete: ['מחק', 'הסר', 'בטל', 'delete', 'remove', 'cancel'],
  find: ['מצא', 'חפש', 'הצג', 'find', 'search', 'show', 'list']
};
```

#### Time Tokens (זמנים)
```javascript
const TIMES = {
  now: ['עכשיו', 'כרגע', 'now'],
  relative_hour: /בעוד (\d+) שעה/,
  relative_day: /בעוד (\d+) (?:יום|ימים)/,
  time_24h: /(\d{1,2}):(\d{2})/,
  time_12h: /(\d{1,2})\s*(?:am|pm)/i
};
```

#### Date Tokens (תאריכים)
```javascript
const DATES = {
  today: ['היום', 'today'],
  tomorrow: ['מחר', 'tomorrow'],
  weekdays_he: ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'],
  weekdays_en: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
  next_week: ['שבוע הבא', 'next week'],
  date_format: /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/
};
```

### Confidence Scoring (v2)
Calculate confidence level for parsed commands:

```javascript
/**
 * Calculate parsing confidence (0.0 to 1.0)
 */
function calculateConfidence(entities) {
  let score = 0.0;
  
  // Action identified: +0.4
  if (entities.action) score += 0.4;
  
  // Subject identified: +0.2
  if (entities.subject) score += 0.2;
  
  // Time/Date identified: +0.2
  if (entities.times.length > 0 || entities.dates.length > 0) score += 0.2;
  
  // Additional details: +0.2
  if (entities.people.length > 0 || entities.locations.length > 0) score += 0.2;
  
  return Math.min(score, 1.0);
}
```

---

## API Integration

### parseText Action
**Endpoint**: `POST /exec`  
**Action**: `parseText`

```javascript
// NLP v1 - Execute mode
{
  action: "parseText",
  options: {
    text: "צור פגישה מחר",
    parseOnly: false  // Execute after parsing
  }
}

// Response (success)
{
  ok: true,
  event: {
    id: "event_id_123",
    title: "פגישה",
    start: "2024-12-26T09:00:00.000Z",
    end: "2024-12-26T10:00:00.000Z",
    allDay: true
  }
}
```

```javascript
// NLP v1 with v2-draft preview
{
  action: "parseText",
  options: {
    text: "צור פגישה מחר",
    parseOnly: true  // Parse only, don't execute
  }
}

// Response (parse only)
{
  ok: true,
  parseOnly: true,
  version: "v2-draft",
  tokens: ["צור", "פגישה", "מחר"],
  intent: "create",
  event: {
    title: "פגישה",
    start: "2024-12-26T09:00:00.000Z",
    end: "2024-12-26T10:00:00.000Z",
    allDay: true
  }
}
```

---

## Testing & Validation

### Test Cases (Hebrew)

#### Create Commands
```javascript
const createTests = [
  {
    input: "צור פגישה היום בשעה 14:00",
    expected: { intent: "create", hasTime: true, allDay: false }
  },
  {
    input: "הוסף תזכורת לקנות חלב מחר",
    expected: { intent: "create", hasTitle: true, allDay: true }
  },
  {
    input: "יצירה פגישת צוות ב-25/12 בשעה 10:00",
    expected: { intent: "create", hasDate: true, hasTime: true }
  }
];
```

#### Update Commands
```javascript
const updateTests = [
  {
    input: "עדכן פגישה עם דני ל 15:00",
    expected: { intent: "update", hasTitle: true }
  },
  {
    input: "שנה תזכורת למחר",
    expected: { intent: "update", hasDate: true }
  }
];
```

#### Delete Commands
```javascript
const deleteTests = [
  {
    input: "מחק פגישה עם דני",
    expected: { intent: "delete", hasSearchTitle: true }
  },
  {
    input: "בטל תזכורת חלב",
    expected: { intent: "delete", hasSearchTitle: true }
  }
];
```

### Edge Cases

#### Ambiguous Commands
- **Multiple times**: "צור פגישה מחר בשעה 10:00 או 14:00"
  - Current: Uses first time found (10:00)
  - v2: Could prompt for clarification

- **No subject**: "צור מחר בשעה 14:00"
  - Current: title = "מחר בשעה 14:00" (full text)
  - v2: Could use default "אירוע חדש"

#### Complex Patterns
- **Multiple events**: "צור 3 פגישות עם דני"
  - Current: Not supported
  - v2: Could loop and create multiple events

- **Date ranges**: "צור פגישה מ-25/12 עד 27/12"
  - Current: Not supported
  - v2: Could create multi-day event

---

## Performance Considerations

### v1 Performance
- **Regex matching**: O(n) where n = text length
- **Event creation**: O(1) - single API call
- **Typical latency**: < 500ms

### v2 Optimization Opportunities
- **Token caching**: Cache frequently used tokens
- **Pre-compiled patterns**: Compile regex once
- **Batch operations**: Support multiple events in single request
- **Async parsing**: Parse while user types (client-side preview)

---

## Future Enhancements

### Short Term (v1.x)
1. ✅ Basic Hebrew NLP
2. 🔄 Improve time parsing accuracy
3. 🔄 Add more date patterns (week days, months)
4. 🔄 Support location extraction

### Medium Term (v2.0)
1. 🚧 Full tokenization engine
2. 🚧 Multi-language support (Hebrew + English)
3. 🚧 Context-aware parsing
4. 🚧 Recurring events support

### Long Term (v3.0)
1. 📋 Machine learning integration
2. 📋 Voice input support
3. 📋 Smart suggestions based on history
4. 📋 Calendar conflict detection

---

## Contributing

### Adding New Patterns
To add new Hebrew patterns to v1:

1. **Update intent detection** in `parseHebrewNLP()`:
```javascript
if (textLower.match(/your_new_pattern/)) {
  result.intent = 'your_intent';
  // Extract details...
}
```

2. **Update time extraction** in `extractDateTime()`:
```javascript
if (textLower.match(/your_time_pattern/)) {
  // Calculate date/time...
}
```

3. **Test thoroughly** with Hebrew text
4. **Update documentation** with examples

### Code Style
- **JSDoc comments**: Required for all public functions
- **Hebrew support**: Test with actual Hebrew characters
- **Error handling**: Always return structured errors
- **Backward compatibility**: Don't break existing patterns

---

## References

- **Google Apps Script Calendar API**: https://developers.google.com/apps-script/reference/calendar
- **Hebrew Unicode Range**: U+0590 to U+05FF
- **ISO 8601 Date Format**: Used for all date/time values
- **Time Zone**: Asia/Jerusalem (UTC+2/+3)

---

**Version**: 1.0.0 (v1 production) / v2-draft (planning)  
**Last Updated**: December 2024  
**Maintainer**: Yaniv Mizrachiy
