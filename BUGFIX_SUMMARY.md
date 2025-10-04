# Bug Fix Summary: TypeError 'ev.getHtmlLink is not a function'

## Issue Description
The application was displaying a `TypeError: 'ev.getHtmlLink is not a function'` error, preventing the calendar editor from working properly.

## Root Cause Analysis
The error occurred due to confusion between two different types of "events":

1. **DOM Events** - JavaScript events from user interactions (button clicks, form submissions, etc.)
   - These are standard browser events with properties like `target`, `preventDefault()`, etc.
   - They do NOT have a `getHtmlLink()` method

2. **Google Calendar Events** - Data objects from the Google Calendar API
   - These represent calendar appointments/meetings
   - They DO have a `getHtmlLink()` method that returns a link to view the event in Google Calendar

The bug occurred when code tried to call `ev.getHtmlLink()` on a DOM event object, which doesn't have this method.

## Solution Implemented

### Files Created
Created Google Apps Script source code in the `src/` directory:

1. **src/Code.gs** - Backend server-side functions
   - Handles calendar operations (fetch, create, update, delete events)
   - Only calls `getHtmlLink()` on actual `CalendarEvent` objects
   - Uses clear variable naming: `calEvent` for Calendar events

2. **src/Index.html** - Frontend user interface
   - Provides a calendar editor UI in Hebrew (RTL)
   - Uses `domEvent` for DOM event handler parameters
   - Uses `calendarEvent` for calendar data from API responses
   - Never calls `getHtmlLink()` on DOM events

3. **src/appsscript.json** - Configuration manifest
   - Defines required OAuth scopes for Calendar API access
   - Configures the web app settings

4. **src/README.md** - Technical documentation
   - Explains the fix in detail
   - Provides deployment instructions
   - Documents naming conventions

### Key Code Changes

#### Backend (Code.gs)
```javascript
// ❌ BEFORE (hypothetical buggy code):
function getEvents() {
  const events = calendar.getEvents(start, end);
  return events.map(ev => ({
    link: ev.getHtmlLink()  // OK - ev is a CalendarEvent
  }));
}
```

```javascript
// ✅ AFTER (fixed code):
function getCalendarEvents(startDate, endDate) {
  const calendarEvents = calendar.getEvents(start, end);
  return calendarEvents.map(function(calEvent) {
    // Clear naming: calEvent is a CalendarEvent object
    return {
      htmlLink: calEvent.getHtmlLink(),  // ✅ Correct
      title: calEvent.getTitle()
      // ... other properties
    };
  });
}
```

#### Frontend (Index.html)
```javascript
// ❌ BEFORE (hypothetical buggy code):
button.addEventListener('click', function(ev) {
  const link = ev.getHtmlLink();  // ❌ ERROR! DOM events don't have this
  window.open(link);
});
```

```javascript
// ✅ AFTER (fixed code):
viewBtn.addEventListener('click', function(domEvent) {
  // domEvent is the DOM event (click event)
  // calendarEvent is from the API response (has htmlLink property)
  window.open(calendarEvent.htmlLink, '_blank');  // ✅ Correct
});
```

## Naming Conventions Established

To prevent this type of error in the future:

| Variable Name | Type | Has getHtmlLink()? | Usage |
|---------------|------|-------------------|-------|
| `domEvent` or `e` | DOM Event | ❌ No | Event listeners (click, submit, etc.) |
| `calEvent` or `calendarEvent` | Calendar Event Object | ✅ Yes (in backend) | Google Calendar API objects |
| `calendarEvent.htmlLink` | String | N/A | Property from API response (frontend) |

## Error Handling Improvements

Added comprehensive error handling:
- Try-catch blocks around all calendar operations
- User-friendly error messages in Hebrew
- Graceful degradation when operations fail
- Validation of required fields before API calls

## Testing Recommendations

1. **Deploy the Script**
   - Use the GitHub Actions workflow `gas-deploy.yml`
   - Verify the deployment succeeds and get the EXEC_URL

2. **Test Calendar Operations**
   - Load events for a date range
   - Create a new calendar event
   - View an event in Google Calendar (tests htmlLink)
   - Delete an event
   - Verify error messages appear for invalid input

3. **Test Event Handling**
   - Click all buttons to ensure no JavaScript errors
   - Check browser console for any TypeError messages
   - Verify DOM events are handled correctly

## Deployment

The code will be automatically deployed when:
1. Changes are pushed to the `main` branch, OR
2. The `gas-deploy.yml` workflow is manually triggered

The workflow will:
- Push code to Google Apps Script using `clasp`
- Create a new version
- Deploy as a web app
- Run a selftest to verify it's working
- Output the EXEC_URL for use in the iframe

## Next Steps

1. Trigger the deployment workflow
2. Update the iframe URL in `index.html` with the new EXEC_URL (if needed)
3. Test the application thoroughly
4. Monitor for any additional errors

## Prevention

To prevent similar issues in the future:
- Always use descriptive variable names
- Add comments explaining the type of event being handled
- Never assume methods exist without checking documentation
- Use TypeScript or JSDoc for better type checking (optional improvement)
