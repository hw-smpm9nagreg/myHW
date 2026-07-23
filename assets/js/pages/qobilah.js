/**
 * pages/qobilah.js - Modul Qobilah
 */
Auth.requireAuth();

let allQobilah = [];
let allAnggota = [];

async function loadQobilah() {
  const list = document.getElementById('qobilahList');
  UI.skeletonCards(list, 3, 'h-20');
  try {
    const [qobilahRes, anggotaRes] = await Promise.all([
      Api.get('getQobilah'),
      Api.get('getAnggota'),
    ]);
    allQobilah = qobilahRes.success ? qobilahRes.data : [];
    allAnggota = anggotaRes.success ? anggotaRes.data : [];
    renderList(allQobilah);
  } catch (err) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function memberCount(qobilahId) {
  return allAnggota.filter(a => a.qobilahId === qobilahId).length;
}

function renderList(data) {
  const list = document.getElementById('qobilahList');
  if (!data.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-campground text-2xl mb-2 block"></i>Belum ada data Qobilah</p>`;
    return;
  }
  list.innerHTML = data.map(q => `
    <div class="card-soft p-4 flex items-center gap-3">
      <div class="menu-icon bg-amber-50 text-amber-500 w-12 h-12"><i class="fa-solid fa-campground"></i></div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-slate-800 text-sm truncate">${q.nama}</p>
        <p class="text-xs text-slate-500 truncate">${q.golongan || '-'} &middot; Pembina: ${q.pembina || '-'}</p>
        <p class="text-xs text-primary font-semibold mt-0.5">${memberCount(q.id)} anggota</p>
      </div>
      <button onclick="editQobilah('${q.id}')" class="w-9 h-9 rounded-lg bg-teal-50 text-primary flex items-center justify-center shrink-0"><i class="fa-solid fa-pen text-xs"></i></button>
      <button onclick="deleteQobilah('${q.id}')" class="w-9 h-9 rounded-lg bg-red-50 text-[var(--color-danger)] flex items-center justify-center shrink-0"><i class="fa-solid fa-trash text-xs"></i></button>
    </div>
  `).join('');
}

document.getElementById('searchInput').addEventListener('input', (e) => {
  const q = e.target.value.toLowerCase();
  renderList(allQobilah.filter(x => x.nama.toLowerCase().includes(q)));
});

// ------------------------------------------------------------------
// Form
// ------------------------------------------------------------------
const formModal = document.getElementById('formModal');
document.getElementById('btnAdd').addEventListener('click', () => openForm());
document.getElementById('btnCloseForm').addEventListener('click', () => formModal.classList.add('hidden'));

function openForm(data = null) {
  document.getElementById('qobilahForm').reset();
  document.getElementById('formTitle').textContent = data ? 'Edit Qobilah' : 'Tambah Qobilah';
  document.getElementById('f_id').value = data ? data.id : '';
  document.getElementById('f_nama').value = data ? data.nama : '';
  document.getElementById('f_golongan').value = data ? data.golongan : 'Athfal';
  document.getElementById('f_pembina').value = data ? data.pembina : '';
  formModal.classList.remove('hidden');
}

function editQobilah(id) {
  const data = allQobilah.find(q => q.id === id);
  if (data) openForm(data);
}

async function deleteQobilah(id) {
  const ok = await UI.confirm('Data Qobilah akan dihapus permanen.', 'Hapus Qobilah?');
  if (!ok) return;
  UI.loading('Menghapus...');
  try {
    const result = await Api.post('deleteQobilah', { id });
    UI.closeLoading();
    if (result.success) { UI.toast('Qobilah dihapus'); loadQobilah(); }
    else UI.toast(result.message || 'Gagal menghapus', 'error');
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

document.getElementById('qobilahForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('f_id').value;
  const payload = {
    id: id || undefined,
    nama: document.getElementById('f_nama').value,
    golongan: document.getElementById('f_golongan').value,
    pembina: document.getElementById('f_pembina').value,
  };
  UI.loading('Menyimpan data...');
  try {
    const result = await Api.post(id ? 'updateQobilah' : 'addQobilah', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast(id ? 'Data Qobilah diperbarui' : 'Qobilah baru ditambahkan');
      formModal.classList.add('hidden');
      loadQobilah();
    } else {
      UI.toast(result.message || 'Gagal menyimpan data', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

window.editQobilah = editQobilah;
window.deleteQobilah = deleteQobilah;

loadQobilah();
