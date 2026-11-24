// ==========================================================================
// ReportLoop - State aplikasi
// Semua state dikumpulkan di satu objek `state`. Saat migrasi ke React,
// tiap properti bisa jadi useState / context / store (Zustand, dll).
// ==========================================================================

import { cloneSeedReports } from '../data/seedReports.js';

export const state = {
  // Data laporan
  reports: cloneSeedReports(),
  upvotedIds: new Set(),

  // Mode aplikasi
  currentRole: 'mahasiswa', // 'mahasiswa' | 'admin'
  isLiveApi: false,
  activeCategoryFilter: 'ALL',

  // Form laporan
  currentPhotoDataUrl: null,
  currentPhotoFile: null,
  pendingSubmission: null,
  modalReturnFocusEl: null,

  // Referensi Leaflet
  map: null,
  targetMarker: null,
  reportMarkersLayer: null,
};

// Kembalikan data ke kondisi demo awal
export function resetToDemoData() {
  state.reports = cloneSeedReports();
  state.upvotedIds = new Set();
}
