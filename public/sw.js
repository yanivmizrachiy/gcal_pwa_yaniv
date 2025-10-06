/** Service Worker for gcal_pwa_yaniv - Phase A.1 */
const CACHE_VERSION = 'gcal-pwa-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

// Install event: cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(CORE_ASSETS);
    }).then(() => {
      self.skipWaiting(); // Activate immediately
    })
  );
});

// Activate event: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_VERSION) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      self.clients.claim(); // Take control immediately
    })
  );
});

// Fetch event: network-first for API calls, cache-first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first strategy for API calls (placeholder for Phase A.2+)
  if (url.pathname.startsWith('/api/') || url.origin.includes('googleapis.com')) {
    event.respondWith(
      fetch(request).catch(() => {
        // Return cached response or error if offline
        return new Response(JSON.stringify({ error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' },
        });
      })
    );
    return;
  }

  // Cache-first strategy for core assets
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(request).then((response) => {
        // Cache successful GET requests
        if (request.method === 'GET' && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_VERSION).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      });
    })
  );
});
