function doGet(e){ 
  return ContentService.createTextOutput(JSON.stringify({ok:true, ts:new Date().toISOString()}))
                       .setMimeType(ContentService.MimeType.JSON);
}
