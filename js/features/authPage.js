// Kontroler form masuk dan daftar untuk peran Mahasiswa dan Admin Sarpras.

import {
  ROLE_HOME,
  redirectIfSignedIn,
  validateRegistration,
  registerAccount,
  loginAccount,
} from '../services/auth.js';
import { initTheme } from '../utils/theme.js';

const role = document.body.dataset.role;
const mode = document.body.dataset.mode;

const form = document.getElementById('auth-form');
const submitBtn = document.getElementById('auth-submit');
const submitLabel = document.getElementById('auth-submit-label');
const formError = document.getElementById('form-error');
const formNotice = document.getElementById('form-notice');

const FIELD_IDS = ['name', 'identifier', 'password', 'confirm', 'inviteCode'];

function fieldEl(name) {
  return document.getElementById(`f-${name}`);
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
      await loginAccount(role, data.identifier, data.password);
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
    formNotice.classList.remove('hidden');
  }

  bindNumericNimInput();
  bindPasswordToggles();
  form.addEventListener('submit', handleSubmit);
}

init();
