const fs=require('fs'); let d={}; try{ d=JSON.parse(fs.readFileSync('status/live.json','utf8')); }catch{}
const p=d.progress||0, trend=p<50?'slow':'stable', eta=p<80?Math.max(1,Math.round((100-p)/2)):2;
console.log(`ETA: ~${eta} minutes | progress: ${p}%`); fs.writeFileSync('status/prediction.json', JSON.stringify({trend,eta}));
