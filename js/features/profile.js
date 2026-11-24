// Kontroler tampilan Profil Akun untuk Mahasiswa dan Admin Sarpras.

import { state } from '../state/store.js';
import { getSession, updateSessionProfile, logout, ROLE_LOGIN } from '../services/auth.js';
import {
  getCategoryBadgeClass,
  getStatusBadgeClass,
  STATUS_LABEL,
  CATEGORY_LABEL,
} from '../utils/badges.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { showToast } from '../utils/toast.js';

export function renderProfilePanel(onSessionUpdated) {
  const container = document.getElementById('profile-container');
  const session = getSession();
  if (!container || !session) return;

  const isAdmin = session.role === 'admin';
  const roleTitle = isAdmin ? 'Petugas Admin Sarpras' : 'Mahasiswa Pelapor';
  const idLabel = isAdmin ? 'Email Terdaftar' : 'Nomor Induk Mahasiswa (NIM)';
  const authMethodLabel = session.provider === 'google' ? 'Google OAuth' : isAdmin ? 'Email & Kata Sandi' : 'NIM & Kata Sandi';
  const sessionDurationLabel = session.rememberMe ? '7 hari (Ingat Saya)' : '8 jam';
  const registeredEmail = session.email || (isAdmin ? session.id : 'Belum diatur');
  const initials = (session.name || 'U')
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase();

  const totalReports = state.reports.length;
  const supportedCount = state.upvotedIds.size;
  const resolvedCount = state.reports.filter((r) => r.status === 'Resolved').length;
  const activeCount = state.reports.filter((r) => r.status !== 'Resolved').length;

  const supportedReports = state.reports.filter((r) => state.upvotedIds.has(r.id));
  const userId = session.id;
  const userReports = !isAdmin
    ? state.reports.filter((r) => String(r.user_id ?? r.reporter_nim ?? r.nim ?? '') === String(userId))
    : [];

  function formatTrackTime(value) {
    const t = Date.parse(value);
    if (!Number.isFinite(t)) return '';
    return new Date(t).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function renderProfileTracking(rep) {
    const stage = rep.status === 'Resolved' ? 3 : rep.status === 'In Progress' ? 2 : 1;
    const latest = Array.isArray(rep.status_history) && rep.status_history.length > 0
      ? rep.status_history[rep.status_history.length - 1]
      : null;
    const noteText = latest
      ? `Admin: ${latest.by || 'Petugas Sarpras'}${formatTrackTime(latest.at) ? ' (' + formatTrackTime(latest.at) + ')' : ''}`
      : 'Menunggu tindakan Admin Sarpras';
    return `
      <div class="mt-2 track-box" aria-label="Progres pengerjaan admin">
        <div class="flex items-center justify-between gap-2 mb-1.5">
          <span class="text-xs font-bold text-ink-900 dark:text-white">Tahap ${stage} dari 3: ${escapeHtml(STATUS_LABEL[rep.status] || rep.status)}</span>
          <span class="text-xs text-ink-600 dark:text-ink-300">${escapeHtml(noteText)}</span>
        </div>
        <div class="track-steps">
          <div class="track-step ${stage >= 1 ? 'is-done' : ''}"><div class="track-bar" aria-hidden="true"></div><span class="track-label">1. Diterima</span></div>
          <div class="track-step ${stage >= 2 ? (stage > 2 ? 'is-done' : 'is-current') : ''}"><div class="track-bar" aria-hidden="true"></div><span class="track-label">2. Diperbaiki</span></div>
          <div class="track-step ${stage >= 3 ? 'is-current' : ''}"><div class="track-bar" aria-hidden="true"></div><span class="track-label">3. Selesai</span></div>
        </div>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <!-- Kartu Identitas Akun -->
      <div class="lg:col-span-5 card p-5 sm:p-6 space-y-5">
        <div class="flex items-center gap-4">
          <div class="w-14 h-14 rounded-2xl bg-brand-700 text-white font-extrabold text-xl flex items-center justify-center shrink-0">
            ${escapeHtml(initials)}
          </div>
          <div class="min-w-0">
            <span class="badge badge-progress">${escapeHtml(roleTitle)}</span>
            <h1 class="mt-1.5 text-xl font-extrabold text-ink-900 dark:text-white truncate">${escapeHtml(session.name)}</h1>
            <p class="text-xs font-mono text-ink-600 dark:text-ink-300 truncate">${escapeHtml(session.id)}</p>
          </div>
        </div>

        <dl class="divide-y divide-ink-200 dark:divide-ink-800 border-y border-ink-200 dark:border-ink-800 text-sm">
          <div class="py-3 flex items-center justify-between gap-3">
            <dt class="text-ink-600 dark:text-ink-300">${idLabel}</dt>
            <dd class="font-mono font-semibold text-ink-900 dark:text-white">${escapeHtml(session.id)}</dd>
          </div>
          ${
            !isAdmin
              ? `<div class="py-3 flex items-center justify-between gap-3">
                  <dt class="text-ink-600 dark:text-ink-300">Email Google</dt>
                  <dd class="font-mono text-xs font-semibold text-ink-900 dark:text-white truncate">${escapeHtml(registeredEmail)}</dd>
                </div>`
              : ''
          }
          <div class="py-3 flex items-center justify-between gap-3">
            <dt class="text-ink-600 dark:text-ink-300">Metode Masuk</dt>
            <dd class="font-semibold text-ink-900 dark:text-white">${escapeHtml(authMethodLabel)}</dd>
          </div>
          <div class="py-3 flex items-center justify-between gap-3">
            <dt class="text-ink-600 dark:text-ink-300">Masa Aktif Sesi</dt>
            <dd class="font-semibold text-ink-900 dark:text-white">${escapeHtml(sessionDurationLabel)}</dd>
          </div>
          <div class="py-3 flex items-center justify-between gap-3">
            <dt class="text-ink-600 dark:text-ink-300">Institusi</dt>
            <dd class="font-semibold text-ink-900 dark:text-white text-right">Politeknik Negeri Indramayu</dd>
          </div>
          <div class="py-3 flex items-center justify-between gap-3">
            <dt class="text-ink-600 dark:text-ink-300">Sumber Data</dt>
            <dd class="font-semibold text-ink-900 dark:text-white">${state.isLiveApi ? 'Server FastAPI Lokal' : 'Mode Demo Lokal'}</dd>
          </div>
        </dl>

        <!-- Form Ubah Nama & Email Akun -->
        <form id="profile-name-form" class="space-y-3">
          <div>
            <label for="profile-input-name" class="label">Nama tampilan</label>
            <input id="profile-input-name" type="text" required minlength="3" value="${escapeHtml(session.name)}" class="field" />
          </div>
          ${
            !isAdmin
              ? `<div>
                  <label for="profile-input-email" class="label">Email Google (untuk pemulihan sandi & OAuth)</label>
                  <input id="profile-input-email" type="email" required placeholder="nama@gmail.com" value="${escapeHtml(session.email || '')}" class="field" />
                </div>`
              : ''
          }
          <div class="flex flex-wrap gap-2">
            <button type="submit" class="btn btn-primary flex-1">Simpan Perubahan</button>
            <button id="btn-profile-logout" type="button" class="btn btn-danger-ghost">Keluar Akun</button>
          </div>
        </form>
      </div>

      <!-- Kolom Kanan: Ringkasan Aktivitas Nyata & Pintasan Menu -->
      <div class="lg:col-span-7 space-y-6">
        <div class="card p-5 sm:p-6">
          <h2 class="text-lg font-extrabold text-ink-900 dark:text-white">Ringkasan aktivitas</h2>
          <p class="hint">Data dihitung langsung dari laporan yang tersimpan pada sesi aktif.</p>

          <dl class="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div class="rounded-xl border border-ink-200 dark:border-ink-800 p-4">
              <dt class="text-xs font-semibold text-ink-600 dark:text-ink-300">Total Laporan Kampus</dt>
              <dd class="mt-1 text-2xl font-extrabold font-mono text-ink-900 dark:text-white">${totalReports}</dd>
            </div>
            <div class="rounded-xl border border-ink-200 dark:border-ink-800 p-4">
              <dt class="text-xs font-semibold text-ink-600 dark:text-ink-300">${isAdmin ? 'Belum Selesai' : 'Laporan Didukung'}</dt>
              <dd class="mt-1 text-2xl font-extrabold font-mono text-brand-700 dark:text-brand-400">${isAdmin ? activeCount : supportedCount}</dd>
            </div>
            <div class="col-span-2 sm:col-span-1 rounded-xl border border-ink-200 dark:border-ink-800 p-4">
              <dt class="text-xs font-semibold text-ink-600 dark:text-ink-300">Laporan Selesai</dt>
              <dd class="mt-1 text-2xl font-extrabold font-mono text-green-700 dark:text-green-400">${resolvedCount}</dd>
            </div>
          </dl>

          <div class="mt-5 pt-4 border-t border-ink-200 dark:border-ink-800 flex flex-wrap gap-2">
            ${
              isAdmin
                ? `<button type="button" data-nav-view="antrean" class="btn btn-sm btn-primary">Buka Antrean Triase</button>
                   <button type="button" data-nav-view="peta" class="btn btn-sm btn-ghost">Buka Peta Kampus</button>`
                : `<button type="button" data-nav-view="lapor" class="btn btn-sm btn-primary">Buat Laporan Baru</button>
                   <button type="button" data-nav-view="papan" data-board-scope="user" class="btn btn-sm btn-ghost">Buka Papan Laporan</button>`
            }
          </div>
        </div>

        ${
          !isAdmin
            ? `<div class="card p-5 sm:p-6">
                <h2 class="text-lg font-extrabold text-ink-900 dark:text-white">Pelacakan laporan saya (${userReports.length})</h2>
                <p class="hint">Pantau tahapan pengerjaan Admin Sarpras dari laporan yang Anda kirim.</p>
                ${
                  userReports.length === 0
                    ? `<div class="mt-4 rounded-xl border border-ink-200 dark:border-ink-800 p-5 text-center text-sm text-ink-600 dark:text-ink-300">
                        Anda belum mengirim laporan. Buka <button type="button" data-nav-view="lapor" class="font-semibold text-brand-700 dark:text-brand-400 underline">Peta &amp; Lapor</button> untuk membuat laporan baru.
                       </div>`
                    : `<ul class="mt-4 divide-y divide-ink-200 dark:divide-ink-800">
                        ${userReports
                          .map(
                            (r) => `
                            <li class="py-3.5 space-y-2">
                              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div class="min-w-0">
                                  <div class="flex flex-wrap items-center gap-1.5">
                                    <span class="${getStatusBadgeClass(r.status)}">${escapeHtml(STATUS_LABEL[r.status] || r.status)}</span>
                                    <span class="${getCategoryBadgeClass()}">${escapeHtml(CATEGORY_LABEL[r.category] || r.category)}</span>
                                  </div>
                                  <p class="mt-1 font-bold text-sm text-ink-900 dark:text-white truncate">${escapeHtml(r.title)}</p>
                                </div>
                                <button
                                  type="button"
                                  data-action="focus-map"
                                  data-lat="${escapeHtml(r.latitude)}"
                                  data-lng="${escapeHtml(r.longitude)}"
                                  class="btn btn-sm btn-ghost shrink-0"
                                >
                                  Lihat di Peta
                                </button>
                              </div>
                              ${renderProfileTracking(r)}
                            </li>`
                          )
                          .join('')}
                       </ul>`
                }
              </div>
              <div class="card p-5 sm:p-6">
                <h2 class="text-lg font-extrabold text-ink-900 dark:text-white">Laporan yang Anda dukung (${supportedReports.length})</h2>
                <p class="hint">Daftar laporan fasilitas kampus yang telah Anda beri dukungan (+1 Upvote).</p>
                ${
                  supportedReports.length === 0
                    ? `<div class="mt-4 rounded-xl border border-ink-200 dark:border-ink-800 p-5 text-center text-sm text-ink-600 dark:text-ink-300">
                        Belum ada laporan yang didukung. Buka <button type="button" data-nav-view="papan" class="font-semibold text-brand-700 dark:text-brand-400 underline">Papan Laporan</button> untuk memberi dukungan.
                       </div>`
                    : `<ul class="mt-4 divide-y divide-ink-200 dark:divide-ink-800">
                        ${supportedReports
                          .map(
                            (r) => `
                            <li class="py-3.5 space-y-2">
                              <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div class="min-w-0">
                                  <div class="flex flex-wrap items-center gap-1.5">
                                    <span class="${getStatusBadgeClass(r.status)}">${escapeHtml(STATUS_LABEL[r.status] || r.status)}</span>
                                    <span class="${getCategoryBadgeClass()}">${escapeHtml(CATEGORY_LABEL[r.category] || r.category)}</span>
                                  </div>
                                  <p class="mt-1 font-bold text-sm text-ink-900 dark:text-white truncate">${escapeHtml(r.title)}</p>
                                </div>
                                <button
                                  type="button"
                                  data-action="focus-map"
                                  data-lat="${escapeHtml(r.latitude)}"
                                  data-lng="${escapeHtml(r.longitude)}"
                                  class="btn btn-sm btn-ghost shrink-0"
                                >
                                  Lihat di Peta
                                </button>
                              </div>
                              ${renderProfileTracking(r)}
                            </li>`
                          )
                          .join('')}
                       </ul>`
                }
              </div>`
            : ''
        }
      </div>
    </div>
  `;

  const nameForm = document.getElementById('profile-name-form');
  if (nameForm) {
    nameForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nameInput = document.getElementById('profile-input-name');
      const emailInput = document.getElementById('profile-input-email');
      try {
        const updates = { name: nameInput.value };
        if (!isAdmin && emailInput) {
          updates.email = emailInput.value;
        }
        const updated = updateSessionProfile(updates);
        if (onSessionUpdated) onSessionUpdated(updated);
        renderProfilePanel(onSessionUpdated);
        showToast('Profil akun berhasil diperbarui.', 'success');
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  const logoutBtn = document.getElementById('btn-profile-logout');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      logout();
      window.location.replace(ROLE_LOGIN[session.role]);
    });
  }
}
