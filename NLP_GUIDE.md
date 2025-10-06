# Hebrew NLP Guide - Smart Calendar

## Overview

The Smart Calendar includes two Hebrew Natural Language Processing (NLP) approaches for creating calendar events from natural Hebrew text.

- **v1 (text action)**: Heuristic parsing with automatic event creation
- **v2 (parseOnly action)**: Tokenization and parsing without event creation

---

## v1: Heuristic Parsing (text action)

### Purpose
Parse Hebrew text and automatically create a calendar event.

### API Endpoint
```json
{
  "action": "text",
  "text": "פגישה עם דני מחר בשעה 15:00"
}
```

### Supported Patterns

#### 1. Date Recognition

| Hebrew | English | Result |
|--------|---------|--------|
| היום | today | Current date |
| מחר | tomorrow | Current date + 1 day |
| מחרתיים | day after tomorrow | Current date + 2 days |

**Examples:**
```
"פגישה היום" → Meeting today at 09:00
"כנס מחר" → Conference tomorrow at 09:00
"ארוחה מחרתיים" → Meal day after tomorrow at 09:00
```

#### 2. Time Recognition

Supports multiple time formats:

| Format | Example | Result |
|--------|---------|--------|
| HH:MM | 15:00 | 3:00 PM |
| HH:MM | 9:30 | 9:30 AM |
| HH | 15 | 3:00 PM |
| HH | 9 | 9:00 AM |

**Examples:**
```
"פגישה בשעה 15:00" → Meeting at 15:00 (3:00 PM)
"ארוחה בשעה 13" → Meal at 13:00 (1:00 PM)
"כנס ב 09:30" → Conference at 09:30 (9:30 AM)
```

**Default:** If no time is specified, defaults to 09:00.

#### 3. Summary Extraction

The summary is extracted from the beginning of the text, before temporal markers.

**Algorithm:**
1. Extract text before temporal keywords (היום, מחר, בשעה, etc.)
2. If no clear boundary, take first 5 words

**Examples:**
```
"פגישה עם לקוח חשוב מחר" → Summary: "פגישה עם לקוח חשוב"
"ארוחת צהריים עם הצוות היום" → Summary: "ארוחת צהריים עם הצוות"
"כנס בשעה 10:00" → Summary: "כנס"
```

#### 4. Location Extraction

Locations are detected after the preposition "ב" (in/at).

**Pattern:** `ב[location text]`

**Examples:**
```
"פגישה בתל אביב" → Location: "תל אביב"
"כנס בירושלים" → Location: "ירושלים"
"מפגש במשרד" → Location: "משרד"
```

**Note:** The location extraction stops at the next space or end of text, so multi-word locations may not be fully captured in complex sentences.

#### 5. Duration

**Default:** All events are created with 1-hour duration.

The end time is automatically set to start time + 1 hour.

---

## v1 Examples

### Example 1: Simple Meeting Tomorrow
```json
{
  "action": "text",
  "text": "פגישה עם דני מחר בשעה 15:00"
}
```

**Parsed Result:**
- Summary: "פגישה עם דני"
- Date: Tomorrow
- Time: 15:00
- Duration: 1 hour (until 16:00)
- Event created: ✓

### Example 2: Lunch Today
```json
{
  "action": "text",
  "text": "ארוחת צהריים היום בשעה 13"
}
```

**Parsed Result:**
- Summary: "ארוחת צהריים"
- Date: Today
- Time: 13:00
- Duration: 1 hour (until 14:00)
- Event created: ✓

### Example 3: Conference with Location
```json
{
  "action": "text",
  "text": "כנס מחרתיים בשעה 9:00 בתל אביב"
}
```

**Parsed Result:**
- Summary: "כנס"
- Date: Day after tomorrow
- Time: 09:00
- Location: "תל אביב"
- Duration: 1 hour (until 10:00)
- Event created: ✓

### Example 4: Default Time
```json
{
  "action": "text",
  "text": "ישיבת צוות מחר"
}
```

**Parsed Result:**
- Summary: "ישיבת צוות"
- Date: Tomorrow
- Time: 09:00 (default)
- Duration: 1 hour (until 10:00)
- Event created: ✓

---

## v2: Tokenization (parseOnly action)

### Purpose
Parse and tokenize Hebrew text without creating an event. Useful for:
- Debugging NLP parsing
- Building more advanced NLP features
- Previewing what would be parsed
- Training data collection

### API Endpoint
```json
{
  "action": "parseOnly",
  "text": "פגישה עם דני מחר בשעה 15:00 בתל אביב"
}
```

### Token Types

| Type | Description | Examples |
|------|-------------|----------|
| `time` | Time in HH:MM format | 15:00, 09:30, 23:45 |
| `number` | Numeric values | 1, 23, 100 |
| `date_relative` | Relative date keywords | היום, מחר, מחרתיים |
| `hebrew_word` | Pure Hebrew words | פגישה, עם, דני |
| `preposition` | Hebrew prepositions | ב, על, עם |
| `unknown` | Unclassified tokens | Mixed characters, symbols |

### Example Response

**Input:**
```json
{
  "action": "parseOnly",
  "text": "פגישה עם דני מחר בשעה 15:00 בתל אביב"
}
```

**Output:**
```json
{
  "ok": true,
  "action": "parseOnly",
  "message": "Text parsed successfully",
  "parsed": {
    "valid": true,
    "summary": "פגישה עם דני",
    "start": "2024-01-16T15:00:00.000Z",
    "end": "2024-01-16T16:00:00.000Z",
    "location": "תל אביב",
    "description": ""
  },
  "tokens": [
    {"index": 0, "text": "פגישה", "type": "hebrew_word"},
    {"index": 1, "text": "עם", "type": "hebrew_word"},
    {"index": 2, "text": "דני", "type": "hebrew_word"},
    {"index": 3, "text": "מחר", "type": "date_relative"},
    {"index": 4, "text": "בשעה", "type": "hebrew_word"},
    {"index": 5, "text": "15:00", "type": "time"},
    {"index": 6, "text": "בתל", "type": "preposition"},
    {"index": 7, "text": "אביב", "type": "hebrew_word"}
  ]
}
```

---

## Best Practices

### Writing Parseable Hebrew Text

#### ✅ Good Examples

1. **Clear temporal markers:**
   ```
   "פגישה מחר בשעה 15:00"
   "ארוחה היום בשעה 13"
   ```

2. **Explicit time format:**
   ```
   "כנס בשעה 09:30"
   "ישיבה ב-14:00"
   ```

3. **Simple location:**
   ```
   "פגישה בתל אביב"
   "מפגש בירושלים"
   ```

#### ❌ Problematic Examples

1. **No temporal markers:**
   ```
   "פגישה עם דני"  // When? Defaults to today 09:00
   ```

2. **Ambiguous time:**
   ```
   "פגישה בבוקר"  // "morning" not recognized, defaults to 09:00
   "פגישה אחרי הצהריים"  // "afternoon" not recognized
   ```

3. **Complex locations:**
   ```
   "פגישה במשרד ברחוב הרצל 15"  // Only "משרד" captured
   ```

4. **Relative references:**
   ```
   "פגישה בשבוע הבא"  // "next week" not supported
   "ארוחה בשישי"  // Day names not yet supported
   ```

### Tips for Best Results

1. **Always include temporal marker:**
   - Use היום, מחר, or מחרתיים

2. **Always include time:**
   - Use HH:MM format (e.g., 15:00)
   - Or HH format (e.g., 15)

3. **Keep summary first:**
   - Put the event name before time/date
   - Example: "פגישה מחר" not "מחר פגישה"

4. **Use simple locations:**
   - Single-word or two-word locations work best
   - Place after time: "פגישה מחר בשעה 15:00 בתל אביב"

5. **Test with parseOnly first:**
   - Verify parsing before creating events
   - Adjust text based on token output

---

## Limitations & Known Issues

### Current Limitations

1. **Date Support:**
   - Only supports: today, tomorrow, day after tomorrow
   - No support for: specific dates, day names, weeks, months
   - No support for: "next week", "next month", etc.

2. **Time Support:**
   - Only supports: HH:MM and HH formats
   - No support for: relative times ("in 2 hours")
   - No support for: am/pm text (uses 24-hour format)

3. **Location Support:**
   - Basic pattern matching only
   - May not capture multi-word locations correctly
   - No address validation

4. **Duration:**
   - Fixed 1-hour duration
   - No support for custom durations in text
   - No support for: "2 hour meeting", "30 minute call"

5. **Language:**
   - Hebrew only
   - No support for mixed Hebrew/English
   - No support for Arabic numerals with Hebrew text mixing

### Workarounds

**For specific dates:**
```javascript
// Use createEvent action instead
{
  "action": "createEvent",
  "summary": "פגישה עם דני",
  "start": "2024-01-20T15:00:00Z",
  "end": "2024-01-20T16:00:00Z"
}
```

**For custom durations:**
```javascript
// Use createEvent with specific end time
{
  "action": "createEvent",
  "summary": "כנס ארוך",
  "start": "2024-01-15T09:00:00Z",
  "end": "2024-01-15T17:00:00Z"  // 8 hours
}
```

**For complex locations:**
```javascript
// Use createEvent with full location
{
  "action": "createEvent",
  "summary": "פגישה",
  "start": "2024-01-15T15:00:00Z",
  "end": "2024-01-15T16:00:00Z",
  "location": "משרד, רחוב הרצל 15, תל אביב"
}
```

---

## Future Enhancements

### Planned Features

1. **Extended Date Support:**
   - Day names (ראשון, שני, etc.)
   - Specific dates (15 בינואר, 15/1/2024)
   - Relative weeks (שבוע הבא)
   - Month names

2. **Enhanced Time Parsing:**
   - Relative times (בעוד שעתיים)
   - Time ranges (בין 14:00 ל-16:00)
   - Duration in text (פגישה של שעתיים)

3. **Improved Location:**
   - Multi-word location support
   - Address validation
   - Location suggestions

4. **Context Awareness:**
   - Learn from user patterns
   - Suggest common meeting types
   - Auto-complete based on history

5. **Machine Learning:**
   - Train on user's calendar history
   - Improve accuracy over time
   - Support more natural language

### Contributing

To improve NLP parsing:

1. **Collect examples:**
   - Use `parseOnly` to test various inputs
   - Document what works and what doesn't

2. **Extend patterns:**
   - Edit `parseHebrewText()` function in Code.gs
   - Add new regex patterns
   - Test thoroughly

3. **Add token types:**
   - Extend `tokenizeHebrewText()` function
   - Add new classification rules
   - Update documentation

---

## Testing & Debugging

### Debug Flow

1. **Start with parseOnly:**
   ```bash
   curl -X POST URL -H "Content-Type: application/json" \
     -d '{"action":"parseOnly","text":"YOUR_HEBREW_TEXT"}'
   ```

2. **Check tokens:**
   - Verify each word is classified correctly
   - Check if time/date tokens are recognized

3. **Check parsed object:**
   - Verify summary extraction
   - Verify date/time calculation
   - Verify location extraction

4. **If satisfied, use text action:**
   ```bash
   curl -X POST URL -H "Content-Type: application/json" \
     -d '{"action":"text","text":"YOUR_HEBREW_TEXT"}'
   ```

### Test Cases

Create a test suite with these examples:

```json
// Test 1: Basic meeting tomorrow
{"text": "פגישה מחר בשעה 15:00"}

// Test 2: Meeting today
{"text": "פגישה היום בשעה 10:00"}

// Test 3: Day after tomorrow
{"text": "כנס מחרתיים בשעה 9:00"}

// Test 4: With location
{"text": "פגישה מחר בשעה 14:00 בתל אביב"}

// Test 5: Default time
{"text": "ישיבה מחר"}

// Test 6: Hour only
{"text": "פגישה היום בשעה 15"}

// Test 7: Complex summary
{"text": "פגישה עם לקוח חשוב מחר בשעה 13:30"}
```

Expected results for each test should be documented and verified.

---

## API Integration Examples

### JavaScript/Node.js

```javascript
async function createEventFromHebrewText(text) {
  const response = await fetch(DEPLOYMENT_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({
      action: 'text',
      text: text
    })
  });
  
  const result = await response.json();
  
  if (result.ok) {
    console.log('Event created:', result.event.title);
    console.log('Parsed summary:', result.parsed.summary);
  } else {
    console.error('Error:', result.error);
  }
  
  return result;
}

// Usage
createEventFromHebrewText('פגישה מחר בשעה 15:00');
```

### Python

```python
import requests
import json

def create_event_from_hebrew(text):
    url = DEPLOYMENT_URL
    payload = {
        'action': 'text',
        'text': text
    }
    
    response = requests.post(url, json=payload)
    result = response.json()
    
    if result['ok']:
        print(f"Event created: {result['event']['title']}")
        print(f"Parsed: {result['parsed']}")
    else:
        print(f"Error: {result['error']}")
    
    return result

# Usage
create_event_from_hebrew('פגישה מחר בשעה 15:00')
```

### cURL

```bash
# Create event from Hebrew text
curl -X POST YOUR_DEPLOYMENT_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "text",
    "text": "פגישה מחר בשעה 15:00"
  }'

# Parse only (no event creation)
curl -X POST YOUR_DEPLOYMENT_URL \
  -H "Content-Type: application/json" \
  -d '{
    "action": "parseOnly",
    "text": "פגישה מחר בשעה 15:00"
  }'
```

---

## Performance Considerations

### Parsing Speed

- Hebrew text parsing is fast (< 100ms typically)
- Event creation adds Calendar API latency (~200-500ms)
- Total response time: usually < 1 second

### Optimization Tips

1. **Use parseOnly for validation:**
   - Check parsing before event creation
   - Avoid creating incorrect events

2. **Batch operations:**
   - Parse multiple texts
   - Create events in batch if needed

3. **Cache common patterns:**
   - Store frequently used phrases
   - Quick lookup for common meetings

---

## Glossary

| Hebrew | Transliteration | English | Usage |
|--------|----------------|---------|-------|
| היום | ha-yom | today | Date marker |
| מחר | machar | tomorrow | Date marker |
| מחרתיים | machratayim | day after tomorrow | Date marker |
| בשעה | be-sha'ah | at (time) | Time marker |
| פגישה | pgisha | meeting | Event type |
| כנס | kenes | conference | Event type |
| ארוחה | arucha | meal | Event type |
| ישיבה | yeshiva | session/meeting | Event type |

---

Last Updated: 2024-01-15
Version: 1.0
