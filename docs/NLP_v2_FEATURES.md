# NLP v2 - Phase A Features Documentation

## Overview
NLP v2 enhances the Hebrew natural language processing capabilities with fuzzy disambiguation, guest management, and protective handling of recurring events.

## Features Implemented

### 1. Fuzzy Disambiguation Engine

The fuzzy matching system allows users to update or delete events without requiring exact titles.

#### Core Functions

- **normalizeHebrew(str)**: Removes Hebrew niqqud (vowel marks), converts to lowercase, and trims whitespace
- **tokenizeForFuzzy(str)**: Splits text into normalized tokens ≥2 chars, removing common stop words
- **levenshteinDistance(a, b, maxThreshold)**: Calculates edit distance with early exit optimization
- **scoreTitleSimilarity(inputTokens, candidateTitle)**: Returns similarity score (0..1) using:
  - 60% token overlap score
  - 40% Levenshtein ratio
- **findCandidateEvents(queryTokens, windowStart, windowEnd, prefilterMax)**: Searches calendar within time window
- **selectBestCandidates(candidates, limit)**: Returns top candidates sorted by score and time proximity

#### Search Parameters

- **Time Window**: 30 days in the past to 60 days in the future
- **Prefilter**: Events with ≥1 token substring match (≥3 chars) OR Levenshtein distance ≤12
- **Acceptance Threshold**: Score ≥0.55 AND longest shared token ≥3 chars
- **Disambiguation**: Returns multiple candidates if >1 event exceeds threshold

#### Example Behavior

```
Command: "מחק פגישה"
- Searches for events with similar titles in the time window
- If one clear match: deletes it
- If multiple matches: returns list for user to choose
- If no match: returns error "לא מצאתי אירוע תואם למחיקה"
```

### 2. Guest Management in Updates

Update commands now support adding and removing guests via NLP.

#### Add Verbs
- הוסף (add)
- הוספת (added)
- לצרף (to join)

#### Remove Verbs
- הסר (remove)
- הורד (take down)
- מחק (delete, in guest context)

#### Features
- Email validation with regex
- Invalid emails generate `GUEST_EMAIL_INVALID` warnings
- Duplicates in both add/remove lists are neutralized with warning
- Multiple guests can be added/removed in one command

#### Example

```
Command: "עדכן פגישה הוסף user1@test.com הסר user2@test.com"
Result:
- Finds matching event via fuzzy search
- Adds user1@test.com to guests
- Removes user2@test.com from guests
```

### 3. Recurrence Modification Blocking

Update operations now detect and block attempts to modify recurrence patterns.

#### Detection Patterns
- Recurrence keywords: חזר, חוזר, חזרת, חוזרת
- "כל" + weekday combinations (e.g., "כל שני")

#### Error Message
```
"שינוי חזרתיות אינו נתמך בעדכון בשלב זה"
```

### 4. Recurring Event Deletion Protection

When deleting a recurring event instance, the system now provides guidance.

#### Behavior
- Detects if event is part of a series using `event.getEventSeries()`
- Deletes only the single instance (default behavior)
- Returns warning of type `SERIES_INSTANCE_DELETE`

#### Warning Message
```
"נמחק רק מופע יחיד. למחיקת כל הסדרה כתוב: מחק את כל הסדרה של [title]"
```

## API Response Structure

### Disambiguation Response
```json
{
  "ok": false,
  "needDisambiguation": true,
  "candidates": [
    {
      "id": "event-id-1",
      "title": "פגישה עם לקוח",
      "start": "2024-01-15T10:00:00.000Z",
      "end": "2024-01-15T11:00:00.000Z",
      "score": 0.85
    },
    ...
  ],
  "error": "מצאתי מספר אירועים תואמים. אנא בחר אירוע ספציפי.",
  "message": "נדרשת בחירה מבין מספר אירועים"
}
```

### Success with Warnings
```json
{
  "ok": true,
  "action": "deleteEvent",
  "message": "האירוע נמחק בהצלחה: Weekly Team Meeting",
  "warnings": [
    {
      "type": "SERIES_INSTANCE_DELETE",
      "message": "נמחק רק מופע יחיד. למחיקת כל הסדרה כתוב: מחק את כל הסדרה של Weekly Team Meeting"
    }
  ]
}
```

### Update with Guest Changes
```json
{
  "ok": true,
  "action": "updateEvent",
  "interpreted": {
    "eventId": "abc123",
    "changes": {
      "guestsAdd": ["user1@example.com"],
      "guestsRemove": ["user2@example.com"]
    }
  },
  "warnings": [
    {
      "type": "GUEST_EMAIL_INVALID",
      "message": "כתובת דוא\"ל לא תקינה: invalid-email"
    }
  ]
}
```

## Warning Types

- **GUEST_EMAIL_INVALID**: Invalid email address format
- **GUEST_DUPLICATE_NEUTRALIZED**: Email appears in both add and remove lists
- **SERIES_INSTANCE_DELETE**: Single instance deleted from recurring series

## Version Information

- **NLP Version**: v2
- **Fuzzy Matching**: Enabled
- **Guest Management**: Enabled
- **Recurrence Protection**: Enabled

## Hebrew Stop Words

The following common Hebrew words are filtered out during fuzzy matching:
את, של, על, אל, עם, לא, כל, או, גם, זה, זו, היא, הוא, יש, לי, מה, מי, כי

## Future Enhancements

- Full series deletion support ("מחק את כל הסדרה")
- Time/date changes in update commands
- Title changes in update commands
- Location and description changes in update commands
