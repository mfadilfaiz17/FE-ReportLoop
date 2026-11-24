// Kontroler form masuk, daftar, lupa kata sandi, dan Google OAuth untuk Mahasiswa dan Admin Sarpras.

import { GOOGLE_CLIENT_ID } from '../config/constants.js';
import {
  ROLE_HOME,
  redirectIfSignedIn,
  validateRegistration,
  registerAccount,
  loginAccount,
  loginWithGoogleOAuth,
  resetAccountPassword,
} from '../services/auth.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { initTheme } from '../utils/theme.js';

const role = document.body.dataset.role;
const mode = document.body.dataset.mode;

const form = document.getElementById('auth-form');
const submitBtn = document.getElementById('auth-submit');
const submitLabel = document.getElementById('auth-submit-label');
const formError = document.getElementById('form-error');
const formNotice = document.getElementById('form-notice');
const modalSlot = document.getElementById('auth-modal-slot');

const FIELD_IDS = ['name', 'identifier', 'email', 'password', 'confirm', 'inviteCode'];

function fieldEl(name) {
  return document.getElementById(`f-${name}`);
}

function isRememberChecked() {
  const cb = document.getElementById('f-remember');
  return Boolean(cb && cb.checked);
}

function clearErrors() {
  FIELD_IDS.forEach((name) => {
    const input = fieldEl(name);
    const msg = document.getElementById(`err-${name}`);
    if (input) input.removeAttribute('aria-invalid');
    if (msg) {
      msg.textContent = '';
      msg.classList.add('hidden');
    }
  });
  formError.textContent = '';
  formError.classList.add('hidden');
}

function showFieldErrors(errors) {
  let firstInvalid = null;
  FIELD_IDS.forEach((name) => {
    if (!errors[name]) return;
    const input = fieldEl(name);
    const msg = document.getElementById(`err-${name}`);
    if (input) {
      input.setAttribute('aria-invalid', 'true');
      if (!firstInvalid) firstInvalid = input;
    }
    if (msg) {
      msg.textContent = errors[name];
      msg.classList.remove('hidden');
    }
  });
  if (firstInvalid) firstInvalid.focus();
}

function showFormError(message) {
  formError.textContent = message;
  formError.classList.remove('hidden');
}

function showFormNotice(message) {
  if (!formNotice) return;
  formNotice.textContent = message;
  formNotice.classList.remove('hidden');
}

function setLoading(isLoading) {
  submitBtn.disabled = isLoading;
  submitBtn.setAttribute('aria-busy', String(isLoading));
  submitLabel.textContent = isLoading
    ? mode === 'login' ? 'Memeriksa akun...' : 'Membuat akun...'
    : submitLabel.dataset.idle;
}

function readForm() {
  const value = (name) => (fieldEl(name) ? fieldEl(name).value : '');
  return {
    name: value('name'),
    identifier: value('identifier'),
    email: value('email'),
    password: value('password'),
    confirm: value('confirm'),
    inviteCode: value('inviteCode'),
  };
}

async function handleSubmit(event) {
  event.preventDefault();
  clearErrors();
  const data = readForm();

  if (mode === 'login') {
    const errors = {};
    const idVal = data.identifier.trim();
    if (!idVal) {
      errors.identifier = role === 'admin' ? 'Isi email admin.' : 'Isi NIM Anda.';
    } else if (role === 'user' && !/^\d{6,12}$/.test(idVal)) {
      errors.identifier = 'NIM harus berupa angka, 6 sampai 12 digit.';
    }
    if (!data.password) errors.password = 'Isi kata sandi.';
    if (Object.keys(errors).length) {
      showFieldErrors(errors);
      return;
    }
    setLoading(true);
    try {
      await loginAccount(role, data.identifier, data.password, { rememberMe: isRememberChecked() });
      window.location.replace(ROLE_HOME[role]);
    } catch (err) {
      showFormError(err.message);
      setLoading(false);
    }
    return;
  }

  const errors = validateRegistration(role, data);
  if (Object.keys(errors).length) {
    showFieldErrors(errors);
    return;
  }
  setLoading(true);
  try {
    await registerAccount(role, data);
    const loginPage = role === 'admin' ? 'admin-masuk.html' : 'masuk.html';
    window.location.replace(`${loginPage}?daftar=berhasil`);
  } catch (err) {
    showFormError(err.message);
    setLoading(false);
  }
}

// --- Tombol Tutup Modal Ikon Silang (Sesuai R-03 >= 44px & R-39 aria-label) ---
function renderModalCloseButton() {
  return `
    <button
      type="button"
      data-close-auth-modal
      aria-label="Tutup dialog"
      title="Tutup"
      class="btn btn-ghost shrink-0 w-11 h-11 p-0 inline-flex items-center justify-center"
    >
      <svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
      </svg>
    </button>
  `;
}

// --- Modal Helper (Aksesibel dengan Escape & focus return) ---
let activeModalCleanup = null;

function closeAuthModal() {
  if (activeModalCleanup) {
    activeModalCleanup();
    activeModalCleanup = null;
  }
  if (modalSlot) modalSlot.innerHTML = '';
}

function openAuthModal(html, triggerEl) {
  closeAuthModal();
  if (!modalSlot) return;
  modalSlot.innerHTML = html;
  const backdrop = modalSlot.firstElementChild;
  const onKeyDown = (e) => {
    if (e.key === 'Escape') closeAuthModal();
  };
  document.addEventListener('keydown', onKeyDown);
  backdrop?.querySelectorAll('[data-close-auth-modal]').forEach((btn) => {
    btn.addEventListener('click', closeAuthModal);
  });
  backdrop?.addEventListener('click', (e) => {
    if (e.target === backdrop) closeAuthModal();
  });
  activeModalCleanup = () => {
    document.removeEventListener('keydown', onKeyDown);
    if (triggerEl && typeof triggerEl.focus === 'function') triggerEl.focus();
  };
  const firstInput = backdrop?.querySelector('input, button:not([data-close-auth-modal])');
  if (firstInput) firstInput.focus();
}

// --- Alur Lupa Kata Sandi ---
function openForgotPasswordModal(triggerEl) {
  const isAdmin = role === 'admin';
  const prefillId = fieldEl('identifier')?.value.trim() || '';

  openAuthModal(
    `
    <div class="fixed inset-0 z-50 bg-ink-950/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="forgot-title">
      <div class="card w-full max-w-md p-5 sm:p-6 shadow-xl fade-in">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 id="forgot-title" class="text-lg font-extrabold text-ink-900 dark:text-white">Atur ulang kata sandi</h3>
            <p class="mt-1 text-xs text-ink-600 dark:text-ink-300">
              ${isAdmin ? 'Masukkan email admin yang terdaftar untuk membuat kata sandi baru.' : 'Verifikasi NIM dan email Google terdaftar untuk mengatur ulang kata sandi.'}
            </p>
          </div>
          ${renderModalCloseButton()}
        </div>

        <p id="forgot-error" role="alert" class="hidden mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/70 px-3 py-2.5 text-xs font-semibold text-red-900 dark:text-red-200"></p>

        <form id="forgot-form" class="mt-4 space-y-3.5" novalidate>
          ${
            isAdmin
              ? `<div>
                  <label for="fg-identifier" class="label">Email admin terdaftar</label>
                  <input id="fg-identifier" type="email" class="field" placeholder="nama@gmail.com" value="${escapeHtml(prefillId)}" />
                </div>`
              : `<div>
                  <label for="fg-identifier" class="label">NIM</label>
                  <input id="fg-identifier" type="tel" inputmode="numeric" maxlength="12" class="field font-mono" placeholder="Nomor induk mahasiswa" value="${escapeHtml(prefillId)}" />
                </div>
                <div>
                  <label for="fg-email" class="label">Email Google terdaftar</label>
                  <input id="fg-email" type="email" class="field" placeholder="nama@gmail.com" />
                </div>`
          }

          <div>
            <label for="fg-new-password" class="label">Kata sandi baru</label>
            <input id="fg-new-password" type="password" autocomplete="new-password" class="field" placeholder="Minimal 8 karakter" />
          </div>

          <div>
            <label for="fg-confirm-password" class="label">Ulangi kata sandi baru</label>
            <input id="fg-confirm-password" type="password" autocomplete="new-password" class="field" />
          </div>

          <div class="pt-2 flex flex-wrap justify-end gap-2">
            <button type="button" data-close-auth-modal class="btn btn-ghost">Batal</button>
            <button id="fg-submit" type="submit" class="btn btn-primary">Simpan Kata Sandi Baru</button>
          </div>
        </form>
      </div>
    </div>
    `,
    triggerEl
  );

  const forgotForm = document.getElementById('forgot-form');
  const forgotError = document.getElementById('forgot-error');
  const fgSubmit = document.getElementById('fg-submit');

  forgotForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    forgotError.classList.add('hidden');
    fgSubmit.disabled = true;
    try {
      const result = await resetAccountPassword(role, {
        identifier: document.getElementById('fg-identifier')?.value || '',
        email: document.getElementById('fg-email')?.value || '',
        newPassword: document.getElementById('fg-new-password')?.value || '',
        confirmPassword: document.getElementById('fg-confirm-password')?.value || '',
      });
      closeAuthModal();
      clearErrors();
      if (fieldEl('identifier') && result.id) fieldEl('identifier').value = result.id;
      showFormNotice('Kata sandi berhasil diperbarui. Silakan masuk dengan kata sandi baru.');
    } catch (err) {
      forgotError.textContent = err.message;
      forgotError.classList.remove('hidden');
      fgSubmit.disabled = false;
    }
  });
}

// --- Alur Google OAuth (Google Identity Services; token ID diverifikasi oleh backend) ---
async function completeGoogleSignIn(credential, triggerEl, extra = {}) {
  try {
    await loginWithGoogleOAuth(role, credential, {
      ...extra,
      rememberMe: isRememberChecked(),
    });
    window.location.replace(ROLE_HOME[role]);
  } catch (err) {
    if (err.code === 'NIM_REQUIRED' || err.code === 'INVITE_REQUIRED') {
      openGoogleCompletionModal(credential, triggerEl);
      return;
    }
    closeAuthModal();
    showFormError(err.message);
  }
}

function openGoogleCompletionModal(credential, triggerEl) {
  const isAdmin = role === 'admin';
  openAuthModal(
    `
    <div class="fixed inset-0 z-50 bg-ink-950/60 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="g-complete-title">
      <div class="card w-full max-w-md p-5 sm:p-6 shadow-xl fade-in">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h3 id="g-complete-title" class="text-lg font-extrabold text-ink-900 dark:text-white">Lengkapi verifikasi akun Google</h3>
            <p class="mt-1 text-xs text-ink-600 dark:text-ink-300">
              Akun Google ini belum terdaftar. ${isAdmin ? 'Masukkan kode undangan Sarpras untuk mengaktifkan akun admin.' : 'Masukkan NIM Anda untuk menghubungkan akun Google.'}
            </p>
          </div>
          ${renderModalCloseButton()}
        </div>

        <p id="gc-error" role="alert" class="hidden mt-4 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/70 px-3 py-2.5 text-xs font-semibold text-red-900 dark:text-red-200"></p>

        <form id="gc-form" class="mt-4 space-y-3.5" novalidate>
          ${
            isAdmin
              ? `<div>
                  <label for="gc-invite" class="label">Kode undangan Sarpras</label>
                  <input id="gc-invite" type="text" autocomplete="off" class="field font-mono" placeholder="Kode dari unit Sarpras" />
                </div>`
              : `<div>
                  <label for="gc-nim" class="label">NIM Mahasiswa</label>
                  <input id="gc-nim" type="tel" inputmode="numeric" maxlength="12" class="field font-mono" placeholder="Nomor induk mahasiswa" />
                </div>`
          }
          <div class="pt-2 flex flex-wrap justify-end gap-2">
            <button type="button" data-close-auth-modal class="btn btn-ghost">Batal</button>
            <button type="submit" class="btn btn-primary">Lanjutkan Masuk</button>
          </div>
        </form>
      </div>
    </div>
    `,
    triggerEl
  );

  document.getElementById('gc-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const errBox = document.getElementById('gc-error');
    errBox.classList.add('hidden');
    try {
      await loginWithGoogleOAuth(role, credential, {
        nim: document.getElementById('gc-nim')?.value || '',
        inviteCode: document.getElementById('gc-invite')?.value || '',
        rememberMe: isRememberChecked(),
      });
      window.location.replace(ROLE_HOME[role]);
    } catch (err) {
      errBox.textContent = err.message;
      errBox.classList.remove('hidden');
    }
  });
}

function initGoogleOAuth() {
  const customBtn = document.getElementById('btn-google-oauth');
  const gisContainer = document.getElementById('google-gis-button');
  if (!customBtn) return;

  // Jika GOOGLE_CLIENT_ID diatur, muat Google Identity Services SDK resmi
  if (GOOGLE_CLIENT_ID) {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.google?.accounts?.id) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => {
          if (!response?.credential) {
            showFormError('Gagal membaca kredensial akun Google.');
            return;
          }
          completeGoogleSignIn(response.credential, customBtn);
        },
      });
      if (gisContainer) {
        gisContainer.classList.remove('hidden');
        customBtn.classList.add('hidden');
        window.google.accounts.id.renderButton(gisContainer, {
          theme: document.documentElement.classList.contains('dark') ? 'filled_black' : 'outline',
          size: 'large',
          width: 340,
          text: mode === 'register' ? 'signup_with' : 'signin_with',
        });
      }
    };
    document.head.appendChild(script);
    return;
  }

  customBtn.addEventListener('click', () => {
    clearErrors();
    showFormError('Masuk dengan Google belum dikonfigurasi. Hubungi pengelola untuk mengisi Google Client ID.');
  });
}

function bindPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.dataset.togglePassword);
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Sembunyikan' : 'Tampilkan';
      btn.setAttribute('aria-pressed', String(show));
    });
  });
}

function bindNumericNimInput() {
  if (role !== 'user') return;
  const nimInput = fieldEl('identifier');
  if (!nimInput) return;
  nimInput.addEventListener('input', () => {
    const digitsOnly = nimInput.value.replace(/\D+/g, '').slice(0, 12);
    if (nimInput.value !== digitsOnly) {
      nimInput.value = digitsOnly;
    }
  });
}

function init() {
  initTheme();
  redirectIfSignedIn(role);
  submitLabel.dataset.idle = submitLabel.textContent;

  if (mode === 'login' && new URLSearchParams(window.location.search).get('daftar') === 'berhasil') {
    showFormNotice('Akun berhasil dibuat. Silakan masuk.');
  }

  const forgotBtn = document.getElementById('btn-open-forgot');
  if (forgotBtn) {
    forgotBtn.addEventListener('click', () => {
      clearErrors();
      openForgotPasswordModal(forgotBtn);
    });
  }

  initGoogleOAuth();
  bindNumericNimInput();
  bindPasswordToggles();
  form.addEventListener('submit', handleSubmit);
}

init();
