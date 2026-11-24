// Efek kemunculan halus saat elemen masuk viewport (menghormati prefers-reduced-motion).

export function initScrollReveal(root = document) {
  const targets = Array.from(root.querySelectorAll('[data-reveal]'));
  if (!targets.length) return;

  const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) {
    targets.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      });
    },
    { threshold: 0.08, rootMargin: '0px 0px -24px 0px' }
  );

  targets.forEach((el) => observer.observe(el));
}
