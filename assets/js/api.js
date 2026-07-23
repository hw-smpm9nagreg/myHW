/**
 * api.js - Fetch wrapper for myHW Google Apps Script backend
 * Ganti API_BASE_URL dengan URL Web App hasil deploy Google Apps Script Anda.
 */
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbw-nxLtY8etOFpcU6NiVx33RfzJRDaV7t84F5OnM4vdkuUGli3J8SnX2lgjzJzm3fuZ/exec';

const Api = {
  async get(action, params = {}) {
    const qs = new URLSearchParams({ action, ...params }).toString();
    const res = await fetch(`${API_BASE_URL}?${qs}`);
    return res.json();
  },

  async post(action, body = {}) {
    const res = await fetch(`${API_BASE_URL}?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // avoids CORS preflight on Apps Script
      body: JSON.stringify(body),
    });
    return res.json();
  },

  // Convert a File object to base64 and upload via backend to Google Drive
  async uploadFile(file, folder = 'myHW-uploads') {
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    return this.post('uploadFile', {
      base64,
      fileName: file.name,
      mimeType: file.type,
      folder,
    });
  },
};
