/**
 * pages/laporan.js - Pusat Laporan & Export
 */
Auth.requireRole('admin', 'pembina', 'bendahara');

const session = Auth.getSession();
let qobilahCache = null;

async function getQobilahName(id) {
  if (!id) return '-';
  if (!qobilahCache) {
    try {
      const result = await Api.get('getQobilah');
      qobilahCache = result.success ? result.data : [];
    } catch (err) {
      qobilahCache = [];
    }
  }
  const q = qobilahCache.find(q => q.id === id);
  return q ? q.nama : '-';
}

const REPORTS = [
  {
    key: 'anggota', title: 'Laporan Anggota', icon: 'fa-users', color: 'bg-teal-50 text-primary',
    roles: ['admin', 'pembina'], action: 'getAnggota',
    columns: async (rows) => Promise.all(rows.map(async a => ({
      'Nomor Anggota': a.nomorAnggota || '(menunggu ACC)',
      'Nama': a.nama,
      'Tingkatan': a.golongan,
      'Qobilah': await getQobilahName(a.qobilahId),
      'Status': a.status,
      'No HP': a.noHp,
      'Email': a.email,
    }))),
  },
  {
    key: 'kegiatan', title: 'Laporan Kegiatan', icon: 'fa-calendar-days', color: 'bg-sky-50 text-sky-500',
    roles: ['admin', 'pembina'], action: 'getKegiatan', dateField: 'tanggal',
    columns: (rows) => rows.map(k => ({
      'Nama Kegiatan': k.nama, 'Jenis': k.jenis, 'Tanggal': UI.formatDate(k.tanggal),
      'Lokasi': k.lokasi, 'Peserta': k.pesertaCount, 'Status': k.status,
    })),
  },
  {
    key: 'absensi', title: 'Laporan Absensi', icon: 'fa-clipboard-check', color: 'bg-emerald-50 text-emerald-500',
    roles: ['admin', 'pembina'], action: 'getAbsensi', dateField: 'tanggal',
    columns: async (rows) => {
      const anggotaRes = await Api.get('getAnggota');
      const anggota = anggotaRes.success ? anggotaRes.data : [];
      const nameOf = (id) => (anggota.find(a => a.id === id) || {}).nama || '-';
      return rows.map(r => ({
        'Tanggal': UI.formatDate(r.tanggal), 'Nama': nameOf(r.anggotaId),
        'Status': r.status, 'Metode': r.metode === 'qr' ? 'QR Code' : 'Manual', 'Keterangan': r.keterangan,
      }));
    },
  },
  {
    key: 'inventaris', title: 'Laporan Inventaris', icon: 'fa-boxes-stacked', color: 'bg-orange-50 text-orange-500',
    roles: ['admin', 'pembina'], action: 'getInventaris',
    columns: (rows) => rows.map(b => ({
      'Nama Barang': b.namaBarang, 'Kategori': b.kategori, 'Lokasi': b.lokasi,
      'Jumlah': b.jumlah, 'Kondisi': b.kondisi,
    })),
  },
  {
    key: 'keuangan', title: 'Laporan Keuangan', icon: 'fa-sack-dollar', color: 'bg-lime-50 text-lime-600',
    roles: ['admin', 'pembina', 'bendahara'], action: 'getKeuangan', dateField: 'tanggal',
    columns: (rows) => rows.map(k => ({
      'Tanggal': UI.formatDate(k.tanggal), 'Jenis': k.jenis === 'masuk' ? 'Kas Masuk' : 'Kas Keluar',
      'Kategori': k.kategori, 'Jumlah': Number(k.jumlah) || 0, 'Keterangan': k.keterangan,
    })),
  },
  {
    key: 'prestasi', title: 'Laporan Prestasi', icon: 'fa-trophy', color: 'bg-yellow-50 text-yellow-500',
    roles: ['admin', 'pembina'], action: 'getPrestasi', dateField: 'tanggal',
    columns: async (rows) => {
      const anggotaRes = await Api.get('getAnggota');
      const anggota = anggotaRes.success ? anggotaRes.data : [];
      const nameOf = (id) => (anggota.find(a => a.id === id) || {}).nama || '-';
      return rows.map(p => ({
        'Nama Anggota': nameOf(p.anggotaId), 'Nama Lomba': p.namaLomba, 'Tingkat': p.tingkat,
        'Juara': p.juara, 'Tanggal': UI.formatDate(p.tanggal),
      }));
    },
  },
];

function renderList() {
  const list = document.getElementById('reportList');
  const visible = REPORTS.filter(r => r.roles.some(role => Auth.hasRole(role)));
  list.innerHTML = visible.map(r => `
    <div class="card-soft p-4 flex items-center gap-3">
      <div class="menu-icon w-11 h-11 text-base shrink-0 ${r.color}"><i class="fa-solid ${r.icon}"></i></div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-slate-800 text-sm">${r.title}</p>
        <p class="text-xs text-slate-400">${r.dateField ? 'Bisa difilter rentang tanggal' : 'Seluruh data'}</p>
      </div>
      <button onclick="exportReport('${r.key}')" class="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0"><i class="fa-solid fa-file-excel"></i></button>
    </div>
  `).join('');
}
renderList();

async function exportReport(key) {
  const config = REPORTS.find(r => r.key === key);
  if (!config) return;

  UI.loading(`Menyiapkan ${config.title}...`);
  try {
    const result = await Api.get(config.action);
    if (!result.success) {
      UI.closeLoading();
      return UI.toast(result.message || 'Gagal mengambil data', 'error');
    }

    let rows = result.data;
    if (config.dateField) {
      const mulai = document.getElementById('filterMulai').value;
      const akhir = document.getElementById('filterAkhir').value;
      rows = rows.filter(r => {
        const tgl = r[config.dateField];
        if (!tgl) return !mulai && !akhir;
        if (mulai && tgl < mulai) return false;
        if (akhir && tgl > akhir) return false;
        return true;
      });
    }

    if (!rows.length) {
      UI.closeLoading();
      return UI.toast('Tidak ada data untuk rentang/kategori ini', 'warning');
    }

    const exportRows = await config.columns(rows);
    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, config.title.replace('Laporan ', ''));
    XLSX.writeFile(wb, `${config.title.replace(/\s+/g, '_')}_myHW_${new Date().toISOString().slice(0, 10)}.xlsx`);

    UI.closeLoading();
    UI.toast(`${config.title} berhasil diunduh`);
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

window.exportReport = exportReport;
