const CACHE_NAME = 'v3';
const urlsToCache = [
  '.',
  'index.html',
  'styles/style.css',
  'js/js.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'js/registration_service_worker.js',
  'icon/icon.png',
  'icon/icon_144.png',
  'icon/icon_192.png',
  'icon/icon_512.png',
  'pwa.webmanifest'
];

self.addEventListener('install', event => {
  // Pre-cache required resources and activate the service worker immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      // Force waiting service worker to become active
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
});

self.addEventListener('fetch', event => {
  const url = event.request.url;
  if (url.includes('speed.cloudflare.com') || url.includes('generate_204')) {
    // Let the browser handle these requests normally without caching
    return;
  }
  if (event.request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then(res => res || caches.match('index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
