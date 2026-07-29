/**
 * pages/dokumen.js - Modul Dokumen
 */
Auth.requireRole('admin', 'pembina');

const session = Auth.getSession();
let allDokumen = [];

const kategoriIcon = {
  'Administrasi': 'fa-folder-open text-slate-500 bg-slate-100',
  'SK & Surat Keputusan': 'fa-gavel text-indigo-500 bg-indigo-50',
  'Formulir': 'fa-file-lines text-sky-500 bg-sky-50',
  'Kegiatan': 'fa-calendar-days text-emerald-500 bg-emerald-50',
  'Lainnya': 'fa-file text-amber-500 bg-amber-50',
};

async function loadDokumen() {
  const list = document.getElementById('dokumenList');
  UI.skeletonCards(list, 4, 'h-16');
  try {
    const result = await Api.get('getDokumen');
    allDokumen = result.success ? result.data : [];
    allDokumen.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    applyFilters();
  } catch (err) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const kategori = document.getElementById('filterKategori').value;
  const filtered = allDokumen.filter(d =>
    (!q || (d.namaFile || '').toLowerCase().includes(q)) && (!kategori || d.kategori === kategori)
  );
  renderList(filtered);
}
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('filterKategori').addEventListener('change', applyFilters);

function renderList(data) {
  const list = document.getElementById('dokumenList');
  if (!data.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-folder-open text-2xl mb-2 block"></i>Belum ada dokumen</p>`;
    return;
  }
  list.innerHTML = data.map(d => {
    const iconClass = kategoriIcon[d.kategori] || kategoriIcon['Lainnya'];
    const isPdf = (d.namaFile || '').toLowerCase().endsWith('.pdf');
    return `
    <div class="card-soft p-3.5 flex items-center gap-3">
      <div class="menu-icon w-11 h-11 text-base shrink-0 ${iconClass}"><i class="fa-solid ${iconClass.split(' ')[0]}"></i></div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5">
          <p class="font-semibold text-slate-800 text-sm truncate">${d.namaFile || '-'}</p>
          ${d.kodeVerifikasi ? '<i class="fa-solid fa-circle-check text-emerald-500 text-xs shrink-0" title="Terverifikasi"></i>' : ''}
        </div>
        <p class="text-xs text-slate-500 truncate">${d.kategori || '-'} &middot; ${UI.formatDate(d.createdAt)}${d.uploadBy ? ' &middot; ' + d.uploadBy : ''}</p>
        ${d.kodeVerifikasi ? `<button onclick="showPengesahan('${d.id}')" class="text-[10px] text-primary font-semibold mt-0.5"><i class="fa-solid fa-stamp mr-0.5"></i>Lembar Pengesahan</button>` : ''}
      </div>
      <div class="flex gap-1.5 shrink-0">
        ${isPdf ? `<button onclick="previewDokumen('${d.id}')" class="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center"><i class="fa-solid fa-eye text-xs"></i></button>` : ''}
        <a href="${d.fileUrl}" target="_blank" class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><i class="fa-solid fa-download text-xs"></i></a>
        <button onclick="deleteDokumen('${d.id}')" class="w-8 h-8 rounded-lg bg-red-50 text-[var(--color-danger)] flex items-center justify-center"><i class="fa-solid fa-trash text-xs"></i></button>
      </div>
    </div>
  `;
  }).join('');
}

function showPengesahan(id) {
  const d = allDokumen.find(d => d.id === id);
  if (!d) return;
  if (d.sertifikatUrl) {
    window.open(d.sertifikatUrl, '_blank');
  } else {
    UI.toast('Kode verifikasi: ' + d.kodeVerifikasi, 'info');
  }
}
window.showPengesahan = showPengesahan;

// ------------------------------------------------------------------
// Preview (Google Docs Viewer untuk PDF)
// ------------------------------------------------------------------
const previewModal = document.getElementById('previewModal');
function previewDokumen(id) {
  const d = allDokumen.find(d => d.id === id);
  if (!d) return;
  document.getElementById('previewTitle').textContent = d.namaFile;
  document.getElementById('previewFrame').src = `https://docs.google.com/viewer?url=${encodeURIComponent(d.fileUrl)}&embedded=true`;
  previewModal.classList.remove('hidden');
}
document.getElementById('btnClosePreview').addEventListener('click', () => {
  previewModal.classList.add('hidden');
  document.getElementById('previewFrame').src = '';
});

// ------------------------------------------------------------------
// Upload
// ------------------------------------------------------------------
const formModal = document.getElementById('formModal');
document.getElementById('btnAdd').addEventListener('click', () => {
  document.getElementById('dokumenForm').reset();
  formModal.classList.remove('hidden');
});
document.getElementById('btnCloseForm').addEventListener('click', () => formModal.classList.add('hidden'));

document.getElementById('dokumenForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('f_file').files[0];
  if (!file) return UI.toast('Pilih file terlebih dahulu', 'error');

  UI.loading('Mengunggah dokumen...');
  try {
    const kategori = document.getElementById('f_kategori').value;
    const uploadBy = session ? (session.nama || session.username) : '';
    const uploadResult = await Api.uploadFile(file, 'myHW-dokumen', {
      withPengesahan: true,
      kategoriPengesahan: kategori,
      uploadBy,
    });
    if (!uploadResult.success) {
      UI.closeLoading();
      return UI.toast('Gagal mengunggah file', 'error');
    }
    const payload = {
      namaFile: document.getElementById('f_namaFile').value || file.name,
      kategori,
      fileUrl: uploadResult.data.url,
      uploadBy,
      kodeVerifikasi: uploadResult.data.kodeVerifikasi || '',
      sertifikatUrl: uploadResult.data.sertifikatUrl || '',
    };
    const result = await Api.post('addDokumen', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast('Dokumen berhasil diunggah');
      formModal.classList.add('hidden');
      loadDokumen();
    } else {
      UI.toast(result.message || 'Gagal menyimpan dokumen', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

async function deleteDokumen(id) {
  const ok = await UI.confirm('Dokumen akan dihapus permanen.', 'Hapus Dokumen?');
  if (!ok) return;
  UI.loading('Menghapus...');
  try {
    const result = await Api.post('deleteDokumen', { id });
    UI.closeLoading();
    if (result.success) { UI.toast('Dokumen dihapus'); loadDokumen(); }
    else UI.toast(result.message || 'Gagal menghapus', 'error');
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

window.previewDokumen = previewDokumen;
window.deleteDokumen = deleteDokumen;

loadDokumen();
