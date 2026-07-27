/**
 * pages/prestasi.js - Modul Prestasi
 */
Auth.requireAuth();

const canWrite = Auth.hasRole('admin', 'pembina');
let allPrestasi = [];
let allAnggota = [];

if (!canWrite) document.getElementById('btnAdd').classList.add('hidden');

async function loadData() {
  const list = document.getElementById('prestasiList');
  UI.skeletonCards(list, 3, 'h-24');
  try {
    const [prestasiRes, anggotaRes] = await Promise.all([
      Api.get('getPrestasi'),
      Api.get('getAnggota'),
    ]);
    allPrestasi = prestasiRes.success ? prestasiRes.data : [];
    allAnggota = anggotaRes.success ? anggotaRes.data : [];

    const options = allAnggota.map(a => `<option value="${a.id}">${a.nama}</option>`).join('');
    document.getElementById('filterAnggota').innerHTML = '<option value="">Semua Anggota</option>' + options;
    document.getElementById('f_anggotaId').innerHTML = options;

    applyFilters();
  } catch (err) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function anggotaName(id) {
  const a = allAnggota.find(a => a.id === id);
  return a ? a.nama : '-';
}

function applyFilters() {
  const anggotaId = document.getElementById('filterAnggota').value;
  const tingkat = document.getElementById('filterTingkat').value;
  const filtered = allPrestasi.filter(p => (!anggotaId || p.anggotaId === anggotaId) && (!tingkat || p.tingkat === tingkat));
  renderList(filtered);
}
document.getElementById('filterAnggota').addEventListener('change', applyFilters);
document.getElementById('filterTingkat').addEventListener('change', applyFilters);

function renderList(data) {
  const list = document.getElementById('prestasiList');
  const sorted = [...data].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  if (!sorted.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-trophy text-2xl mb-2 block"></i>Belum ada catatan prestasi</p>`;
    return;
  }
  list.innerHTML = sorted.map(p => `
    <div class="card-soft p-4">
      <div class="flex items-start gap-3">
        <div class="menu-icon bg-yellow-50 text-yellow-500 w-11 h-11 text-base shrink-0"><i class="fa-solid fa-trophy"></i></div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-800 text-sm truncate">${p.namaLomba}</p>
          <p class="text-xs text-slate-500 mt-0.5">${anggotaName(p.anggotaId)} &middot; ${p.tingkat || '-'}</p>
          ${p.tanggal ? `<p class="text-xs text-slate-400 mt-0.5"><i class="fa-solid fa-calendar-day mr-1"></i>${UI.formatDate(p.tanggal)}</p>` : ''}
        </div>
        ${p.juara ? `<span class="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 shrink-0">${p.juara}</span>` : ''}
      </div>
      <div class="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
        ${p.sertifikatUrl ? `<a href="${p.sertifikatUrl}" target="_blank" class="text-primary font-medium"><i class="fa-solid fa-certificate mr-1"></i>Lihat Sertifikat</a>` : '<span class="text-slate-300"><i class="fa-solid fa-certificate mr-1"></i>Tanpa sertifikat</span>'}
        ${canWrite ? `
        <div class="ml-auto flex gap-2">
          <button onclick="deletePrestasi('${p.id}')" class="w-7 h-7 rounded-lg bg-red-50 text-[var(--color-danger)] flex items-center justify-center"><i class="fa-solid fa-trash text-[10px]"></i></button>
        </div>` : ''}
      </div>
    </div>
  `).join('');
}

// ------------------------------------------------------------------
// Form
// ------------------------------------------------------------------
const formModal = document.getElementById('formModal');
document.getElementById('btnAdd').addEventListener('click', () => {
  document.getElementById('prestasiForm').reset();
  document.getElementById('f_id').value = '';
  formModal.classList.remove('hidden');
});
document.getElementById('btnCloseForm').addEventListener('click', () => formModal.classList.add('hidden'));

async function deletePrestasi(id) {
  if (!canWrite) return;
  const ok = await UI.confirm('Catatan prestasi akan dihapus permanen.', 'Hapus Prestasi?');
  if (!ok) return;
  UI.loading('Menghapus...');
  try {
    const result = await Api.post('deletePrestasi', { id });
    UI.closeLoading();
    if (result.success) { UI.toast('Prestasi dihapus'); loadData(); }
    else UI.toast(result.message || 'Gagal menghapus', 'error');
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

document.getElementById('prestasiForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    anggotaId: document.getElementById('f_anggotaId').value,
    namaLomba: document.getElementById('f_namaLomba').value,
    tingkat: document.getElementById('f_tingkat').value,
    juara: document.getElementById('f_juara').value,
    tanggal: document.getElementById('f_tanggal').value,
  };

  UI.loading('Menyimpan prestasi...');
  try {
    const sertifikatFile = document.getElementById('f_sertifikat').files[0];
    if (sertifikatFile) {
      const r = await Api.uploadFile(sertifikatFile, 'myHW-sertifikat-prestasi');
      if (r.success) payload.sertifikatUrl = r.data.url;
    }
    const result = await Api.post('addPrestasi', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast('Prestasi tercatat');
      formModal.classList.add('hidden');
      loadData();
    } else {
      UI.toast(result.message || 'Gagal menyimpan prestasi', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

window.deletePrestasi = deletePrestasi;

loadData();
