/**
 * pages/sertifikat.js - E-Sertifikat milik sendiri
 */
Auth.requireAuth();

async function loadSertifikat() {
  const list = document.getElementById('sertifikatList');
  UI.skeletonCards(list, 3, 'h-20');
  try {
    const result = await Api.get('getMySertifikat');
    const data = result.success ? result.data : [];
    renderList(data);
  } catch (err) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function renderList(data) {
  const list = document.getElementById('sertifikatList');
  if (!data.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-certificate text-2xl mb-2 block"></i>Belum ada sertifikat. Sertifikat akan muncul di sini setelah admin/pembina men-generate-nya untuk kegiatan yang Anda hadiri.</p>`;
    return;
  }
  const sorted = [...data].sort((a, b) => new Date(b.kegiatanTanggal) - new Date(a.kegiatanTanggal));
  list.innerHTML = sorted.map(s => `
    <div class="card-soft p-4 flex items-center gap-3">
      <div class="menu-icon bg-amber-50 text-amber-500 w-12 h-12 shrink-0"><i class="fa-solid fa-certificate"></i></div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-slate-800 text-sm truncate">${s.kegiatanNama}</p>
        <p class="text-xs text-slate-400 truncate">${UI.formatDate(s.kegiatanTanggal)} &middot; ${s.nomorSertifikat}</p>
      </div>
      <a href="${s.fileUrl}" target="_blank" class="btn-primary px-4 py-2.5 text-xs shrink-0"><i class="fa-solid fa-download mr-1"></i>Unduh</a>
    </div>
  `).join('');
}

loadSertifikat();
