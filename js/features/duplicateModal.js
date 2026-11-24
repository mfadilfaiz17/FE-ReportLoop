// ==========================================================================
// ReportLoop - Fitur modal laporan serupa (radius 15 m)
// Buka/tutup modal, fokus keyboard (Esc + Tab trap), dan callback aksi.
// Aksi dukung dan kirim paksa diterima lewat callback supaya modul ini
// tidak bergantung ke fitur lain. Di React bisa jadi <DuplicateModal />.
// ==========================================================================

import { state } from '../state/store.js';
import { CATEGORY_LABEL } from '../utils/badges.js';

const MODAL_ID = 'duplicate-modal';

export function openDuplicateModal(existingReport, distanceMeters, candidatePayload, { onUpvote, onForceSubmit }) {
  state.pendingSubmission = candidatePayload;

  document.getElementById('dup-modal-message').textContent =
    `Laporan serupa sudah ada ${distanceMeters} meter dari titik ini. Dukung laporan tersebut agar lebih cepat ditangani Sarpras.`;
  document.getElementById('dup-existing-cat').textContent =
    CATEGORY_LABEL[existingReport.category] || existingReport.category;
  document.getElementById('dup-existing-dist').textContent = `Jarak ${distanceMeters} m`;
  document.getElementById('dup-existing-title').textContent = existingReport.title;
  document.getElementById('dup-existing-id').textContent = String(existingReport.id).slice(0, 8);
  document.getElementById('dup-existing-upvotes').textContent = existingReport.upvotes;

  document.getElementById('btn-dup-upvote').onclick = function () {
    closeDuplicateModal();
    if (onUpvote) onUpvote(existingReport.id);
  };

  document.getElementById('btn-dup-force').onclick = function () {
    const saved = state.pendingSubmission;
    closeDuplicateModal();
    if (saved && onForceSubmit) onForceSubmit(saved);
  };

  state.modalReturnFocusEl = document.activeElement;
  document.getElementById(MODAL_ID).classList.remove('hidden');
  document.getElementById('btn-dup-upvote').focus();
}

export function closeDuplicateModal() {
  document.getElementById(MODAL_ID).classList.add('hidden');
  state.pendingSubmission = null;
  if (state.modalReturnFocusEl && typeof state.modalReturnFocusEl.focus === 'function') {
    state.modalReturnFocusEl.focus();
  }
  state.modalReturnFocusEl = null;
}

// Dukungan keyboard modal: Esc untuk menutup, Tab terkunci di dalam modal
export function bindDuplicateModalEvents() {
  const modal = document.getElementById(MODAL_ID);
  if (!modal) return;

  // Klik pada latar gelap (di luar kotak dialog) menutup modal
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeDuplicateModal();
  });

  document.addEventListener('keydown', (event) => {
    if (modal.classList.contains('hidden')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeDuplicateModal();
      return;
    }

    if (event.key === 'Tab') {
      const focusable = modal.querySelectorAll('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}
