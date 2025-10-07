# Google Calendar PWA - NLP v2 Features

## Overview
Phase A implementation of enhanced Hebrew Natural Language Processing (NLP v2).

**Version**: v2  
**Language**: Hebrew (עברית)

## New Features

### 1. Duration Phrases
- `45 דקות`, `חצי שעה`, `שעתיים`, `90 דק'`, `30 דק`

### 2. All-Day Events
- `כל היום`, `יום מלא`, or date without time

### 3. Guest Management
- Extract emails: `עם user@example.com`
- Multiple guests supported

### 4. Recurrence Patterns
- Daily: `כל יום`
- Weekly: `כל שני`, `כל שלישי`, etc.
- Until: `עד 31.12`, `עד סוף דצמבר`
- Times: `ל-5 פעמים`

### 5. Expanded Colors
- `תכלת`, `סגול`, `אפור`, plus original colors

### 6. Enhanced Reminders
- `תזכורת 10`, `תזכורות 30,10,5`, `תזכורת 15 דקות`

### 7. Free Slot Suggestion
- Action: `suggestSlots`
- Find free time slots by duration and part-of-day

## Example Usage

```
מחר 09:00 פגישת צוות שעתיים עם dani@example.com תזכורות 30,10 צבע כחול
```

## Backward Compatibility
All NLP v1 commands continue to work.
