// ==========================================================================
// ReportLoop - Layanan autentikasi (MODE DEMO, tanpa backend)
// Akun user dan admin disimpan terpisah di localStorage browser ini saja.
// Kata sandi di-hash SHA-256 + salt per akun, tidak pernah disimpan polos.
// Ini BUKAN keamanan sungguhan: siapa pun yang membuka devtools bisa melihat
// atau mengubah data. Saat backend FastAPI siap, ganti isi file ini dengan
// panggilan ke endpoint login/daftar dan simpan token sesi dari server.
// ==========================================================================

const ACCOUNT_KEYS = {
  user: 'reportloop.accounts.user',
  admin: 'reportloop.accounts.admin',
};
const SESSION_KEY = 'reportloop.session';

// Kode undangan admin untuk demo. Ganti dengan validasi server nanti.
export const ADMIN_INVITE_CODE_DEMO = 'SARPRAS-DEMO';

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

function makeSalt() {
  return toHex(crypto.getRandomValues(new Uint8Array(16)));
}

function normalizeId(role, identifier) {
  const v = String(identifier || '').trim();
  return role === 'admin' ? v.toLowerCase() : v;
}

// Validasi bentuk isian. Mengembalikan objek { field: pesan } kosong bila lolos.
export function validateRegistration(role, { name, identifier, password, confirm, inviteCode }) {
  const errors = {};
  if (!String(name || '').trim() || String(name).trim().length < 3) {
    errors.name = 'Nama lengkap minimal 3 karakter.';
  }
  if (role === 'user') {
    if (!/^\d{6,12}$/.test(String(identifier || '').trim())) {
      errors.identifier = 'NIM harus berupa angka, 6 sampai 12 digit.';
    }
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(identifier || '').trim())) {
    errors.identifier = 'Masukkan alamat email yang valid.';
  }
  if (String(password || '').length < 8) {
    errors.password = 'Kata sandi minimal 8 karakter.';
  }
  if (password !== confirm) {
    errors.confirm = 'Konfirmasi kata sandi tidak sama.';
  }
  if (role === 'admin' && String(inviteCode || '').trim() !== ADMIN_INVITE_CODE_DEMO) {
    errors.inviteCode = 'Kode undangan admin tidak cocok.';
  }
  return errors;
}

export async function registerAccount(role, form) {
  const accounts = readJson(ACCOUNT_KEYS[role], []);
  const id = normalizeId(role, form.identifier);

  if (accounts.some((a) => a.id === id)) {
    throw new Error(role === 'admin' ? 'Email ini sudah terdaftar sebagai admin.' : 'NIM ini sudah terdaftar.');
  }

  const salt = makeSalt();
  const hash = await hashPassword(form.password, salt);
  accounts.push({
    id,
    name: String(form.name).trim(),
    salt,
    hash,
    created_at: new Date().toISOString(),
  });
  writeJson(ACCOUNT_KEYS[role], accounts);
}

export async function loginAccount(role, identifier, password) {
  const accounts = readJson(ACCOUNT_KEYS[role], []);
  const id = normalizeId(role, identifier);
  const account = accounts.find((a) => a.id === id);

  // Pesan sengaja sama untuk akun tak ada dan sandi salah
  const failure = new Error(role === 'admin' ? 'Email atau kata sandi salah.' : 'NIM atau kata sandi salah.');
  if (!account) throw failure;

  const hash = await hashPassword(password, account.salt);
  if (hash !== account.hash) throw failure;

  writeJson(SESSION_KEY, { role, id: account.id, name: account.name, at: Date.now() });
  return { role, id: account.id, name: account.name };
}

export function getSession() {
  const s = readJson(SESSION_KEY, null);
  if (!s || (s.role !== 'user' && s.role !== 'admin')) return null;
  return s;
}

export function updateSessionName(newName) {
  const s = getSession();
  if (!s) throw new Error('Sesi tidak ditemukan.');
  const trimmed = String(newName || '').trim();
  if (trimmed.length < 3) {
    throw new Error('Nama lengkap minimal 3 karakter.');
  }

  const updatedSession = { ...s, name: trimmed };
  writeJson(SESSION_KEY, updatedSession);

  const accounts = readJson(ACCOUNT_KEYS[s.role], []);
  const idx = accounts.findIndex((a) => a.id === s.id);
  if (idx !== -1) {
    accounts[idx].name = trimmed;
    writeJson(ACCOUNT_KEYS[s.role], accounts);
  }
  return updatedSession;
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
  const s = getSession();
  if (s && s.role === role) return s;
  // Peran salah diarahkan ke beranda perannya sendiri, bukan ke halaman asing
  window.location.replace(s ? ROLE_HOME[s.role] : ROLE_LOGIN[role]);
  return null;
}

// Dipanggil di halaman masuk/daftar: bila sudah login, langsung ke beranda
export function redirectIfSignedIn() {
  const s = getSession();
  if (s) window.location.replace(ROLE_HOME[s.role]);
}
