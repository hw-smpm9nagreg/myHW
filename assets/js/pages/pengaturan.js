/**
 * pages/pengaturan.js - Pengaturan Aplikasi
 */
Auth.requireAuth();
document.getElementById('year').textContent = new Date().getFullYear();

// ------------------------------------------------------------------
// Mode Gelap
// ------------------------------------------------------------------
const darkToggle = document.getElementById('darkModeToggle');
darkToggle.checked = localStorage.getItem('myhw_dark') === '1';
document.body.classList.toggle('dark', darkToggle.checked);

darkToggle.addEventListener('change', () => {
  localStorage.setItem('myhw_dark', darkToggle.checked ? '1' : '0');
  document.body.classList.toggle('dark', darkToggle.checked);
});

// ------------------------------------------------------------------
// Informasi Organisasi (khusus admin/pembina)
// ------------------------------------------------------------------
if (Auth.hasRole('admin', 'pembina')) {
  document.getElementById('orgSection').classList.remove('hidden');
  loadSettings();
}

async function loadSettings() {
  try {
    const result = await Api.get('getSettings');
    if (result.success) {
      const s = result.data;
      document.getElementById('s_namaOrganisasi').value = s.namaOrganisasi || '';
      document.getElementById('s_subjudulOrganisasi').value = s.subjudulOrganisasi || '';
      document.getElementById('s_alamatSekretariat').value = s.alamatSekretariat || '';
      document.getElementById('s_kontakOrganisasi').value = s.kontakOrganisasi || '';
    }
  } catch (err) {
    // biarkan form kosong jika gagal memuat - tidak menghalangi pengisian baru
  }
}

document.getElementById('orgForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    namaOrganisasi: document.getElementById('s_namaOrganisasi').value,
    subjudulOrganisasi: document.getElementById('s_subjudulOrganisasi').value,
    alamatSekretariat: document.getElementById('s_alamatSekretariat').value,
    kontakOrganisasi: document.getElementById('s_kontakOrganisasi').value,
  };
  UI.loading('Menyimpan pengaturan...');
  try {
    const result = await Api.post('updateSettings', payload);
    UI.closeLoading();
    if (result.success) UI.toast('Pengaturan organisasi disimpan');
    else UI.toast(result.message || 'Gagal menyimpan pengaturan', 'error');
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

// ------------------------------------------------------------------
// Segarkan Cache Aplikasi
// ------------------------------------------------------------------
document.getElementById('btnRefreshCache').addEventListener('click', async () => {
  const ok = await UI.confirm('Aplikasi akan memuat ulang versi terbaru dari server.', 'Segarkan Cache?');
  if (!ok) return;
  UI.loading('Menyegarkan cache...');
  try {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(r => r.unregister()));
    }
    if (window.caches) {
      const keys = await caches.keys();
      await Promise.all(keys.map(k => caches.delete(k)));
    }
  } catch (err) {
    // tetap lanjut reload walau ada bagian yang gagal dibersihkan
  }
  window.location.reload();
});
