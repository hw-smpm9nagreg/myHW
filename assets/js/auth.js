/**
 * auth.js - Session management via LocalStorage
 */
const Auth = {
  SESSION_KEY: 'myhw_session',

  saveSession(user) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(user));
  },

  getSession() {
    const raw = localStorage.getItem(this.SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  isLoggedIn() {
    return !!this.getSession();
  },

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    window.location.href = 'login.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) window.location.href = 'login.html';
  },

  async login(username, password) {
    const result = await Api.post('login', { username, password });
    if (result.success) this.saveSession(result.data);
    return result;
  },
};
