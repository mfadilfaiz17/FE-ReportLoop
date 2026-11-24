// ==========================================================================
// ReportLoop - Fitur form laporan + aksi laporan
// Tebakan kategori, validasi umur foto, kirim laporan (FastAPI / demo),
// deteksi duplikat radius 15 m, dukungan (upvote), dan ubah status.
// renderAll dikirim sebagai argumen supaya tidak ada impor melingkar.
// Di React bisa jadi <ReportForm /> + hook useReports().
// ==========================================================================

import { DUPLICATE_RADIUS_METERS } from '../config/constants.js';
import { state } from '../state/store.js';
import { predictNlpCategory } from '../services/nlp.js';
import { haversineDistanceMeters } from '../services/geo.js';
import { postReport, postUpvote, patchReportStatus } from '../services/api.js';
import { showToast } from '../utils/toast.js';
import { getCategoryBadgeClass, CATEGORY_LABEL } from '../utils/badges.js';
import { clearPhoto, showStaleAlert, hideStaleAlert } from './photo.js';
import { focusMapOn } from './map.js';
import { openDuplicateModal } from './duplicateModal.js';

let nlpDebounceTimer = null;

export function debouncedNlpPreview() {
  clearTimeout(nlpDebounceTimer);
  nlpDebounceTimer = setTimeout(updateNlpPreview, 400);
}

export function updateNlpPreview() {
  const titleEl = document.getElementById('input-title');
  const descEl = document.getElementById('input-description');
  const badge = document.getElementById('nlp-category-badge');
  const confText = document.getElementById('nlp-confidence-text');
  if (!titleEl || !descEl || !badge || !confText) return;

  const result = predictNlpCategory(titleEl.value, descEl.value);
  badge.textContent = CATEGORY_LABEL[result.category] || result.category;
  badge.className = getCategoryBadgeClass(result.category);
  confText.textContent = `Keyakinan: ${(result.confidence * 100).toFixed(1)}%`;
}

function setSubmitLoading(isLoading) {
  const btn = document.getElementById('btn-submit-report');
  if (!btn) return;
  btn.disabled = isLoading;
  btn.setAttribute('aria-busy', String(isLoading));
  btn.textContent = isLoading ? 'Mengirim laporan...' : 'Kirim laporan ke Sarpras';
}

function resetReportForm() {
  document.getElementById('input-title').value = '';
  document.getElementById('input-description').value = '';
  clearPhoto();
  updateNlpPreview();
}

function openDuplicate(existing, distance, payload, renderAll) {
  openDuplicateModal(existing, distance, payload, {
    onUpvote: (id) => {
      upvoteReport(id, renderAll);
      resetReportForm();
    },
    onForceSubmit: (saved) => finalizeCreateReport(saved, renderAll),
  });
}

export function finalizeCreateReport(payload, renderAll) {
  const newReport = {
    id: 'rep-' + (window.crypto && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(16).slice(2, 10)),
    title: payload.title,
    description: payload.description,
    photo_url: payload.photoUrl,
    photo_verification: 'Foto kamera baru',
    latitude: payload.latitude,
    longitude: payload.longitude,
    category: payload.nlp.category,
    nlp_confidence: payload.nlp.confidence,
    status: 'Received',
    upvotes: 1,
    created_at: new Date().toISOString(),
  };

  state.reports.unshift(newReport);
  state.upvotedIds.add(newReport.id);
  resetReportForm();
  renderAll();
  focusMapOn(newReport.latitude, newReport.longitude, 18);

  showToast(
    `Laporan terkirim. Kategori: ${CATEGORY_LABEL[newReport.category] || newReport.category} (${(newReport.nlp_confidence * 100).toFixed(0)}%).`,
    'success'
  );
}

export async function handleReportSubmit(event, renderAll) {
  event.preventDefault();
  hideStaleAlert();

  const title = document.getElementById('input-title').value.trim();
  const description = document.getElementById('input-description').value.trim();
  const latitude = parseFloat(document.getElementById('input-lat').value);
  const longitude = parseFloat(document.getElementById('input-lng').value);
  const exifSim = document.querySelector('input[name="exif_sim"]:checked').value;

  if (!title || !description) {
    showToast('Isi judul dan deskripsi laporan terlebih dahulu.', 'error');
    return;
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    showToast('Koordinat belum valid. Pilih titik di peta atau isi latitude dan longitude.', 'error');
    return;
  }
  if (!state.currentPhotoDataUrl && !state.currentPhotoFile) {
    showToast('Lampirkan foto bukti, atau pakai foto contoh untuk uji coba.', 'error');
    return;
  }

  // Lapis 1: validasi umur foto
  if (exifSim === 'stale') {
    showStaleAlert();
    showToast('Foto lama (lebih dari 24 jam) ditolak. Ambil foto terbaru di lokasi.', 'error');
    return;
  }

  const nlp = predictNlpCategory(title, description);
  const candidate = { title, description, latitude, longitude, nlp, photoUrl: state.currentPhotoDataUrl };

  // Mode FastAPI
  if (state.isLiveApi && state.currentPhotoFile) {
    setSubmitLoading(true);
    try {
      const res = await postReport({
        title,
        description,
        latitude,
        longitude,
        photoFile: state.currentPhotoFile,
        forceSubmit: false,
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 400) {
        showStaleAlert();
        showToast(data.detail || 'Foto lama (lebih dari 24 jam) ditolak. Ambil foto terbaru di lokasi.', 'error');
        return;
      }
      if (res.status === 409) {
        const existing = data.detail?.existing_report;
        if (existing) {
          openDuplicate(existing, existing.distance_meters, candidate, renderAll);
        } else {
          showToast(data.detail || 'Laporan serupa sudah ada di sekitar lokasi ini.', 'warning');
        }
        return;
      }
      if (res.ok) {
        state.reports.unshift(data);
        state.upvotedIds.add(data.id);
        resetReportForm();
        renderAll();
        focusMapOn(data.latitude, data.longitude, 18);
        showToast(`Laporan tersimpan di server (${CATEGORY_LABEL[data.category] || data.category}).`, 'success');
        return;
      }
      showToast(`Server menolak laporan (kode ${res.status}). Laporan belum tersimpan, silakan coba lagi.`, 'error');
      return;
    } catch (err) {
      showToast('Server FastAPI tidak terjangkau. Laporan diproses dalam mode demo.', 'warning');
    } finally {
      setSubmitLoading(false);
    }
  }

  // Lapis 2: cek duplikat radius 15 m (Haversine)
  let nearbyDuplicate = null;
  let minDist = Infinity;

  for (const rep of state.reports) {
    if (rep.status !== 'Resolved' && rep.category === nlp.category) {
      const dist = haversineDistanceMeters(latitude, longitude, rep.latitude, rep.longitude);
      if (dist <= DUPLICATE_RADIUS_METERS && dist < minDist) {
        minDist = dist;
        nearbyDuplicate = rep;
      }
    }
  }

  if (nearbyDuplicate) {
    openDuplicate(nearbyDuplicate, Number(minDist.toFixed(1)), candidate, renderAll);
    return;
  }

  // Lapis 3: simpan laporan baru
  finalizeCreateReport(candidate, renderAll);
}

export async function upvoteReport(reportId, renderAll) {
  const target = state.reports.find((r) => r.id === reportId);
  if (!target) return;

  if (state.upvotedIds.has(reportId)) {
    showToast('Anda sudah mendukung laporan ini.', 'info');
    return;
  }

  if (state.isLiveApi) {
    const updated = await postUpvote(reportId);
    if (updated) {
      Object.assign(target, updated);
    } else {
      showToast('Gagal mengirim dukungan ke server FastAPI.', 'error');
      return;
    }
  } else {
    target.upvotes += 1;
  }

  state.upvotedIds.add(reportId);
  renderAll();
  showToast(`Dukungan Anda untuk "${target.title}" tercatat.`, 'success');
}

export async function updateReportStatus(reportId, newStatus, renderAll) {
  const target = state.reports.find((r) => r.id === reportId);
  if (!target) return;

  if (state.isLiveApi) {
    const updated = await patchReportStatus(reportId, newStatus);
    if (updated) {
      Object.assign(target, updated);
    } else {
      showToast('Gagal memperbarui status di server FastAPI.', 'error');
      return;
    }
  } else {
    target.status = newStatus;
  }

  renderAll();
  const label = newStatus === 'In Progress' ? 'Diperbaiki' : newStatus === 'Resolved' ? 'Selesai' : 'Diterima';
  showToast(`Status "${target.title}" diubah menjadi ${label}.`, 'success');
}

// Pasang event form (hanya ada di halaman user)
export function bindFormEvents(renderAll) {
  const form = document.getElementById('report-form');
  if (!form) return;
  document.getElementById('input-title').addEventListener('input', debouncedNlpPreview);
  document.getElementById('input-description').addEventListener('input', debouncedNlpPreview);
  form.addEventListener('submit', (e) => handleReportSubmit(e, renderAll));
}
