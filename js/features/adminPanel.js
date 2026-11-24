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

  const resolvedBtn = `<button type="button" data-action="set-status" data-id="${id}" data-status="Resolved"
      aria-label="Tandai selesai: ${title}" class="btn btn-sm btn-ghost">Tandai selesai</button>`;

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
          <span class="${getStatusBadgeClass(rep.status)}">${statusText}</span>
          <span class="${getCategoryBadgeClass(rep.category)}">${catText}</span>
          <span class="text-xs font-mono text-ink-600 dark:text-ink-400">#${escapeHtml(rep.id.slice(0, 8))}</span>
        </div>
        <h3 class="mt-2 text-base font-bold text-ink-900 dark:text-white">${escapeHtml(rep.title)}</h3>
        <p class="mt-1 text-sm text-ink-600 dark:text-ink-300 leading-relaxed line-clamp-2">${escapeHtml(rep.description)}</p>
        <p class="mt-2 text-xs text-ink-600 dark:text-ink-400">
          ${escapeHtml(rep.photo_verification || '')}${confidence ? ' \u2022 ' + confidence : ''}
        </p>
      </div>

      <div class="lg:col-span-2">
        <p class="text-xs font-semibold text-ink-600 dark:text-ink-400">Dukungan</p>
        <p class="text-2xl font-extrabold text-brand-700 dark:text-brand-400 font-mono">${rep.upvotes}</p>
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

export function renderAdminTable() {
  renderKpis();

  const catFilter = document.getElementById('admin-filter-category').value;
  const statusFilter = document.getElementById('admin-filter-status').value;

  const sorted = state.reports
    .filter((r) => {
      const okCat = catFilter === 'ALL' || r.category === catFilter;
      const okStat = statusFilter === 'ALL' || r.status === statusFilter;
      return okCat && okStat;
    })
    .sort((a, b) => b.upvotes - a.upvotes);

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

  queue.innerHTML = sorted.map((rep, i) => renderQueueRow(rep, i + 1)).join('');
}

export function bindAdminEvents() {
  document.getElementById('admin-filter-category').addEventListener('change', renderAdminTable);
  document.getElementById('admin-filter-status').addEventListener('change', renderAdminTable);
}
