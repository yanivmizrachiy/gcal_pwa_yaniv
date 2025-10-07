# CHECKPOINTS.md
## Verifiable Quality Checkpoints for Stage 2.1

### Purpose
This document defines testable, verifiable checkpoints derived from SYSTEM_DIRECTIVE.md to ensure system compliance and quality.

---

## 1. CRUD Operations Verification

### 1.1 Create Event
**Checkpoint**: ✓ Create event with all supported fields
```javascript
// Test payload
{
  action: 'createEvent',
  event: {
    title: 'פגישת צוות',
    start: '2025-01-15T10:00:00Z',
    end: '2025-01-15T11:00:00Z',
    description: 'פגישה שבועית',
    location: 'משרד',
    color: 'blue',
    reminders: [10, 30]
  }
}
// Expected: { ok: true, action: 'createEvent', message: '...', event: {...} }
```

**Verification Steps**:
1. Send createEvent request with all fields
2. Verify response has `ok: true` and `action: 'createEvent'`
3. Verify `event` object returned with id, title, start, end
4. Check Hebrew success message present

### 1.2 Find Events
**Checkpoint**: ✓ Find events returns both 'events' and 'items' arrays
```javascript
// Test payload
{
  action: 'findEvents',
  options: {
    timeMin: '2025-01-01T00:00:00Z',
    maxResults: 10
  }
}
// Expected: { ok: true, action: 'findEvents', count: N, events: [...], items: [...] }
```

**Verification Steps**:
1. Send findEvents request
2. Verify response has both `events` and `items` fields
3. Verify `items` is identical to `events` (backwards compatibility)
4. Verify count matches array length

### 1.3 Update Event
**Checkpoint**: ✓ Update event with partial changes
```javascript
// Test payload
{
  action: 'updateEvent',
  eventId: 'event_id_here',
  changes: {
    title: 'כותרת מעודכנת'
  }
}
// Expected: { ok: true, action: 'updateEvent', message: '...', changedFields: ['כותרת'], event: {...} }
```

**Verification Steps**:
1. Create test event
2. Update single field (title)
3. Verify response has `ok: true` and `action: 'updateEvent'`
4. Verify `changedFields` array lists modified fields
5. Check Hebrew message includes changed field names

### 1.4 Delete Event
**Checkpoint**: ✓ Delete event by ID
```javascript
// Test payload
{
  action: 'deleteEvent',
  eventId: 'event_id_here'
}
// Expected: { ok: true, action: 'deleteEvent', message: 'האירוע נמחק בהצלחה: ...' }
```

**Verification Steps**:
1. Create test event
2. Delete event by ID
3. Verify response has `ok: true` and `action: 'deleteEvent'`
4. Verify Hebrew success message includes event title
5. Confirm event no longer exists in calendar

---

## 2. NLP ParseOnly Safety

### 2.1 ParseOnly Mode - No Mutations
**Checkpoint**: ✓ parseOnly:true prevents all calendar modifications
```javascript
// Test payload
{
  action: 'parseNlp',
  text: 'פגישה היום 14:00-15:00',
  parseOnly: true
}
// Expected: { ok: true, action: 'parseNlp', parseOnly: true, interpreted: {...}, message: 'תצוגה מקדימה - לא בוצעו שינויים' }
```

**Verification Steps**:
1. Count calendar events before parseNlp call
2. Send parseNlp with parseOnly:true
3. Verify response has `parseOnly: true`
4. Verify Hebrew message: "תצוגה מקדימה - לא בוצעו שינויים"
5. Verify `interpreted` field contains parsed command structure
6. Count calendar events after - MUST be identical (no mutations)

### 2.2 ParseOnly:false Executes Command
**Checkpoint**: ✓ parseOnly:false creates actual calendar event
```javascript
// Test payload
{
  action: 'parseNlp',
  text: 'פגישה היום 14:00-15:00',
  parseOnly: false
}
// Expected: { ok: true, action: 'createEvent', message: '...', event: {...}, interpreted: {...} }
```

**Verification Steps**:
1. Count calendar events before
2. Send parseNlp with parseOnly:false
3. Verify event created in calendar
4. Verify response includes both `event` and `interpreted` fields
5. Count calendar events after - should increase by 1

### 2.3 Text Action Alias
**Checkpoint**: ✓ 'text' action delegates to handleParseNlp
```javascript
// Test payload (text action, equivalent to parseNlp)
{
  action: 'text',
  text: 'פגישה מחר 10:00-11:00'
}
// Expected: Same as parseNlp with parseOnly:false
```

**Verification Steps**:
1. Send request with action:'text'
2. Verify behavior identical to parseNlp action
3. Verify command is executed (not just parsed)
4. Future: verify parseOnly flag is recognized when passed

---

## 3. Hebrew Delta Messages

### 3.1 Success Messages in Hebrew
**Checkpoint**: ✓ All success responses include Hebrew messages

**Verification Steps**:
1. Test each action (create, update, delete, parse)
2. Verify all success messages contain Hebrew text
3. Verify messages are contextual and informative

**Expected Messages**:
- Create: "האירוע נוצר בהצלחה: [title]"
- Update: "האירוע עודכן (שדות: [fields])"
- Delete: "האירוע נמחק בהצלחה: [title]"
- ParseOnly: "תצוגה מקדימה - לא בוצעו שינויים"
- SelfTest: "בדיקה תקינה"

### 3.2 Error Messages in Hebrew
**Checkpoint**: ✓ All error responses include Hebrew error text

**Verification Steps**:
1. Trigger various error conditions
2. Verify all error messages contain Hebrew text

**Expected Error Messages**:
- Unsupported action: "פעולה לא נתמכת: [action]"
- Event not found: "אירוע לא נמצא"
- Parse failure: "לא הצלחתי להבין את הפקודה"
- Delete requires ID: "מחיקה דורשת זיהוי אירוע ספציפי"
- Update requires ID: "עדכון דורש זיהוי אירוע ספציפי"

---

## 4. Fail-Safe Fallback

### 4.1 Error Response Normalization
**Checkpoint**: ✓ All errors follow { ok:false, action?:, error: } structure

**Verification Steps**:
1. Test unsupported action
2. Test missing required parameters
3. Test invalid data
4. Verify all error responses have:
   - `ok: false`
   - `error: string` (Hebrew message)
   - Optional `action: string` field

**Test Cases**:
```javascript
// Unsupported action
{ action: 'unknown' }
→ { ok: false, error: "פעולה לא נתמכת: unknown" }

// Missing event
{ action: 'deleteEvent', eventId: 'invalid_id' }
→ { ok: false, action: 'deleteEvent', error: 'אירוע לא נמצא' }

// NLP parse failure
{ action: 'parseNlp', text: 'invalid command' }
→ { ok: false, action: 'parseNlp', error: '...', tokens: [...] }
```

### 4.2 Catch-All Error Handling
**Checkpoint**: ✓ Unexpected errors return safe error response

**Verification Steps**:
1. Trigger internal error (e.g., malformed JSON)
2. Verify response has `ok: false`
3. Verify Hebrew error message present
4. Verify stack trace included in error response (for debugging)

---

## 5. Performance Targets

### 5.1 API Response Times
**Checkpoint**: ✓ Operations complete within target times

**Targets**:
- CRUD operations: < 2 seconds
- NLP parsing: < 1 second (for interpretation)
- findEvents with filters: < 2 seconds

**Verification Steps**:
1. Measure response time for each operation type
2. Run multiple iterations (10+ calls per operation)
3. Calculate average and max response times
4. Verify 95th percentile under target thresholds

### 5.2 NLP Parsing Performance
**Checkpoint**: ✓ Command interpretation is fast

**Verification Steps**:
1. Test various NLP commands (simple and complex)
2. Measure time from request to interpreted response
3. Verify parseOnly:true responses are faster than execution
4. Target: < 1 second for parsing, < 2 seconds for execution

---

## 6. Backwards Compatibility

### 6.1 Items Alias in FindEvents
**Checkpoint**: ✓ findEvents returns both 'events' and 'items'

**Verification Steps**:
1. Call findEvents
2. Verify response has both `events` and `items` arrays
3. Verify both arrays are identical (deep equality)
4. Verify existing UI code using `data.items` still works

### 6.2 Legacy GET Endpoints
**Checkpoint**: ✓ doGet continues to support legacy modes

**Verification Steps**:
1. Test GET ?mode=selftest
2. Test GET ?mode=events
3. Test GET ?mode=today
4. Verify all return expected data structures
5. Verify no breaking changes to response formats

### 6.3 Action Aliases Don't Break Existing Actions
**Checkpoint**: ✓ Adding 'text' doesn't affect other actions

**Verification Steps**:
1. Test all existing actions still work
2. Verify 'text' is additive, not replacing
3. Verify parseNlp action continues to work unchanged

---

## 7. Automation Verification

### 7.1 SelfTest Action
**Checkpoint**: ✓ selfTest returns system health status

**Verification Steps**:
1. Call selfTest action
2. Verify response includes:
   - `ok: true`
   - `action: 'selfTest'`
   - `message: 'בדיקה תקינה'`
   - `nlpVersion: 'v1'`
   - `now: ISO8601 timestamp`

### 7.2 Deployment Pipeline
**Checkpoint**: ✓ GitHub Actions successfully deploy changes

**Verification Steps**:
1. Verify gas-deploy.yml workflow exists
2. Confirm workflow runs on push to main
3. Verify deployment updates Apps Script
4. Test deployed endpoint responds correctly

---

## Checkpoint Summary

| Category | Checkpoint | Status |
|----------|-----------|--------|
| CRUD | Create Event | ⬜ |
| CRUD | Find Events (with items alias) | ⬜ |
| CRUD | Update Event | ⬜ |
| CRUD | Delete Event | ⬜ |
| NLP Safety | parseOnly prevents mutations | ⬜ |
| NLP Safety | parseOnly:false executes | ⬜ |
| NLP Safety | 'text' action alias works | ⬜ |
| Hebrew | Success messages in Hebrew | ⬜ |
| Hebrew | Error messages in Hebrew | ⬜ |
| Fail-Safe | Error response normalization | ⬜ |
| Fail-Safe | Catch-all error handling | ⬜ |
| Performance | CRUD < 2s | ⬜ |
| Performance | NLP parsing < 1s | ⬜ |
| Backwards Compat | items alias in findEvents | ⬜ |
| Backwards Compat | Legacy GET endpoints | ⬜ |
| Automation | selfTest works | ⬜ |
| Automation | Deployment pipeline | ⬜ |

**Legend**: ⬜ Pending | ✅ Verified | ❌ Failed

---

## Testing Procedure

To verify all checkpoints:

1. **Manual Testing**: Use test client or curl to verify each checkpoint
2. **Automated Testing**: Create test scripts for regression testing
3. **UI Integration**: Verify frontend still works with API changes
4. **Documentation Review**: Ensure changes match directive

## Sign-Off

- [ ] All checkpoints verified
- [ ] Documentation updated
- [ ] Code reviewed
- [ ] Deployed to production
- [ ] Monitoring confirms stable operation
