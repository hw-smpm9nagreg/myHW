/**
 * pages/absensi.js - Modul Absensi (manual + riwayat gabungan dengan QR)
 */
Auth.requireAuth();

let allAbsensi = [];
let allAnggota = [];
let allKegiatan = [];

const statusLabel = { hadir: 'Hadir', izin: 'Izin', sakit: 'Sakit', alpa: 'Alpa' };
const statusBadge = {
  hadir: 'bg-emerald-50 text-emerald-600',
  izin: 'bg-sky-50 text-sky-600',
  sakit: 'bg-amber-50 text-amber-600',
  alpa: 'bg-red-50 text-[var(--color-danger)]',
};

async function loadData() {
  const list = document.getElementById('absensiList');
  UI.skeletonCards(list, 4, 'h-16');
  try {
    const [absensiRes, anggotaRes, kegiatanRes] = await Promise.all([
      Api.get('getAbsensi'),
      Api.get('getAnggota'),
      Api.get('getKegiatan'),
    ]);
    allAbsensi = absensiRes.success ? absensiRes.data : [];
    allAnggota = anggotaRes.success ? anggotaRes.data : [];
    allKegiatan = kegiatanRes.success ? kegiatanRes.data : [];

    document.getElementById('f_anggotaId').innerHTML = allAnggota.map(a => `<option value="${a.id}">${a.nama}</option>`).join('');
    const kegiatanOptions = allKegiatan.map(k => `<option value="${k.id}">${k.nama}</option>`).join('');
    document.getElementById('f_kegiatanId').innerHTML = '<option value="">- Tanpa Kegiatan (Latihan Rutin) -</option>' + kegiatanOptions;
    document.getElementById('filterKegiatan').innerHTML = '<option value="">Semua Kegiatan</option>' + kegiatanOptions;

    applyFilters();
  } catch (err) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function anggotaName(id) {
  const a = allAnggota.find(a => a.id === id);
  return a ? a.nama : '-';
}
function kegiatanName(id) {
  if (!id) return 'Latihan Rutin';
  const k = allKegiatan.find(k => k.id === id);
  return k ? k.nama : '-';
}

function applyFilters() {
  const tanggal = document.getElementById('filterTanggal').value;
  const kegiatanId = document.getElementById('filterKegiatan').value;
  const status = document.getElementById('filterStatus').value;

  const filtered = allAbsensi.filter(a =>
    (!tanggal || a.tanggal === tanggal) &&
    (!kegiatanId || a.kegiatanId === kegiatanId) &&
    (!status || a.status === status)
  );
  renderList(filtered);
}
document.getElementById('filterTanggal').addEventListener('change', applyFilters);
document.getElementById('filterKegiatan').addEventListener('change', applyFilters);
document.getElementById('filterStatus').addEventListener('change', applyFilters);

function renderList(data) {
  const list = document.getElementById('absensiList');
  const sorted = [...data].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
  if (!sorted.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-clipboard-check text-2xl mb-2 block"></i>Belum ada data kehadiran</p>`;
    return;
  }
  list.innerHTML = sorted.map(a => `
    <div class="card-soft p-3.5 flex items-center gap-3">
      <div class="menu-icon w-10 h-10 text-sm ${statusBadge[a.status] || 'bg-slate-100 text-slate-500'}">
        <i class="fa-solid ${a.metode === 'qr' ? 'fa-qrcode' : 'fa-pen'}"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-slate-800 text-sm truncate">${anggotaName(a.anggotaId)}</p>
        <p class="text-xs text-slate-500 truncate">${UI.formatDate(a.tanggal)} &middot; ${kegiatanName(a.kegiatanId)}${a.waktu ? ' &middot; ' + a.waktu : ''}</p>
      </div>
      <span class="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${statusBadge[a.status] || 'bg-slate-100 text-slate-500'}">${statusLabel[a.status] || a.status}</span>
    </div>
  `).join('');
}

// ------------------------------------------------------------------
// Form
// ------------------------------------------------------------------
const formModal = document.getElementById('formModal');
document.getElementById('btnAdd').addEventListener('click', () => {
  document.getElementById('absensiForm').reset();
  document.getElementById('f_tanggal').value = new Date().toISOString().slice(0, 10);
  formModal.classList.remove('hidden');
});
document.getElementById('btnCloseForm').addEventListener('click', () => formModal.classList.add('hidden'));

document.getElementById('absensiForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    anggotaId: document.getElementById('f_anggotaId').value,
    kegiatanId: document.getElementById('f_kegiatanId').value,
    tanggal: document.getElementById('f_tanggal').value,
    status: document.getElementById('f_status').value,
    keterangan: document.getElementById('f_keterangan').value,
    metode: 'manual',
    waktu: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };

  UI.loading('Menyimpan kehadiran...');
  try {
    const result = await Api.post('addAbsensi', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast('Kehadiran tercatat');
      formModal.classList.add('hidden');
      loadData();
    } else {
      UI.toast(result.message || 'Gagal menyimpan kehadiran', 'error');
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
  if (!allAbsensi.length) return UI.toast('Tidak ada data untuk diekspor', 'warning');
  const rows = allAbsensi.map(a => ({
    'Tanggal': UI.formatDate(a.tanggal),
    'Nama Anggota': anggotaName(a.anggotaId),
    'Kegiatan': kegiatanName(a.kegiatanId),
    'Status': statusLabel[a.status] || a.status,
    'Metode': a.metode === 'qr' ? 'QR Code' : 'Manual',
    'Waktu': a.waktu || '',
    'Keterangan': a.keterangan || '',
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Absensi');
  XLSX.writeFile(wb, `Riwayat_Absensi_myHW_${new Date().toISOString().slice(0, 10)}.xlsx`);
});

loadData();
