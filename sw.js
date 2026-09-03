// Dziennik Zdrowia — minimal offline app-shell cache.
// All real data lives in localStorage on-device; this only caches the
// static shell (HTML/manifest/icons) so the app opens without network.
const CACHE = 'dziennik-zdrowia-v4';
const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Cache-first for the shell, network-first fallback to cache for everything else same-origin.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      const fetchPromise = fetch(e.request).then(networkRes => {
        caches.open(CACHE).then(c => c.put(e.request, networkRes.clone()));
        return networkRes;
      }).catch(() => cached);
      return cached || fetchPromise;
    })
  );
});
