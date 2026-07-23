/**
 * pages/inventaris.js - Modul Inventaris
 */
Auth.requireAuth();

let allBarang = [];
let allPeminjaman = [];
let allAnggota = [];
let activeTab = 'barang';

const kondisiLabel = { baik: 'Baik', rusak_ringan: 'Rusak Ringan', rusak_berat: 'Rusak Berat' };
const kondisiBadge = { baik: 'bg-emerald-50 text-emerald-600', rusak_ringan: 'bg-amber-50 text-amber-600', rusak_berat: 'bg-red-50 text-[var(--color-danger)]' };

// ------------------------------------------------------------------
// Load
// ------------------------------------------------------------------
async function loadAll() {
  UI.skeletonCards(document.getElementById('barangList'), 3, 'h-20');
  try {
    const [barangRes, peminjamanRes, anggotaRes] = await Promise.all([
      Api.get('getInventaris'),
      Api.get('getPeminjaman'),
      Api.get('getAnggota'),
    ]);
    allBarang = barangRes.success ? barangRes.data : [];
    allPeminjaman = peminjamanRes.success ? peminjamanRes.data : [];
    allAnggota = anggotaRes.success ? anggotaRes.data : [];
    document.getElementById('p_anggotaId').innerHTML = allAnggota.map(a => `<option value="${a.id}">${a.nama}</option>`).join('');
    applyBarangFilters();
    renderPeminjaman();
  } catch (err) {
    document.getElementById('barangList').innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function anggotaName(id) {
  const a = allAnggota.find(a => a.id === id);
  return a ? a.nama : '-';
}
function barangName(id) {
  const b = allBarang.find(b => b.id === id);
  return b ? b.namaBarang : '-';
}

// ------------------------------------------------------------------
// Tabs
// ------------------------------------------------------------------
function setTab(tab) {
  activeTab = tab;
  document.getElementById('panelBarang').classList.toggle('hidden', tab !== 'barang');
  document.getElementById('panelPeminjaman').classList.toggle('hidden', tab !== 'peminjaman');
  document.getElementById('tabBarang').className = 'tab-btn flex-1 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold ' +
    (tab === 'barang' ? 'bg-primary text-white' : 'text-slate-500');
  document.getElementById('tabPeminjaman').className = 'tab-btn flex-1 py-2.5 rounded-[var(--radius-sm)] text-sm font-semibold ' +
    (tab === 'peminjaman' ? 'bg-primary text-white' : 'text-slate-500');
  document.getElementById('btnAdd').innerHTML = tab === 'barang' ? '<i class="fa-solid fa-plus"></i>' : '<i class="fa-solid fa-qrcode"></i>';
}
document.getElementById('tabBarang').addEventListener('click', () => setTab('barang'));
document.getElementById('tabPeminjaman').addEventListener('click', () => setTab('peminjaman'));
setTab('barang');

// ------------------------------------------------------------------
// Barang list
// ------------------------------------------------------------------
function applyBarangFilters() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const kategori = document.getElementById('filterKategori').value;
  const filtered = allBarang.filter(b =>
    (!q || b.namaBarang.toLowerCase().includes(q)) && (!kategori || b.kategori === kategori)
  );
  renderBarang(filtered);
}
document.getElementById('searchInput').addEventListener('input', applyBarangFilters);
document.getElementById('filterKategori').addEventListener('change', applyBarangFilters);

function renderBarang(data) {
  const list = document.getElementById('barangList');
  if (!data.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-boxes-stacked text-2xl mb-2 block"></i>Belum ada data barang</p>`;
    return;
  }
  list.innerHTML = data.map(b => `
    <div class="card-soft p-3.5 flex items-center gap-3">
      <div class="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-orange-500 shrink-0 overflow-hidden">
        ${b.fotoUrl ? `<img src="${b.fotoUrl}" class="w-full h-full object-cover" />` : '<i class="fa-solid fa-box"></i>'}
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-slate-800 text-sm truncate">${b.namaBarang}</p>
        <p class="text-xs text-slate-500 truncate">${b.kategori || '-'} &middot; ${b.lokasi || '-'} &middot; Jml: ${b.jumlah || 0}</p>
      </div>
      <span class="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${kondisiBadge[b.kondisi] || 'bg-slate-100 text-slate-500'}">${kondisiLabel[b.kondisi] || b.kondisi || '-'}</span>
      <div class="flex flex-col gap-1.5 shrink-0">
        <button onclick="openDetail('${b.id}')" class="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center"><i class="fa-solid fa-qrcode text-xs"></i></button>
        <button onclick="editBarang('${b.id}')" class="w-8 h-8 rounded-lg bg-teal-50 text-primary flex items-center justify-center"><i class="fa-solid fa-pen text-xs"></i></button>
      </div>
    </div>
  `).join('');
}

// ------------------------------------------------------------------
// Peminjaman list
// ------------------------------------------------------------------
function renderPeminjaman() {
  const list = document.getElementById('peminjamanList');
  const sorted = [...allPeminjaman].sort((a, b) => new Date(b.tanggalPinjam) - new Date(a.tanggalPinjam));
  if (!sorted.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-clock-rotate-left text-2xl mb-2 block"></i>Belum ada riwayat peminjaman</p>`;
    return;
  }
  list.innerHTML = sorted.map(p => `
    <div class="card-soft p-4">
      <div class="flex items-start justify-between gap-2">
        <div class="min-w-0">
          <p class="font-semibold text-slate-800 text-sm truncate">${barangName(p.inventarisId)}</p>
          <p class="text-xs text-slate-500 mt-0.5">Dipinjam oleh ${anggotaName(p.anggotaId)} &middot; Jml: ${p.jumlah || 1}</p>
        </div>
        <span class="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${p.status === 'dikembalikan' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}">
          ${p.status === 'dikembalikan' ? 'Dikembalikan' : 'Dipinjam'}
        </span>
      </div>
      <p class="text-xs text-slate-500 mt-2"><i class="fa-solid fa-calendar-day mr-1"></i>Pinjam: ${UI.formatDate(p.tanggalPinjam)}
        ${p.tanggalKembaliAktual ? ' &middot; Kembali: ' + UI.formatDate(p.tanggalKembaliAktual) : (p.tanggalKembaliRencana ? ' &middot; Rencana kembali: ' + UI.formatDate(p.tanggalKembaliRencana) : '')}
      </p>
      ${p.status !== 'dikembalikan' ? `<button onclick="kembalikanBarang('${p.id}')" class="w-full mt-3 py-2 rounded-[var(--radius-sm)] bg-teal-50 text-primary text-xs font-semibold"><i class="fa-solid fa-rotate-left mr-1"></i>Tandai Dikembalikan</button>` : ''}
    </div>
  `).join('');
}

async function kembalikanBarang(id) {
  const ok = await UI.confirm('Barang akan ditandai sudah dikembalikan.', 'Konfirmasi Pengembalian?');
  if (!ok) return;
  UI.loading('Menyimpan...');
  try {
    const result = await Api.post('kembalikanPeminjaman', { id });
    UI.closeLoading();
    if (result.success) { UI.toast('Barang ditandai dikembalikan'); loadAll(); }
    else UI.toast(result.message || 'Gagal menyimpan', 'error');
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

// ------------------------------------------------------------------
// Form barang
// ------------------------------------------------------------------
const formModal = document.getElementById('formModal');
document.getElementById('btnAdd').addEventListener('click', () => {
  if (activeTab === 'barang') openForm();
  else UI.toast('Pilih barang di tab "Barang" lalu klik ikon QR untuk mencatat peminjaman', 'warning');
});
document.getElementById('btnCloseForm').addEventListener('click', () => formModal.classList.add('hidden'));

function openForm(data = null) {
  document.getElementById('barangForm').reset();
  document.getElementById('fotoPreview').innerHTML = '<i class="fa-solid fa-box"></i>';
  document.getElementById('formTitle').textContent = data ? 'Edit Barang' : 'Tambah Barang';
  document.getElementById('f_id').value = data ? data.id : '';
  document.getElementById('f_namaBarang').value = data ? data.namaBarang : '';
  document.getElementById('f_kategori').value = data ? data.kategori : 'Tenda';
  document.getElementById('f_jumlah').value = data ? data.jumlah : '';
  document.getElementById('f_lokasi').value = data ? data.lokasi : '';
  document.getElementById('f_kondisi').value = data ? data.kondisi : 'baik';
  if (data && data.fotoUrl) document.getElementById('fotoPreview').innerHTML = `<img src="${data.fotoUrl}" class="w-full h-full object-cover" />`;
  formModal.classList.remove('hidden');
}

function editBarang(id) {
  const data = allBarang.find(b => b.id === id);
  if (data) openForm(data);
}

document.getElementById('barangForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('f_id').value;
  const payload = {
    id: id || undefined,
    namaBarang: document.getElementById('f_namaBarang').value,
    kategori: document.getElementById('f_kategori').value,
    jumlah: document.getElementById('f_jumlah').value,
    lokasi: document.getElementById('f_lokasi').value,
    kondisi: document.getElementById('f_kondisi').value,
    qrCode: id ? undefined : `INV-${Date.now()}`,
  };

  UI.loading('Menyimpan barang...');
  try {
    const fotoFile = document.getElementById('f_foto').files[0];
    if (fotoFile) {
      const r = await Api.uploadFile(fotoFile, 'myHW-foto-inventaris');
      if (r.success) payload.fotoUrl = r.data.url;
    }
    const result = await Api.post(id ? 'updateInventaris' : 'addInventaris', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast(id ? 'Data barang diperbarui' : 'Barang baru ditambahkan');
      formModal.classList.add('hidden');
      loadAll();
    } else {
      UI.toast(result.message || 'Gagal menyimpan data', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

// ------------------------------------------------------------------
// Detail / QR + peminjaman shortcut
// ------------------------------------------------------------------
const detailModal = document.getElementById('detailModal');
document.getElementById('btnCloseDetail').addEventListener('click', () => detailModal.classList.add('hidden'));

function openDetail(id) {
  const data = allBarang.find(b => b.id === id);
  if (!data) return;
  document.getElementById('detailNama').textContent = data.namaBarang;
  document.getElementById('detailKategori').textContent = `${data.kategori || '-'} &middot; ${data.lokasi || '-'}`.replace('&middot;', '·');
  document.getElementById('qrCodeCanvas').innerHTML =
    `<img src="https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(data.qrCode || data.id)}" class="w-40 h-40" />`;
  document.getElementById('p_inventarisId').value = data.id;
  detailModal.classList.remove('hidden');
}

document.getElementById('btnPinjam').addEventListener('click', () => {
  detailModal.classList.add('hidden');
  document.getElementById('pinjamForm').reset();
  document.getElementById('p_inventarisId').value = document.getElementById('p_inventarisId').value;
  document.getElementById('pinjamModal').classList.remove('hidden');
});
document.getElementById('btnClosePinjam').addEventListener('click', () => document.getElementById('pinjamModal').classList.add('hidden'));

document.getElementById('pinjamForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    inventarisId: document.getElementById('p_inventarisId').value,
    anggotaId: document.getElementById('p_anggotaId').value,
    jumlah: document.getElementById('p_jumlah').value,
    tanggalKembaliRencana: document.getElementById('p_tanggalKembaliRencana').value,
    catatan: document.getElementById('p_catatan').value,
  };
  UI.loading('Menyimpan peminjaman...');
  try {
    const result = await Api.post('addPeminjaman', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast('Peminjaman tercatat');
      document.getElementById('pinjamModal').classList.add('hidden');
      setTab('peminjaman');
      loadAll();
    } else {
      UI.toast(result.message || 'Gagal mencatat peminjaman', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

// ------------------------------------------------------------------
// Export
// ------------------------------------------------------------------
document.getElementById('btnExport').addEventListener('click', () => {
  if (!allBarang.length) return UI.toast('Tidak ada data untuk diekspor', 'warning');
  const rows = allBarang.map(b => ({
    'Nama Barang': b.namaBarang,
    'Kategori': b.kategori,
    'Lokasi': b.lokasi,
    'Jumlah': b.jumlah,
    'Kondisi': kondisiLabel[b.kondisi] || b.kondisi,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Inventaris');
  XLSX.writeFile(wb, `Data_Inventaris_myHW_${new Date().toISOString().slice(0, 10)}.xlsx`);
});

window.editBarang = editBarang;
window.openDetail = openDetail;
window.kembalikanBarang = kembalikanBarang;

loadAll();
