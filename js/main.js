// Titik masuk aplikasi setelah login: memuat partial HTML, tema, peta, dan fitur peran.

import { initCampusMap, renderMapMarkers, bindMapEvents } from './features/map.js';
import { bindPhotoEvents } from './features/photo.js';
import { bindDuplicateModalEvents } from './features/duplicateModal.js';
import { renderPublicBoard, bindBoardEvents } from './features/publicBoard.js';
import { renderAdminTable, bindAdminEvents } from './features/adminPanel.js';
import { bindHeaderEvents, focusReportOnMap, renderSession } from './features/header.js';
import { renderProfilePanel } from './features/profile.js';
import {
  bindFormEvents,
  updateNlpPreview,
  upvoteReport,
  updateReportStatus,
} from './features/reportForm.js';
import { requireRole } from './services/auth.js';
import { state, saveDemoState } from './state/store.js';
import { initTheme } from './utils/theme.js';
import { initScrollReveal } from './utils/scrollReveal.js';

const role = document.body.dataset.role;

const PARTIALS = {
  user: [
    { target: 'slot-header', file: 'header.html' },
    { target: 'slot-view', file: 'view-mahasiswa.html' },
    { target: 'slot-modal', file: 'duplicate-modal.html' },
    { target: 'slot-footer', file: 'footer.html' },
  ],
  admin: [
    { target: 'slot-header', file: 'header.html' },
    { target: 'slot-view', file: 'view-admin.html' },
    { target: 'slot-footer', file: 'footer.html' },
  ],
};

async function loadPartials() {
  await Promise.all(
    PARTIALS[role].map(async ({ target, file }) => {
      const res = await fetch(file);
      if (!res.ok) throw new Error(`Gagal memuat ${file} (HTTP ${res.status})`);
      document.getElementById(target).innerHTML = await res.text();
    })
  );
}

export function renderAll() {
  if (!state.isLiveApi) saveDemoState();
  if (role === 'user') renderPublicBoard();
  if (role === 'admin') renderAdminTable();
  renderProfilePanel(renderSession);
  renderMapMarkers();
}

function bindDelegatedActions() {
  document.addEventListener('click', (event) => {
    const el = event.target.closest('[data-action]');
    if (!el) return;
    const { action, id, status, lat, lng } = el.dataset;

    if (action === 'upvote') {
      upvoteReport(id, renderAll);
    } else if (action === 'set-status') {
      updateReportStatus(id, status, renderAll);
    } else if (action === 'focus-map') {
      focusReportOnMap(parseFloat(lat), parseFloat(lng), role);
    }
  });
}

function showBootError() {
  document.getElementById('slot-view').innerHTML = `
    <div class="card state-box" role="alert">
      <strong>Halaman gagal dimuat</strong>
      Buka aplikasi lewat server lokal (misalnya Live Server di VS Code), bukan langsung dari file. Setelah itu muat ulang halaman.
    </div>`;
}

async function boot() {
  initTheme();
  const session = requireRole(role);
  if (!session) return;

  try {
    await loadPartials();
  } catch (err) {
    console.error(err);
    showBootError();
    return;
  }

  initTheme();
  bindHeaderEvents(renderAll, session);
  bindMapEvents();
  bindPhotoEvents();
  bindFormEvents(renderAll);
  if (role === 'user') bindBoardEvents();
  if (role === 'admin') bindAdminEvents();
  bindDuplicateModalEvents();
  bindDelegatedActions();

  initCampusMap();
  updateNlpPreview();
  renderAll();
  initScrollReveal();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}