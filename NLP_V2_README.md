# NLP v2 Phase A - Hebrew Natural Language Processing

## 🎯 Overview

This implementation adds intelligent update and delete operations to the Google Calendar PWA via Hebrew natural language processing. It includes fuzzy event matching, disambiguation, comprehensive validation, and rich field detection.

**Version:** v2  
**Status:** ✅ Complete  
**Language:** Hebrew (עברית)

## 🚀 Key Features

### 1. Fuzzy Event Matching
Match events by approximate title instead of exact IDs:
```
מחק פגישה עם דוקטור  
→ Automatically finds "פגישה עם הרופא"
```

**Algorithm:**
- Levenshtein distance with early termination
- Token overlap scoring (weighted 60%)
- Combined similarity threshold: ≥0.55
- Minimum shared token length: ≥3 characters
- Search window: ±30 days from current date

### 2. Update Operations
Modify events using natural Hebrew commands:
```
העבר פגישת צוות ל-15:00-16:00     // Reschedule
שנה כותרת של פגישה ל ישיבה חדשה   // Rename
עדכן פגישה מיקום זום              // Change location
```

**Supported Update Keywords:**
- עדכן, שנה, ערוך, תקן (general update)
- העבר, הזז, דחה (reschedule/postpone)

**Detectable Fields:**
- ⏰ Time/Schedule
- 📝 Title
- 📍 Location
- 🎨 Color
- 🔔 Reminders

### 3. Delete Operations
Remove events with smart matching:
```
מחק פגישת צוות        // Single match → deletes immediately
מחק פגישה            // Multiple matches → shows disambiguation
```

**Supported Delete Keywords:**
- מחק, מחיקה, הסר, בטל

### 4. Disambiguation
When multiple events match, get a choice:
```json
{
  "error": "נמצאו מספר אירועים תואמים...",
  "disambiguate": {
    "candidates": [
      {
        "id": "abc@google.com",
        "title": "פגישה עם רופא",
        "start": "2024-01-15T10:00:00Z",
        "score": 0.85
      },
      ...
    ]
  }
}
```

### 5. Smart Validation
- ❌ Recurrence conflict: Can't specify both `until` and `times`
- ❌ Recurrence update: Not supported in Phase A
- ⚠️ Recurring events: Warns about single-instance deletion

## 📁 Project Structure

```
.
├── src/
│   └── Code.gs                    # Main implementation (1000+ lines)
├── frontend/
│   └── types/calendar.ts          # TypeScript interfaces
├── test/
│   ├── nlp_v2_tests.js           # Test suite (190 lines)
│   └── README.md                  # Test documentation
├── docs/
│   └── NLP_V2_USAGE_EXAMPLES.md  # Usage examples
├── IMPLEMENTATION_SUMMARY.md      # Technical details
└── NLP_V2_README.md              # This file
```

## 🔧 Implementation Details

### New Functions (11 total)

**Fuzzy Matching:**
- `normalizeHebrew(text)` - Remove diacritics, normalize text
- `levenshteinDistance(str1, str2, max)` - Edit distance with early exit
- `calculateSimilarity(query, target)` - 0-1 similarity score
- `findEventsByFuzzyTitle(query, days)` - Search events with fuzzy matching

**NLP Parsing:**
- `parseHebrewCommand(text)` - Main parser (refactored)
- `parseCreateCommand(text, tokens, result)` - Handle creation
- `parseDeleteCommand(text, tokens, result)` - Handle deletion with fuzzy match
- `parseUpdateCommand(text, tokens, result)` - Handle updates with fuzzy match
- `extractTitleForModification(text, tokens)` - Extract clean title for search
- `detectUpdateFields(text, tokens)` - Identify fields to update

**Validation:**
- Enhanced `handleCreateEvent()` with recurrence validation

### Modified Components
- ✏️ `handleSelfTest()` - Updated version to 'v2'
- ✏️ TypeScript types - Added disambiguation and recurrence interfaces

## 📊 Statistics

- **Total Changes:** 1,350+ lines across 7 files
- **New Functions:** 11
- **Test Cases:** 7 comprehensive scenarios
- **Documentation:** 3 files (implementation, tests, usage)
- **Supported Operations:** Create, Update, Delete
- **Supported Languages:** Hebrew (עברית)

## 🧪 Testing

Run tests in Google Apps Script:
```javascript
runAllNlpV2Tests()
```

Test categories:
1. Hebrew normalization
2. Levenshtein distance
3. Similarity calculation
4. Delete command parsing
5. Update command parsing
6. Recurrence validation
7. Title extraction

See `test/README.md` for details.

## 📖 Usage Examples

### Basic Delete
```javascript
POST /exec
{
  "action": "parseNlp",
  "text": "מחק פגישת צוות"
}
```

### Basic Update
```javascript
POST /exec
{
  "action": "parseNlp",
  "text": "העבר ישיבה ל-16:00-17:00"
}
```

### With Explicit ID
```javascript
POST /exec
{
  "action": "parseNlp",
  "text": "מחק abc123@google.com"
}
```

For comprehensive examples, see `docs/NLP_V2_USAGE_EXAMPLES.md`.

## 🎯 Matching Algorithm

### Scoring Components

**Token Overlap (60% weight):**
```
shared_tokens / max(query_tokens, target_tokens)
```

**Levenshtein Ratio (40% weight):**
```
1 - (edit_distance / max_length)
```

### Acceptance Criteria
1. Combined score ≥ 0.55
2. At least one shared token ≥ 3 characters
3. Within ±30 days time window

### Sorting Priority
1. Higher similarity score
2. Future events over past (on tie)
3. Closer in absolute time

## ⚙️ Configuration

Key thresholds (configurable in code):

```javascript
SIMILARITY_THRESHOLD = 0.55      // Minimum match score
MIN_TOKEN_LENGTH = 3             // Minimum shared token size
SEARCH_WINDOW_DAYS = 30          // Time window for search
MAX_CANDIDATES = 5               // Max disambiguation results
```

## 🔄 Backward Compatibility

✅ All existing v1 features continue to work  
✅ No breaking changes to API  
✅ TypeScript types are additive only  
✅ Previous NLP commands remain functional

## 🚧 Phase A Limitations

**Not Implemented:**
- Guest management (add/remove)
- Recurrence rule creation/modification
- Series-wide operations
- Advanced time parsing ("next Tuesday", "in 3 hours")
- Multi-language support

These features are planned for future phases.

## 📝 Hebrew Keyword Reference

### Operations
| Hebrew | English | Usage |
|--------|---------|-------|
| מחק, הסר, בטל | Delete | מחק פגישה |
| עדכן, שנה | Update | עדכן פגישה |
| העבר, דחה, הזז | Reschedule | העבר ל-15:00 |

### Fields
| Hebrew | English | Usage |
|--------|---------|-------|
| כותרת, שם | Title | שנה כותרת ל... |
| מיקום | Location | מיקום משרד 3 |
| צבע | Color | צבע אדום |
| תזכורת | Reminder | תזכורת 10 30 |
| זמן, שעה | Time | זמן 14:00 |

### Colors
אדום, כחול, ירוק, צהוב, כתום, סגול, ורוד, חום

## 🔗 Related Files

- **Implementation:** [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **Usage Examples:** [docs/NLP_V2_USAGE_EXAMPLES.md](./docs/NLP_V2_USAGE_EXAMPLES.md)
- **Tests:** [test/README.md](./test/README.md)
- **Main Code:** [src/Code.gs](./src/Code.gs)
- **Types:** [frontend/types/calendar.ts](./frontend/types/calendar.ts)

## 🤝 Contributing

When extending NLP v2:

1. Maintain Hebrew-first design
2. Add test cases for new features
3. Update documentation
4. Follow existing code style
5. Preserve backward compatibility

## 📄 License

Part of the gcal_pwa_yaniv project.

---

**NLP Version:** v2  
**Implementation Date:** January 2025  
**Status:** ✅ Production Ready
