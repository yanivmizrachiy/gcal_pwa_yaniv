/**
 * NLP v2 Manual Test Cases
 * These tests demonstrate the expected behavior of the NLP v2 implementation
 * 
 * To run these tests in Apps Script:
 * 1. Copy the test functions below
 * 2. Paste them into your Code.gs file
 * 3. Run each test function individually from the Apps Script editor
 */

/**
 * Test 1: Hebrew text normalization
 */
function testNormalizeHebrew() {
  // Test removing diacritics
  var input1 = 'שָׁלוֹם עוֹלָם';
  var expected1 = 'שלום עולם';
  var result1 = normalizeHebrew(input1);
  Logger.log('Test 1a: ' + (result1 === expected1 ? 'PASS' : 'FAIL'));
  Logger.log('Input: "' + input1 + '", Expected: "' + expected1 + '", Got: "' + result1 + '"');
  
  // Test removing punctuation
  var input2 = 'פגישה, עם! אמא?';
  var expected2 = 'פגישה עם אמא';
  var result2 = normalizeHebrew(input2);
  Logger.log('Test 1b: ' + (result2 === expected2 ? 'PASS' : 'FAIL'));
  Logger.log('Input: "' + input2 + '", Expected: "' + expected2 + '", Got: "' + result2 + '"');
}

/**
 * Test 2: Levenshtein distance
 */
function testLevenshteinDistance() {
  var dist1 = levenshteinDistance('פגישה', 'פגישה', 10);
  Logger.log('Test 2a (identical): ' + (dist1 === 0 ? 'PASS' : 'FAIL') + ' - distance: ' + dist1);
  
  var dist2 = levenshteinDistance('פגישה', 'פגיסה', 10);
  Logger.log('Test 2b (1 char diff): ' + (dist2 === 1 ? 'PASS' : 'FAIL') + ' - distance: ' + dist2);
  
  var dist3 = levenshteinDistance('פגישה', 'ישיבה', 10);
  Logger.log('Test 2c (different): distance: ' + dist3);
}

/**
 * Test 3: Similarity calculation
 */
function testCalculateSimilarity() {
  var sim1 = calculateSimilarity('פגישה עם רופא', 'פגישה עם רופא');
  Logger.log('Test 3a (exact match): score=' + sim1.score + ' (should be 1.0)');
  
  var sim2 = calculateSimilarity('פגישה רופא', 'פגישה עם רופא');
  Logger.log('Test 3b (similar): score=' + sim2.score + ' (should be >0.55)');
  
  var sim3 = calculateSimilarity('פגישה', 'ישיבה');
  Logger.log('Test 3c (different): score=' + sim3.score + ' (should be low)');
}

/**
 * Test 4: Delete command parsing with fuzzy matching
 * Note: This requires actual calendar events to exist
 */
function testDeleteCommandParsing() {
  // Test explicit event ID
  var text1 = 'מחק abc123@google.com';
  var result1 = parseHebrewCommand(text1);
  Logger.log('Test 4a (explicit ID): success=' + result1.success + ', operation=' + result1.operation + ', eventId=' + result1.eventId);
  
  // Test fuzzy matching (requires events in calendar)
  var text2 = 'מחק פגישה עם דוקטור';
  var result2 = parseHebrewCommand(text2);
  Logger.log('Test 4b (fuzzy): success=' + result2.success + ', operation=' + result2.operation);
  if (result2.disambiguate) {
    Logger.log('Disambiguation needed: ' + result2.disambiguate.candidates.length + ' candidates');
  }
  
  // Test recurring event warning
  var text3 = 'מחק פגישת צוות שבועית';
  var result3 = parseHebrewCommand(text3);
  Logger.log('Test 4c (recurring): warnings=' + JSON.stringify(result3.warnings || []));
}

/**
 * Test 5: Update command parsing
 */
function testUpdateCommandParsing() {
  // Test time reschedule
  var text1 = 'העבר פגישה ל-15:00-16:00';
  var result1 = parseHebrewCommand(text1);
  Logger.log('Test 5a (reschedule): operation=' + result1.operation);
  if (result1.changes) {
    Logger.log('Changes detected: ' + JSON.stringify(Object.keys(result1.changes)));
  }
  
  // Test title change
  var text2 = 'שנה כותרת של פגישה ל פגישת צוות';
  var result2 = parseHebrewCommand(text2);
  Logger.log('Test 5b (title change): changes=' + JSON.stringify(result2.changes || {}));
  
  // Test location change
  var text3 = 'עדכן פגישה מיקום משרד 3';
  var result3 = parseHebrewCommand(text3);
  Logger.log('Test 5c (location): changes=' + JSON.stringify(result3.changes || {}));
  
  // Test recurrence modification (should fail)
  var text4 = 'שנה פגישה לכל שבוע';
  var result4 = parseHebrewCommand(text4);
  Logger.log('Test 5d (recurrence - should fail): error=' + result4.error);
}

/**
 * Test 6: Recurrence validation on create
 */
function testRecurrenceValidation() {
  // Valid: only 'times'
  var eventData1 = {
    title: 'פגישה',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 3600000).toISOString(),
    recurrence: { frequency: 'weekly', times: 5 }
  };
  var result1 = handleCreateEvent(eventData1);
  Logger.log('Test 6a (only times): ok=' + result1.ok);
  
  // Valid: only 'until'
  var eventData2 = {
    title: 'פגישה',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 3600000).toISOString(),
    recurrence: { frequency: 'weekly', until: new Date(Date.now() + 30*24*60*60*1000).toISOString() }
  };
  var result2 = handleCreateEvent(eventData2);
  Logger.log('Test 6b (only until): ok=' + result2.ok);
  
  // Invalid: both 'times' and 'until'
  var eventData3 = {
    title: 'פגישה',
    start: new Date().toISOString(),
    end: new Date(Date.now() + 3600000).toISOString(),
    recurrence: { 
      frequency: 'weekly', 
      times: 5,
      until: new Date(Date.now() + 30*24*60*60*1000).toISOString()
    }
  };
  var result3 = handleCreateEvent(eventData3);
  Logger.log('Test 6c (both times and until - should fail): ok=' + result3.ok + ', error=' + result3.error);
}

/**
 * Test 7: Title extraction for modification
 */
function testTitleExtraction() {
  var tokens1 = tokenizeHebrew('מחק פגישה עם דוקטור');
  var title1 = extractTitleForModification('מחק פגישה עם דוקטור', tokens1);
  Logger.log('Test 7a: "' + title1 + '" (should be "פגישה דוקטור")');
  
  var tokens2 = tokenizeHebrew('עדכן ישיבת צוות זמן ל-15:00');
  var title2 = extractTitleForModification('עדכן ישיבת צוות זמן ל-15:00', tokens2);
  Logger.log('Test 7b: "' + title2 + '" (should be "ישיבת צוות")');
}

/**
 * Run all tests
 */
function runAllNlpV2Tests() {
  Logger.log('=== Starting NLP v2 Tests ===\n');
  
  Logger.log('--- Test 1: Hebrew Normalization ---');
  testNormalizeHebrew();
  
  Logger.log('\n--- Test 2: Levenshtein Distance ---');
  testLevenshteinDistance();
  
  Logger.log('\n--- Test 3: Similarity Calculation ---');
  testCalculateSimilarity();
  
  Logger.log('\n--- Test 4: Delete Command Parsing ---');
  testDeleteCommandParsing();
  
  Logger.log('\n--- Test 5: Update Command Parsing ---');
  testUpdateCommandParsing();
  
  Logger.log('\n--- Test 6: Recurrence Validation ---');
  testRecurrenceValidation();
  
  Logger.log('\n--- Test 7: Title Extraction ---');
  testTitleExtraction();
  
  Logger.log('\n=== Tests Complete ===');
}
