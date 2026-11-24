// Util tampilan badge status, badge kategori, warna pin peta, dan placeholder foto.

export const STATUS_LABEL = {
  Received: 'Diterima',
  'In Progress': 'Diperbaiki',
  Resolved: 'Selesai',
};

export const CATEGORY_LABEL = {
  Infrastructure: 'Infrastruktur',
  Cleanliness: 'Kebersihan',
  Security: 'Keamanan',
};

export function getCategoryBadgeClass() {
  return 'badge badge-cat';
}

export function getStatusBadgeClass(status) {
  if (status === 'Resolved') return 'badge badge-resolved';
  if (status === 'In Progress') return 'badge badge-progress';
  return 'badge badge-received';
}

export function getStatusPinColor(status) {
  if (status === 'Resolved') return '#15803d';
  if (status === 'In Progress') return '#1d4ed8';
  return '#b45309';
}

export function getPhotoPlaceholderSvg(category) {
  const label = CATEGORY_LABEL[category] || 'Laporan';
  return `
    <div class="w-full h-32 flex flex-col items-center justify-center px-4 text-center bg-ink-100 dark:bg-ink-800/80 text-ink-700 dark:text-ink-300 border-b border-ink-200 dark:border-ink-800">
      <span class="text-sm font-bold">${label}</span>
      <span class="text-xs mt-0.5">Belum ada foto</span>
    </div>
  `;
}
