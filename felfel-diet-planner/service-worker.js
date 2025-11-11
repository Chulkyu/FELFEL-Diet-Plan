const CACHE_NAME = 'diet-planner-cache-v2'; // Version updated!
const urlsToCache = [
  '/',
  '/index.html',
  // Note: Caching .tsx files directly can be problematic.
  // The browser fetches them, but the service worker might serve the wrong content type.
  // For a build-less setup, it's often safer to just cache the main entry points
  // and let the browser handle dynamic imports, or exclude them from the cache.
  // However, for this fix, we will keep them but rely on the cache version bump.
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/components/icons.tsx',
  '/components/NutritionChart.tsx',
  '/services/geminiService.ts',
  '/services/nutritionService.ts',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
  // Skip waiting forces the new service worker to activate immediately.
  self.skipWaiting(); 
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache first, then network fallback
        return response || fetch(event.request);
      }
    )
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Tell all active clients to use the new service worker.
        return self.clients.claim();
    })
  );
});
