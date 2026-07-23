/**
 * ui.js - Shared UI helpers (toast, loading, confirm) built on SweetAlert2
 */
const UI = {
  toast(message, icon = 'success') {
    Swal.fire({
      toast: true,
      position: 'top-end',
      icon,
      title: message,
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
    });
  },

  loading(message = 'Memuat...') {
    Swal.fire({
      title: message,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  },

  closeLoading() {
    Swal.close();
  },

  async confirm(message, title = 'Yakin?') {
    const result = await Swal.fire({
      title,
      text: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0F766E',
      cancelButtonColor: '#EF4444',
      confirmButtonText: 'Ya, lanjutkan',
      cancelButtonText: 'Batal',
    });
    return result.isConfirmed;
  },

  skeletonCards(container, count = 3, heightClass = 'h-24') {
    container.innerHTML = Array.from({ length: count })
      .map(() => `<div class="skeleton ${heightClass} w-full mb-3"></div>`)
      .join('');
  },

  formatCurrency(value) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value || 0);
  },

  formatDate(dateStr) {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
  },
};
