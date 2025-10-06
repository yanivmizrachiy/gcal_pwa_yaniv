const C='yaniv-v4';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS))); 
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys.map(key => {
        if (key !== C) return caches.delete(key);
      }));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch',e=>{
  const url = new URL(e.request.url);
  
  // Network-first strategy for Apps Script API calls
  if (url.hostname === 'script.google.com' || url.hostname === 'script.googleusercontent.com') {
    e.respondWith(
      fetch(e.request)
        .catch(() => {
          return new Response(JSON.stringify({
            ok: false,
            error: 'Network unavailable. Apps Script API requires internet connection.'
          }), {
            status: 503,
            headers: {'Content-Type': 'application/json'}
          });
        })
    );
    return;
  }
  
  // Cache-first strategy for static assets
  const p = url.pathname.split('/').pop();
  if (ASSETS.includes(p) || ASSETS.includes('./' + p)) {
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request))
    );
  }
});
