/**
 * Smart Calendar Editor - Google Apps Script
 * Fixes: TypeError 'ev.getHtmlLink is not a function'
 * 
 * The issue occurred because DOM event objects (e.g., from button clicks)
 * were confused with Google Calendar Event objects.
 */

/**
 * Serves the HTML interface for the calendar editor
 */
function doGet(e) {
  try {
    // Check for selftest mode
    if (e && e.parameter && e.parameter.mode === 'selftest') {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'ok',
        message: 'Smart Calendar Editor is running',
        timestamp: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    // Serve the main HTML interface
    return HtmlService.createHtmlOutputFromFile('Index')
      .setTitle('יומן חכם – עורך אירועים')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (error) {
    return ContentService.createTextOutput('Error: ' + error.toString())
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

/**
 * Get calendar events for a date range
 * @param {string} startDate - Start date in ISO format
 * @param {string} endDate - End date in ISO format
 * @returns {Array} Array of event objects
 */
function getCalendarEvents(startDate, endDate) {
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Get calendar events (these are CalendarEvent objects, NOT DOM events)
    const calendarEvents = calendar.getEvents(start, end);
    
    // Convert CalendarEvent objects to plain objects for JSON serialization
    const events = calendarEvents.map(function(calEvent) {
      // FIX: Use 'calEvent' (CalendarEvent object) instead of 'ev' (DOM event)
      // CalendarEvent objects HAVE getHtmlLink() method
      return {
        id: calEvent.getId(),
        title: calEvent.getTitle(),
        start: calEvent.getStartTime().toISOString(),
        end: calEvent.getEndTime().toISOString(),
        description: calEvent.getDescription() || '',
        location: calEvent.getLocation() || '',
        // FIX: Properly call getHtmlLink() on CalendarEvent object
        htmlLink: calEvent.getHtmlLink() || '',
        color: calEvent.getColor() || ''
      };
    });
    
    return events;
  } catch (error) {
    throw new Error('Failed to fetch calendar events: ' + error.toString());
  }
}

/**
 * Create a new calendar event
 * @param {Object} eventData - Event details
 * @returns {Object} Created event details
 */
function createCalendarEvent(eventData) {
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    
    // Validate input
    if (!eventData.title || !eventData.start || !eventData.end) {
      throw new Error('Missing required fields: title, start, end');
    }
    
    const start = new Date(eventData.start);
    const end = new Date(eventData.end);
    
    // Create the event
    const calEvent = calendar.createEvent(
      eventData.title,
      start,
      end,
      {
        description: eventData.description || '',
        location: eventData.location || ''
      }
    );
    
    // Return the created event details
    // FIX: Use calEvent (CalendarEvent) which HAS getHtmlLink()
    return {
      id: calEvent.getId(),
      title: calEvent.getTitle(),
      start: calEvent.getStartTime().toISOString(),
      end: calEvent.getEndTime().toISOString(),
      htmlLink: calEvent.getHtmlLink(),
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to create event: ' + error.toString()
    };
  }
}

/**
 * Update an existing calendar event
 * @param {string} eventId - Event ID
 * @param {Object} updates - Fields to update
 * @returns {Object} Update result
 */
function updateCalendarEvent(eventId, updates) {
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const calEvent = calendar.getEventById(eventId);
    
    if (!calEvent) {
      throw new Error('Event not found');
    }
    
    // Update fields
    if (updates.title) calEvent.setTitle(updates.title);
    if (updates.description !== undefined) calEvent.setDescription(updates.description);
    if (updates.location !== undefined) calEvent.setLocation(updates.location);
    if (updates.start && updates.end) {
      calEvent.setTime(new Date(updates.start), new Date(updates.end));
    }
    
    return {
      success: true,
      htmlLink: calEvent.getHtmlLink()
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to update event: ' + error.toString()
    };
  }
}

/**
 * Delete a calendar event
 * @param {string} eventId - Event ID
 * @returns {Object} Deletion result
 */
function deleteCalendarEvent(eventId) {
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    const calEvent = calendar.getEventById(eventId);
    
    if (!calEvent) {
      throw new Error('Event not found');
    }
    
    calEvent.deleteEvent();
    
    return {
      success: true,
      message: 'Event deleted successfully'
    };
  } catch (error) {
    return {
      success: false,
      error: 'Failed to delete event: ' + error.toString()
    };
  }
}
