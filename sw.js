const C='yaniv-v4';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS))); 
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(
      keys.filter(k=>k!==C).map(k=>caches.delete(k))
    )).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const url = new URL(e.request.url);
  const pathname = url.pathname.split('/').pop();
  
  // Network-first for Google Apps Script exec URLs (API calls)
  if (url.hostname.includes('script.google.com') && url.pathname.includes('/exec')) {
    e.respondWith(
      fetch(e.request)
        .catch(()=>new Response(JSON.stringify({error:true,message:'אין חיבור לאינטרנט'}),
          {headers:{'Content-Type':'application/json'}}))
    );
    return;
  }
  
  // Cache-first for static assets
  if (ASSETS.includes(pathname) || ASSETS.includes('./'+pathname)) {
    e.respondWith(
      caches.match(e.request).then(r=>r||fetch(e.request).then(resp=>{
        if(resp.ok) caches.open(C).then(c=>c.put(e.request,resp.clone()));
        return resp;
      }))
    );
  }
});
