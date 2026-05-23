const CACHE_NAME = 'guitarist-tools-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.svg',
  './icon-180.png',
  './icon-192.png',
  './icon-512.png',
  'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Cache same-origin requests or Google Fonts
  const isSameOrigin = url.origin === self.location.origin;
  const isGoogleFont = url.hostname.includes('googleapis.com') || url.hostname.includes('gstatic.com');

  if (!isSameOrigin && !isGoogleFont) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Create request clone for fetching in background
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, cacheCopy);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.log('[Service Worker] Fetch failed', err);
      });

      // Serve cached response immediately if we have it, else wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
