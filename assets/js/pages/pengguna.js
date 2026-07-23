/**
 * pages/pengguna.js - Manajemen Pengguna (khusus admin)
 */
Auth.requireRole('admin');

const currentSession = Auth.getSession();
let allUsers = [];

const roleLabel = { admin: 'Admin', pembina: 'Pembina', bendahara: 'Bendahara', anggota: 'Anggota' };
const roleBadge = {
  admin: 'bg-teal-50 text-primary',
  pembina: 'bg-sky-50 text-sky-600',
  bendahara: 'bg-lime-50 text-lime-600',
  anggota: 'bg-slate-100 text-slate-500',
};

async function loadUsers() {
  const list = document.getElementById('userList');
  UI.skeletonCards(list, 4, 'h-20');
  try {
    const result = await Api.get('getUsers');
    if (!result.success) {
      list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">${result.message || 'Gagal memuat data pengguna'}</p>`;
      return;
    }
    allUsers = result.data;
    applyFilter();
  } catch (err) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10">Gagal memuat data. Periksa koneksi ke server.</p>`;
  }
}

function applyFilter() {
  const q = document.getElementById('searchInput').value.toLowerCase();
  const filtered = allUsers.filter(u =>
    !q || `${u.nama} ${u.username} ${u.email}`.toLowerCase().includes(q)
  );
  renderList(filtered);
}
document.getElementById('searchInput').addEventListener('input', applyFilter);

function renderList(data) {
  const list = document.getElementById('userList');
  if (!data.length) {
    list.innerHTML = `<p class="text-center text-sm text-slate-400 py-10"><i class="fa-solid fa-users-slash text-2xl mb-2 block"></i>Tidak ada pengguna ditemukan</p>`;
    return;
  }
  list.innerHTML = data.map(u => `
    <div class="card-soft p-4">
      <div class="flex items-center gap-3">
        <div class="w-11 h-11 rounded-xl bg-teal-50 flex items-center justify-center text-primary font-bold shrink-0 overflow-hidden">
          ${u.fotoUrl ? `<img src="${u.fotoUrl}" class="w-full h-full object-cover" />` : (u.nama || u.username || '?').charAt(0).toUpperCase()}
        </div>
        <div class="flex-1 min-w-0">
          <p class="font-semibold text-slate-800 text-sm truncate">${u.nama || u.username}${u.id === currentSession.id ? ' <span class=\"text-[10px] text-slate-400\">(Anda)</span>' : ''}</p>
          <p class="text-xs text-slate-500 truncate">${u.email || u.username}</p>
        </div>
        <span class="text-[10px] font-semibold px-2 py-1 rounded-full shrink-0 ${u.status === 'aktif' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}">
          ${u.status === 'aktif' ? 'Aktif' : 'Nonaktif'}
        </span>
      </div>
      <div class="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100">
        <div>
          <label class="block text-[10px] text-slate-400 font-semibold uppercase mb-1">Role</label>
          <select onchange="changeRole('${u.id}', this.value)" class="input-soft w-full px-2 py-2 text-xs ${roleBadge[u.role] || ''}" ${u.id === currentSession.id ? 'disabled' : ''}>
            <option value="anggota" ${u.role === 'anggota' ? 'selected' : ''}>Anggota</option>
            <option value="pembina" ${u.role === 'pembina' ? 'selected' : ''}>Pembina</option>
            <option value="bendahara" ${u.role === 'bendahara' ? 'selected' : ''}>Bendahara</option>
            <option value="admin" ${u.role === 'admin' ? 'selected' : ''}>Admin</option>
          </select>
        </div>
        <div>
          <label class="block text-[10px] text-slate-400 font-semibold uppercase mb-1">Status</label>
          <button onclick="toggleStatus('${u.id}', '${u.status}')" class="w-full py-2 rounded-[var(--radius-sm)] text-xs font-semibold ${u.status === 'aktif' ? 'bg-red-50 text-[var(--color-danger)]' : 'bg-emerald-50 text-emerald-600'}" ${u.id === currentSession.id ? 'disabled' : ''}>
            ${u.status === 'aktif' ? 'Nonaktifkan' : 'Aktifkan'}
          </button>
        </div>
      </div>
      ${u.id !== currentSession.id ? `<button onclick="deleteUserAccount('${u.id}')" class="w-full mt-2 py-2 rounded-[var(--radius-sm)] bg-slate-50 text-slate-400 text-xs font-semibold"><i class="fa-solid fa-trash mr-1"></i>Hapus Akun</button>` : ''}
    </div>
  `).join('');
}

async function changeRole(id, role) {
  UI.loading('Menyimpan role...');
  try {
    const result = await Api.post('updateUserRole', { id, role });
    UI.closeLoading();
    if (result.success) { UI.toast('Role diperbarui'); loadUsers(); }
    else { UI.toast(result.message || 'Gagal mengubah role', 'error'); loadUsers(); }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

async function toggleStatus(id, currentStatus) {
  const newStatus = currentStatus === 'aktif' ? 'nonaktif' : 'aktif';
  const ok = await UI.confirm(
    newStatus === 'nonaktif' ? 'Pengguna tidak akan bisa login setelah dinonaktifkan.' : 'Pengguna akan bisa login kembali.',
    newStatus === 'nonaktif' ? 'Nonaktifkan Akun?' : 'Aktifkan Akun?'
  );
  if (!ok) return;
  UI.loading('Menyimpan...');
  try {
    const result = await Api.post('updateUserStatus', { id, status: newStatus });
    UI.closeLoading();
    if (result.success) { UI.toast('Status akun diperbarui'); loadUsers(); }
    else UI.toast(result.message || 'Gagal mengubah status', 'error');
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

async function deleteUserAccount(id) {
  const ok = await UI.confirm('Akun ini akan dihapus permanen dan tidak bisa login lagi.', 'Hapus Akun Pengguna?');
  if (!ok) return;
  UI.loading('Menghapus akun...');
  try {
    const result = await Api.post('deleteUser', { id });
    UI.closeLoading();
    if (result.success) { UI.toast('Akun dihapus'); loadUsers(); }
    else UI.toast(result.message || 'Gagal menghapus akun', 'error');
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
}

// ------------------------------------------------------------------
// Tambah pengguna
// ------------------------------------------------------------------
const formModal = document.getElementById('formModal');
document.getElementById('btnAdd').addEventListener('click', () => {
  document.getElementById('userForm').reset();
  formModal.classList.remove('hidden');
});
document.getElementById('btnCloseForm').addEventListener('click', () => formModal.classList.add('hidden'));

document.getElementById('userForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const payload = {
    nama: document.getElementById('f_nama').value,
    username: document.getElementById('f_username').value,
    email: document.getElementById('f_email').value,
    password: document.getElementById('f_password').value,
    role: document.getElementById('f_role').value,
  };
  UI.loading('Membuat akun...');
  try {
    const result = await Api.post('addUserByAdmin', payload);
    UI.closeLoading();
    if (result.success) {
      UI.toast('Akun pengguna baru dibuat');
      formModal.classList.add('hidden');
      loadUsers();
    } else {
      UI.toast(result.message || 'Gagal membuat akun', 'error');
    }
  } catch (err) {
    UI.closeLoading();
    UI.toast('Tidak dapat terhubung ke server', 'error');
  }
});

window.changeRole = changeRole;
window.toggleStatus = toggleStatus;
window.deleteUserAccount = deleteUserAccount;

loadUsers();
