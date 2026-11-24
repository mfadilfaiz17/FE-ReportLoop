// ==========================================================================
// ReportLoop - Fitur form laporan + aksi laporan
// Tebakan kategori, validasi umur foto, kirim laporan (FastAPI / demo),
// deteksi duplikat radius 15 m, dukungan (upvote), dan ubah status.
// renderAll dikirim sebagai argumen supaya tidak ada impor melingkar.
// Di React bisa jadi <ReportForm /> + hook useReports().
// ==========================================================================

import { DUPLICATE_RADIUS_METERS, CAMPUS_BOUNDARY } from '../config/constants.js';
import { state } from '../state/store.js';
import { predictNlpCategory } from '../services/nlp.js';
import { haversineDistanceMeters, isPointInPolygon } from '../services/geo.js';
import { postReport, postUpvote, patchReportStatus } from '../services/api.js';
import { getSession } from '../services/auth.js';
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
  const titleEl = document.getElementById('input-title');
  const descEl = document.getElementById('input-description');
  if (titleEl) titleEl.value = '';
  if (descEl) descEl.value = '';
  clearPhoto();
  updateNlpPreview();
}

function openDuplicate(existing, distance, payload, renderAll) {
  openDuplicateModal(existing, distance, payload, {
    onUpvote: async (id) => {
      if (await upvoteReport(id, renderAll)) resetReportForm();
    },
    onForceSubmit: (saved) => forceSubmitReport(saved, renderAll),
  });
}

export function finalizeCreateReport(payload, renderAll) {
  const session = getSession();
  const newReport = {
    id: 'rep-' + (window.crypto && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(16).slice(2, 10)),
    user_id: session?.id || null,
    reporter_name: session?.name || null,
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

function isStalePhotoError(data) {
  const detail = data && typeof data === 'object' ? (data.detail ?? data) : data;
  const text = typeof detail === 'string' ? detail : JSON.stringify(detail || {});
  return /STALE_PHOTO|foto lama|24 jam/i.test(text);
}

async function forceSubmitReport(payload, renderAll) {
  if (!(state.isLiveApi && payload.photoFile)) {
    finalizeCreateReport(payload, renderAll);
    return;
  }

  setSubmitLoading(true);
  try {
    const res = await postReport({
      title: payload.title,
      description: payload.description,
      latitude: payload.latitude,
      longitude: payload.longitude,
      photoFile: payload.photoFile,
      forceSubmit: true,
    });
    const data = await res.json().catch(() => ({}));

    if (res.ok && data && data.id) {
      state.reports.unshift(data);
      state.upvotedIds.add(data.id);
      resetReportForm();
      renderAll();
      focusMapOn(data.latitude ?? payload.latitude, data.longitude ?? payload.longitude, 18);
      showToast(`Laporan tersimpan di server (${CATEGORY_LABEL[data.category] || data.category || payload.nlp.category}).`, 'success');
      return;
    }

    const errMsg = typeof data.detail === 'string' ? data.detail : data.detail?.message;
    showToast(errMsg || `Server menolak laporan (kode ${res.status}). Laporan belum tersimpan, silakan coba lagi.`, 'error');
  } catch (err) {
    showToast('Server FastAPI tidak terjangkau. Laporan belum tersimpan, silakan coba lagi.', 'error');
  } finally {
    setSubmitLoading(false);
  }
}

export async function handleReportSubmit(event, renderAll) {
  event.preventDefault();
  hideStaleAlert();

  const form = event.currentTarget instanceof HTMLFormElement
    ? event.currentTarget
    : document.getElementById('report-form');
  const titleEl = form?.querySelector('#input-title') || document.getElementById('input-title');
  const descEl = form?.querySelector('#input-description') || document.getElementById('input-description');
  const latEl = form?.querySelector('#input-lat') || document.getElementById('input-lat');
  const lngEl = form?.querySelector('#input-lng') || document.getElementById('input-lng');

  if (!titleEl || !descEl || !latEl || !lngEl) {
    showToast('Elemen form laporan tidak lengkap. Muat ulang halaman dan coba lagi.', 'error');
    return;
  }

  const title = titleEl.value.trim();
  const description = descEl.value.trim();
  const latitude = parseFloat(latEl.value);
  const longitude = parseFloat(lngEl.value);

  if (!title || !description) {
    showToast('Isi judul dan deskripsi laporan terlebih dahulu.', 'error');
    return;
  }
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    showToast('Koordinat belum valid. Pilih titik di peta atau isi latitude dan longitude.', 'error');
    return;
  }
  if (!isPointInPolygon(latitude, longitude, CAMPUS_BOUNDARY)) {
    showToast('Lokasi di luar area kampus Politeknik Negeri Indramayu. Pilih titik di dalam area kampus pada peta.', 'error');
    return;
  }
  if (!state.currentPhotoFile) {
    showToast('Ambil dan lampirkan foto bukti langsung di lokasi.', 'error');
    return;
  }

  // Lapis 1: validasi umur foto
  if (state.isStalePhoto) {
    showStaleAlert();
    showToast('Foto lama (lebih dari 24 jam) ditolak. Ambil foto terbaru di lokasi.', 'error');
    return;
  }

  const nlp = predictNlpCategory(title, description);
  const candidate = { title, description, latitude, longitude, nlp, photoUrl: state.currentPhotoDataUrl, photoFile: state.currentPhotoFile };

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

      const rawText = await res.text();
      let data = {};
      try {
        data = rawText ? JSON.parse(rawText) : {};
      } catch (_) {
        data = { detail: rawText || null };
      }

      if (res.status === 400 && isStalePhotoError(data)) {
        state.isStalePhoto = true;
        const submitBtn = document.getElementById('btn-submit-report');
        if (submitBtn) submitBtn.disabled = true;
        showStaleAlert();
        const detailMsg = typeof data.detail === 'string' ? data.detail : data.detail?.message;
        showToast(detailMsg || 'Foto lama (lebih dari 24 jam) ditolak. Ambil foto terbaru di lokasi.', 'error');
        return;
      }
      if (res.status === 409) {
        const existing = data.detail?.existing_report || data.existing_report;
        if (existing) {
          openDuplicate(existing, existing.distance_meters, candidate, renderAll);
        } else {
          const dupMsg = typeof data.detail === 'string' ? data.detail : data.detail?.message;
          showToast(dupMsg || 'Laporan serupa sudah ada di sekitar lokasi ini.', 'warning');
        }
        return;
      }
      if (res.ok) {
        const savedReport = data && typeof data === 'object' && data.id ? data : null;
        if (savedReport) {
          state.reports.unshift(savedReport);
          state.upvotedIds.add(savedReport.id);
          resetReportForm();
          renderAll();
          focusMapOn(savedReport.latitude ?? latitude, savedReport.longitude ?? longitude, 18);
          showToast(`Laporan tersimpan di server (${CATEGORY_LABEL[savedReport.category] || savedReport.category || candidate.nlp.category}).`, 'success');
          return;
        }
        showToast('Respons server berhasil tetapi format data laporan tidak lengkap.', 'error');
        return;
      }
      const errMsg = typeof data.detail === 'string' ? data.detail : data.detail?.message;
      showToast(errMsg || `Server menolak laporan (kode ${res.status}). Laporan belum tersimpan, silakan coba lagi.`, 'error');
      return;
    } catch (err) {
      const reason = err && err.message ? ` (${err.message})` : '';
      showToast(`Server FastAPI tidak terjangkau${reason}. Laporan diproses dalam mode demo.`, 'warning');
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

const pendingUpvotes = new Set();

// Mengembalikan true hanya bila dukungan baru tercatat.
export async function upvoteReport(reportId, renderAll) {
  const target = state.reports.find((r) => String(r.id) === String(reportId));
  const key = target ? target.id : reportId;
  const pendingKey = String(reportId);

  if (state.upvotedIds.has(key)) {
    showToast('Anda sudah mendukung laporan ini.', 'info');
    return false;
  }
  if (pendingUpvotes.has(pendingKey)) return false;
  if (!target && !state.isLiveApi) return false;

  pendingUpvotes.add(pendingKey);
  try {
    if (state.isLiveApi) {
      const result = await postUpvote(reportId);
      if (result && result.status === 409) {
        state.upvotedIds.add(key);
        renderAll();
        showToast('Anda sudah mendukung laporan ini.', 'info');
        return false;
      }
      if (!result || !result.ok) {
        showToast('Gagal mengirim dukungan ke server FastAPI.', 'error');
        return false;
      }
      if (target && result.data && typeof result.data === 'object') {
        Object.assign(target, result.data);
      }
    } else {
      target.upvotes += 1;
    }

    state.upvotedIds.add(key);
    renderAll();
    showToast(target ? `Dukungan Anda untuk "${target.title}" tercatat.` : 'Dukungan Anda tercatat.', 'success');
    return true;
  } finally {
    pendingUpvotes.delete(pendingKey);
  }
}

export async function updateReportStatus(reportId, newStatus, renderAll) {
  const target = state.reports.find((r) => String(r.id) === String(reportId));
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
  const titleEl = form.querySelector('#input-title') || document.getElementById('input-title');
  const descEl = form.querySelector('#input-description') || document.getElementById('input-description');
  if (titleEl) titleEl.addEventListener('input', debouncedNlpPreview);
  if (descEl) descEl.addEventListener('input', debouncedNlpPreview);
  form.addEventListener('submit', (e) => handleReportSubmit(e, renderAll));
}
