# NLP v2 Testing Guide

This directory contains test cases for the NLP v2 implementation.

## Test Files

### nlp_v2_tests.js

Manual test cases for NLP v2 features. These tests are designed to be run in the Google Apps Script environment.

## Running Tests

Since this is a Google Apps Script project, tests need to be run in the Apps Script editor:

1. Open your Google Apps Script project
2. Copy the content of `nlp_v2_tests.js`
3. Paste it into a new file in your Apps Script project (or append to Code.gs)
4. Run individual test functions from the editor, or run `runAllNlpV2Tests()` to execute all tests

## Test Coverage

### Test 1: Hebrew Text Normalization
- Removes Hebrew diacritics (niqqud)
- Removes punctuation
- Normalizes whitespace

### Test 2: Levenshtein Distance
- Tests exact match (distance = 0)
- Tests single character difference
- Tests different strings

### Test 3: Similarity Calculation
- Tests exact match (score = 1.0)
- Tests similar strings (score > 0.55)
- Tests different strings (low score)

### Test 4: Delete Command Parsing
- Tests explicit event ID deletion
- Tests fuzzy matching for event titles
- Tests disambiguation when multiple events match
- Tests warning for recurring event deletion

### Test 5: Update Command Parsing
- Tests time rescheduling ("העבר ל")
- Tests title changes ("שנה כותרת ל")
- Tests location updates
- Tests recurrence modification rejection

### Test 6: Recurrence Validation
- Tests valid recurrence with only 'times'
- Tests valid recurrence with only 'until'
- Tests invalid recurrence with both 'times' and 'until' (should fail)

### Test 7: Title Extraction
- Tests extracting event title from delete commands
- Tests extracting event title from update commands with time modifications

## Expected Behavior

### Fuzzy Matching
- Threshold: score ≥ 0.55 AND at least one shared token ≥ 3 chars
- Time window: ±30 days from current date
- Preference: Future events over past (on score tie), nearer in time

### Disambiguation
- When multiple events match (>1), returns disambiguation object
- Contains up to 5 candidate events with id, title, start, end, score
- Error message in Hebrew requests user selection

### Update Operations
- Supported keywords: עדכן, שנה, ערוך, תקן, העבר, הזז, דחה
- Field detection: time, title, location, color, reminders
- Recurrence modification: Not supported, returns Hebrew error message

### Delete Operations
- Supported keywords: מחק, מחיקה, הסר, בטל
- Supports explicit event IDs (format: xxx@google.com)
- Fuzzy matching for event titles
- Warning for recurring events: single instance deleted by default

### Validation
- Recurrence conflict: Cannot specify both 'until' and 'times'
- Returns Hebrew error messages for all validation failures

## Note

Some tests require actual calendar events to exist in the test calendar. Create sample events before running tests 4 and beyond.
