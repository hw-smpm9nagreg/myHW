/**
 * pwa.js - Registrasi Service Worker + terapkan preferensi Mode Gelap secara global
 * Set window.PWA_SW_PATH dan window.PWA_SCOPE sebelum memuat script ini
 * (path relatif berbeda untuk halaman di root vs di dalam folder pages/).
 */

// Mode Gelap disimpan di localStorage (diatur dari halaman Pengaturan atau Profil),
// diterapkan di sini supaya berlaku konsisten di semua halaman, bukan cuma satu halaman.
if (localStorage.getItem('myhw_dark') === '1') {
  document.body.classList.add('dark');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const swPath = window.PWA_SW_PATH || 'sw.js';
    const scope = window.PWA_SCOPE || './';
    navigator.serviceWorker.register(swPath, { scope })
      .catch((err) => console.warn('Registrasi Service Worker gagal:', err));
  });
}
