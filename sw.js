// Service Worker for 小六一的闯关日记 PWA
const CACHE_NAME = 'chuangguan-riji-v2';
const ASSETS = [
  '/',
  '/daily-workbench.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install: cache all assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS).catch(err => {
        // Some assets may fail - that's ok for offline
        console.warn('Cache addAll partial failure:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first with network fallback
self.addEventListener('fetch', event => {
  // Only handle navigation and same-origin requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Don't cache non-success responses
        if (!response || response.status !== 200) return response;

        // Clone and cache successful responses
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clone);
        });

        return response;
      }).catch(() => {
        // Offline fallback - return the main page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/daily-workbench.html') || caches.match('/');
        }
        // For other resources, just fail gracefully
        return new Response('Offline', { status: 503 });
      });
    })
  );
});
