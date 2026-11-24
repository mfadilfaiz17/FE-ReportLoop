// Fitur foto bukti: unggah kamera/galeri, validasi MIME & ukuran maks 5 MB, dan cek umur foto (< 24 jam).

import { state } from '../state/store.js';
import { showToast } from '../utils/toast.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_PHOTO_AGE_MS = 24 * 60 * 60 * 1000;

function syncSubmitButtonState() {
  const submitBtn = document.getElementById('btn-submit-report');
  if (!submitBtn) return;
  submitBtn.disabled = Boolean(state.isStalePhoto);
}

export function handlePhotoChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    event.target.value = '';
    state.currentPhotoFile = null;
    state.isStalePhoto = false;
    hideStaleAlert();
    syncSubmitButtonState();
    showToast('Format foto harus JPG, PNG, atau WebP.', 'error');
    return;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    event.target.value = '';
    state.currentPhotoFile = null;
    state.isStalePhoto = false;
    hideStaleAlert();
    syncSubmitButtonState();
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    showToast(`Ukuran foto (${sizeMb} MB) melebihi batas maksimal 5 MB.`, 'error');
    return;
  }

  const isStale = Number.isFinite(file.lastModified) && (Date.now() - file.lastModified) > MAX_PHOTO_AGE_MS;
  state.isStalePhoto = isStale;
  state.currentPhotoFile = file;

  const reader = new FileReader();
  reader.onload = function (e) {
    state.currentPhotoDataUrl = e.target.result;
    document.getElementById('photo-preview-img').src = state.currentPhotoDataUrl;
    const kb = Math.round(file.size / 1024);
    document.getElementById('photo-filename').textContent = `${file.name} (${kb} KB)`;
    document.getElementById('photo-preview-wrapper').classList.remove('hidden');
  };
  reader.onerror = function () {
    state.currentPhotoFile = null;
    state.isStalePhoto = false;
    syncSubmitButtonState();
    showToast('Foto tidak bisa dibaca. Pilih file gambar lain.', 'error');
  };
  reader.readAsDataURL(file);

  if (isStale) {
    showStaleAlert();
    syncSubmitButtonState();
    showToast('Foto lama (lebih dari 24 jam) ditolak. Ambil foto terbaru di lokasi.', 'error');
  } else {
    hideStaleAlert();
    syncSubmitButtonState();
  }
}

export function clearPhoto() {
  state.currentPhotoDataUrl = null;
  state.currentPhotoFile = null;
  state.isStalePhoto = false;
  hideStaleAlert();
  syncSubmitButtonState();
  const input = document.getElementById('input-photo');
  const wrapper = document.getElementById('photo-preview-wrapper');
  if (input) input.value = '';
  if (wrapper) wrapper.classList.add('hidden');
}

export function showStaleAlert() {
  const el = document.getElementById('stale-photo-alert');
  if (el) el.classList.remove('hidden');
}

export function hideStaleAlert() {
  const el = document.getElementById('stale-photo-alert');
  if (el) el.classList.add('hidden');
}

export function bindPhotoEvents() {
  const input = document.getElementById('input-photo');
  if (!input) return;
  input.addEventListener('change', handlePhotoChange);
  document.getElementById('btn-clear-photo').addEventListener('click', clearPhoto);
  document.getElementById('btn-hide-stale').addEventListener('click', hideStaleAlert);
}
