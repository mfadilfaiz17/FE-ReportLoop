// Fitur peta kampus Leaflet: marker laporan, target laporan baru, preset lokasi, dan GPS.

import { CAMPUS_CENTER, CAMPUS_BOUNDARY } from '../config/constants.js';
import { state } from '../state/store.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { showToast } from '../utils/toast.js';
import { getStatusPinColor, STATUS_LABEL, CATEGORY_LABEL } from '../utils/badges.js';

export function initCampusMap() {
  const mapEl = document.getElementById('campus-map');
  if (!mapEl) return;
  if (state.map) {
    state.map.remove();
    state.map = null;
    state.targetMarker = null;
    state.reportMarkersLayer = null;
  }

  if (typeof L === 'undefined') {
    mapEl.innerHTML =
      '<div class="state-box"><strong>Peta tidak dapat dimuat</strong>Periksa koneksi internet Anda lalu muat ulang halaman. Anda tetap bisa mengisi koordinat secara manual pada formulir.</div>';
    return;
  }

  state.map = L.map('campus-map', {
    center: CAMPUS_CENTER,
    zoom: 17,
    zoomControl: true,
  });

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap',
  }).addTo(state.map);

  L.polygon(CAMPUS_BOUNDARY, {
    color: '#1d4ed8',
    weight: 1.5,
    dashArray: '5, 5',
    fillColor: '#1d4ed8',
    fillOpacity: 0.05,
  })
    .addTo(state.map)
    .bindTooltip('Area kampus Politeknik Negeri Indramayu', { sticky: false });

  state.reportMarkersLayer = L.layerGroup().addTo(state.map);

  const latInput = document.getElementById('input-lat');
  const lngInput = document.getElementById('input-lng');
  if (!latInput || !lngInput) return;

  const initialLat = parseFloat(latInput.value);
  const initialLng = parseFloat(lngInput.value);
  const targetIcon = L.divIcon({
    className: 'custom-target-pin',
    html: '<div class="target-pin-pulse"></div>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

  state.targetMarker = L.marker([initialLat, initialLng], {
    icon: targetIcon,
    draggable: true,
    keyboard: false,
  }).addTo(state.map);

  state.targetMarker.bindPopup('<b>Titik laporan baru</b><br/>Geser pin atau klik peta untuk memindahkan.');

  state.targetMarker.on('dragend', function (e) {
    const pos = e.target.getLatLng();
    updateSelectedCoordinates(pos.lat, pos.lng);
  });

  state.map.on('click', function (e) {
    updateSelectedCoordinates(e.latlng.lat, e.latlng.lng);
  });

  renderMapMarkers();
}

export function updateSelectedCoordinates(lat, lng) {
  const fixedLat = Number(lat).toFixed(5);
  const fixedLng = Number(lng).toFixed(5);
  document.getElementById('input-lat').value = fixedLat;
  document.getElementById('input-lng').value = fixedLng;
  const badge = document.getElementById('map-coord-badge');
  if (badge) badge.textContent = `${fixedLat}, ${fixedLng}`;
  if (state.targetMarker) {
    state.targetMarker.setLatLng([parseFloat(fixedLat), parseFloat(fixedLng)]);
  }
}

export function syncMarkerFromInputs() {
  const lat = parseFloat(document.getElementById('input-lat').value);
  const lng = parseFloat(document.getElementById('input-lng').value);
  if (!isNaN(lat) && !isNaN(lng)) {
    updateSelectedCoordinates(lat, lng);
    if (state.map) state.map.panTo([lat, lng]);
  }
}

export function selectPresetLocation(lat, lng, label) {
  updateSelectedCoordinates(lat, lng);
  if (state.map) {
    state.map.setView([lat, lng], 18);
  }
  showToast(`Titik pin dipindahkan ke ${label}`, 'info');
}

export function useDeviceGeolocation() {
  const btn = document.getElementById('btn-use-gps');
  const labelEl = document.getElementById('gps-btn-label');

  if (!navigator.geolocation) {
    showToast('Browser Anda tidak mendukung fitur lokasi GPS otomatis.', 'error');
    return;
  }

  if (btn) {
    btn.disabled = true;
    btn.setAttribute('aria-busy', 'true');
  }
  if (labelEl) labelEl.textContent = 'Mencari koordinat GPS...';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      updateSelectedCoordinates(latitude, longitude);
      if (state.map) state.map.setView([latitude, longitude], 18);
      if (btn) {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
      }
      if (labelEl) labelEl.textContent = 'Gunakan Lokasi GPS Saya';
      showToast('Titik laporan berhasil diperbarui dari lokasi GPS perangkat.', 'success');
    },
    (err) => {
      if (btn) {
        btn.disabled = false;
        btn.removeAttribute('aria-busy');
      }
      if (labelEl) labelEl.textContent = 'Gunakan Lokasi GPS Saya';
      const msg =
        err.code === 1
          ? 'Izin lokasi ditolak. Aktifkan izin lokasi browser atau klik titik langsung di peta.'
          : 'Gagal mendapatkan sinyal GPS. Silakan pilih titik langsung di peta kampus.';
      showToast(msg, 'error');
    },
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
  );
}

export function focusMapOn(lat, lng, zoom = 19) {
  if (state.map) {
    state.map.setView([lat, lng], zoom);
  }
}

export function invalidateMapSize() {
  if (state.map) state.map.invalidateSize();
}

export function renderMapMarkers() {
  if (!state.reportMarkersLayer) return;
  state.reportMarkersLayer.clearLayers();

  state.reports.forEach((rep) => {
    const color = getStatusPinColor(rep.status);
    const pinHtml = `
      <div style="
        width: 26px;
        height: 26px;
        background: ${color};
        border: 3px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 2px 6px rgba(15,23,42,0.35);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <div style="width: 7px; height: 7px; background: #fff; border-radius: 50%; transform: rotate(45deg);"></div>
      </div>
    `;

    const icon = L.divIcon({
      className: 'report-status-pin',
      html: pinHtml,
      iconSize: [26, 26],
      iconAnchor: [13, 26],
      popupAnchor: [0, -24],
    });

    const marker = L.marker([rep.latitude, rep.longitude], { icon, keyboard: false });
    marker.bindPopup(`
      <div style="min-width: 190px;">
        <div style="font-size: 12px; font-weight: 700; color: ${color}; margin-bottom: 2px;">
          ${escapeHtml(STATUS_LABEL[rep.status] || rep.status)} \u2022 ${escapeHtml(CATEGORY_LABEL[rep.category] || rep.category)}
        </div>
        <div style="font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 4px;">
          ${escapeHtml(rep.title)}
        </div>
        <div style="font-size: 12px; color: #475569; margin-bottom: 6px;">
          ${escapeHtml(rep.description)}
        </div>
        <div style="font-size: 12px; font-weight: 700; color: #1e3a8a;">
          ${rep.upvotes} dukungan
        </div>
      </div>
    `);
    marker.addTo(state.reportMarkersLayer);
  });
}

export function bindMapEvents() {
  const lat = document.getElementById('input-lat');
  const lng = document.getElementById('input-lng');
  if (lat) lat.addEventListener('change', syncMarkerFromInputs);
  if (lng) lng.addEventListener('change', syncMarkerFromInputs);

  const gpsBtn = document.getElementById('btn-use-gps');
  if (gpsBtn) gpsBtn.addEventListener('click', useDeviceGeolocation);

  document.querySelectorAll('[data-preset-lat]').forEach((btn) => {
    btn.addEventListener('click', () => {
      selectPresetLocation(
        parseFloat(btn.dataset.presetLat),
        parseFloat(btn.dataset.presetLng),
        btn.dataset.presetLabel
      );
    });
  });
}
