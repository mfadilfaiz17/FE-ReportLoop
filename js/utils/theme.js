// Pengelola tema Light (Biru-Putih) dan Dark (Biru-Slate Gelap).

const THEME_KEY = 'reportloop.theme';

const SUN_ICON = `<svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>`;

const MOON_ICON = `<svg class="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>`;

export function getPreferredTheme() {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
  } catch (_) {
    // Abaikan jika penyimpanan diblokir
  }
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme) {
  const isDark = theme === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.dataset.theme = theme;

  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (_) {
    // Abaikan jika penyimpanan diblokir
  }

  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(isDark));
    btn.setAttribute('aria-label', isDark ? 'Beralih ke mode terang' : 'Beralih ke mode gelap');
    const iconSlot = btn.querySelector('[data-theme-icon]');
    const labelSlot = btn.querySelector('[data-theme-label]');
    if (iconSlot) iconSlot.innerHTML = isDark ? SUN_ICON : MOON_ICON;
    if (labelSlot) labelSlot.textContent = isDark ? 'Terang' : 'Gelap';
  });
}

export function toggleTheme(event) {
  const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!document.startViewTransition || reduceMotion) {
    applyTheme(next);
    return next;
  }

  const trigger = event?.currentTarget instanceof HTMLElement ? event.currentTarget : null;
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (trigger) {
    const rect = trigger.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
  } else if (event && typeof event.clientX === 'number' && typeof event.clientY === 'number') {
    x = event.clientX;
    y = event.clientY;
  }

  const endRadius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y)
  );

  const root = document.documentElement;
  root.classList.add('theme-transitioning');

  const transition = document.startViewTransition(() => {
    applyTheme(next);
  });

  transition.ready
    .then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 650,
          easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    })
    .catch(() => {
      // Fallback aman bila transisi dibatalkan
    });

  transition.finished.finally(() => {
    root.classList.remove('theme-transitioning');
  });

  return next;
}

export function initTheme() {
  applyTheme(getPreferredTheme());
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    if (btn.dataset.themeBound === 'true') return;
    btn.dataset.themeBound = 'true';
    btn.addEventListener('click', toggleTheme);
  });
}
