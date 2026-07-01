const CACHE = 'student-os-v1';

const ASSETS = [
  '/',
  '/index.html',
  '/js/app.js',
  '/js/state.js',
  '/js/tasks.js',
  '/js/timer.js',
  '/js/gamification.js',
  '/js/ai.js',
  '/js/settings.js',
  '/js/utils.js',
  '/styles/variables.css',
  '/styles/layout.css',
  '/styles/components.css',
  '/styles/animations.css',
  '/manifest.json',
  '/favicon.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  const url = event.request.url;

  if (url.includes('fonts.googleapis') || url.includes('fonts.gstatic')) {
    event.respondWith(
      caches.open(CACHE).then(cache =>
        cache.match(event.request).then(r =>
          r || fetch(event.request).then(res => {
            cache.put(event.request, res.clone());
            return res;
          })
        )
      )
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(r =>
      r || fetch(event.request).catch(() => caches.match('/index.html'))
    )
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
