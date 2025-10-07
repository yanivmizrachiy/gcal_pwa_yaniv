# NLP v2 Phase A - Testing Guide

This document outlines the test cases for NLP v2 Phase A implementation.

## Test Environment
These tests should be run in the Google Apps Script environment with access to CalendarApp.

## Regression Tests

### Test 1: Simple Path (Backward Compatibility)
**Input:** `היום 10:00 ישיבה`
**Expected:**
- start: today at 10:00
- end: today at 11:00
- title: 'ישיבה'
- warnings: []
**Status:** Should work unchanged from v1

### Test 2: Duration Precedence
**Input:** `היום 10:00-11:00 ישיבה שעה`
**Expected:**
- start: today at 10:00
- end: today at 11:00
- title: 'ישיבה'
- warnings: [{ code: 'IGNORED_DURATION', message: '...' }]
**Validates:** Time range takes precedence over duration phrase

## Part-of-Day Heuristics

### Test 3: Morning (בבוקר)
**Input:** `מחר בבוקר פגישת הנהלה`
**Expected:**
- start: tomorrow at 09:00
- end: tomorrow at 10:00
- title: 'פגישת הנהלה'
- warnings: [{ code: 'DEFAULT_TIME_INFERRED', context: { partOfDay: 'morning', assignedStart: '...' } }]

### Test 4: Noon (בצהריים)
**Input:** `היום בצהריים פגישה`
**Expected:**
- start: today at 12:30
- end: today at 13:30
- title: 'פגישה'
- warnings: [{ code: 'DEFAULT_TIME_INFERRED', context: { partOfDay: 'noon', ... } }]

### Test 5: Afternoon (אחר הצהריים)
**Input:** `מחר אחר הצהריים סיור`
**Expected:**
- start: tomorrow at 15:00
- end: tomorrow at 16:00
- title: 'סיור'
- warnings: [{ code: 'DEFAULT_TIME_INFERRED', context: { partOfDay: 'afternoon', ... } }]

### Test 6: Evening (בערב)
**Input:** `היום בערב ארוחה`
**Expected:**
- start: today at 19:00
- end: today at 20:00
- title: 'ארוחה'
- warnings: [{ code: 'DEFAULT_TIME_INFERRED', context: { partOfDay: 'evening', ... } }]

## Duration Phrases

### Test 7: Quarter Hour (רבע שעה)
**Input:** `היום בבוקר רבע שעה ישיבה`
**Expected:**
- start: today at 09:00
- end: today at 09:15
- duration: 15 minutes
- warnings: [{ code: 'DEFAULT_TIME_INFERRED', ... }]

### Test 8: Three Quarters Hour (שלושת רבעי שעה)
**Input:** `מחר 10:00 שלושת רבעי שעה פגישה`
**Expected:**
- start: tomorrow at 10:00
- end: tomorrow at 10:45
- duration: 45 minutes
- warnings: []

### Test 9: Two Hours (שעתיים)
**Input:** `היום 14:00 שעתיים סדנה`
**Expected:**
- start: today at 14:00
- end: today at 16:00
- duration: 120 minutes
- warnings: []

## Title Extraction

### Test 10: Quoted Title
**Input:** `היום 10:00 "פגישה חשובה מאוד" צבע אדום`
**Expected:**
- title: 'פגישה חשובה מאוד'
- Functional tokens (צבע, אדום) not in title
- warnings: []

### Test 11: Missing Title
**Input:** `היום 10:00 צבע אדום`
**Expected:**
- title: 'אירוע'
- warnings: [{ code: 'MISSING_TITLE', ... }]

### Test 12: Functional Token Stripping
**Input:** `צור היום 10:00 פגישה בבוקר תזכורת 30`
**Expected:**
- title: 'פגישה' (stripped: צור, היום, 10:00, בבוקר, תזכורת, 30)
- operation: 'create'

## Recurrence Validation

### Test 13: Recurrence Conflict
**Input:** `כל יום 10:00 פגישה עד 31.12 פעמים 10`
**Expected:**
- success: false
- error: 'חזרתיות לא תקינה: לא ניתן להגדיר גם "עד" וגם "פעמים"'

### Test 14: Recurrence Until Only
**Input:** `כל יום 10:00 פגישה עד 31.12`
**Expected:**
- Parsed successfully (no conflict)
- Note: Full recurrence implementation in future commits

### Test 15: Recurrence Times Only
**Input:** `כל יום 10:00 פגישה פעמים 5`
**Expected:**
- Parsed successfully (no conflict)
- Note: Full recurrence implementation in future commits

## Warnings Schema

### Test 16: Multiple Warnings
**Input:** `בבוקר צבע אדום שעה` (no date, no time, no title)
**Expected:**
- Multiple warnings possible
- Each warning has: { code, message, context? }

### Test 17: Empty Warnings Array
**Input:** `היום 10:00 ישיבה רגילה`
**Expected:**
- warnings: []
- Always present, even if empty

## SuggestSlots Function

### Test 18: All-Day Event Blocking
**Setup:** Create all-day event on specific date
**Action:** Call suggestSlots for that date range
**Expected:**
- Entire day blocked (00:00-23:59:59.999)
- No slots suggested overlapping that day

### Test 19: Interval Merging
**Setup:** Create events at 10:00-11:00 and 11:00-12:00
**Action:** Call suggestSlots for the day
**Expected:**
- Merged into single busy interval 10:00-12:00
- No artificial gap at 11:00

### Test 20: Adjacent Intervals
**Setup:** Create events at 09:00-10:00 and 10:00-11:00
**Action:** Call suggestSlots
**Expected:**
- Properly merged (end === next.start)
- lengthMinutes accurate

## Integration Tests

### Test 21: SelfTest Response
**Action:** Call handleSelfTest()
**Expected:**
```json
{
  "ok": true,
  "action": "selfTest",
  "nlpVersion": "v2",
  "progressPercent": 100,
  "features": ["warnings-v2", "timeofday-heuristics", "duration-phrases", "title-refinement", "recurrence-validation"]
}
```

### Test 22: ParseNlp Response Structure
**Action:** Call parseNlp with any valid command
**Expected:**
- Response includes `interpreted.warnings` array
- Warnings array present even if empty

## Notes

- All Hebrew text should be properly handled
- Warning messages should be in Hebrew
- Warning codes should be in English (uppercase)
- Backward compatibility maintained for v1 commands
- All tests should pass without breaking existing functionality
