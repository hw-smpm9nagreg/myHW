/**
 * pages/kartu-anggota.js - Kartu Anggota milik sendiri
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
  wrap.innerHTML = `
    <div class="card-soft overflow-hidden">
      <div class="gradient-primary p-5 text-center relative">
        <div class="absolute inset-0 opacity-10 pointer-events-none" style="background-image: radial-gradient(#fff 1px, transparent 1px); background-size: 16px 16px;"></div>
        <div class="relative">
          <p class="text-teal-50 text-xs font-semibold tracking-wide">KARTU TANDA ANGGOTA</p>
          <p class="text-white font-bold text-lg -mt-0.5">Hizbul Wathan</p>
        </div>
      </div>
      <div class="p-5 text-center -mt-2">
        <div class="w-24 h-24 rounded-3xl bg-teal-50 mx-auto flex items-center justify-center text-3xl font-bold text-primary overflow-hidden border-4 border-white shadow -mt-10 relative bg-white">
          ${a.fotoUrl ? `<img src="${a.fotoUrl}" class="w-full h-full object-cover rounded-3xl" />` : (a.nama || '?').charAt(0).toUpperCase()}
        </div>
        <h2 class="font-bold text-slate-800 text-lg mt-3">${a.nama || '-'}</h2>
        <p class="text-xs text-slate-500">${a.nomorAnggota || '-'} &middot; ${a.golongan || '-'}</p>
        <span class="inline-block text-[10px] font-semibold px-2.5 py-1 rounded-full mt-2 ${a.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}">
          ${a.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
        </span>

        <div class="w-44 h-44 mx-auto mt-5 bg-slate-50 rounded-2xl flex items-center justify-center">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(a.qrCode || a.id)}" class="w-40 h-40" alt="QR Code Anggota" />
        </div>
        <p class="text-[10px] text-slate-400 mt-2">Tunjukkan QR ini saat presensi kegiatan</p>

        <button id="btnPrint" class="btn-primary w-full py-2.5 mt-5"><i class="fa-solid fa-print mr-1"></i> Cetak Kartu</button>
      </div>
    </div>
  `;
  document.getElementById('btnPrint').addEventListener('click', () => window.print());
}

loadKartu();
