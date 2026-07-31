/**
 * pages/materi.js - Modul Materi Pembelajaran
 */
Auth.requireAuth();

const session = Auth.getSession();
const canWrite = Auth.hasRole('admin', 'pembina');
let allMateri = [];

if (canWrite) document.getElementById('btnAdd').classList.remove('hidden');

const kategoriIcon = {
  'Kepanduan Dasar': 'fa-compass text-primary bg-teal-50',
  'SKT & TKT': 'fa-award text-rose-500 bg-rose-50',
  'P3K & Kesehatan': 'fa-kit-medical text-red-500 bg-red-50',
  'Tali Temali': 'fa-link text-amber-500 bg-amber-50',
  'Sandi & Isyarat': 'fa-flag text-sky-500 bg-sky-50',
  'Kegiatan Alam': 'fa-mountain-sun text-emerald-500 bg-emerald-50',
  'Lainnya': 'fa-book text-slate-500 bg-slate-100',
};

async function loadMateri() {
  const list = document.getElementById('materiList');
  UI.skeletonCards(list, 4, 'h-16');
  try {
    const result = await Api.get('getMateri');
    allMateri = result.success ? result.data : [];
    allMateri.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    applyFilters();
  } catch (err) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const kategori = document.getElementById('filterKategori').value;
  const filtered = allMateri.filter(m =>
    (!q || (m.judul || '').toLowerCase().includes(q)) && (!kategori || m.kategori === kategori)
  );
  renderList(filtered);
}
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('filterKategori').addEventListener('change', applyFilters);

function renderList(data) {
  const list = document.getElementById('materiList');
  if (!data.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-book-open text-2xl mb-2 block"></i>Belum ada materi</p>`;
    return;
  }
  list.innerHTML = data.map(m => {
    const iconClass = kategoriIcon[m.kategori] || kategoriIcon['Lainnya'];
    const isPdf = (m.fileUrl || '').toLowerCase().includes('.pdf') || true; // fallback: coba preview, iframe akan gagal-aman kalau bukan PDF
    return `
    <div class="card-soft p-3.5">
      <div class="flex items-center gap-3">
        <div class="menu-icon w-11 h-11 text-base shrink-0 ${iconClass}"><i class="fa-solid ${iconClass.split(' ')[0]}"></i></div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-800 text-sm truncate">${m.judul || '-'}</p>
          <p class="text-xs text-slate-500 truncate">${m.kategori || '-'}${m.uploadBy ? ' &middot; ' + m.uploadBy : ''}</p>
        </div>
        <div class="flex gap-1.5 shrink-0">
          <button onclick="previewMateri('${m.id}')" class="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center"><i class="fa-solid fa-eye text-xs"></i></button>
          <a href="${m.fileUrl}" target="_blank" class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><i class="fa-solid fa-download text-xs"></i></a>
          ${canWrite ? `<button onclick="deleteMateri('${m.id}')" class="w-8 h-8 rounded-lg bg-red-50 text-[var(--color-danger)] flex items-center justify-center"><i class="fa-solid fa-trash text-xs"></i></button>` : ''}
        </div>
      </div>
      ${m.deskripsi ? `<p class="text-xs text-slate-500 mt-2.5 pt-2.5 border-t border-slate-100">${m.deskripsi}</p>` : ''}
    </div>
  `;
  }).join('');
}

// ------------------------------------------------------------------
// Preview
// ------------------------------------------------------------------
const previewModal = document.getElementById('previewModal');
function previewMateri(id) {
  const m = allMateri.find(m => m.id === id);
  if (!m) return;
  document.getElementById('previewTitle').textContent = m.judul;
  document.getElementById('previewFrame').src = `https://docs.google.com/viewer?url=${encodeURIComponent(m.fileUrl)}&embedded=true`;
  previewModal.classList.remove('hidden');
}
document.getElementById('btnClosePreview').addEventListener('click', () => {
  previewModal.classList.add('hidden');
  document.getElementById('previewFrame').src = '';
});

// ------------------------------------------------------------------
// Upload (admin/pembina saja)
// ------------------------------------------------------------------
const formModal = document.getElementById('formModal');
document.getElementById('btnAdd').addEventListener('click', () => {
  document.getElementById('materiForm').reset();
  formModal.classList.remove('hidden');
});
document.getElementById('btnCloseForm').addEventListener('click', () => formModal.classList.add('hidden'));

document.getElementById('materiForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const file = document.getElementById('f_file').files[0];
  if (!file) return UI.toast('Pilih file terlebih dahulu', 'error');

  UI.loading('Mengunggah materi...');
  try {
    const uploadResult = await Api.uploadFile(file, 'myHW-materi');
    if (!uploadResult.success) {
      UI.closeLoading();
      return UI.toast('Gagal mengunggah file', 'error');
    }
    const payload = {
      judul: document.getElementById('f_judul').value,
      kategori: document.getElementById('f_kategori').value,
      deskripsi: document.getElementById('f_deskripsi').value,
      fileUrl: uploadResult.data.url,
      uploadBy: session ? (session.nama || session.username) : '',
    };
    const result = await Api.post('addMateri', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast('Materi berhasil diunggah');
      formModal.classList.add('hidden');
      loadMateri();
    } else {
      UI.toast(result.message || 'Gagal menyimpan materi', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

async function deleteMateri(id) {
  if (!canWrite) return;
  const ok = await UI.confirm('Materi akan dihapus permanen.', 'Hapus Materi?');
  if (!ok) return;
  UI.loading('Menghapus...');
  try {
    const result = await Api.post('deleteMateri', { id });
    UI.closeLoading();
    if (result.success) { UI.toast('Materi dihapus'); loadMateri(); }
    else UI.toast(result.message || 'Gagal menghapus', 'error');
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

window.previewMateri = previewMateri;
window.deleteMateri = deleteMateri;

loadMateri();
