# API Test Examples

This file contains test examples you can use to verify the API is working correctly after deployment.

## Prerequisites

Replace `YOUR_DEPLOYMENT_URL` with your actual Apps Script deployment URL.

```bash
export DEPLOYMENT_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"
```

---

## 1. Self-Test (GET - Legacy)

```bash
curl "${DEPLOYMENT_URL}?mode=selftest"
```

**Expected Response:**
```json
{
  "ok": true,
  "now": "2024-01-15T10:00:00.000Z",
  "user": "your-email@gmail.com",
  "scopes": ["calendar", "external_request", "userinfo.email"]
}
```

---

## 2. Get Events (GET - Legacy)

```bash
curl "${DEPLOYMENT_URL}?mode=events"
```

**Expected Response:**
```json
{
  "ok": true,
  "count": 3,
  "events": [
    {
      "id": "event_id_123",
      "title": "Meeting",
      "start": "2024-01-15T14:00:00.000Z",
      "end": "2024-01-15T15:00:00.000Z",
      "allDay": false
    }
  ]
}
```

---

## 3. Self-Test (POST)

```bash
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{"action":"selfTest"}'
```

**Expected Response:**
```json
{
  "ok": true,
  "action": "selfTest",
  "message": "Service operational",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "user": "your-email@gmail.com",
  "calendarAccess": true
}
```

---

## 4. Find Events

```bash
# Find all events in next 7 days
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "findEvents",
    "options": {
      "maxResults": 10
    }
  }'

# Search for specific events
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "findEvents",
    "options": {
      "q": "meeting",
      "maxResults": 5
    }
  }'

# Find events in specific date range
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "findEvents",
    "options": {
      "timeMin": "2024-01-15T00:00:00Z",
      "timeMax": "2024-01-22T23:59:59Z",
      "maxResults": 20
    }
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "action": "findEvents",
  "message": "Found 5 event(s)",
  "count": 5,
  "events": [
    {
      "id": "...",
      "title": "Team Meeting",
      "start": "2024-01-15T14:00:00.000Z",
      "end": "2024-01-15T15:00:00.000Z",
      "allDay": false,
      "location": "Conference Room",
      "description": "Weekly sync",
      "color": "",
      "attendees": [],
      "created": "2024-01-10T09:00:00.000Z",
      "updated": "2024-01-10T09:00:00.000Z"
    }
  ]
}
```

---

## 5. Create Event

```bash
# Simple event
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createEvent",
    "summary": "Test Meeting",
    "start": "2024-01-20T14:00:00Z",
    "end": "2024-01-20T15:00:00Z"
  }'

# Event with all options
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createEvent",
    "summary": "Important Client Meeting",
    "start": "2024-01-20T10:00:00Z",
    "end": "2024-01-20T11:30:00Z",
    "location": "Conference Room A",
    "description": "Q1 planning discussion",
    "attendees": [
      {"email": "colleague@example.com"}
    ],
    "reminders": [
      {"method": "popup", "minutes": 10},
      {"method": "popup", "minutes": 60}
    ],
    "color": "9"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "action": "createEvent",
  "message": "Event created: Test Meeting",
  "event": {
    "id": "newly_created_event_id",
    "title": "Test Meeting",
    "start": "2024-01-20T14:00:00.000Z",
    "end": "2024-01-20T15:00:00.000Z",
    "allDay": false,
    "location": "",
    "description": "",
    "color": "",
    "attendees": [],
    "created": "2024-01-15T10:30:00.000Z",
    "updated": "2024-01-15T10:30:00.000Z"
  }
}
```

---

## 6. Get Event by ID

```bash
# Replace EVENT_ID with actual event ID from create/find response
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "getEvent",
    "id": "EVENT_ID_HERE"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "action": "getEvent",
  "message": "Event retrieved",
  "event": {
    "id": "EVENT_ID_HERE",
    "title": "Test Meeting",
    ...
  }
}
```

---

## 7. Update Event

```bash
# Update title only
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updateEvent",
    "id": "EVENT_ID_HERE",
    "summary": "Updated Meeting Title"
  }'

# Update time
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updateEvent",
    "id": "EVENT_ID_HERE",
    "start": "2024-01-20T15:00:00Z",
    "end": "2024-01-20T16:00:00Z"
  }'

# Update multiple fields
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "updateEvent",
    "id": "EVENT_ID_HERE",
    "summary": "Updated Meeting",
    "location": "New Location",
    "attendees": [
      {"email": "new-attendee@example.com"}
    ],
    "attendeesMode": "replace"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "action": "updateEvent",
  "message": "Event updated: Updated Meeting Title",
  "event": {
    "id": "EVENT_ID_HERE",
    "title": "Updated Meeting Title",
    ...
  }
}
```

---

## 8. Delete Event

```bash
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "deleteEvent",
    "id": "EVENT_ID_HERE"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "action": "deleteEvent",
  "message": "Event deleted: Test Meeting",
  "id": "EVENT_ID_HERE"
}
```

---

## 9. Hebrew NLP - Text (with event creation)

```bash
# Meeting tomorrow at 3 PM
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "text",
    "text": "פגישה עם דני מחר בשעה 15:00"
  }'

# Lunch today
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "text",
    "text": "ארוחת צהריים היום בשעה 13"
  }'

# Conference with location
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "text",
    "text": "כנס מחרתיים בשעה 9:00 בתל אביב"
  }'
```

**Expected Response:**
```json
{
  "ok": true,
  "action": "text",
  "message": "Event created from text: פגישה עם דני",
  "parsed": {
    "valid": true,
    "summary": "פגישה עם דני",
    "start": "2024-01-16T15:00:00.000Z",
    "end": "2024-01-16T16:00:00.000Z",
    "location": "",
    "description": ""
  },
  "event": {
    "id": "newly_created_event_id",
    "title": "פגישה עם דני",
    "start": "2024-01-16T15:00:00.000Z",
    "end": "2024-01-16T16:00:00.000Z",
    ...
  }
}
```

---

## 10. Hebrew NLP - Parse Only (no event creation)

```bash
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "parseOnly",
    "text": "פגישה עם דני מחר בשעה 15:00 בתל אביב"
  }'
```

**Expected Response:**
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

## Error Cases

### Invalid Action
```bash
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{"action":"invalidAction"}'
```

**Response:**
```json
{
  "ok": false,
  "action": "invalidAction",
  "error": "Unknown action: invalidAction",
  "availableActions": ["selfTest", "findEvents", "createEvent", "updateEvent", "deleteEvent", "getEvent", "text", "parseOnly"]
}
```

### Missing Required Fields
```bash
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "createEvent",
    "summary": "Test"
  }'
```

**Response:**
```json
{
  "ok": false,
  "action": "createEvent",
  "error": "Missing required fields: summary, start, end"
}
```

### Event Not Found
```bash
curl -X POST "${DEPLOYMENT_URL}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "getEvent",
    "id": "non_existent_id"
  }'
```

**Response:**
```json
{
  "ok": false,
  "action": "getEvent",
  "error": "Event not found: non_existent_id"
}
```

---

## Testing Workflow

1. **Test GET endpoints first:**
   ```bash
   curl "${DEPLOYMENT_URL}?mode=selftest"
   curl "${DEPLOYMENT_URL}?mode=events"
   ```

2. **Test POST selfTest:**
   ```bash
   curl -X POST "${DEPLOYMENT_URL}" -H "Content-Type: application/json" -d '{"action":"selfTest"}'
   ```

3. **Test findEvents:**
   ```bash
   curl -X POST "${DEPLOYMENT_URL}" -H "Content-Type: application/json" -d '{"action":"findEvents","options":{"maxResults":5}}'
   ```

4. **Test createEvent:**
   ```bash
   curl -X POST "${DEPLOYMENT_URL}" -H "Content-Type: application/json" -d '{"action":"createEvent","summary":"Test","start":"2024-01-20T10:00:00Z","end":"2024-01-20T11:00:00Z"}'
   # Save the event ID from response
   ```

5. **Test getEvent with the ID:**
   ```bash
   curl -X POST "${DEPLOYMENT_URL}" -H "Content-Type: application/json" -d '{"action":"getEvent","id":"EVENT_ID_FROM_STEP_4"}'
   ```

6. **Test updateEvent:**
   ```bash
   curl -X POST "${DEPLOYMENT_URL}" -H "Content-Type: application/json" -d '{"action":"updateEvent","id":"EVENT_ID_FROM_STEP_4","summary":"Updated Test"}'
   ```

7. **Test deleteEvent:**
   ```bash
   curl -X POST "${DEPLOYMENT_URL}" -H "Content-Type: application/json" -d '{"action":"deleteEvent","id":"EVENT_ID_FROM_STEP_4"}'
   ```

8. **Test Hebrew NLP:**
   ```bash
   # First test parseOnly
   curl -X POST "${DEPLOYMENT_URL}" -H "Content-Type: application/json" -d '{"action":"parseOnly","text":"פגישה מחר בשעה 14:00"}'
   
   # Then create event with text
   curl -X POST "${DEPLOYMENT_URL}" -H "Content-Type: application/json" -d '{"action":"text","text":"פגישה מחר בשעה 14:00"}'
   ```

---

## Automated Test Script

Create a file `test.sh`:

```bash
#!/bin/bash

# Set your deployment URL
DEPLOYMENT_URL="https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec"

echo "=== Testing Smart Calendar API ==="
echo ""

# Test 1: Self-test GET
echo "1. Self-test (GET)..."
curl -s "${DEPLOYMENT_URL}?mode=selftest" | jq .
echo ""

# Test 2: Self-test POST
echo "2. Self-test (POST)..."
curl -s -X POST "${DEPLOYMENT_URL}" -H "Content-Type: application/json" -d '{"action":"selfTest"}' | jq .
echo ""

# Test 3: Find events
echo "3. Find events..."
curl -s -X POST "${DEPLOYMENT_URL}" -H "Content-Type: application/json" -d '{"action":"findEvents","options":{"maxResults":5}}' | jq .
echo ""

# Test 4: Parse Hebrew text (no event creation)
echo "4. Parse Hebrew text..."
curl -s -X POST "${DEPLOYMENT_URL}" -H "Content-Type: application/json" -d '{"action":"parseOnly","text":"פגישה מחר בשעה 14:00"}' | jq .
echo ""

# Test 5: Create event from Hebrew text
echo "5. Create event from Hebrew text..."
curl -s -X POST "${DEPLOYMENT_URL}" -H "Content-Type: application/json" -d '{"action":"text","text":"בדיקה מחר בשעה 10:00"}' | jq .
echo ""

echo "=== Tests Complete ==="
```

Make it executable:
```bash
chmod +x test.sh
./test.sh
```

---

## Notes

- Replace `YOUR_SCRIPT_ID` or `YOUR_DEPLOYMENT_URL` with actual values
- All timestamps should be in ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)
- Event IDs are long strings returned by Google Calendar
- Hebrew text parsing requires proper UTF-8 encoding
- Use `jq` for pretty-printing JSON responses (optional but recommended)

---

Last Updated: 2024-01-15
