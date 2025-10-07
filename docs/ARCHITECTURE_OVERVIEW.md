# NLP v2 Architecture Overview

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                         User Input                           │
│                  (Hebrew NLP Command)                        │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    handleParseNlp()                          │
│  - Receives text and parseOnly flag                          │
│  - Calls parseHebrewCommand()                                │
│  - Handles disambiguation responses                          │
│  - Merges warnings from interpretation + execution           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  parseHebrewCommand()                        │
│  - Tokenizes input                                           │
│  - Detects operation: create/update/delete                   │
│  - Routes to appropriate handler                             │
└─────┬───────────────────────┬────────────────────┬──────────┘
      │                       │                    │
      ▼                       ▼                    ▼
┌──────────┐          ┌──────────────┐     ┌──────────────┐
│  CREATE  │          │    UPDATE    │     │    DELETE    │
│ (v1 Flow)│          │  (v2 Flow)   │     │  (v2 Flow)   │
└──────────┘          └──────┬───────┘     └──────┬───────┘
                             │                    │
                             │                    │
              ┌──────────────┴────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────┐
│              Fuzzy Disambiguation Engine                     │
├─────────────────────────────────────────────────────────────┤
│  1. normalizeHebrew()                                        │
│     - Remove niqqud marks                                    │
│     - Lowercase + trim                                       │
│                                                              │
│  2. tokenizeForFuzzy()                                       │
│     - Split into words                                       │
│     - Filter tokens < 2 chars                                │
│     - Remove stop words                                      │
│                                                              │
│  3. findCandidateEvents()                                    │
│     - Search calendar (-30 to +60 days)                      │
│     - Prefilter: token match OR Levenshtein ≤ 12            │
│     - Score each candidate                                   │
│                                                              │
│  4. scoreTitleSimilarity()                                   │
│     - Token overlap (60%)                                    │
│     - Levenshtein ratio (40%)                                │
│     - Track longest shared token                             │
│                                                              │
│  5. selectBestCandidates()                                   │
│     - Sort by score (desc)                                   │
│     - Then by time proximity                                 │
│     - Return top 6                                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   Threshold Check      │
            │   score ≥ 0.55 AND     │
            │   longest token ≥ 3    │
            └────────┬───────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌───────────────┐         ┌──────────────┐
│  Single Match │         │   Multiple   │
│               │         │   Matches    │
└───────┬───────┘         └──────┬───────┘
        │                        │
        ▼                        ▼
┌───────────────┐         ┌──────────────┐
│   Execute     │         │ Disambiguation│
│   Operation   │         │   Response    │
└───────┬───────┘         └──────────────┘
        │
        ▼
```

## Update Operation Flow (Guest Management)

```
┌─────────────────────────────────────────────────────────────┐
│           Update Command with Guests                         │
│   "עדכן פגישה הוסף user@test.com הסר old@test.com"          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Recurrence Check                                │
│  - Detect: חזר, חוזר, "כל" + weekday                       │
│  - If found: BLOCK with error                                │
└────────────────────────┬────────────────────────────────────┘
                         │ (No recurrence)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            Fuzzy Match Target Event                          │
│  - Extract query words                                       │
│  - Run fuzzy search                                          │
│  - Select best match                                         │
└────────────────────────┬────────────────────────────────────┘
                         │ (Match found)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            Parse Guest Changes                               │
├─────────────────────────────────────────────────────────────┤
│  Add Context: הוסף, הוספת, לצרף                           │
│  Remove Context: הסר, הורד, מחק                            │
│                                                              │
│  For each email:                                             │
│  1. Validate format (regex)                                  │
│  2. Add to guestsAdd[] or guestsRemove[]                     │
│  3. Generate warnings for invalid emails                     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│          Neutralize Duplicates                               │
│  - Find emails in both add and remove                        │
│  - Remove from both lists                                    │
│  - Generate GUEST_DUPLICATE_NEUTRALIZED warning              │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              Return Success                                  │
│  - eventId                                                   │
│  - changes: { guestsAdd[], guestsRemove[] }                  │
│  - warnings[]                                                │
└─────────────────────────────────────────────────────────────┘
```

## Delete Operation Flow (Recurring Protection)

```
┌─────────────────────────────────────────────────────────────┐
│              Delete Command                                  │
│           "מחק פגישה שבועית"                                │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│            Fuzzy Match Target Event                          │
│  - Run fuzzy disambiguation                                  │
│  - Get eventId                                               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│         handleDeleteEvent(eventId)                           │
│  1. Load event from calendar                                 │
│  2. Check if recurring: event.getEventSeries()               │
│  3. Delete event (instance only if recurring)                │
└────────────────────────┬────────────────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
        ┌──────────────┐  ┌──────────────┐
        │   Regular    │  │  Recurring   │
        │    Event     │  │   Instance   │
        └──────┬───────┘  └──────┬───────┘
               │                 │
               ▼                 ▼
        ┌──────────────┐  ┌──────────────────────────┐
        │   Success    │  │  Success + Warning       │
        │   (no warn)  │  │  SERIES_INSTANCE_DELETE  │
        └──────────────┘  └──────────────────────────┘
```

## Component Responsibilities

### parseHebrewCommand()
- **Input**: Raw Hebrew text
- **Output**: Interpretation object with operation, eventId, changes, warnings
- **Responsibilities**:
  - Operation detection (create/update/delete)
  - Fuzzy matching for update/delete
  - Guest parsing for update
  - Recurrence blocking for update
  - Disambiguation handling

### Fuzzy Engine Functions
- **normalizeHebrew()**: Text normalization
- **tokenizeForFuzzy()**: Token extraction
- **levenshteinDistance()**: Edit distance calculation
- **scoreTitleSimilarity()**: Similarity scoring
- **findCandidateEvents()**: Calendar search
- **selectBestCandidates()**: Result filtering

### Operation Handlers
- **handleCreateEvent()**: Create new calendar event
- **handleUpdateEvent()**: Modify existing event
- **handleDeleteEvent()**: Delete event + recurring detection
- **handleParseNlp()**: NLP orchestration + warning merging

## Data Structures

### Interpretation Result
```javascript
{
  success: boolean,
  operation: 'create' | 'update' | 'delete',
  eventId: string | null,
  event: {...} | null,           // for create
  changes: {...} | null,         // for update
  warnings: [                    // v2 new
    {type: string, message: string}
  ],
  needDisambiguation: boolean,   // v2 new
  candidates: [                  // v2 new
    {id, title, start, end, score}
  ],
  error: string | null
}
```

### Changes Object (Update)
```javascript
{
  guestsAdd: string[],           // v2 new
  guestsRemove: string[],        // v2 new
  title: string,                 // future
  start: string,                 // future
  end: string,                   // future
  location: string,              // future
  description: string            // future
}
```

### Warning Object
```javascript
{
  type: 'GUEST_EMAIL_INVALID' | 
        'GUEST_DUPLICATE_NEUTRALIZED' | 
        'SERIES_INSTANCE_DELETE',
  message: string                // Hebrew text
}
```

## Key Design Decisions

1. **Two-Phase Matching**: Prefilter → Score → Select
   - Reduces computation on large calendars
   - Early exit optimizations in Levenshtein

2. **Threshold-Based Disambiguation**
   - Single threshold (0.55) prevents false matches
   - Minimum token length (3) ensures meaningful overlap
   - Multiple candidates trigger user selection

3. **Warning System**
   - Non-blocking notifications
   - Structured with type + message
   - Merged from interpretation + execution phases

4. **Recurrence Protection**
   - Block modification (error)
   - Allow deletion with warning
   - Preserve user intent while preventing mistakes

5. **Guest Management**
   - Context-based verb detection
   - Email validation with warnings
   - Duplicate neutralization

## Performance Considerations

- **Event Search Limit**: 500 events prefiltered
- **Time Window**: 90-day window balances recall vs. performance
- **Early Exit**: Levenshtein distance stops if threshold exceeded
- **Token Filtering**: Stop words and short tokens reduce comparisons
- **Candidate Limit**: Top 6 candidates prevent overwhelming user

## Hebrew Language Support

- **Niqqud Removal**: Handles vowel marks in Hebrew text
- **Stop Words**: 18 common words filtered
- **Message Localization**: All errors/warnings in Hebrew
- **RTL Text**: Proper right-to-left text handling
