const SHELL = 'talana-shell-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((cache) => cache.addAll([
      '/',
      '/manifest.json',
      '/talana_logo.png',
      '/assets/gold.png',
      '/assets/silver.png'
    ]).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== SHELL).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((res) => {
        if (res.ok && new URL(event.request.url).pathname.match(/\.(js|css|woff2|png|svg|ico)$/)) {
          const clone = res.clone();
          caches.open(SHELL).then((cache) => cache.put(event.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(event.request).then((r) => r || caches.match('/')))
  );
});
