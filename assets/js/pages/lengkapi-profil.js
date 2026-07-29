/**
 * pages/lengkapi-profil.js - Lengkapi data keanggotaan setelah login pertama kali
 */
Auth.requireAuth();

const session = Auth.getSession();

// Kalau akun ini bukan role 'anggota' (mis. admin/pembina yang dibuat lewat
// Manajemen Pengguna dan sudah punya data lengkap), atau ternyata sudah
// terdaftar sebagai anggota, langsung lempar ke dashboard - tidak perlu isi form lagi.
async function checkAlreadyRegistered() {
  try {
    const result = await Api.get('getMyAnggota');
    if (result.success) {
      window.location.href = '../dashboard.html';
    }
  } catch (err) {
    // gagal cek - biarkan tetap di form, aman untuk dicoba isi
  }
}
checkAlreadyRegistered();

// ------------------------------------------------------------------
// Tampilkan info akun dari sesi (nama, email, foto dari Google)
// ------------------------------------------------------------------
if (session) {
  document.getElementById('f_nama').value = session.nama || session.username || '';
  document.getElementById('displayEmail').textContent = session.email || '';
  if (session.fotoUrl) {
    document.getElementById('avatarWrap').innerHTML = `<img src="${session.fotoUrl}" class="w-full h-full object-cover" alt="Foto" />`;
  } else {
    document.getElementById('avatarInitial').textContent = (session.nama || session.username || '?').charAt(0).toUpperCase();
  }
}

// ------------------------------------------------------------------
// Submit pendaftaran
// ------------------------------------------------------------------
document.getElementById('registrasiForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    nama: document.getElementById('f_nama').value,
    tempatLahir: document.getElementById('f_tempatLahir').value,
    tanggalLahir: document.getElementById('f_tanggalLahir').value,
    alamat: document.getElementById('f_alamat').value,
    noHp: document.getElementById('f_noHp').value,
    jenisKelamin: document.getElementById('f_jenisKelamin').value,
    golongan: document.getElementById('f_golongan').value,
  };

  UI.loading('Mengirim pendaftaran...');
  try {
    const result = await Api.post('completeRegistration', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast('Pendaftaran terkirim! Menunggu persetujuan admin/pembina.');
      setTimeout(() => { window.location.href = '../dashboard.html'; }, 1200);
    } else {
      UI.toast(result.message || 'Gagal menyimpan pendaftaran', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});
