/**
 * pages/anggota.js - Modul Anggota (CRUD lengkap)
 */
Auth.requireAuth();

const PAGE_SIZE = 10;
let allData = [];
let filteredData = [];
let currentPage = 1;
let fotoBase64 = null;
let qobilahOptions = [];

// ------------------------------------------------------------------
// Load data
// ------------------------------------------------------------------
async function loadAnggota() {
  const list = document.getElementById('anggotaList');
  UI.skeletonCards(list, 4, 'h-20');
  try {
    const [anggotaRes, qobilahRes] = await Promise.all([
      Api.get('getAnggota'),
      Api.get('getQobilah'),
    ]);
    allData = anggotaRes.success ? anggotaRes.data : [];
    qobilahOptions = qobilahRes.success ? qobilahRes.data : [];
    populateQobilahSelect();
    applyFilters();
  } catch (err) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function populateQobilahSelect() {
  const sel = document.getElementById('f_qobilahId');
  sel.innerHTML = '<option value="">- Pilih Qobilah -</option>' +
    qobilahOptions.map(q => `<option value="${q.id}">${q.nama}</option>`).join('');
}

function qobilahName(id) {
  const q = qobilahOptions.find(q => q.id === id);
  return q ? q.nama : '-';
}

// ------------------------------------------------------------------
// Filters / search / pagination
// ------------------------------------------------------------------
function applyFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const golongan = document.getElementById('filterGolongan').value;
  const status = document.getElementById('filterStatus').value;

  filteredData = allData.filter(a => {
    const matchQ = !q || `${a.nama} ${a.nomorAnggota}`.toLowerCase().includes(q);
    const matchGolongan = !golongan || a.golongan === golongan;
    const matchStatus = !status || a.status === status;
    return matchQ && matchGolongan && matchStatus;
  });
  currentPage = 1;
  renderList();
}

document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('filterGolongan').addEventListener('change', applyFilters);
document.getElementById('filterStatus').addEventListener('change', applyFilters);
document.getElementById('btnFilter').addEventListener('click', () => {
  document.getElementById('filterPanel').classList.toggle('hidden');
});

// ------------------------------------------------------------------
// Render
// ------------------------------------------------------------------
function renderList() {
  const list = document.getElementById('anggotaList');
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageData = filteredData.slice(start, start + PAGE_SIZE);

  if (!pageData.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-user-slash text-2xl mb-2 block"></i>Belum ada data anggota</p>`;
  } else {
    list.innerHTML = pageData.map(a => `
      <div class="card-soft p-3.5 flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-teal-50 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
          ${a.fotoUrl ? `<img src="${a.fotoUrl}" class="w-full h-full object-cover" />` : (a.nama || '?').charAt(0).toUpperCase()}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-800 text-sm truncate">${a.nama || '-'}</p>
          <p class="text-xs text-slate-500 truncate">${a.nomorAnggota || '-'} &middot; ${a.golongan || '-'} &middot; ${qobilahName(a.qobilahId)}</p>
        </div>
        <span class="text-[10px] font-semibold px-2 py-1 rounded-full ${a.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}">
          ${a.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
        </span>
        <div class="flex flex-col gap-1.5 shrink-0">
          <button onclick="openDetail('${a.id}')" class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><i class="fa-solid fa-qrcode text-xs"></i></button>
          <button onclick="editAnggota('${a.id}')" class="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center"><i class="fa-solid fa-pen text-xs"></i></button>
        </div>
      </div>
    `).join('');
  }

  renderPagination();
}

function renderPagination() {
  const totalPages = Math.max(1, Math.ceil(filteredData.length / PAGE_SIZE));
  const el = document.getElementById('pagination');
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  let html = '';
  for (let i = 1; i <= totalPages; i++) {
    html += `<button onclick="goToPage(${i})" class="w-8 h-8 rounded-lg text-xs font-semibold ${i === currentPage ? 'bg-primary text-white' : 'bg-white text-slate-500 border border-slate-200'}">${i}</button>`;
  }
  el.innerHTML = html;
}

function goToPage(p) {
  currentPage = p;
  renderList();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ------------------------------------------------------------------
// Form (add / edit)
// ------------------------------------------------------------------
const formModal = document.getElementById('formModal');

document.getElementById('btnAdd').addEventListener('click', () => openForm());
document.getElementById('btnCloseForm').addEventListener('click', () => formModal.classList.add('hidden'));

function openForm(data = null) {
  document.getElementById('anggotaForm').reset();
  fotoBase64 = null;
  document.getElementById('fotoPreview').innerHTML = '<i class="fa-solid fa-camera"></i>';
  document.getElementById('formTitle').textContent = data ? 'Edit Anggota' : 'Tambah Anggota';
  document.getElementById('f_id').value = data ? data.id : '';

  if (data) {
    document.getElementById('f_nomorAnggota').value = data.nomorAnggota || '';
    document.getElementById('f_nama').value = data.nama || '';
    document.getElementById('f_tempatLahir').value = data.tempatLahir || '';
    document.getElementById('f_tanggalLahir').value = data.tanggalLahir ? String(data.tanggalLahir).slice(0, 10) : '';
    document.getElementById('f_alamat').value = data.alamat || '';
    document.getElementById('f_noHp').value = data.noHp || '';
    document.getElementById('f_email').value = data.email || '';
    document.getElementById('f_jenisKelamin').value = data.jenisKelamin || 'L';
    document.getElementById('f_golongan').value = data.golongan || 'Athfal';
    document.getElementById('f_qobilahId').value = data.qobilahId || '';
    document.getElementById('f_status').value = data.status || 'aktif';
    if (data.fotoUrl) document.getElementById('fotoPreview').innerHTML = `<img src="${data.fotoUrl}" class="w-full h-full object-cover" />`;
  }
  formModal.classList.remove('hidden');
}

function editAnggota(id) {
  const data = allData.find(a => a.id === id);
  if (data) openForm(data);
}

document.getElementById('f_foto').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    document.getElementById('fotoPreview').innerHTML = `<img src="${reader.result}" class="w-full h-full object-cover" />`;
  };
  reader.readAsDataURL(file);
});

document.getElementById('anggotaForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('f_id').value;
  const payload = {
    id: id || undefined,
    nomorAnggota: document.getElementById('f_nomorAnggota').value,
    nama: document.getElementById('f_nama').value,
    tempatLahir: document.getElementById('f_tempatLahir').value,
    tanggalLahir: document.getElementById('f_tanggalLahir').value,
    alamat: document.getElementById('f_alamat').value,
    noHp: document.getElementById('f_noHp').value,
    email: document.getElementById('f_email').value,
    jenisKelamin: document.getElementById('f_jenisKelamin').value,
    golongan: document.getElementById('f_golongan').value,
    qobilahId: document.getElementById('f_qobilahId').value,
    status: document.getElementById('f_status').value,
    qrCode: id ? undefined : `HW-${Date.now()}`,
  };

  UI.loading('Menyimpan data...');
  try {
    const fotoFile = document.getElementById('f_foto').files[0];
    if (fotoFile) {
      const uploadRes = await Api.uploadFile(fotoFile, 'myHW-foto-anggota');
      if (uploadRes.success) payload.fotoUrl = uploadRes.data.url;
    }
    const result = await Api.post(id ? 'updateAnggota' : 'addAnggota', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast(id ? 'Data anggota diperbarui' : 'Anggota baru ditambahkan');
      formModal.classList.add('hidden');
      loadAnggota();
    } else {
      UI.toast(result.message || 'Gagal menyimpan data', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

// ------------------------------------------------------------------
// Detail / QR modal
// ------------------------------------------------------------------
const detailModal = document.getElementById('detailModal');
document.getElementById('btnCloseDetail').addEventListener('click', () => detailModal.classList.add('hidden'));

function openDetail(id) {
  const data = allData.find(a => a.id === id);
  if (!data) return;
  document.getElementById('detailNama').textContent = data.nama;
  document.getElementById('detailNomor').textContent = data.nomorAnggota;
  document.getElementById('qrCodeCanvas').innerHTML =
    `<img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(data.qrCode || data.id)}" class="w-40 h-40" />`;
  detailModal.classList.remove('hidden');
}

document.getElementById('btnPrintCard').addEventListener('click', () => window.print());

// ------------------------------------------------------------------
// Export Excel
// ------------------------------------------------------------------
document.getElementById('btnExport').addEventListener('click', () => {
  if (!filteredData.length) return UI.toast('Tidak ada data untuk diekspor', 'warning');
  const rows = filteredData.map(a => ({
    'Nomor Anggota': a.nomorAnggota,
    'Nama': a.nama,
    'Golongan': a.golongan,
    'Qobilah': qobilahName(a.qobilahId),
    'Status': a.status,
    'No HP': a.noHp,
    'Email': a.email,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Anggota');
  XLSX.writeFile(wb, `Data_Anggota_myHW_${new Date().toISOString().slice(0, 10)}.xlsx`);
});

// expose to inline handlers
window.editAnggota = editAnggota;
window.openDetail = openDetail;
window.goToPage = goToPage;

loadAnggota();
