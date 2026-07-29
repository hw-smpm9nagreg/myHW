/**
 * pages/verifikasi.js - Halaman verifikasi keaslian dokumen (publik, tanpa login)
 * Diakses lewat scan QR Code pengesahan pada dokumen/surat.
 */
document.getElementById('year').textContent = new Date().getFullYear();

const params = new URLSearchParams(window.location.search);
const kode = params.get('kode');

async function verify() {
  const card = document.getElementById('resultCard');

  if (!kode) {
    renderInvalid(card, 'Kode verifikasi tidak ditemukan pada tautan ini.');
    return;
  }

  try {
    const result = await Api.get('verifikasiDokumen', { kode });
    if (result.success) {
      renderValid(card, result.data);
    } else {
      renderInvalid(card, result.message || 'Dokumen tidak ditemukan atau kode tidak valid.');
    }
  } catch (err) {
    renderInvalid(card, 'Tidak dapat terhubung ke server. Coba lagi nanti.');
  }
}

function renderValid(card, data) {
  card.innerHTML = `
    <div class="w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center text-3xl mx-auto mb-3">
      <i class="fa-solid fa-shield-check"></i>
    </div>
    <h2 class="font-bold text-emerald-600 text-lg">Dokumen Terverifikasi</h2>
    <p class="text-xs text-slate-500 mb-4">Dokumen ini sah dan tercatat di sistem myHW</p>

    <div class="text-left bg-slate-50 rounded-[var(--radius-sm)] p-3.5 space-y-2 text-sm">
      <div>
        <p class="text-[10px] text-slate-400 uppercase font-semibold">Nama Dokumen</p>
        <p class="font-medium text-slate-700">${data.namaFile || '-'}</p>
      </div>
      <div>
        <p class="text-[10px] text-slate-400 uppercase font-semibold">Kategori</p>
        <p class="font-medium text-slate-700">${data.kategori || '-'}</p>
      </div>
      <div>
        <p class="text-[10px] text-slate-400 uppercase font-semibold">Tanggal</p>
        <p class="font-medium text-slate-700">${data.tanggal || '-'}</p>
      </div>
      ${data.uploadBy ? `
      <div>
        <p class="text-[10px] text-slate-400 uppercase font-semibold">Diunggah / Ditandatangani oleh</p>
        <p class="font-medium text-slate-700">${data.uploadBy}</p>
      </div>` : ''}
      <div>
        <p class="text-[10px] text-slate-400 uppercase font-semibold">Kode Verifikasi</p>
        <p class="font-mono text-xs text-slate-500 break-all">${kode}</p>
      </div>
      <div>
        <p class="text-[10px] text-slate-400 uppercase font-semibold">Hash Keaslian (SHA-256)</p>
        <p class="font-mono text-[10px] text-slate-400 break-all">${data.fileHash || '-'}</p>
      </div>
    </div>

    ${data.fileUrl ? `<a href="${data.fileUrl}" target="_blank" class="btn-primary block w-full py-2.5 mt-4 text-sm"><i class="fa-solid fa-file mr-1"></i>Lihat Dokumen</a>` : ''}
  `;
}

function renderInvalid(card, message) {
  card.innerHTML = `
    <div class="w-16 h-16 rounded-full bg-red-50 text-[var(--color-danger)] flex items-center justify-center text-3xl mx-auto mb-3">
      <i class="fa-solid fa-circle-xmark"></i>
    </div>
    <h2 class="font-bold text-[var(--color-danger)] text-lg">Tidak Terverifikasi</h2>
    <p class="text-xs text-slate-500 mt-1">${message}</p>
  `;
}

verify();
