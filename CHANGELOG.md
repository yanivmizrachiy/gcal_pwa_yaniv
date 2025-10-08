# Changelog

All notable changes to this project will be documented in this file.

## [2025-10-08] NLP v2 Activation

### Added
- NLP v2 parsing engine (Hebrew) with warnings system & guests handling
- SelfTest contract upgraded (progressPercent=100, features[], warningsSample)
- Enhanced tokenization supporting:
  - Extended date keywords: היום, מחר, מחרתיים, אתמול, weekdays (ראשון, שני, etc.)
  - Time ranges with multiple formats: HH:MM, HH:MM-HH:MM, HH-HH
  - Duration parsing: חצי שעה, שעה, N דקות
  - Email/guest detection with validation
  - Recurrence keyword detection (כל יום, כל שבוע, כל חודש)
  - Enhanced color mapping with Hebrew synonyms
- Warning system with canonical codes:
  - MISSING_TITLE
  - IGNORED_DURATION
  - DEFAULT_TIME_INFERRED
  - GUEST_EMAIL_INVALID
  - GUEST_LIST_TRUNCATED
  - GUEST_DUP_CONFLICT
  - RECURRENCE_UNSUPPORTED
  - RECURRENCE_CONFLICT
  - AMBIGUOUS_MATCH
  - NO_MATCH
  - SERIES_INSTANCE_DELETE
  - FUZZY_TRUNCATED
- Fuzzy disambiguation for update/delete operations
- Guest management in create operations (addGuest)

### Changed
- parseNlp now supports create/update/delete/disambiguation/parseOnly operations
- SelfTest (GET & POST) returns unified v2 contract
- parseOnly flag enforced as early guard (no calendar mutations)

### Notes
- Recurrence detection present (non-mutating) – emits RECURRENCE_UNSUPPORTED warning
- Update/delete operations use fuzzy matching with disambiguation when ambiguous
- All responses include warnings array for consistency
