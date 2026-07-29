/**
 * pages/surat.js - Modul Surat (Masuk & Keluar)
 */
Auth.requireRole('admin', 'pembina');

let allSurat = [];
let activeTab = 'masuk';

const statusBadge = {
  diterima: 'bg-sky-50 text-sky-600',
  terkirim: 'bg-emerald-50 text-emerald-600',
  draft: 'bg-slate-100 text-slate-500',
};
const statusLabel = { diterima: 'Diterima', terkirim: 'Terkirim', draft: 'Draft' };

async function loadSurat() {
  const list = document.getElementById('suratList');
  UI.skeletonCards(list, 3, 'h-20');
  try {
    const result = await Api.get('getSurat');
    allSurat = result.success ? result.data : [];
    allSurat.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    renderList();
  } catch (err) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function setTab(tab) {
  activeTab = tab;
  document.getElementById('tabMasuk').className = 'tab-btn flex-1 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold ' +
    (tab === 'masuk' ? 'bg-primary text-white' : 'text-slate-500');
  document.getElementById('tabKeluar').className = 'tab-btn flex-1 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold ' +
    (tab === 'keluar' ? 'bg-primary text-white' : 'text-slate-500');
  renderList();
}
document.getElementById('tabMasuk').addEventListener('click', () => setTab('masuk'));
document.getElementById('tabKeluar').addEventListener('click', () => setTab('keluar'));
setTab('masuk');

function renderList() {
  const list = document.getElementById('suratList');
  const filtered = allSurat.filter(s => s.jenis === activeTab);
  if (!filtered.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-envelope-open-text text-2xl mb-2 block"></i>Belum ada surat ${activeTab === 'masuk' ? 'masuk' : 'keluar'}</p>`;
    return;
  }
  list.innerHTML = filtered.map(s => `
    <div class="card-soft p-4">
      <div class="flex items-start gap-3">
        <div class="menu-icon bg-indigo-50 text-indigo-500 w-11 h-11 text-base shrink-0"><i class="fa-solid fa-envelope-open-text"></i></div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-800 text-sm truncate">${s.perihal || '-'}</p>
          <p class="text-xs text-slate-400 font-mono mt-0.5">${s.nomorSurat || '-'}</p>
          <p class="text-xs text-slate-500 mt-0.5">${activeTab === 'masuk' ? 'Dari' : 'Kepada'}: ${s.tujuanAsal || '-'} &middot; ${UI.formatDate(s.tanggal)}</p>
        </div>
        <button onclick="deleteSurat('${s.id}')" class="w-7 h-7 rounded-lg bg-red-50 text-[var(--color-danger)] flex items-center justify-center shrink-0"><i class="fa-solid fa-trash text-[10px]"></i></button>
      </div>
      ${s.fileUrl ? `<a href="${s.fileUrl}" target="_blank" class="inline-flex items-center gap-1 text-xs text-primary font-medium mt-3"><i class="fa-solid fa-file-pdf"></i> Lihat / Unduh File</a>` : '<p class="text-xs text-slate-300 mt-3"><i class="fa-solid fa-file-pdf mr-1"></i>Tanpa file</p>'}
      ${s.kodeVerifikasi ? `<p class="text-[10px] text-emerald-600 font-semibold mt-1.5"><i class="fa-solid fa-circle-check mr-1"></i>Terverifikasi &middot; Kode: ${s.kodeVerifikasi}</p>` : ''}
    </div>
  `).join('');
}

// ------------------------------------------------------------------
// Form
// ------------------------------------------------------------------
const formModal = document.getElementById('formModal');
document.getElementById('btnAdd').addEventListener('click', () => openForm());
document.getElementById('btnCloseForm').addEventListener('click', () => formModal.classList.add('hidden'));

function openForm() {
  document.getElementById('suratForm').reset();
  document.getElementById('f_tanggal').value = new Date().toISOString().slice(0, 10);
  const isKeluar = activeTab === 'keluar';
  document.getElementById('formTitle').textContent = isKeluar ? 'Tambah Surat Keluar' : 'Tambah Surat Masuk';
  document.getElementById('labelTujuanAsal').textContent = isKeluar ? 'Tujuan Surat' : 'Asal Surat';
  document.getElementById('keluarFields').classList.toggle('hidden', !isKeluar);
  document.getElementById('uploadManualField').classList.toggle('hidden', isKeluar);
  formModal.classList.remove('hidden');
}

async function deleteSurat(id) {
  const ok = await UI.confirm('Data surat akan dihapus permanen.', 'Hapus Surat?');
  if (!ok) return;
  UI.loading('Menghapus...');
  try {
    const result = await Api.post('deleteSurat', { id });
    UI.closeLoading();
    if (result.success) { UI.toast('Surat dihapus'); loadSurat(); }
    else UI.toast(result.message || 'Gagal menghapus', 'error');
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

document.getElementById('suratForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const isKeluar = activeTab === 'keluar';
  const payload = {
    jenis: activeTab,
    tujuanAsal: document.getElementById('f_tujuanAsal').value,
    perihal: document.getElementById('f_perihal').value,
    tanggal: document.getElementById('f_tanggal').value,
    status: isKeluar ? 'terkirim' : 'diterima',
  };

  UI.loading(isKeluar ? 'Membuat surat...' : 'Menyimpan surat...');
  try {
    if (isKeluar) {
      payload.isi = document.getElementById('f_isi').value;
      payload.penandatangan = document.getElementById('f_penandatangan').value;

      const generatePdf = document.getElementById('f_generatePdf').checked;
      if (generatePdf) {
        const pdfResult = await Api.post('generateSuratPdf', payload);
        if (pdfResult.success) {
          payload.fileUrl = pdfResult.data.url;
          payload.nomorSurat = pdfResult.data.nomorSurat;
          payload.kodeVerifikasi = pdfResult.data.kodeVerifikasi;
        }
      }
    }

    const manualFile = document.getElementById('f_file').files[0];
    if (manualFile) {
      const r = await Api.uploadFile(manualFile, 'myHW-surat-scan');
      if (r.success) payload.fileUrl = r.data.url;
    }

    // Catatan: backend selalu men-generate ulang nomorSurat resmi saat addSurat dipanggil
    // (lihat addSuratWithNomor di Code.gs), jadi nomor dari generateSuratPdf di atas hanya
    // dipakai untuk teks di dalam PDF - keduanya akan konsisten selama tidak ada surat lain
    // jenis & tahun yang sama tersimpan di antara kedua pemanggilan ini.
    const result = await Api.post('addSurat', payload);

    UI.closeLoading();
    if (result.success) {
      UI.toast('Surat tersimpan' + (result.data && result.data.nomorSurat ? ` (${result.data.nomorSurat})` : ''));
      formModal.classList.add('hidden');
      loadSurat();
    } else {
      UI.toast(result.message || 'Gagal menyimpan surat', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

window.deleteSurat = deleteSurat;

loadSurat();
