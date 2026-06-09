'use strict';

// Minimal service worker: makes the app installable and caches the static
// shell for offline launch. API calls always go to the network (never cached —
// your data must be live and is per-session authed).

const CACHE = 'credit-monitor-v1';
const SHELL = ['/', '/index.html', '/styles.css', '/app.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);
  // Never cache the API or auth — always go to network.
  if (req.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname === '/login') return;
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).catch(() => caches.match('/')))
  );
});
