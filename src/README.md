# Smart Calendar Editor - Google Apps Script

## Overview
This directory contains the Google Apps Script source code for the Smart Calendar Editor that runs in the PWA iframe.

## Files
- **Code.gs** - Backend Google Apps Script with calendar operations
- **Index.html** - Frontend HTML/JavaScript interface
- **appsscript.json** - Apps Script manifest with configuration and permissions

## Fix for TypeError: 'ev.getHtmlLink is not a function'

### Problem
The error occurred due to confusion between two different types of "events":
1. **DOM Events** - JavaScript events from user interactions (clicks, etc.)
2. **Calendar Events** - Google Calendar API event objects

The `getHtmlLink()` method is ONLY available on Calendar Event objects, not on DOM events.

### Solution
We've implemented clear naming conventions throughout the code:

#### In Code.gs (Backend)
- Use `calEvent` or `calendarEvent` for Google Calendar Event objects
- These objects HAVE the `getHtmlLink()` method
- Example:
```javascript
const calEvent = calendar.createEvent(title, start, end);
const link = calEvent.getHtmlLink(); // ✅ Correct - CalendarEvent has this method
```

#### In Index.html (Frontend)
- Use `domEvent` for DOM event handler parameters
- Use `calendarEvent` for calendar data objects from API responses
- Example:
```javascript
// DOM event listener - parameter is a DOM event
viewBtn.addEventListener('click', function(domEvent) {
  // ❌ WRONG: domEvent.getHtmlLink() - DOM events don't have this!
  // ✅ CORRECT: Use the calendar event object from the API
  window.open(calendarEvent.htmlLink, '_blank');
});
```

### Key Points
1. **Never** call `getHtmlLink()` on DOM events
2. **Always** use descriptive variable names:
   - `domEvent` or `e` for DOM events
   - `calEvent` or `calendarEvent` for Calendar events
3. Calendar event data (including `htmlLink`) comes from the API response, not from click events

## Deployment
This code is automatically deployed using GitHub Actions workflow `gas-deploy.yml`:
1. Code is pushed to the `src/` directory
2. GitHub Actions runs `clasp push` to deploy to Google Apps Script
3. The script is automatically versioned and deployed as a web app

## Testing
To test the deployment:
1. Push changes to the `main` branch or trigger the `gas-deploy.yml` workflow
2. The workflow will output the EXEC_URL (web app URL)
3. Update the iframe src in `index.html` with the new EXEC_URL
4. Test the calendar editor functionality

## Permissions Required
The script requires the following OAuth scopes:
- `https://www.googleapis.com/auth/calendar` - To read/write calendar events
- `https://www.googleapis.com/auth/script.external_request` - For external API calls
