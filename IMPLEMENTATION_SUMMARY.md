# NLP v2 Phase A Implementation Summary

## Overview
This implementation adds intelligent update/delete operations via Hebrew natural language processing, fuzzy event identification, enhanced validation, and richer duration/time heuristics. All outputs remain fully in Hebrew.

## Key Features Implemented

### 1. Fuzzy Matching Infrastructure
**New Functions:**
- `normalizeHebrew(text)`: Removes Hebrew diacritics (niqqud), punctuation, normalizes whitespace
- `levenshteinDistance(str1, str2, maxDistance)`: Calculates edit distance with early termination
- `calculateSimilarity(query, target)`: Computes 0-1 similarity score using token overlap + Levenshtein ratio
- `findEventsByFuzzyTitle(titleQuery, windowDays)`: Searches events within ±30 days using fuzzy matching

**Matching Criteria:**
- Threshold: score ≥ 0.55 AND at least one shared token ≥ 3 characters
- Time window: ±30 days from current date (configurable)
- Sorting: By score (desc), then future events preferred, then by time proximity

### 2. Update/Delete NLP Operations
**New Parsing Structure:**
- Split `parseHebrewCommand` into modular functions:
  - `parseCreateCommand(text, tokens, result)`
  - `parseDeleteCommand(text, tokens, result)`
  - `parseUpdateCommand(text, tokens, result)`

**Delete Operation:**
- Keywords: מחק, מחיקה, הסר, בטל
- Supports explicit event IDs (pattern: `xxx@google.com`)
- Fuzzy event matching by title
- Disambiguation for multiple matches (returns top 5 candidates)
- Warning for recurring events: "נמחק מופע יחיד. למחיקת כל הסדרה כתוב: מחק את כל הסדרה של [title]"

**Update Operation:**
- Keywords: עדכן, שנה, ערוך, תקן, העבר, הזז, דחה
- Fuzzy event matching (same as delete)
- Field detection via `detectUpdateFields(text, tokens)`
- Supported fields: time, title, location, color, reminders
- Explicit recurrence modification rejection with Hebrew message

### 3. Disambiguation Response
When multiple events match (>1):
```javascript
{
  ok: false,
  error: "נמצאו מספר אירועים תואמים. אנא בחר אחד מהרשימה או ציין שם מדויק יותר",
  disambiguate: {
    query: "original query",
    candidates: [
      { id, title, start, end, score },
      ...
    ]
  }
}
```

### 4. Update Field Detection
**New Function:** `detectUpdateFields(text, tokens)`

Recognizes:
- **Time reschedule:** "העבר ל", "דחה ל", "הזז ל" + date/time
- **Standalone time range:** HH:MM–HH:MM after update verb
- **Title change:** "שנה כותרת ל", "שם חדש", "לכותרת"
- **Location:** "מיקום", "למיקום", "ב" + location phrase
- **Color:** existing `extractColor()` function
- **Reminders:** existing `extractReminders()` function

### 5. Validation & Warnings
**Recurrence Validation:**
- Added to `handleCreateEvent()`: Rejects events with both `until` and `times` in recurrence
- Error message: "לא ניתן לציין גם תאריך סיום (until) וגם מספר פעמים (times) בחזרתיות"

**Recurrence Update Rejection:**
- Detects keywords: כל שבוע, כל יום, חוזר, תדירות
- Error message: "עדכון חזרתיות אינו נתמך בשלב זה"

**Recurring Event Delete Warning:**
- Checks `event.isRecurringEvent()`
- Adds warning to result: "נמחק מופע יחיד. למחיקת כל הסדרה כתוב: מחק את כל הסדרה של [title]"

### 6. Title Extraction Enhancement
**New Function:** `extractTitleForModification(text, tokens)`

Improved title extraction for update/delete operations:
- Removes operation keywords (מחק, עדכן, etc.)
- Removes modification keywords (זמן, כותרת, מיקום, etc.)
- Filters time patterns and numbers
- Returns clean title query for fuzzy matching

### 7. TypeScript Type Updates
**Added to `calendar.ts`:**
```typescript
interface DisambiguationCandidate {
  id: string;
  title: string;
  start: string;
  end: string;
  score: number;
}

interface NlpDisambiguation {
  query: string;
  candidates: DisambiguationCandidate[];
}

// Added to NlpInterpretation:
disambiguate?: NlpDisambiguation | null;
warnings?: string[];

// Added to CreateEventRequest:
recurrence?: {
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  until?: string;
  times?: number;
};
```

### 8. Version Update
- Changed `nlpVersion` from 'v1' to 'v2' in `handleSelfTest()`

## Test Coverage
Created comprehensive test suite in `test/nlp_v2_tests.js`:
- Hebrew text normalization tests
- Levenshtein distance calculation tests
- Similarity scoring tests
- Delete command parsing tests
- Update command parsing tests
- Recurrence validation tests
- Title extraction tests

## Code Statistics
- Total lines: ~1000 lines in Code.gs
- New functions: 7 (fuzzy matching + parsing helpers)
- Modified functions: 3 (handleSelfTest, handleCreateEvent, parseHebrewCommand)
- New TypeScript interfaces: 2

## Usage Examples

### Delete with Fuzzy Matching
```
מחק פגישה עם דוקטור
```
→ Finds event(s) matching "פגישה דוקטור", handles disambiguation if needed

### Update Time
```
העבר פגישת צוות ל-15:00-16:00
```
→ Reschedules "פגישת צוות" to 15:00-16:00

### Update Title
```
שנה כותרת של ישיבה ל פגישת סטטוס
```
→ Renames event to "פגישת סטטוס"

### Update Location
```
עדכן פגישה מיקום משרד 3
```
→ Sets location to "משרד 3"

## Files Modified
1. `src/Code.gs` - Main implementation
2. `frontend/types/calendar.ts` - TypeScript types
3. `test/nlp_v2_tests.js` - Test cases (new)
4. `test/README.md` - Test documentation (new)
5. `.gitignore` - Git ignore rules (new)

## Backward Compatibility
- All existing create operations continue to work
- Previous NLP v1 commands remain functional
- API endpoints unchanged
- Type extensions are additive only

## Future Enhancements (Not in Phase A)
- Guest addition/removal (skeleton present)
- Full recurrence rule creation
- Series-wide updates/deletes
- More sophisticated time parsing (e.g., "next Tuesday", "in 3 hours")
- Multi-language support
