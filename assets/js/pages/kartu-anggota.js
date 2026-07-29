/**
 * pages/kartu-anggota.js - Kartu Anggota milik sendiri
 * Satu elemen kartu (id="kartuAnggotaCard") dipakai untuk tampilan layar
 * maupun hasil cetak - background-nya adalah gambar template KTA resmi,
 * data anggota ditempel di atasnya lewat overlay posisi persen.
 */
Auth.requireAuth();

async function loadKartu() {
  const wrap = document.getElementById('cardWrap');
  UI.skeletonCards(wrap, 1, 'h-64');
  try {
    const result = await Api.get('getMyAnggota');
    if (!result.success) {
      wrap.innerHTML = `
        <div class="card-soft p-8 text-center">
          <i class="fa-solid fa-id-card text-3xl text-slate-300 mb-3 block"></i>
          <p class="text-sm text-slate-500">${result.message || 'Data Anggota belum tersedia untuk akun ini'}</p>
          <p class="text-xs text-slate-400 mt-2">Hubungi admin/pembina jika Anda seharusnya terdaftar sebagai anggota.</p>
        </div>`;
      return;
    }
    renderCard(result.data);
  } catch (err) {
    wrap.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function renderCard(a) {
  const wrap = document.getElementById('cardWrap');

  if (a.statusApproval === 'pending') {
    wrap.innerHTML = `
      <div class="card-soft p-8 text-center">
        <div class="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center text-3xl mx-auto mb-3">
          <i class="fa-solid fa-hourglass-half"></i>
        </div>
        <h2 class="font-bold text-slate-800">Menunggu Persetujuan Admin</h2>
        <p class="text-xs text-slate-500 mt-1">Pendaftaran Anda sedang ditinjau oleh admin/pembina. Kartu anggota &amp; QR Code resmi akan tersedia di sini setelah disetujui.</p>
      </div>`;
    return;
  }

  const ttl = [a.tempatLahir, formatTanggalSingkat(a.tanggalLahir)].filter(Boolean).join(', ');
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(a.qrCode || a.id)}`;
  const fotoTag = a.fotoUrl
    ? `<img src="${a.fotoUrl}" style="width: 100%; height: 100%; object-fit: cover;" />`
    : '';

  wrap.innerHTML = `
    <div id="kartuAnggotaCard" class="kta-card">
      <p class="kta-overlay kta-nomor" style="top: 30%; left: 0; right: 0; text-align: center; font-weight: 800;">${a.nomorAnggota || '-'}</p>

      <div class="kta-overlay" style="top: 41%; left: 4%; width: 19%; height: 42%; border-radius: 4px; overflow: hidden; background: #F1F5F9;">${fotoTag}</div>

      <table class="kta-overlay kta-table" style="top: 44%; left: 26%; width: 48%; border-collapse: collapse;">
        <tr><td style="width: 30%; font-weight: 600; padding: 3px 0;">Nama</td><td style="width: 8%;">:</td><td style="font-weight: 600;">${a.nama || '-'}</td></tr>
        <tr><td style="font-weight: 600; padding: 3px 0;">TTL</td><td>:</td><td>${ttl || '-'}</td></tr>
        <tr><td style="font-weight: 600; padding: 3px 0;">Tingkatan</td><td>:</td><td>${a.golongan || '-'}</td></tr>
        <tr><td style="font-weight: 600; padding: 3px 0; vertical-align: top;">Alamat</td><td style="vertical-align: top;">:</td><td style="vertical-align: top;">${a.alamat || '-'}</td></tr>
      </table>

      <div class="kta-overlay" style="top: 66%; right: 4%; width: 19%; height: 29%;">
        <img src="${qrUrl}" style="width: 100%; height: 100%;" alt="QR Code Anggota" />
      </div>
    </div>

    <p class="text-center text-xs text-slate-400 mt-3 print:hidden">Tunjukkan QR ini saat presensi kegiatan</p>
    <button id="btnPrint" class="btn-primary w-full py-2.5 mt-4 print:hidden"><i class="fa-solid fa-print mr-1"></i> Cetak Kartu</button>
  `;
  document.getElementById('btnPrint').addEventListener('click', () => window.print());
}

function formatTanggalSingkat(tanggal) {
  if (!tanggal) return '';
  const d = new Date(tanggal);
  if (isNaN(d)) return '';
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}-${mm}-${d.getFullYear()}`;
}

loadKartu();
