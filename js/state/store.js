// ==========================================================================
// ReportLoop - State aplikasi
// Semua state dikumpulkan di satu objek `state`. Saat migrasi ke React,
// tiap properti bisa jadi useState / context / store (Zustand, dll).
// ==========================================================================

import { cloneSeedReports } from '../data/seedReports.js';
import { getSession } from '../services/auth.js';

const DEMO_REPORTS_KEY = 'reportloop.demo.reports';
const DEMO_UPVOTES_KEY = 'reportloop.demo.upvotes';

function upvoteKey() {
  const session = getSession();
  return `${DEMO_UPVOTES_KEY}.${session?.id || 'anon'}`;
}

function readStorage(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

function loadDemoReports() {
  const saved = readStorage(DEMO_REPORTS_KEY);
  return Array.isArray(saved) && saved.length > 0 ? saved : cloneSeedReports();
}

function loadDemoUpvotes() {
  const saved = readStorage(upvoteKey());
  return new Set(Array.isArray(saved) ? saved : []);
}

// Simpan data mode demo agar tidak hilang saat halaman dimuat ulang.
// Foto data URL dibuang bila kuota penyimpanan penuh.
export function saveDemoState() {
  try {
    localStorage.setItem(upvoteKey(), JSON.stringify([...state.upvotedIds]));
  } catch (_) {
    /* penyimpanan tidak tersedia */
  }
  try {
    localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(state.reports));
  } catch (_) {
    try {
      const slim = state.reports.map((r) => ({
        ...r,
        photo_url: typeof r.photo_url === 'string' && r.photo_url.startsWith('data:') ? null : r.photo_url,
      }));
      localStorage.setItem(DEMO_REPORTS_KEY, JSON.stringify(slim));
    } catch (__) {
      /* penyimpanan penuh */
    }
  }
}

export const state = {
  // Data laporan
  reports: loadDemoReports(),
  upvotedIds: loadDemoUpvotes(),

  // Mode aplikasi
  currentRole: 'mahasiswa', // 'mahasiswa' | 'admin'
  isLiveApi: false,
  activeCategoryFilter: 'ALL',

  // Form laporan
  currentPhotoDataUrl: null,
  currentPhotoFile: null,
  isStalePhoto: false,
  pendingSubmission: null,
  modalReturnFocusEl: null,

  // Referensi Leaflet
  map: null,
  targetMarker: null,
  reportMarkersLayer: null,
};

// Kembalikan data ke kondisi demo awal
export function resetToDemoData() {
  state.reports = loadDemoReports();
  state.upvotedIds = loadDemoUpvotes();
}
