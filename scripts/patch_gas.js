const fs = require('fs'); const file = 'apps_script/Code.gs';
if (!fs.existsSync(file)) { console.log('Code.gs not found, skipping'); process.exit(0); }
let code = fs.readFileSync(file,'utf8');
if (!/function\s+handleSelfTestV2\s*\(/.test(code)) {
  code += `
function handleSelfTestV2() {
  try {
    var cal = CalendarApp.getDefaultCalendar();
    var now = new Date(); var later = new Date(now.getTime() + 60*60*1000);
    cal.getEvents(now,later);
    return { ok:true, nlpVersion:"v2", progressPercent:100, calendarAccess:true };
  } catch(e){
    return { ok:false, nlpVersion:"v2", progressPercent:0, calendarAccess:false, error:String(e&&e.message||e) };
  }
}`; fs.writeFileSync(file, code, 'utf8'); console.log('Injected handleSelfTestV2');
} else { console.log('handleSelfTestV2 exists'); }
