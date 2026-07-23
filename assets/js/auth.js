/**
 * auth.js - Session management via LocalStorage (token-based)
 */
const Auth = {
  SESSION_KEY: 'myhw_session',

  // Halaman di dalam /pages/ butuh path relatif '../' untuk kembali ke root
  _basePath() {
    return window.location.pathname.includes('/pages/') ? '../' : '';
  },

  saveSession(user) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
  },

  getSession() {
    const raw = localStorage.getItem(this.SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  clearSession() {
    localStorage.removeItem(this.SESSION_KEY);
  },

  isLoggedIn() {
    const session = this.getSession();
    return !!(session && session.token);
  },

  hasRole(...roles) {
    const session = this.getSession();
    return !!(session && roles.includes(session.role));
  },

  requireAuth() {
    if (!this.isLoggedIn()) window.location.href = this._basePath() + 'login.html';
  },

  // Panggil dari halaman yang dibatasi role tertentu, mis. Auth.requireRole('admin')
  requireRole(...roles) {
    this.requireAuth();
    if (!this.hasRole(...roles)) {
      UI.toast('Anda tidak memiliki akses ke halaman ini', 'error');
      setTimeout(() => { window.location.href = this._basePath() + 'dashboard.html'; }, 1200);
    }
  },

  async logout() {
    const session = this.getSession();
    const token = session ? session.token : '';
    this.clearSession();
    if (token) {
      try { await Api.post('logout', { token }); } catch (err) { /* best effort */ }
    }
    window.location.href = this._basePath() + 'login.html';
  },

  async login(username, password) {
    const result = await Api.post('login', { username, password });
    if (result.success) this.saveSession(result.data);
    return result;
  },
};
