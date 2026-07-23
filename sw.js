/**
 * sw.js - Service Worker untuk myHW
 * Strategi: cache-first untuk app shell (HTML/CSS/JS milik sendiri),
 * network-first dengan fallback ke cache untuk request lain (termasuk API GAS).
 * Catatan: karena backend GAS butuh koneksi internet untuk baca/tulis data,
 * mode offline di sini hanya menjaga APLIKASI (shell) tetap bisa dibuka,
 * bukan membuat data tersinkron penuh secara offline.
 */

const CACHE_NAME = 'myhw-cache-v1';

const APP_SHELL = [
  './index.html',
  './login.html',
  './dashboard.html',
  './manifest.json',
  './assets/css/style.css',
  './assets/js/api.js',
  './assets/js/auth.js',
  './assets/js/ui.js',
  './assets/js/app.js',
  './assets/js/config.js',
  './assets/js/pwa.js',
  './pages/anggota.html',
  './pages/profil.html',
  './pages/qobilah.html',
  './pages/kegiatan.html',
  './pages/keuangan.html',
  './pages/skt-tkt.html',
  './pages/inventaris.html',
  './pages/qr-scanner.html',
  './assets/js/pages/anggota.js',
  './assets/js/pages/profil.js',
  './assets/js/pages/qobilah.js',
  './assets/js/pages/kegiatan.js',
  './assets/js/pages/keuangan.js',
  './assets/js/pages/skt-tkt.js',
  './assets/js/pages/inventaris.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .catch((err) => console.warn('SW install cache error (non-fatal):', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return; // never cache POST (writes to GAS API)

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;

  if (isSameOrigin) {
    // App shell: cache-first, refresh cache in background
    event.respondWith(
      caches.match(req).then((cached) => {
        const networkFetch = fetch(req)
          .then((res) => {
            const resClone = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
            return res;
          })
          .catch(() => cached);
        return cached || networkFetch;
      })
    );
  } else {
    // External resources (CDN, GAS API, images): network-first, fallback to cache
    event.respondWith(
      fetch(req)
        .then((res) => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
  }
});
