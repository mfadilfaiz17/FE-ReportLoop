// ==========================================================================
// ReportLoop - Layanan autentikasi (MODE DEMO + siap integrasi FastAPI & Google OAuth)
// Akun user dan admin disimpan terpisah di localStorage browser ini saja.
// Kata sandi di-hash PBKDF2-SHA256 + salt per akun, tidak pernah disimpan polos.
// ==========================================================================

import { FASTAPI_BASE_URL } from '../config/constants.js';

const ACCOUNT_KEYS = {
  user: 'reportloop.accounts.user',
  admin: 'reportloop.accounts.admin',
};
const SESSION_KEY = 'reportloop.session';
const SESSION_DEFAULT_AGE_MS = 8 * 60 * 60 * 1000;
const SESSION_REMEMBER_AGE_MS = 7 * 24 * 60 * 60 * 1000;

// Hash SHA-256 kode undangan admin demo (kode polos tidak disimpan di sumber).
const ADMIN_INVITE_HASH_DEMO = 'f4e4f862de2428c313de39ffb206725251f1aa1228781378cf7077470187755c';

export async function isValidInviteCode(code) {
  if (!window.crypto || !crypto.subtle) return false;
  const data = new TextEncoder().encode(`reportloop-invite:${String(code || '').trim()}`);
  return toHex(await crypto.subtle.digest('SHA-256', data)) === ADMIN_INVITE_HASH_DEMO;
}

export const ROLE_HOME = {
  user: 'user.html',
  admin: 'admin.html',
};
export const ROLE_LOGIN = {
  user: 'masuk.html',
  admin: 'admin-masuk.html',
};

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_) {
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_) {
    throw new Error('Penyimpanan browser tidak tersedia. Nonaktifkan mode privat lalu coba lagi.');
  }
}

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPassword(password, salt) {
  if (!window.crypto || !crypto.subtle) {
    throw new Error('Browser ini tidak mendukung penyandian kata sandi. Buka lewat localhost atau HTTPS.');
  }
  const data = new TextEncoder().encode(`${salt}:${password}`);
  return toHex(await crypto.subtle.digest('SHA-256', data));
}

const PBKDF2_ITERATIONS = 210000;

async function hashPasswordStrong(password, salt, iterations = PBKDF2_ITERATIONS) {
  if (!window.crypto || !crypto.subtle) {
    throw new Error('Browser ini tidak mendukung penyandian kata sandi. Buka lewat localhost atau HTTPS.');
  }
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', hash: 'SHA-256', salt: enc.encode(salt), iterations },
    key,
    256
  );
  return toHex(bits);
}

function makeSalt() {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

function normalizeId(role, identifier) {
  const v = String(identifier || '').trim();
  return role === 'admin' ? v.toLowerCase() : v;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Validasi bentuk isian registrasi. Mengembalikan objek { field: pesan } kosong bila lolos.
export function validateRegistration(role, { name, identifier, email, password, confirm, inviteCode }) {
  const errors = {};
  if (!String(name || '').trim() || String(name).trim().length < 3) {
    errors.name = 'Nama lengkap minimal 3 karakter.';
  }
  if (role === 'user') {
    if (!/^\d{6,12}$/.test(String(identifier || '').trim())) {
      errors.identifier = 'NIM harus berupa angka, 6 sampai 12 digit.';
    }
    if (!EMAIL_REGEX.test(String(email || '').trim())) {
      errors.email = 'Masukkan alamat email Google yang valid.';
    }
  } else if (!EMAIL_REGEX.test(String(identifier || '').trim())) {
    errors.identifier = 'Masukkan alamat email yang valid.';
  }
  if (String(password || '').length < 8) {
    errors.password = 'Kata sandi minimal 8 karakter.';
  }
  if (password !== confirm) {
    errors.confirm = 'Konfirmasi kata sandi tidak sama.';
  }
  if (role === 'admin' && !String(inviteCode || '').trim()) {
    errors.inviteCode = 'Isi kode undangan admin.';
  }
  return errors;
}

export async function registerAccount(role, form) {
  if (role === 'admin' && !(await isValidInviteCode(form.inviteCode))) {
    throw new Error('Kode undangan admin tidak cocok.');
  }

  const accounts = readJson(ACCOUNT_KEYS[role], []);
  const id = normalizeId(role, form.identifier);
  const email = role === 'admin' ? id : normalizeEmail(form.email);

  if (accounts.some((a) => a.id === id)) {
    throw new Error(role === 'admin' ? 'Email ini sudah terdaftar sebagai admin.' : 'NIM ini sudah terdaftar.');
  }
  if (role === 'user' && email && accounts.some((a) => normalizeEmail(a.email) === email)) {
    throw new Error('Alamat email ini sudah digunakan oleh akun mahasiswa lain.');
  }

  const salt = makeSalt();
  const hash = await hashPasswordStrong(form.password, salt);
  accounts.push({
    id,
    email,
    name: String(form.name).trim(),
    provider: 'password',
    salt,
    hash,
    algo: 'pbkdf2',
    iterations: PBKDF2_ITERATIONS,
    created_at: new Date().toISOString(),
  });
  writeJson(ACCOUNT_KEYS[role], accounts);
}

function buildSessionPayload(role, account, { rememberMe = false, provider } = {}) {
  const maxAgeMs = rememberMe ? SESSION_REMEMBER_AGE_MS : SESSION_DEFAULT_AGE_MS;
  const now = Date.now();
  return {
    role,
    id: account.id,
    email: account.email || (role === 'admin' ? account.id : ''),
    name: account.name,
    provider: provider || account.provider || 'password',
    rememberMe: Boolean(rememberMe),
    at: now,
    expiresAt: now + maxAgeMs,
  };
}

export async function loginAccount(role, identifier, password, { rememberMe = false } = {}) {
  const accounts = readJson(ACCOUNT_KEYS[role], []);
  const id = normalizeId(role, identifier);
  const account = accounts.find((a) => a.id === id);

  // Pesan sengaja sama untuk akun tak ada dan sandi salah
  const failure = new Error(role === 'admin' ? 'Email atau kata sandi salah.' : 'NIM atau kata sandi salah.');

  const attemptKey = `reportloop.attempts.${role}.${id}`;
  const attempts = readJson(attemptKey, { count: 0, lockedUntil: 0 });
  if (attempts.lockedUntil > Date.now()) {
    const minutes = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
    throw new Error(`Terlalu banyak percobaan gagal. Coba lagi dalam ${minutes} menit.`);
  }

  const registerFailure = () => {
    const count = (attempts.count || 0) + 1;
    writeJson(attemptKey, count >= 5
      ? { count: 0, lockedUntil: Date.now() + 5 * 60 * 1000 }
      : { count, lockedUntil: 0 });
    return failure;
  };

  if (!account) throw registerFailure();
  if (!account.hash && account.provider === 'google') {
    throw new Error('Akun ini terdaftar lewat Google. Gunakan tombol Masuk dengan Google atau atur kata sandi lewat Lupa kata sandi.');
  }

  const isStrong = account.algo === 'pbkdf2';
  const hash = isStrong
    ? await hashPasswordStrong(password, account.salt, account.iterations || PBKDF2_ITERATIONS)
    : await hashPassword(password, account.salt);
  if (hash !== account.hash) throw registerFailure();

  try {
    localStorage.removeItem(attemptKey);
  } catch (_) {
    /* tidak ada yang perlu dilakukan */
  }

  if (!isStrong) {
    const upgraded = await hashPasswordStrong(password, account.salt);
    const list = readJson(ACCOUNT_KEYS[role], []);
    const idx = list.findIndex((a) => a.id === account.id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], hash: upgraded, algo: 'pbkdf2', iterations: PBKDF2_ITERATIONS };
      writeJson(ACCOUNT_KEYS[role], list);
    }
  }

  const session = buildSessionPayload(role, account, { rememberMe });
  writeJson(SESSION_KEY, session);
  return session;
}

// Masuk atau daftar via Google OAuth. Token ID Google (credential) dikirim ke backend FastAPI,
// yang memverifikasinya lalu mengembalikan { id, email, name, token }. Kontrak lengkap ada di README.md.
export async function loginWithGoogleOAuth(role, credential, { nim, inviteCode, rememberMe = false } = {}) {
  if (!credential) {
    throw new Error('Kredensial Google tidak ditemukan. Coba masuk lagi.');
  }

  let res;
  try {
    res = await fetch(`${FASTAPI_BASE_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential,
        role,
        nim: String(nim || '').trim() || undefined,
        invite_code: String(inviteCode || '').trim() || undefined,
      }),
    });
  } catch (_) {
    throw new Error('Server backend tidak dapat dihubungi. Pastikan FastAPI berjalan.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const code = data?.code || data?.detail?.code;
    if (code === 'NIM_REQUIRED' || code === 'INVITE_REQUIRED') {
      const err = new Error(code);
      err.code = code;
      throw err;
    }
    const message = data?.message || (typeof data?.detail === 'string' ? data.detail : data?.detail?.message);
    throw new Error(message || 'Masuk dengan Google gagal.');
  }
  if (!data?.id || !data?.token) {
    throw new Error('Respons backend tidak lengkap. Hubungi pengelola server.');
  }

  const session = buildSessionPayload(
    role,
    { id: data.id, email: data.email, name: data.name },
    { rememberMe, provider: 'google' }
  );
  session.token = data.token;
  writeJson(SESSION_KEY, session);
  return session;
}

// Pemulihan kata sandi (verifikasi kecocokan NIM + Email untuk mahasiswa, atau Email terdaftar untuk admin)
export async function resetAccountPassword(role, { identifier, email, newPassword, confirmPassword }) {
  if (String(newPassword || '').length < 8) {
    throw new Error('Kata sandi baru minimal 8 karakter.');
  }
  if (newPassword !== confirmPassword) {
    throw new Error('Konfirmasi kata sandi baru tidak sama.');
  }

  const accounts = readJson(ACCOUNT_KEYS[role], []);
  let idx = -1;

  if (role === 'user') {
    const cleanNim = String(identifier || '').trim();
    const cleanEmail = normalizeEmail(email);
    if (!/^\d{6,12}$/.test(cleanNim)) {
      throw new Error('Masukkan NIM 6 sampai 12 digit.');
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      throw new Error('Masukkan alamat email terdaftar yang valid.');
    }
    idx = accounts.findIndex((a) => a.id === cleanNim && normalizeEmail(a.email) === cleanEmail);
  } else {
    const cleanEmail = normalizeEmail(identifier || email);
    if (!EMAIL_REGEX.test(cleanEmail)) {
      throw new Error('Masukkan alamat email admin yang valid.');
    }
    idx = accounts.findIndex((a) => normalizeEmail(a.id) === cleanEmail);
  }

  if (idx === -1) {
    throw new Error(
      role === 'user'
        ? 'Kombinasi NIM dan email tidak ditemukan. Pastikan email sesuai saat pendaftaran.'
        : 'Email admin tidak ditemukan di sistem.'
    );
  }

  const salt = makeSalt();
  const hash = await hashPasswordStrong(newPassword, salt);
  accounts[idx] = {
    ...accounts[idx],
    salt,
    hash,
    algo: 'pbkdf2',
    iterations: PBKDF2_ITERATIONS,
    updated_at: new Date().toISOString(),
  };
  writeJson(ACCOUNT_KEYS[role], accounts);

  try {
    localStorage.removeItem(`reportloop.attempts.${role}.${accounts[idx].id}`);
  } catch (_) {
    /* tidak ada yang perlu dilakukan */
  }

  return { id: accounts[idx].id, email: accounts[idx].email };
}

export function getSession() {
  const s = readJson(SESSION_KEY, null);
  if (!s || (s.role !== 'user' && s.role !== 'admin')) return null;
  const maxAge = s.rememberMe ? SESSION_REMEMBER_AGE_MS : SESSION_DEFAULT_AGE_MS;
  const expired = Number.isFinite(s.expiresAt)
    ? Date.now() > s.expiresAt
    : !Number.isFinite(s.at) || Date.now() - s.at > maxAge;
  if (expired) {
    logout();
    return null;
  }
  return s;
}

export function updateSessionProfile(updates) {
  const s = getSession();
  if (!s) throw new Error('Sesi tidak ditemukan.');

  const nextName = updates.name !== undefined ? String(updates.name).trim() : s.name;
  if (nextName.length < 3) {
    throw new Error('Nama lengkap minimal 3 karakter.');
  }

  let nextEmail = s.email || '';
  if (updates.email !== undefined) {
    const normalized = normalizeEmail(updates.email);
    if (!EMAIL_REGEX.test(normalized)) {
      throw new Error('Masukkan alamat email yang valid.');
    }
    nextEmail = normalized;
  }

  const accounts = readJson(ACCOUNT_KEYS[s.role], []);
  if (s.role === 'user' && nextEmail && accounts.some((a) => a.id !== s.id && normalizeEmail(a.email) === nextEmail)) {
    throw new Error('Alamat email ini sudah digunakan oleh akun mahasiswa lain.');
  }

  const updatedSession = { ...s, name: nextName, email: nextEmail };
  writeJson(SESSION_KEY, updatedSession);

  const idx = accounts.findIndex((a) => a.id === s.id);
  if (idx !== -1) {
    accounts[idx] = { ...accounts[idx], name: nextName, email: nextEmail };
    writeJson(ACCOUNT_KEYS[s.role], accounts);
  }
  return updatedSession;
}

export function updateSessionName(newName) {
  return updateSessionProfile({ name: newName });
}

export function logout() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (_) {
    /* tidak ada yang perlu dilakukan */
  }
}

// Dipanggil di halaman terlindungi. Mengembalikan sesi, atau mengalihkan ke
// halaman masuk peran yang sesuai dan mengembalikan null.
export function requireRole(role) {
  let s = getSession();
  if (s) {
    const registered = s.provider === 'google' || readJson(ACCOUNT_KEYS[s.role], []).some((a) => a.id === s.id);
    if (!registered || s.at > Date.now() + 60 * 1000) {
      logout();
      s = null;
    }
  }
  if (s && s.role === role) return s;
  // Peran salah diarahkan ke beranda perannya sendiri, bukan ke halaman asing
  window.location.replace(s ? ROLE_HOME[s.role] : ROLE_LOGIN[role]);
  return null;
}

// Dipanggil di halaman masuk/daftar: bila sudah login, langsung ke beranda
export function redirectIfSignedIn(role) {
  const s = getSession();
  if (s && (!role || s.role === role)) window.location.replace(ROLE_HOME[s.role]);
}
