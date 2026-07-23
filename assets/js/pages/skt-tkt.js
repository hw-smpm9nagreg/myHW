/**
 * pages/skt-tkt.js - Modul SKT & TKT (Syarat & Tanda Kenaikan Tingkat)
 */
Auth.requireAuth();

let allRecords = [];
let allAnggota = [];

const statusBadge = {
  belum: 'bg-slate-100 text-slate-500',
  proses: 'bg-amber-50 text-amber-600',
  lulus: 'bg-emerald-50 text-emerald-600',
};
const statusLabel = { belum: 'Belum Mulai', proses: 'Dalam Proses', lulus: 'Lulus' };

async function loadData() {
  const list = document.getElementById('sktList');
  UI.skeletonCards(list, 3, 'h-24');
  try {
    const [sktRes, anggotaRes] = await Promise.all([
      Api.get('getSktTkt'),
      Api.get('getAnggota'),
    ]);
    allRecords = sktRes.success ? sktRes.data : [];
    allAnggota = anggotaRes.success ? anggotaRes.data : [];
    populateAnggotaSelects();
    applyFilters();
  } catch (err) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function populateAnggotaSelects() {
  const options = allAnggota.map(a => `<option value="${a.id}">${a.nama}</option>`).join('');
  document.getElementById('filterAnggota').innerHTML = '<option value="">Semua Anggota</option>' + options;
  document.getElementById('f_anggotaId').innerHTML = '<option value="">- Pilih Anggota -</option>' + options;
}

function anggotaName(id) {
  const a = allAnggota.find(a => a.id === id);
  return a ? a.nama : '-';
}

function applyFilters() {
  const anggotaId = document.getElementById('filterAnggota').value;
  const jenis = document.getElementById('filterJenis').value;
  const status = document.getElementById('filterStatus').value;
  const filtered = allRecords.filter(r =>
    (!anggotaId || r.anggotaId === anggotaId) &&
    (!jenis || r.jenis === jenis) &&
    (!status || r.status === status)
  );
  renderList(filtered);
}
document.getElementById('filterAnggota').addEventListener('change', applyFilters);
document.getElementById('filterJenis').addEventListener('change', applyFilters);
document.getElementById('filterStatus').addEventListener('change', applyFilters);

function renderList(data) {
  const list = document.getElementById('sktList');
  if (!data.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-award text-2xl mb-2 block"></i>Belum ada catatan SKT/TKT</p>`;
    return;
  }
  list.innerHTML = data.map(r => `
    <div class="card-soft p-4">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="font-semibold text-slate-800 text-sm truncate">${anggotaName(r.anggotaId)}</p>
          <p class="text-xs text-slate-500 mt-0.5">${r.jenis} &middot; ${r.tingkat}</p>
        </div>
        <span class="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${statusBadge[r.status] || 'bg-slate-100 text-slate-500'}">${statusLabel[r.status] || r.status}</span>
      </div>
      ${r.syarat ? `<p class="text-xs text-slate-500 mt-2">${r.syarat}</p>` : ''}
      <div class="mt-3">
        <div class="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span>Progress</span><span>${r.progress || 0}%</span>
        </div>
        <div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
          <div class="h-full gradient-primary" style="width: ${r.progress || 0}%"></div>
        </div>
      </div>
      <div class="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 text-xs text-slate-500">
        <span>${r.penguji ? `<i class="fa-solid fa-user-tie mr-1"></i>${r.penguji}` : ''} ${r.tanggalUjian ? '&middot; ' + UI.formatDate(r.tanggalUjian) : ''}</span>
        <div class="flex gap-2">
          <button onclick="editRecord('${r.id}')" class="w-7 h-7 rounded-lg bg-teal-50 text-primary flex items-center justify-center"><i class="fa-solid fa-pen text-[10px]"></i></button>
          <button onclick="deleteRecord('${r.id}')" class="w-7 h-7 rounded-lg bg-red-50 text-[var(--color-danger)] flex items-center justify-center"><i class="fa-solid fa-trash text-[10px]"></i></button>
        </div>
      </div>
    </div>
  `).join('');
}

// ------------------------------------------------------------------
// Form
// ------------------------------------------------------------------
const formModal = document.getElementById('formModal');
document.getElementById('btnAdd').addEventListener('click', () => openForm());
document.getElementById('btnCloseForm').addEventListener('click', () => formModal.classList.add('hidden'));

document.getElementById('f_progress').addEventListener('input', (e) => {
  document.getElementById('progressValue').textContent = e.target.value;
});

function openForm(data = null) {
  document.getElementById('sktForm').reset();
  document.getElementById('formTitle').textContent = data ? 'Edit Catatan' : 'Tambah Catatan';
  document.getElementById('f_id').value = data ? data.id : '';
  document.getElementById('f_anggotaId').value = data ? data.anggotaId : '';
  document.getElementById('f_jenis').value = data ? data.jenis : 'SKT';
  document.getElementById('f_tingkat').value = data ? data.tingkat : '';
  document.getElementById('f_syarat').value = data ? data.syarat : '';
  document.getElementById('f_progress').value = data ? (data.progress || 0) : 0;
  document.getElementById('progressValue').textContent = data ? (data.progress || 0) : 0;
  document.getElementById('f_tanggalUjian').value = data && data.tanggalUjian ? String(data.tanggalUjian).slice(0, 10) : '';
  document.getElementById('f_penguji').value = data ? data.penguji : '';
  document.getElementById('f_status').value = data ? data.status : 'belum';
  document.getElementById('f_catatan').value = data ? data.catatan : '';
  formModal.classList.remove('hidden');
}

function editRecord(id) {
  const data = allRecords.find(r => r.id === id);
  if (data) openForm(data);
}

async function deleteRecord(id) {
  const ok = await UI.confirm('Catatan SKT/TKT akan dihapus permanen.', 'Hapus Catatan?');
  if (!ok) return;
  UI.loading('Menghapus...');
  try {
    const result = await Api.post('deleteSktTkt', { id });
    UI.closeLoading();
    if (result.success) { UI.toast('Catatan dihapus'); loadData(); }
    else UI.toast(result.message || 'Gagal menghapus', 'error');
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

document.getElementById('sktForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('f_id').value;
  const payload = {
    id: id || undefined,
    anggotaId: document.getElementById('f_anggotaId').value,
    jenis: document.getElementById('f_jenis').value,
    tingkat: document.getElementById('f_tingkat').value,
    syarat: document.getElementById('f_syarat').value,
    progress: document.getElementById('f_progress').value,
    tanggalUjian: document.getElementById('f_tanggalUjian').value,
    penguji: document.getElementById('f_penguji').value,
    status: document.getElementById('f_status').value,
    catatan: document.getElementById('f_catatan').value,
  };

  UI.loading('Menyimpan catatan...');
  try {
    const result = await Api.post(id ? 'updateSktTkt' : 'addSktTkt', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast(id ? 'Catatan diperbarui' : 'Catatan baru ditambahkan');
      formModal.classList.add('hidden');
      loadData();
    } else {
      UI.toast(result.message || 'Gagal menyimpan catatan', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

window.editRecord = editRecord;
window.deleteRecord = deleteRecord;

loadData();
