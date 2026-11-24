// Layanan REST API FastAPI + PostGIS (tanpa akses DOM agar siap dipindah ke React).

import { FASTAPI_BASE_URL } from '../config/constants.js';
import { getSession } from './auth.js';

function buildAuthHeaders(extra = {}) {
  const session = getSession();
  const headers = { ...extra };
  if (session && session.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }
  return headers;
}

export async function fetchReports(timeoutMs = 2500) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/reports`, {
      headers: buildAuthHeaders(),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json();
    return Array.isArray(payload) ? payload : Array.isArray(payload?.reports) ? payload.reports : [];
  } finally {
    clearTimeout(timeoutId);
  }
}

export function postReport({ title, description, latitude, longitude, photoFile, forceSubmit = false }) {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('description', description);
  formData.append('latitude', String(latitude));
  formData.append('longitude', String(longitude));
  formData.append('force_submit', String(forceSubmit));
  if (photoFile) {
    formData.append('photo', photoFile);
  }

  return fetch(`${FASTAPI_BASE_URL}/api/reports`, {
    method: 'POST',
    headers: buildAuthHeaders(),
    body: formData,
  });
}

export async function postUpvote(reportId) {
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/reports/${reportId}/upvote`, {
      method: 'POST',
      headers: buildAuthHeaders(),
    });
    return res.ok ? await res.json() : null;
  } catch (_) {
    return null;
  }
}

export async function patchReportStatus(reportId, status) {
  try {
    const res = await fetch(`${FASTAPI_BASE_URL}/api/reports/${reportId}/status`, {
      method: 'PATCH',
      headers: buildAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status }),
    });
    return res.ok ? await res.json() : null;
  } catch (_) {
    return null;
  }
}
