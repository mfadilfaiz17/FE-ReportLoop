// Fitur foto bukti: unggah kamera/galeri, validasi MIME & ukuran maks 5 MB, dan foto contoh.

import { state } from '../state/store.js';
import { showToast } from '../utils/toast.js';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

export function handlePhotoChange(event) {
  const file = event.target.files[0];
  if (!file) return;

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    event.target.value = '';
    state.currentPhotoFile = null;
    showToast('Format foto harus JPG, PNG, atau WebP.', 'error');
    return;
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    event.target.value = '';
    state.currentPhotoFile = null;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    showToast(`Ukuran foto (${sizeMb} MB) melebihi batas maksimal 5 MB.`, 'error');
    return;
  }

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
    showToast('Foto tidak bisa dibaca. Pilih file gambar lain.', 'error');
  };
  reader.readAsDataURL(file);
}

export function useSamplePhoto() {
  const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ');
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
      <rect width="640" height="360" fill="#1e3a8a"/>
      <text x="320" y="170" fill="#ffffff" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">FOTO CONTOH UNTUK UJI COBA</text>
      <text x="320" y="205" fill="#dbeafe" font-family="monospace" font-size="14" text-anchor="middle">${timestamp}</text>
    </svg>
  `;
  state.currentPhotoDataUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  state.currentPhotoFile = null;
  document.getElementById('photo-preview-img').src = state.currentPhotoDataUrl;
  document.getElementById('photo-filename').textContent = 'foto-contoh.svg';
  document.getElementById('photo-preview-wrapper').classList.remove('hidden');
  showToast('Foto contoh dilampirkan (hanya untuk uji coba).', 'info');
}

export function clearPhoto() {
  state.currentPhotoDataUrl = null;
  state.currentPhotoFile = null;
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
  document.getElementById('btn-sample-photo').addEventListener('click', useSamplePhoto);
  document.getElementById('btn-clear-photo').addEventListener('click', clearPhoto);
  document.getElementById('btn-hide-stale').addEventListener('click', hideStaleAlert);
}
