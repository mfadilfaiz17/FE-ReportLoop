// ==========================================================================
// ReportLoop - Fitur header & pengalih halaman (Peta & Lapor, Papan, Profil)
// ==========================================================================

import { API_MODE_STYLES } from '../config/constants.js';
import { state, resetToDemoData } from '../state/store.js';
import { fetchReports } from '../services/api.js';
import { logout, ROLE_LOGIN } from '../services/auth.js';
import { showToast } from '../utils/toast.js';
import { focusMapOn } from './map.js';
import { renderProfilePanel } from './profile.js';
import { setScope } from './publicBoard.js';

const NAV_ITEMS = {
  user: [
    { view: 'lapor', label: 'Peta & Lapor' },
    { view: 'papan', label: 'Papan Laporan' },
    { view: 'profil', label: 'Profil Saya' },
  ],
  admin: [
    { view: 'antrean', label: 'Antrean Triase' },
    { view: 'peta', label: 'Peta Kampus' },
    { view: 'profil', label: 'Profil Petugas' },
  ],
};

const DEFAULT_VIEW = {
  user: 'lapor',
  admin: 'antrean',
};

const ROLE_TEXT = {
  user: 'Mahasiswa',
  admin: 'Admin Sarpras',
};

let activeView = null;

export function getActiveView() {
  return activeView;
}

export function switchView(role, viewId, { updateHash = true } = {}) {
  const validViews = (NAV_ITEMS[role] || []).map((item) => item.view);
  const targetView = validViews.includes(viewId) ? viewId : DEFAULT_VIEW[role];
  activeView = targetView;

  // Tampilkan hanya section [data-page] yang dipilih
  document.querySelectorAll('[data-page]').forEach((section) => {
    const isMatch = section.dataset.page === targetView;
    section.classList.toggle('hidden', !isMatch);
  });

  // Perbarui indikator aktif pada tombol navigasi
  document.querySelectorAll('[data-nav-view]').forEach((btn) => {
    const isMatch = btn.dataset.navView === targetView;
    if (isMatch) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  });

  if (updateHash && window.location.hash !== `#${targetView}`) {
    history.replaceState(null, '', `#${targetView}`);
  }

  // Segarkan peta Leaflet jika tampilan peta baru saja muncul dari kondisi hidden
  if ((targetView === 'lapor' || targetView === 'peta') && state.map) {
    requestAnimationFrame(() => {
      state.map.invalidateSize();
    });
  }

  if (targetView === 'profil') {
    renderProfilePanel(renderSession);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

export function renderNav(role) {
  const list = document.getElementById('app-nav');
  if (!list) return;

  list.innerHTML = NAV_ITEMS[role]
    .map(
      (item) =>
        `<li><button type="button" class="nav-link" data-nav-view="${item.view}">${item.label}</button></li>`
    )
    .join('');
}

export function renderSession(session) {
  const nameDesktop = document.getElementById('session-name');
  const nameMobile = document.getElementById('session-name-mobile');
  const avatar = document.getElementById('session-avatar');
  const roleLabel = document.getElementById('role-label');

  if (nameDesktop) nameDesktop.textContent = session.name;
  if (nameMobile) nameMobile.textContent = session.name.split(/\s+/)[0] || 'Profil';
  if (avatar) {
    avatar.textContent = (session.name || 'U')
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0] || '')
      .join('')
      .toUpperCase();
  }
  if (roleLabel) {
    roleLabel.textContent = `${ROLE_TEXT[session.role]} \u2022 Politeknik Negeri Indramayu`;
  }
}

export function focusReportOnMap(lat, lng, role = document.body.dataset.role) {
  const mapView = role === 'admin' ? 'peta' : 'lapor';
  if (activeView !== mapView) {
    switchView(role, mapView);
  }
  setTimeout(() => {
    if (state.map) state.map.invalidateSize();
    focusMapOn(lat, lng, 19);
  }, 180);
}

export function setApiModeUI(mode) {
  const style = API_MODE_STYLES[mode] || API_MODE_STYLES.demo;
  const dot = document.getElementById('api-dot');
  const label = document.getElementById('api-mode-label');
  if (dot) dot.className = style.dot;
  if (label) label.textContent = style.label;
}

export async function toggleApiMode(renderAll) {
  const label = document.getElementById('api-mode-label');
  const btn = document.getElementById('btn-api-mode');

  if (!state.isLiveApi) {
    label.textContent = 'Menghubungkan...';
    btn.disabled = true;
    try {
      const liveReports = await fetchReports(2500);
      state.isLiveApi = true;
      state.reports = Array.isArray(liveReports) ? liveReports : [];
      state.upvotedIds = new Set();
      setApiModeUI('live');
      renderAll();
      showToast('Terhubung ke server FastAPI lokal.', 'success');
      return;
    } catch (_) {
      // Jatuh kembali ke mode demo
    } finally {
      btn.disabled = false;
    }

    state.isLiveApi = false;
    setApiModeUI('demo');
    showToast('Server FastAPI lokal (port 8000) belum aktif. Tetap memakai mode demo.', 'warning');
  } else {
    state.isLiveApi = false;
    resetToDemoData();
    setApiModeUI('demo');
    renderAll();
    showToast('Kembali ke mode demo dengan data kampus Polindra.', 'info');
  }
}

function doLogout(role) {
  logout();
  window.location.replace(ROLE_LOGIN[role]);
}

export function bindHeaderEvents(renderAll, session) {
  renderNav(session.role);
  renderSession(session);
  setApiModeUI('demo');

  // Delegasi klik untuk semua tombol pindah halaman [data-nav-view]
  document.addEventListener('click', (event) => {
    const navBtn = event.target.closest('[data-nav-view]');
    if (!navBtn) return;
    const targetView = navBtn.dataset.navView;
    switchView(session.role, targetView);
    if (session.role === 'user' && targetView === 'papan') {
      setScope(navBtn.dataset.boardScope || 'all');
    }
  });

  // Dukungan tombol Back/Forward browser
  window.addEventListener('hashchange', () => {
    const hashView = window.location.hash.replace('#', '');
    if (hashView) switchView(session.role, hashView, { updateHash: false });
  });

  // Aktifkan halaman awal sesuai hash URL atau default peran
  const initialHash = window.location.hash.replace('#', '');
  switchView(session.role, initialHash || DEFAULT_VIEW[session.role], { updateHash: false });

  document.getElementById('btn-api-mode')?.addEventListener('click', () => toggleApiMode(renderAll));
  document.querySelectorAll('[data-logout-trigger]').forEach((btn) => {
    btn.addEventListener('click', () => doLogout(session.role));
  });
}