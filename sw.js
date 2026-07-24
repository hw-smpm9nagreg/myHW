/**
 * sw.js - Service Worker untuk myHW
 * Strategi: network-first untuk semua file sendiri (HTML/CSS/JS) - selalu ambil versi
 * terbaru dari server kalau online, cache hanya dipakai sebagai fallback saat offline.
 * (Sebelumnya cache-first menyebabkan versi lama tetap tampil setelah update di-deploy.)
 * Catatan: karena backend GAS butuh koneksi internet untuk baca/tulis data,
 * mode offline di sini hanya menjaga APLIKASI (shell) tetap bisa dibuka,
 * bukan membuat data tersinkron penuh secara offline.
 */

// Naikkan angka versi ini setiap kali struktur/isi app shell berubah signifikan,
// supaya cache lama otomatis dibersihkan di sisi pengguna.
const CACHE_NAME = 'myhw-cache-v2';

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
  './pages/kartu-anggota.html',
  './pages/pengguna.html',
  './assets/js/pages/anggota.js',
  './assets/js/pages/profil.js',
  './assets/js/pages/qobilah.js',
  './assets/js/pages/kegiatan.js',
  './assets/js/pages/keuangan.js',
  './assets/js/pages/skt-tkt.js',
  './assets/js/pages/inventaris.js',
  './assets/js/pages/kartu-anggota.js',
  './assets/js/pages/pengguna.js',
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

  // Network-first untuk semua request: selalu coba ambil versi terbaru dulu.
  // Kalau gagal (offline / server tidak terjangkau), baru pakai cache sebagai fallback.
  event.respondWith(
    fetch(req)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req))
  );
});
