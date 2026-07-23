/**
 * pwa.js - Registrasi Service Worker
 * Set window.PWA_SW_PATH dan window.PWA_SCOPE sebelum memuat script ini
 * (path relatif berbeda untuk halaman di root vs di dalam folder pages/).
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = window.PWA_SW_PATH || 'sw.js';
    const scope = window.PWA_SCOPE || './';
    navigator.serviceWorker.register(swPath, { scope })
      .catch((err) => console.warn('Registrasi Service Worker gagal:', err));
  });
}
