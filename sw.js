const CACHE_VERSION = 'yaniv-v4';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Install event - cache essential assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first for API calls, cache first for assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // For Apps Script API calls, always try network first
  if (url.hostname.includes('script.google.com')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(JSON.stringify({
            ok: false,
            message: 'אין חיבור לאינטרנט. נסה שוב כשתחזור להיות מחובר.'
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // For local assets, cache first strategy
  const pathname = url.pathname;
  const filename = pathname.split('/').pop();
  
  if (ASSETS.some(asset => asset.includes(filename))) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then(response => {
          if (response.ok) {
            const responseToCache = response.clone();
            caches.open(CACHE_VERSION).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        });
      })
    );
  }
});
