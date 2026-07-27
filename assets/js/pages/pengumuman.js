/**
 * pages/pengumuman.js - Modul Pengumuman
 */
Auth.requireAuth();

const session = Auth.getSession();
const canWrite = Auth.hasRole('admin', 'pembina');
let allPengumuman = [];

if (canWrite) document.getElementById('btnAdd').classList.remove('hidden');

async function loadPengumuman() {
  const list = document.getElementById('pengumumanList');
  UI.skeletonCards(list, 3, 'h-28');
  try {
    const result = await Api.get('getPengumuman');
    if (!result.success) {
      list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">${result.message || 'Gagal memuat pengumuman'}</p>`;
      return;
    }
    allPengumuman = result.data.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    renderList();
  } catch (err) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function renderList() {
  const list = document.getElementById('pengumumanList');
  if (!allPengumuman.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-bullhorn text-2xl mb-2 block"></i>Belum ada pengumuman</p>`;
    return;
  }
  list.innerHTML = allPengumuman.map(p => `
    <div class="card-soft p-4">
      <div class="flex items-start gap-3">
        <div class="menu-icon bg-red-50 text-red-500 w-11 h-11 text-base shrink-0"><i class="fa-solid fa-bullhorn"></i></div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-800 text-sm">${p.judul}</p>
          <p class="text-xs text-slate-400 mt-0.5"><i class="fa-solid fa-calendar-day mr-1"></i>${UI.formatDate(p.tanggal)}${p.createdBy ? ' &middot; ' + p.createdBy : ''}</p>
        </div>
        ${canWrite ? `
        <div class="flex flex-col gap-1.5 shrink-0">
          <button onclick="editPengumuman('${p.id}')" class="w-7 h-7 rounded-lg bg-teal-50 text-primary flex items-center justify-center"><i class="fa-solid fa-pen text-[10px]"></i></button>
          <button onclick="deletePengumuman('${p.id}')" class="w-7 h-7 rounded-lg bg-red-50 text-[var(--color-danger)] flex items-center justify-center"><i class="fa-solid fa-trash text-[10px]"></i></button>
        </div>` : ''}
      </div>
      <p class="text-sm text-slate-600 mt-3 whitespace-pre-line">${p.isi || ''}</p>
      ${p.lampiranUrl ? `<a href="${p.lampiranUrl}" target="_blank" class="inline-flex items-center gap-1 text-xs text-primary font-medium mt-3"><i class="fa-solid fa-paperclip"></i> Lihat Lampiran</a>` : ''}
    </div>
  `).join('');
}

// ------------------------------------------------------------------
// Form (admin/pembina saja)
// ------------------------------------------------------------------
const formModal = document.getElementById('formModal');
document.getElementById('btnAdd').addEventListener('click', () => openForm());
document.getElementById('btnCloseForm').addEventListener('click', () => formModal.classList.add('hidden'));

function openForm(data = null) {
  document.getElementById('pengumumanForm').reset();
  document.getElementById('formTitle').textContent = data ? 'Edit Pengumuman' : 'Tambah Pengumuman';
  document.getElementById('f_id').value = data ? data.id : '';
  document.getElementById('f_judul').value = data ? data.judul : '';
  document.getElementById('f_tanggal').value = data && data.tanggal ? String(data.tanggal).slice(0, 10) : new Date().toISOString().slice(0, 10);
  document.getElementById('f_isi').value = data ? data.isi : '';
  formModal.classList.remove('hidden');
}

function editPengumuman(id) {
  if (!canWrite) return;
  const data = allPengumuman.find(p => p.id === id);
  if (data) openForm(data);
}

async function deletePengumuman(id) {
  if (!canWrite) return;
  const ok = await UI.confirm('Pengumuman akan dihapus permanen.', 'Hapus Pengumuman?');
  if (!ok) return;
  UI.loading('Menghapus...');
  try {
    const result = await Api.post('deletePengumuman', { id });
    UI.closeLoading();
    if (result.success) { UI.toast('Pengumuman dihapus'); loadPengumuman(); }
    else UI.toast(result.message || 'Gagal menghapus', 'error');
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

document.getElementById('pengumumanForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('f_id').value;
  const payload = {
    id: id || undefined,
    judul: document.getElementById('f_judul').value,
    tanggal: document.getElementById('f_tanggal').value,
    isi: document.getElementById('f_isi').value,
    createdBy: session ? (session.nama || session.username) : '',
  };

  UI.loading('Menyimpan pengumuman...');
  try {
    const lampiranFile = document.getElementById('f_lampiran').files[0];
    if (lampiranFile) {
      const r = await Api.uploadFile(lampiranFile, 'myHW-lampiran-pengumuman');
      if (r.success) payload.lampiranUrl = r.data.url;
    }
    const result = await Api.post(id ? 'updatePengumuman' : 'addPengumuman', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast(id ? 'Pengumuman diperbarui' : 'Pengumuman baru ditambahkan');
      formModal.classList.add('hidden');
      loadPengumuman();
    } else {
      UI.toast(result.message || 'Gagal menyimpan pengumuman', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

window.editPengumuman = editPengumuman;
window.deletePengumuman = deletePengumuman;

loadPengumuman();
