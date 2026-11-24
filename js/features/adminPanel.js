// Fitur panel admin Sarpras: ringkasan KPI, antrean triase prioritas dukungan, dan filter.

import { state } from '../state/store.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import {
  getCategoryBadgeClass,
  getStatusBadgeClass,
  STATUS_LABEL,
  CATEGORY_LABEL,
} from '../utils/badges.js';

function renderKpis() {
  const { reports } = state;
  const count = (status) => reports.filter((r) => r.status === status).length;
  document.getElementById('kpi-total').textContent = reports.length;
  document.getElementById('kpi-received').textContent = count('Received');
  document.getElementById('kpi-progress').textContent = count('In Progress');
  document.getElementById('kpi-resolved').textContent = count('Resolved');
}

function formatReportDate(value) {
  const t = Date.parse(value);
  if (!Number.isFinite(t)) return '';
  return new Date(t).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function safePhotoUrl(url) {
  const u = String(url || '');
  return /^(data:image\/|https?:\/\/|\/|\.{0,2}\/)/i.test(u) ? u : '';
}

function renderStatusHistory(rep) {
  if (!Array.isArray(rep.status_history) || rep.status_history.length === 0) return '';
  const items = rep.status_history
    .slice(-3)
    .reverse()
    .map((h) => {
      const from = STATUS_LABEL[h.from] || h.from;
      const to = STATUS_LABEL[h.to] || h.to;
      const when = formatReportDate(h.at);
      return `<li>${escapeHtml(from)} \u2192 ${escapeHtml(to)} oleh ${escapeHtml(h.by || 'petugas')}${when ? ' \u2022 ' + escapeHtml(when) : ''}</li>`;
    })
    .join('');
  return `<ul class="mt-2 space-y-0.5 text-xs text-ink-600 dark:text-ink-400" aria-label="Riwayat status">${items}</ul>`;
}

function renderActionButtons(rep) {
  const title = escapeHtml(rep.title);
  const id = escapeHtml(rep.id);

  if (rep.status === 'Resolved') {
    return '<span class="text-sm font-semibold text-green-700 dark:text-green-400">Sudah selesai</span>';
  }

  const progressBtn =
    rep.status === 'Received'
      ? `<button type="button" data-action="set-status" data-id="${id}" data-status="In Progress"
           aria-label="Mulai perbaikan: ${title}" class="btn btn-sm btn-primary">Mulai perbaikan</button>`
      : '';

  const resolvedBtn =
    rep.status === 'In Progress'
      ? `<button type="button" data-action="set-status" data-id="${id}" data-status="Resolved"
      aria-label="Tandai selesai: ${title}" class="btn btn-sm btn-primary">Tandai selesai</button>`
      : '';

  return progressBtn + resolvedBtn;
}

function renderQueueRow(rep, rank) {
  const statusText = STATUS_LABEL[rep.status] || rep.status;
  const catText = CATEGORY_LABEL[rep.category] || rep.category;
  const confidence = Number.isFinite(rep.nlp_confidence)
    ? `Tebakan kategori ${(rep.nlp_confidence * 100).toFixed(0)}%`
    : '';

  return `
    <article class="p-4 sm:p-5 grid gap-3 lg:grid-cols-12 lg:items-start">
      <div class="lg:col-span-1">
        <p class="text-xs font-semibold text-ink-600 dark:text-ink-400">Urutan</p>
        <p class="text-2xl font-extrabold text-ink-900 dark:text-white font-mono">${rank}</p>
      </div>

      <div class="lg:col-span-6">
        <div class="flex flex-wrap items-center gap-2">
          <span class="${getStatusBadgeClass(rep.status)}">${escapeHtml(statusText)}</span>
          <span class="${getCategoryBadgeClass(rep.category)}">${escapeHtml(catText)}</span>
          <span class="text-xs font-mono text-ink-600 dark:text-ink-400">#${escapeHtml(String(rep.id).slice(0, 8))}</span>
        </div>
        <h3 class="mt-2 text-base font-bold text-ink-900 dark:text-white">${escapeHtml(rep.title)}</h3>
        <p class="mt-1 text-sm text-ink-600 dark:text-ink-300 leading-relaxed line-clamp-2">${escapeHtml(rep.description)}</p>
        <p class="mt-2 text-xs text-ink-600 dark:text-ink-400">
          ${escapeHtml(rep.photo_verification || '')}${confidence ? ' \u2022 ' + confidence : ''}
        </p>
        <p class="mt-1 text-xs text-ink-600 dark:text-ink-400">
          Pelapor: ${escapeHtml(rep.reporter_name || 'Tidak diketahui')}${formatReportDate(rep.created_at) ? ' \u2022 ' + escapeHtml(formatReportDate(rep.created_at)) : ''}
        </p>
        ${safePhotoUrl(rep.photo_url)
          ? `<a href="${escapeHtml(safePhotoUrl(rep.photo_url))}" target="_blank" rel="noopener noreferrer" class="mt-2 inline-block">
               <img src="${escapeHtml(safePhotoUrl(rep.photo_url))}" alt="Foto bukti: ${escapeHtml(rep.title)}" loading="lazy" class="h-20 w-32 rounded-lg border border-ink-200 dark:border-ink-800 object-cover" />
             </a>`
          : ''}
        ${renderStatusHistory(rep)}
      </div>

      <div class="lg:col-span-2">
        <p class="text-xs font-semibold text-ink-600 dark:text-ink-400">Dukungan</p>
        <p class="text-2xl font-extrabold text-brand-700 dark:text-brand-400 font-mono">${escapeHtml(String(rep.upvotes))}</p>
      </div>

      <div class="lg:col-span-3 flex flex-wrap lg:flex-col gap-2">
        ${renderActionButtons(rep)}
        <button type="button" data-action="focus-map"
          data-lat="${escapeHtml(rep.latitude)}" data-lng="${escapeHtml(rep.longitude)}"
          aria-label="Lihat lokasi laporan ${escapeHtml(rep.title)} di peta"
          class="btn btn-sm btn-ghost">Lihat peta</button>
      </div>
    </article>
  `;
}

function emptyQueueMessage() {
  if (state.reports.length === 0) {
    return {
      title: 'Belum ada laporan masuk',
      body: 'Laporan dari mahasiswa akan muncul di sini, diurutkan dari yang paling banyak didukung.',
    };
  }
  return {
    title: 'Tidak ada laporan untuk filter ini',
    body: 'Ubah kategori atau status pada filter untuk melihat laporan lain.',
  };
}

const PAGE_SIZE = 10;
let visibleCount = PAGE_SIZE;

export function renderAdminTable() {
  renderKpis();

  const catFilter = document.getElementById('admin-filter-category').value;
  const statusFilter = document.getElementById('admin-filter-status').value;

  const query = (document.getElementById('admin-search')?.value || '').trim().toLowerCase();
  const sortMode = document.getElementById('admin-sort')?.value || 'upvotes';
  const time = (r) => {
    const t = Date.parse(r.created_at);
    return Number.isFinite(t) ? t : 0;
  };

  const sorted = state.reports
    .filter((r) => {
      const okCat = catFilter === 'ALL' || r.category === catFilter;
      const okStat = statusFilter === 'ALL' || r.status === statusFilter;
      const okQuery =
        !query ||
        [r.title, r.description, r.reporter_name].some((v) =>
          String(v || '').toLowerCase().includes(query)
        );
      return okCat && okStat && okQuery;
    })
    .sort((a, b) => {
      if (sortMode === 'newest') return time(b) - time(a);
      if (sortMode === 'oldest') return time(a) - time(b);
      return b.upvotes - a.upvotes || time(a) - time(b);
    });

  const sortHint = document.getElementById('queue-sort-hint');
  if (sortHint) {
    sortHint.textContent =
      sortMode === 'newest'
        ? 'Diurutkan dari laporan terbaru.'
        : sortMode === 'oldest'
          ? 'Diurutkan dari laporan yang paling lama menunggu.'
          : 'Diurutkan berdasarkan dukungan terbanyak, lalu yang lebih lama.';
  }

  const summary = document.getElementById('queue-summary');
  if (summary) {
    summary.textContent = `Menampilkan ${sorted.length} dari ${state.reports.length} laporan.`;
  }

  const queue = document.getElementById('admin-queue');
  if (sorted.length === 0) {
    const msg = emptyQueueMessage();
    queue.innerHTML = `<div class="state-box"><strong>${msg.title}</strong>${msg.body}</div>`;
    return;
  }

  const shown = sorted.slice(0, visibleCount);
  const remaining = sorted.length - shown.length;
  queue.innerHTML =
    shown.map((rep, i) => renderQueueRow(rep, i + 1)).join('') +
    (remaining > 0
      ? `<div class="p-4 sm:p-5 text-center">
           <button type="button" id="admin-show-more" class="btn btn-sm btn-ghost">Tampilkan lebih banyak (${remaining} lagi)</button>
         </div>`
      : '');
}

export function bindAdminEvents() {
  const resetAndRender = () => {
    visibleCount = PAGE_SIZE;
    renderAdminTable();
  };
  document.getElementById('admin-filter-category').addEventListener('change', resetAndRender);
  document.getElementById('admin-filter-status').addEventListener('change', resetAndRender);
  document.getElementById('admin-sort')?.addEventListener('change', resetAndRender);
  document.getElementById('admin-search')?.addEventListener('input', resetAndRender);
  document.getElementById('admin-queue').addEventListener('click', (event) => {
    if (event.target.closest('#admin-show-more')) {
      visibleCount += PAGE_SIZE;
      renderAdminTable();
    }
  });
}
