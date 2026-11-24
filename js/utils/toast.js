// ==========================================================================
// ReportLoop - Util toast
// Notifikasi singkat di pojok kanan bawah. Di React bisa diganti komponen
// <Toast /> atau library seperti react-hot-toast.
// Warna hanya menandai jenis pesan; teks putih di atas latar tua (kontras > 7:1).
// ==========================================================================

const TOAST_COLORS = {
  success: 'bg-green-800 text-white border-green-900',
  error: 'bg-red-800 text-white border-red-900',
  warning: 'bg-amber-800 text-white border-amber-900',
  info: 'bg-brand-900 text-white border-brand-800',
};

export function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `pointer-events-auto px-4 py-3 rounded-lg border shadow-lg text-sm font-medium leading-relaxed fade-in ${TOAST_COLORS[type] || TOAST_COLORS.info}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4500);
}
