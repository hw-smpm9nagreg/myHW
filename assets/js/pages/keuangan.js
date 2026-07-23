/**
 * pages/keuangan.js - Modul Keuangan
 */
Auth.requireRole('admin', 'bendahara');

const session = Auth.getSession();
let allKeuangan = [];
let chartInstance = null;

async function loadKeuangan() {
  const list = document.getElementById('keuanganList');
  UI.skeletonCards(list, 4, 'h-16');
  try {
    const result = await Api.get('getKeuangan');
    allKeuangan = result.success ? result.data : [];
    allKeuangan.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    renderSummary();
    renderChart();
    applyFilters();
  } catch (err) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function renderSummary() {
  let masuk = 0, keluar = 0;
  allKeuangan.forEach(k => {
    const jumlah = Number(k.jumlah) || 0;
    if (k.jenis === 'masuk') masuk += jumlah; else keluar += jumlah;
  });
  document.getElementById('totalMasuk').textContent = UI.formatCurrency(masuk);
  document.getElementById('totalKeluar').textContent = UI.formatCurrency(keluar);
  document.getElementById('totalSaldo').textContent = UI.formatCurrency(masuk - keluar);
}

function renderChart() {
  const byMonth = {};
  allKeuangan.forEach(k => {
    if (!k.tanggal) return;
    const key = new Date(k.tanggal).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    if (!byMonth[key]) byMonth[key] = { masuk: 0, keluar: 0 };
    const jumlah = Number(k.jumlah) || 0;
    if (k.jenis === 'masuk') byMonth[key].masuk += jumlah; else byMonth[key].keluar += jumlah;
  });
  const labels = Object.keys(byMonth);
  const masukData = labels.map(l => byMonth[l].masuk);
  const keluarData = labels.map(l => byMonth[l].keluar);

  if (chartInstance) chartInstance.destroy();
  chartInstance = new Chart(document.getElementById('keuanganChart'), {
    type: 'bar',
    data: {
      labels: labels.length ? labels : ['-'],
      datasets: [
        { label: 'Masuk', data: masukData.length ? masukData : [0], backgroundColor: '#22C55E', borderRadius: 6, maxBarThickness: 20 },
        { label: 'Keluar', data: keluarData.length ? keluarData : [0], backgroundColor: '#EF4444', borderRadius: 6, maxBarThickness: 20 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, font: { size: 11 } } } },
      scales: { y: { beginAtZero: true, grid: { color: '#F1F5F9' } }, x: { grid: { display: false } } },
    },
  });
}

function applyFilters() {
  const jenis = document.getElementById('filterJenis').value;
  const kategori = document.getElementById('filterKategori').value;
  const filtered = allKeuangan.filter(k => (!jenis || k.jenis === jenis) && (!kategori || k.kategori === kategori));
  renderList(filtered);
}
document.getElementById('filterJenis').addEventListener('change', applyFilters);
document.getElementById('filterKategori').addEventListener('change', applyFilters);

function renderList(data) {
  const list = document.getElementById('keuanganList');
  if (!data.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-sack-dollar text-2xl mb-2 block"></i>Belum ada transaksi</p>`;
    return;
  }
  list.innerHTML = data.map(k => `
    <div class="card-soft p-3.5 flex items-center gap-3">
      <div class="menu-icon w-10 h-10 text-sm ${k.jenis === 'masuk' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-[var(--color-danger)]'}">
        <i class="fa-solid ${k.jenis === 'masuk' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-slate-800 text-sm truncate">${k.kategori || '-'}</p>
        <p class="text-xs text-slate-500 truncate">${UI.formatDate(k.tanggal)}${k.keterangan ? ' &middot; ' + k.keterangan : ''}</p>
      </div>
      <p class="font-bold text-sm shrink-0 ${k.jenis === 'masuk' ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'}">
        ${k.jenis === 'masuk' ? '+' : '-'}${UI.formatCurrency(k.jumlah)}
      </p>
      <button onclick="deleteKeuangan('${k.id}')" class="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><i class="fa-solid fa-trash text-xs"></i></button>
    </div>
  `).join('');
}

// ------------------------------------------------------------------
// Form
// ------------------------------------------------------------------
const formModal = document.getElementById('formModal');
document.getElementById('btnAdd').addEventListener('click', () => openForm());
document.getElementById('btnCloseForm').addEventListener('click', () => formModal.classList.add('hidden'));

document.querySelectorAll('.jenis-btn').forEach(btn => {
  btn.addEventListener('click', () => setJenis(btn.dataset.jenis));
});

function setJenis(jenis) {
  document.getElementById('f_jenis').value = jenis;
  document.querySelectorAll('.jenis-btn').forEach(btn => {
    const active = btn.dataset.jenis === jenis;
    btn.className = 'jenis-btn py-2.5 rounded-[var(--radius-sm)] border font-semibold text-sm ' +
      (active
        ? (jenis === 'masuk' ? 'bg-emerald-50 border-emerald-300 text-emerald-600' : 'bg-red-50 border-red-300 text-[var(--color-danger)]')
        : 'border-slate-200 text-slate-500');
  });
}

function openForm() {
  document.getElementById('keuanganForm').reset();
  document.getElementById('f_id').value = '';
  document.getElementById('f_tanggal').value = new Date().toISOString().slice(0, 10);
  setJenis('masuk');
  formModal.classList.remove('hidden');
}

async function deleteKeuangan(id) {
  const ok = await UI.confirm('Transaksi akan dihapus permanen.', 'Hapus Transaksi?');
  if (!ok) return;
  UI.loading('Menghapus...');
  try {
    const result = await Api.post('deleteKeuangan', { id });
    UI.closeLoading();
    if (result.success) { UI.toast('Transaksi dihapus'); loadKeuangan(); }
    else UI.toast(result.message || 'Gagal menghapus', 'error');
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

document.getElementById('keuanganForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    tanggal: document.getElementById('f_tanggal').value,
    jenis: document.getElementById('f_jenis').value,
    kategori: document.getElementById('f_kategori').value,
    jumlah: document.getElementById('f_jumlah').value,
    keterangan: document.getElementById('f_keterangan').value,
    createdBy: session ? (session.nama || session.username) : '',
  };

  UI.loading('Menyimpan transaksi...');
  try {
    const buktiFile = document.getElementById('f_bukti').files[0];
    if (buktiFile) {
      const r = await Api.uploadFile(buktiFile, 'myHW-bukti-keuangan');
      if (r.success) payload.buktiUrl = r.data.url;
    }
    const result = await Api.post('addKeuangan', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast('Transaksi tersimpan');
      formModal.classList.add('hidden');
      loadKeuangan();
    } else {
      UI.toast(result.message || 'Gagal menyimpan transaksi', 'error');
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
  if (!allKeuangan.length) return UI.toast('Tidak ada data untuk diekspor', 'warning');
  const rows = allKeuangan.map(k => ({
    'Tanggal': UI.formatDate(k.tanggal),
    'Jenis': k.jenis === 'masuk' ? 'Kas Masuk' : 'Kas Keluar',
    'Kategori': k.kategori,
    'Jumlah': Number(k.jumlah) || 0,
    'Keterangan': k.keterangan,
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Keuangan');
  XLSX.writeFile(wb, `Laporan_Keuangan_myHW_${new Date().toISOString().slice(0, 10)}.xlsx`);
});

window.deleteKeuangan = deleteKeuangan;

loadKeuangan();
