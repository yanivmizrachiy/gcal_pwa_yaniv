const C='yaniv-cache-v1';
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(ASSETS))); self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(self.clients.claim());});
self.addEventListener('fetch',e=>{const p=new URL(e.request.url).pathname.split('/').pop(); if(ASSETS.includes(p)) e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)))});
