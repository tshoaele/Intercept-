const CACHE = 'rewire-v6';

// Only these exact paths are cached by the service worker.
const CACHEABLE_PATHS = new Set([
  '/',
  '/index.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/fonts/Radja.ttf',
  '/fonts/Radja.otf'
]);

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  if (!isSameOrigin) return; // never cache cross-origin

  // Allow explicit navigation requests to fall through to index.html
  const isNavigation = e.request.mode === 'navigate';
  if (!isNavigation && !CACHEABLE_PATHS.has(url.pathname)) return;

  e.respondWith(
    caches.match(e.request).then(r => {
      if (r) return r;
      return fetch(e.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic'){
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(()=>{});
        }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
