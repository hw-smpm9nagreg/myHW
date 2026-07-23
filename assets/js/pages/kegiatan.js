/**
 * pages/kegiatan.js - Modul Kegiatan
 */
Auth.requireAuth();

let allKegiatan = [];

const statusBadge = {
  rencana: 'bg-sky-50 text-sky-600',
  berlangsung: 'bg-amber-50 text-amber-600',
  selesai: 'bg-emerald-50 text-emerald-600',
};
const statusLabel = { rencana: 'Rencana', berlangsung: 'Berlangsung', selesai: 'Selesai' };

async function loadKegiatan() {
  const list = document.getElementById('kegiatanList');
  UI.skeletonCards(list, 3, 'h-24');
  try {
    const result = await Api.get('getKegiatan');
    allKegiatan = result.success ? result.data : [];
    allKegiatan.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    renderList(allKegiatan);
  } catch (err) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function renderList(data) {
  const list = document.getElementById('kegiatanList');
  if (!data.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-calendar-xmark text-2xl mb-2 block"></i>Belum ada kegiatan</p>`;
    return;
  }
  list.innerHTML = data.map(k => `
    <div class="card-soft p-4">
      <div class="flex items-start gap-3">
        <div class="w-14 h-14 rounded-2xl overflow-hidden shrink-0 bg-teal-50 flex items-center justify-center text-primary">
          ${k.fotoUrl ? `<img src="${k.fotoUrl}" class="w-full h-full object-cover" />` : '<i class="fa-solid fa-image text-lg"></i>'}
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="font-semibold text-slate-800 text-sm truncate">${k.nama}</p>
            <span class="text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${statusBadge[k.status] || 'bg-slate-100 text-slate-500'}">${statusLabel[k.status] || k.status || '-'}</span>
          </div>
          <p class="text-xs text-slate-500 mt-0.5"><i class="fa-solid fa-calendar-day mr-1"></i>${UI.formatDate(k.tanggal)}</p>
          <p class="text-xs text-slate-500"><i class="fa-solid fa-location-dot mr-1"></i>${k.lokasi || '-'} &middot; ${k.jenis || '-'}</p>
        </div>
        <div class="flex flex-col gap-1.5 shrink-0">
          <button onclick="editKegiatan('${k.id}')" class="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center"><i class="fa-solid fa-pen text-xs"></i></button>
          <button onclick="deleteKegiatan('${k.id}')" class="w-8 h-8 rounded-lg bg-red-50 text-[var(--color-danger)] flex items-center justify-center"><i class="fa-solid fa-trash text-xs"></i></button>
        </div>
      </div>
      <div class="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 text-xs">
        ${k.proposalUrl ? `<a href="${k.proposalUrl}" target="_blank" class="text-primary font-medium"><i class="fa-solid fa-file-lines mr-1"></i>Proposal</a>` : '<span class="text-slate-300"><i class="fa-solid fa-file-lines mr-1"></i>Proposal</span>'}
        ${k.lpjUrl ? `<a href="${k.lpjUrl}" target="_blank" class="text-primary font-medium"><i class="fa-solid fa-file-invoice mr-1"></i>LPJ</a>` : '<span class="text-slate-300"><i class="fa-solid fa-file-invoice mr-1"></i>LPJ</span>'}
        <span class="ml-auto text-slate-400"><i class="fa-solid fa-users mr-1"></i>${k.pesertaCount || 0} peserta</span>
      </div>
    </div>
  `).join('');
}

function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const jenis = document.getElementById('filterJenis').value;
  renderList(allKegiatan.filter(k => {
    const matchQ = !q || k.nama.toLowerCase().includes(q);
    const matchJenis = !jenis || k.jenis === jenis;
    return matchQ && matchJenis;
  }));
}
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('filterJenis').addEventListener('change', applyFilters);

// ------------------------------------------------------------------
// Form
// ------------------------------------------------------------------
const formModal = document.getElementById('formModal');
document.getElementById('btnAdd').addEventListener('click', () => openForm());
document.getElementById('btnCloseForm').addEventListener('click', () => formModal.classList.add('hidden'));

function openForm(data = null) {
  document.getElementById('kegiatanForm').reset();
  document.getElementById('formTitle').textContent = data ? 'Edit Kegiatan' : 'Tambah Kegiatan';
  document.getElementById('f_id').value = data ? data.id : '';
  document.getElementById('f_nama').value = data ? data.nama : '';
  document.getElementById('f_jenis').value = data ? data.jenis : 'Latihan Rutin';
  document.getElementById('f_tanggal').value = data && data.tanggal ? String(data.tanggal).slice(0, 10) : '';
  document.getElementById('f_lokasi').value = data ? data.lokasi : '';
  document.getElementById('f_deskripsi').value = data ? data.deskripsi : '';
  document.getElementById('f_pesertaCount').value = data ? data.pesertaCount : '';
  document.getElementById('f_status').value = data ? data.status : 'rencana';
  formModal.classList.remove('hidden');
}

function editKegiatan(id) {
  const data = allKegiatan.find(k => k.id === id);
  if (data) openForm(data);
}

async function deleteKegiatan(id) {
  const ok = await UI.confirm('Data kegiatan akan dihapus permanen.', 'Hapus Kegiatan?');
  if (!ok) return;
  UI.loading('Menghapus...');
  try {
    const result = await Api.post('deleteKegiatan', { id });
    UI.closeLoading();
    if (result.success) { UI.toast('Kegiatan dihapus'); loadKegiatan(); }
    else UI.toast(result.message || 'Gagal menghapus', 'error');
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

document.getElementById('kegiatanForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('f_id').value;
  const payload = {
    id: id || undefined,
    nama: document.getElementById('f_nama').value,
    jenis: document.getElementById('f_jenis').value,
    tanggal: document.getElementById('f_tanggal').value,
    lokasi: document.getElementById('f_lokasi').value,
    deskripsi: document.getElementById('f_deskripsi').value,
    pesertaCount: document.getElementById('f_pesertaCount').value,
    status: document.getElementById('f_status').value,
  };

  UI.loading('Menyimpan data...');
  try {
    const proposalFile = document.getElementById('f_proposal').files[0];
    const lpjFile = document.getElementById('f_lpj').files[0];
    const fotoFile = document.getElementById('f_foto').files[0];

    if (proposalFile) {
      const r = await Api.uploadFile(proposalFile, 'myHW-kegiatan-proposal');
      if (r.success) payload.proposalUrl = r.data.url;
    }
    if (lpjFile) {
      const r = await Api.uploadFile(lpjFile, 'myHW-kegiatan-lpj');
      if (r.success) payload.lpjUrl = r.data.url;
    }
    if (fotoFile) {
      const r = await Api.uploadFile(fotoFile, 'myHW-kegiatan-dokumentasi');
      if (r.success) payload.fotoUrl = r.data.url;
    }

    const result = await Api.post(id ? 'updateKegiatan' : 'addKegiatan', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast(id ? 'Kegiatan diperbarui' : 'Kegiatan baru ditambahkan');
      formModal.classList.add('hidden');
      loadKegiatan();
    } else {
      UI.toast(result.message || 'Gagal menyimpan data', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

window.editKegiatan = editKegiatan;
window.deleteKegiatan = deleteKegiatan;

loadKegiatan();
