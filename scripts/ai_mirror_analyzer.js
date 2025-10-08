const fs = require('fs'); const out='status/mirror_analysis.json';
let logs={}; try{ logs=JSON.parse(fs.readFileSync('status/last_run.json','utf8')||'{}'); }catch{}
const issues=[]; if(!logs.ok) issues.push('SelfTest failed'); if(logs.calendarAccess===false) issues.push('Calendar access missing');
const actions=[]; if(issues.length) actions.push('patch_gas'); if((logs.progressPercent||0)<100) actions.push('optimize_workflow');
const result={time:new Date().toISOString(),issues,actions}; fs.mkdirSync('status',{recursive:true}); fs.writeFileSync(out,JSON.stringify(result,null,2)); console.log('AI-Mirror analysis complete.');
