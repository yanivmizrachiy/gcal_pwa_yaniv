const C='yaniv-v4';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];

// Install: cache static assets
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS))); 
  self.skipWaiting();
});

// Activate: cleanup old caches
self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys=>
      Promise.all(keys.map(key=>key!==C?caches.delete(key):null))
    ).then(()=>self.clients.claim())
  );
});

// Fetch: cache-first for static, network-first for API calls
self.addEventListener('fetch',e=>{
  const url = new URL(e.request.url);
  const path = url.pathname.split('/').pop();
  
  // Static assets: cache-first strategy
  if (ASSETS.includes(path) || ASSETS.includes('./' + path)) {
    e.respondWith(
      caches.match(e.request).then(r=>r||fetch(e.request))
    );
  }
  // Apps Script exec calls: network-first strategy (always try network)
  else if (url.hostname.includes('script.google.com') || url.pathname.includes('/exec')) {
    e.respondWith(
      fetch(e.request).catch(err=>{
        console.error('Network failed for API call:', err);
        return new Response(JSON.stringify({ok:false,error:'Network unavailable'}), {
          headers:{'Content-Type':'application/json'}
        });
      })
    );
  }
});
