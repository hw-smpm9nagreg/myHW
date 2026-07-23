/**
 * app.js - Dashboard bootstrap
 */
Auth.requireAuth();

const session = Auth.getSession();
if (session) {
  document.getElementById('greetName').textContent = session.nama || session.username;
  document.getElementById('greetRole').innerHTML =
    `<i class="fa-solid fa-shield-halved mr-1"></i>${session.role === 'admin' ? 'Administrator' : (session.jabatan || 'Anggota')}`;
  document.getElementById('profileName').textContent = session.nama || session.username;
  document.getElementById('profileNomor').textContent = session.nomorAnggota || '-';
  document.getElementById('profileQobilah').textContent = session.qobilah || '-';
  document.getElementById('avatarInitial').textContent = (session.nama || session.username || '?').charAt(0).toUpperCase();
}

document.getElementById('btnLogout').addEventListener('click', async () => {
  const ok = await UI.confirm('Anda akan keluar dari myHW.', 'Keluar?');
  if (ok) Auth.logout();
});

// ------------------------------------------------------------------
// Ringkasan cards
// ------------------------------------------------------------------
const summaryConfig = [
  { key: 'jumlahAnggota',    label: 'Jumlah Anggota',    icon: 'fa-users',            color: 'text-primary bg-teal-50' },
  { key: 'kegiatanBulanIni', label: 'Kegiatan Bulan Ini', icon: 'fa-calendar-days',    color: 'text-sky-500 bg-sky-50' },
  { key: 'jumlahInventaris', label: 'Inventaris',        icon: 'fa-boxes-stacked',    color: 'text-orange-500 bg-orange-50' },
  { key: 'saldoKas',         label: 'Kas',                icon: 'fa-sack-dollar',      color: 'text-lime-600 bg-lime-50', currency: true },
];

async function loadSummary() {
  const container = document.getElementById('summaryCards');
  UI.skeletonCards(container, 4, 'h-20');

  try {
    const result = await Api.get('getDashboardSummary');
    const data = result.success ? result.data : {};
    container.innerHTML = summaryConfig.map(cfg => `
      <div class="card-soft p-4 flex items-center gap-3">
        <div class="menu-icon ${cfg.color}"><i class="fa-solid ${cfg.icon}"></i></div>
        <div class="min-w-0">
          <p class="text-[11px] text-slate-500 truncate">${cfg.label}</p>
          <p class="font-bold text-slate-800 text-sm truncate">
            ${cfg.currency ? UI.formatCurrency(data[cfg.key]) : (data[cfg.key] ?? 0)}
          </p>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = `<p class="col-span-2 text-center text-sm text-slate-400 py-6">Gagal memuat ringkasan</p>`;
  }
}

// ------------------------------------------------------------------
// Attendance chart (placeholder data until absensi module feeds real numbers)
// ------------------------------------------------------------------
async function loadChart() {
  const ctx = document.getElementById('statsChart');
  let labels = [];
  let values = [];
  try {
    const result = await Api.get('getAbsensi');
    const rows = result.success ? result.data : [];
    const byMonth = {};
    rows.forEach(r => {
      if (!r.tanggal) return;
      const d = new Date(r.tanggal);
      const key = d.toLocaleDateString('id-ID', { month: 'short' });
      byMonth[key] = (byMonth[key] || 0) + 1;
    });
    labels = Object.keys(byMonth);
    values = Object.values(byMonth);
  } catch (err) { /* fall through to empty chart */ }

  if (!labels.length) { labels = ['-']; values = [0]; }

  new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Kehadiran',
        data: values,
        backgroundColor: '#14B8A6',
        borderRadius: 8,
        maxBarThickness: 28,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#F1F5F9' } },
        x: { grid: { display: false } },
      },
    },
  });
}

loadSummary();
loadChart();
