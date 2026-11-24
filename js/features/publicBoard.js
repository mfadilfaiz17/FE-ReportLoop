// Fitur papan laporan mahasiswa: kartu laporan, tab scope, filter, pencarian, dan pengurutan.

import { FASTAPI_BASE_URL } from '../config/constants.js';
import { state } from '../state/store.js';
import { getSession } from '../services/auth.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import {
  getCategoryBadgeClass,
  getStatusBadgeClass,
  getPhotoPlaceholderSvg,
  STATUS_LABEL,
  CATEGORY_LABEL,
} from '../utils/badges.js';

let scope = 'all';

export function setFilterCategory(cat) {
  state.activeCategoryFilter = cat;
  document.querySelectorAll('.cat-pill').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.cat === cat));
  });
  renderPublicBoard();
}

export function setScope(next) {
  scope = next;
  document.querySelectorAll('[data-scope]').forEach((tab) => {
    tab.setAttribute('aria-selected', String(tab.dataset.scope === next));
  });
  renderPublicBoard();
}

function isUserReport(rep, session) {
  if (!session || !session.id) return false;
  const ownerId = rep.user_id ?? rep.reporter_nim ?? rep.nim ?? null;
  return ownerId !== null && String(ownerId) === String(session.id);
}

function supportPercent(rep, maxUpvotes) {
  if (!maxUpvotes) return 0;
  return Math.round((rep.upvotes / maxUpvotes) * 100);
}

function emptyMessage() {
  if (state.reports.length === 0) {
    return {
      title: 'Belum ada laporan di kampus',
      body: 'Jadilah yang pertama: pilih lokasi di peta, isi formulir, lalu kirim laporan.',
    };
  }
  if (scope === 'user') {
    return {
      title: 'Anda belum mengirim laporan',
      body: 'Buka Peta & Lapor untuk melaporkan kondisi fasilitas kampus.',
    };
  }
  if (scope === 'mine') {
    return {
      title: 'Anda belum mendukung laporan apa pun',
      body: 'Buka tab Semua laporan, lalu tekan Dukung pada laporan yang juga Anda temui.',
    };
  }
  return {
    title: 'Tidak ada laporan yang cocok',
    body: 'Ubah kata pencarian atau lepas filter kategori dan status untuk melihat lebih banyak laporan.',
  };
}

export function renderLoading() {
  const grid = document.getElementById('public-reports-grid');
  if (!grid) return;
  grid.setAttribute('aria-busy', 'true');
  grid.innerHTML = [1, 2]
    .map(
      () => `
      <div class="card p-4 space-y-3" aria-hidden="true">
        <div class="skeleton h-5 w-2/3"></div>
        <div class="skeleton h-4 w-1/2"></div>
        <div class="skeleton h-16 w-full"></div>
      </div>`
    )
    .join('');
}

export function renderLoadError(retry) {
  const grid = document.getElementById('public-reports-grid');
  if (!grid) return;
  grid.removeAttribute('aria-busy');
  grid.innerHTML = `
    <div class="col-span-full state-box">
      <strong>Laporan gagal dimuat</strong>
      Periksa koneksi Anda, lalu coba lagi.
      <div class="mt-3"><button type="button" id="btn-retry-load" class="btn btn-ghost btn-sm">Muat ulang laporan</button></div>
    </div>`;
  const btn = document.getElementById('btn-retry-load');
  if (btn && retry) btn.addEventListener('click', retry);
}

export function renderPublicBoard() {
  const grid = document.getElementById('public-reports-grid');
  if (!grid) return;
  grid.removeAttribute('aria-busy');

  const session = getSession();
  const statusFilter = document.getElementById('filter-status').value;
  const sortBy = document.getElementById('sort-reports').value;
  const query = document.getElementById('search-reports').value.trim().toLowerCase();

  const filtered = state.reports.filter((r) => {
    const matchScope =
      scope === 'all'
        ? true
        : scope === 'user'
          ? isUserReport(r, session)
          : state.upvotedIds.has(r.id);
    const matchCat = state.activeCategoryFilter === 'ALL' || r.category === state.activeCategoryFilter;
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const matchQuery =
      !query || r.title.toLowerCase().includes(query) || r.description.toLowerCase().includes(query);
    return matchScope && matchCat && matchStatus && matchQuery;
  });

  if (sortBy === 'upvotes') {
    filtered.sort((a, b) => b.upvotes - a.upvotes);
  } else {
    filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  const summary = document.getElementById('board-summary');
  if (summary) {
    summary.textContent = `Menampilkan ${filtered.length} dari ${state.reports.length} laporan.`;
  }

  if (filtered.length === 0) {
    const msg = emptyMessage();
    grid.innerHTML = `
      <div class="col-span-full state-box">
        <strong>${msg.title}</strong>
        ${msg.body}
      </div>`;
    return;
  }

  const maxUpvotes = Math.max(...state.reports.map((r) => r.upvotes), 0);
  grid.innerHTML = filtered.map((rep) => renderReportCard(rep, maxUpvotes)).join('');
}

const TRACK_STEPS = [
  { key: 'Received', label: '1. Diterima' },
  { key: 'In Progress', label: '2. Diperbaiki' },
  { key: 'Resolved', label: '3. Selesai' },
];

function stepIndexForStatus(status) {
  if (status === 'Resolved') return 2;
  if (status === 'In Progress') return 1;
  return 0;
}

function formatTrackDate(value) {
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return '';
  return new Date(t).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderAdminTracking(rep) {
  const activeIdx = stepIndexForStatus(rep.status);
  const stepsHtml = TRACK_STEPS.map((st, idx) => {
    const cls = idx < activeIdx ? 'track-step is-done' : idx === activeIdx ? 'track-step is-current' : 'track-step';
    return `
      <div class="${cls}">
        <div class="track-bar" aria-hidden="true"></div>
        <span class="track-label">${escapeHtml(st.label)}</span>
      </div>
    `;
  }).join('');

  const latest = Array.isArray(rep.status_history) && rep.status_history.length > 0
    ? rep.status_history[rep.status_history.length - 1]
    : null;
  const latestToLabel = latest ? (STATUS_LABEL[latest.to] || latest.to) : '';
  const latestWhen = latest ? formatTrackDate(latest.at) : '';
  const historyHtml = latest
    ? `<p class="mt-2 border-t border-ink-200 dark:border-ink-800 pt-2 text-xs text-ink-600 dark:text-ink-300">Status ke <strong>${escapeHtml(latestToLabel)}</strong> oleh Admin${latestWhen ? ` (${escapeHtml(latestWhen)})` : ''}</p>`
    : '';

  return `
    <div class="track-box" aria-label="Progres pengerjaan admin">
      <div class="flex items-center justify-between gap-2 mb-2">
        <span class="text-xs font-bold text-ink-900 dark:text-white">Progres admin</span>
        <span class="text-xs font-semibold text-ink-600 dark:text-ink-300">${escapeHtml(STATUS_LABEL[rep.status] || rep.status)}</span>
      </div>
      <div class="track-steps">${stepsHtml}</div>
      ${historyHtml}
    </div>
  `;
}

function renderReportCard(rep, maxUpvotes) {
  const isUpvoted = state.upvotedIds.has(rep.id);
  const formattedDate = new Date(rep.created_at).toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  const resolvedPhotoSrc = rep.photo_url
    ? rep.photo_url.startsWith('/uploads')
      ? `${FASTAPI_BASE_URL}${rep.photo_url}`
      : rep.photo_url
    : null;

  const pct = supportPercent(rep, maxUpvotes);
  const statusText = STATUS_LABEL[rep.status] || rep.status;
  const catText = CATEGORY_LABEL[rep.category] || rep.category;

  return `
    <article class="card overflow-hidden flex flex-col">
      ${
        resolvedPhotoSrc
          ? `<img src="${escapeHtml(resolvedPhotoSrc)}" alt="Foto laporan: ${escapeHtml(rep.title)}" width="640" height="360" class="w-full h-32 object-cover" loading="lazy" />`
          : getPhotoPlaceholderSvg(rep.category)
      }

      <div class="p-4 flex-1 flex flex-col gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="${getStatusBadgeClass(rep.status)}">${statusText}</span>
          <span class="${getCategoryBadgeClass(rep.category)}">${catText}</span>
        </div>

        <div>
          <h3 class="text-base font-bold text-ink-900 dark:text-white leading-snug">${escapeHtml(rep.title)}</h3>
          <p class="mt-1 text-sm text-ink-600 dark:text-ink-300 leading-relaxed line-clamp-3">${escapeHtml(rep.description)}</p>
        </div>

        <div class="flex items-center justify-between text-xs text-ink-600 dark:text-ink-400">
          <span class="font-mono">#${escapeHtml(String(rep.id).slice(0, 8))}</span>
          <span>${formattedDate}</span>
        </div>

        ${renderAdminTracking(rep)}

        <div class="border-t border-ink-200 dark:border-ink-800 pt-3">
          <div class="flex items-center justify-between text-sm font-semibold text-ink-900 dark:text-white">
            <span>${rep.upvotes} dukungan</span>
            <button
              type="button"
              data-action="focus-map"
              data-lat="${escapeHtml(rep.latitude)}"
              data-lng="${escapeHtml(rep.longitude)}"
              aria-label="Lihat lokasi laporan ${escapeHtml(rep.title)} di peta"
              class="font-mono text-xs font-medium text-brand-700 dark:text-brand-400 underline underline-offset-2 hover:text-brand-900 dark:hover:text-brand-300 min-h-[36px] px-1"
            >${Number(rep.latitude).toFixed(4)}, ${Number(rep.longitude).toFixed(4)}</button>
          </div>
          <div class="meter mt-2" role="img" aria-label="Dukungan ${pct} persen dari laporan paling didukung"><span style="width:${pct}%"></span></div>
        </div>

        <button
          type="button"
          data-action="upvote"
          data-id="${escapeHtml(rep.id)}"
          aria-pressed="${isUpvoted}"
          aria-label="${isUpvoted ? 'Batalkan dukungan' : 'Dukung'} laporan ${escapeHtml(rep.title)}, ${rep.upvotes} dukungan"
          class="btn w-full ${isUpvoted ? 'btn-primary' : 'btn-ghost'}"
        >${isUpvoted ? 'Batalkan dukungan' : 'Dukung laporan ini'}</button>
      </div>
    </article>
  `;
}

export function bindBoardEvents() {
  document.querySelectorAll('.cat-pill').forEach((btn) => {
    btn.addEventListener('click', () => setFilterCategory(btn.dataset.cat));
  });
  document.querySelectorAll('[data-scope]').forEach((tab) => {
    tab.addEventListener('click', () => setScope(tab.dataset.scope));
  });
  document.getElementById('filter-status').addEventListener('change', renderPublicBoard);
  document.getElementById('sort-reports').addEventListener('change', renderPublicBoard);
  document.getElementById('search-reports').addEventListener('input', renderPublicBoard);
}
