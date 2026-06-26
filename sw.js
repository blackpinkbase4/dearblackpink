const CACHE_NAME = 'dear-bp-v15';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon.svg',
  './stay.mp3'
];

// Install Event - cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event - network first fallback to cache for critical assets
self.addEventListener('fetch', (event) => {
  // 1. Exclude Supabase database requests to guarantee real-time sync
  if (event.request.url.includes('supabase.co')) {
    return;
  }

  // 2. Exclude Range requests and MP3 files to prevent playback failures in Chrome/Safari
  if (event.request.headers.has('range') || event.request.url.endsWith('.mp3')) {
    return;
  }

  const url = new URL(event.request.url);
  // Check if it's one of the critical app shell documents/scripts
  const isCriticalAsset = 
    url.pathname === '/' || 
    url.pathname.endsWith('index.html') || 
    url.pathname.endsWith('app.js') || 
    url.pathname.endsWith('style.css') || 
    url.pathname.endsWith('manifest.json');

  if (isCriticalAsset) {
    // Network-First Strategy: fetch fresh from server, fallback to cache if offline
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  } else {
    // Stale-While-Revalidate Strategy for other static assets (icons, images)
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          fetch(event.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          }).catch(() => { /* ignore network error when offline */ });
          
          return cachedResponse;
        }
        return fetch(event.request);
      })
    );
  }
});
