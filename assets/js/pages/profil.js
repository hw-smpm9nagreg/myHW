/**
 * pages/profil.js - Halaman Profil
 */
Auth.requireAuth();

const session = Auth.getSession();
document.getElementById('year').textContent = new Date().getFullYear();

function renderProfile() {
  document.getElementById('profileNama').textContent = session.nama || session.username;
  document.getElementById('profileJabatan').textContent = session.role === 'admin' ? 'Administrator' : (session.jabatan || 'Anggota');
  document.getElementById('profileNomor').textContent = session.nomorAnggota || '-';
  document.getElementById('profileQobilah').textContent = session.qobilah || '-';
  document.getElementById('profileEmail').textContent = session.email || '-';
  document.getElementById('profileStatus').textContent = session.status === 'nonaktif' ? 'Nonaktif' : 'Aktif';

  if (session.fotoUrl) {
    document.getElementById('avatarWrap').innerHTML = `<img src="${session.fotoUrl}" class="w-full h-full object-cover" />`;
  } else {
    document.getElementById('avatarInitial').textContent = (session.nama || session.username || '?').charAt(0).toUpperCase();
  }
}
renderProfile();

// ------------------------------------------------------------------
// Foto profil
// ------------------------------------------------------------------
document.getElementById('fotoInput').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  UI.loading('Mengunggah foto...');
  try {
    const uploadRes = await Api.uploadFile(file, 'myHW-foto-profil');
    if (!uploadRes.success) { UI.closeLoading(); return UI.toast('Gagal mengunggah foto', 'error'); }
    const result = await Api.post('updateProfile', { id: session.id, fotoUrl: uploadRes.data.url });
    UI.closeLoading();
    if (result.success) {
      Auth.saveSession({ ...session, fotoUrl: uploadRes.data.url });
      document.getElementById('avatarWrap').innerHTML = `<img src="${uploadRes.data.url}" class="w-full h-full object-cover" />`;
      UI.toast('Foto profil diperbarui');
    } else {
      UI.toast(result.message || 'Gagal menyimpan foto', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

// ------------------------------------------------------------------
// Edit profil
// ------------------------------------------------------------------
const editModal = document.getElementById('editModal');
document.getElementById('btnEditProfil').addEventListener('click', () => {
  document.getElementById('e_nama').value = session.nama || '';
  document.getElementById('e_email').value = session.email || '';
  editModal.classList.remove('hidden');
});
document.getElementById('btnCloseEdit').addEventListener('click', () => editModal.classList.add('hidden'));

document.getElementById('editForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    id: session.id,
    nama: document.getElementById('e_nama').value,
    email: document.getElementById('e_email').value,
  };
  UI.loading('Menyimpan...');
  try {
    const result = await Api.post('updateProfile', payload);
    UI.closeLoading();
    if (result.success) {
      Auth.saveSession({ ...session, ...payload });
      UI.toast('Profil diperbarui');
      editModal.classList.add('hidden');
      renderProfile();
    } else {
      UI.toast(result.message || 'Gagal menyimpan profil', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

// ------------------------------------------------------------------
// Ubah kata sandi
// ------------------------------------------------------------------
const passwordModal = document.getElementById('passwordModal');
document.getElementById('btnChangePassword').addEventListener('click', () => {
  document.getElementById('passwordForm').reset();
  passwordModal.classList.remove('hidden');
});
document.getElementById('btnClosePassword').addEventListener('click', () => passwordModal.classList.add('hidden'));

document.getElementById('passwordForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const newPassword = document.getElementById('p_new').value;
  const confirm = document.getElementById('p_confirm').value;
  if (newPassword !== confirm) return UI.toast('Konfirmasi kata sandi tidak cocok', 'error');

  UI.loading('Menyimpan kata sandi...');
  try {
    const result = await Api.post('changePassword', { id: session.id, newPassword });
    UI.closeLoading();
    if (result.success) {
      UI.toast('Kata sandi berhasil diubah');
      passwordModal.classList.add('hidden');
    } else {
      UI.toast(result.message || 'Gagal mengubah kata sandi', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

// ------------------------------------------------------------------
// Dark mode
// ------------------------------------------------------------------
const darkToggle = document.getElementById('darkModeToggle');
darkToggle.checked = localStorage.getItem('myhw_dark') === '1';
document.body.classList.toggle('dark', darkToggle.checked);

darkToggle.addEventListener('change', () => {
  localStorage.setItem('myhw_dark', darkToggle.checked ? '1' : '0');
  document.body.classList.toggle('dark', darkToggle.checked);
});

// ------------------------------------------------------------------
// Logout
// ------------------------------------------------------------------
document.getElementById('btnLogout').addEventListener('click', async () => {
  const ok = await UI.confirm('Anda akan keluar dari myHW.', 'Keluar?');
  if (ok) Auth.logout();
});
