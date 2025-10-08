const fs=require('fs'), yaml=require('js-yaml'); const dir='.github/workflows';
if(!fs.existsSync(dir)) process.exit(0);
for(const f of fs.readdirSync(dir).filter(x=>x.endsWith('.yml'))){
  const full=`${dir}/${f}`; const data=yaml.load(fs.readFileSync(full,'utf8'));
  if(data && data.jobs){ for(const j of Object.keys(data.jobs)){ const steps=data.jobs[j].steps||[]; for(const s of steps){ if(s.name && /Upload/i.test(s.name)) s.if="always()"; } } }
  fs.writeFileSync(full, yaml.dump(data)); console.log('Optimized', f);
}
