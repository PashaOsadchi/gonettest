const CACHE_NAME = 'v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles/style.css',
  '/js/js.js',
  '/js/registration_service_worker.js',
  '/icon/icon.png',
  '/icon/icon_144.png',
  '/icon/icon_192.png',
  '/icon/icon_512.png',
  '/pwa.webmanifest'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
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
  if (
    url.startsWith('https://speed.cloudflare.com/__down') ||
    url.startsWith('https://www.google.com/generate_204')
  ) {
    // Always fetch connectivity check requests from the network without caching
    event.respondWith(fetch(event.request, { cache: 'no-store' }));
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
        .catch(() => caches.match(event.request).then(res => res || caches.match('/index.html')))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
