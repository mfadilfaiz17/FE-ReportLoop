// Kontroler tumpukan kartu (card stack) dengan swipe sentuh & seret mouse untuk 3 Langkah Pelaporan.

export function initStepsCarousel() {
  const track = document.querySelector('[data-steps-track]');
  if (!track) return;

  const cards = Array.from(track.querySelectorAll('[data-step-card]'));
  const dots = Array.from(document.querySelectorAll('[data-step-dot]'));
  const counterEl = document.querySelector('[data-step-counter]');

  const total = cards.length;
  if (!total) return;

  let activeIndex = 0;
  let isAnimating = false;

  function renderStack(targetIndex) {
    activeIndex = ((targetIndex % total) + total) % total;

    cards.forEach((card, i) => {
      const pos = (i - activeIndex + total) % total;
      card.dataset.stackPos = String(pos);
      card.classList.remove('is-dragging-top', 'is-throwing-left', 'is-throwing-right');
      card.style.transform = '';
      card.style.opacity = '';

      if (pos === 0) {
        card.setAttribute('aria-current', 'step');
        card.removeAttribute('aria-hidden');
      } else {
        card.removeAttribute('aria-current');
        card.setAttribute('aria-hidden', 'true');
      }
    });

    dots.forEach((dot, i) => {
      const isCurrent = i === activeIndex;
      dot.setAttribute('aria-selected', String(isCurrent));
      dot.tabIndex = isCurrent ? 0 : -1;
      dot.classList.toggle('is-active', isCurrent);
    });

    if (counterEl) {
      counterEl.textContent = `0${activeIndex + 1} / 0${total}`;
    }
  }

  function getTopCard() {
    return cards[activeIndex];
  }

  function cycleCard(direction) {
    if (isAnimating || total < 2) return;

    const reduceMotion =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const step = direction === 'prev' ? -1 : 1;
    const nextIdx = (activeIndex + step + total) % total;
    const topCard = getTopCard();

    if (reduceMotion || !topCard) {
      renderStack(nextIdx);
      return;
    }

    isAnimating = true;
    topCard.classList.remove('is-dragging-top');
    topCard.style.transform = '';
    topCard.style.opacity = '';
    topCard.classList.add(direction === 'prev' ? 'is-throwing-right' : 'is-throwing-left');

    window.setTimeout(() => {
      renderStack(nextIdx);
      isAnimating = false;
    }, 260);
  }

  function goToCard(targetIndex) {
    if (isAnimating) return;
    const normalized = ((targetIndex % total) + total) % total;
    if (normalized === activeIndex) return;
    renderStack(normalized);
  }

  // Interaksi swipe (sentuh) & click-and-drag (mouse desktop)
  let isPointerDown = false;
  let activePointerId = null;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let isHorizontalSwipe = null;

  track.addEventListener('pointerdown', (event) => {
    if (isAnimating || (event.pointerType === 'mouse' && event.button !== 0)) return;
    isPointerDown = true;
    activePointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    currentX = 0;
    isHorizontalSwipe = null;
    track.classList.add('is-dragging');
    track.setPointerCapture(event.pointerId);
  });

  track.addEventListener('pointermove', (event) => {
    if (!isPointerDown || event.pointerId !== activePointerId) return;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    if (isHorizontalSwipe === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      isHorizontalSwipe = Math.abs(dx) >= Math.abs(dy);
    }

    if (!isHorizontalSwipe) return;
    currentX = dx;

    const topCard = getTopCard();
    if (!topCard) return;
    topCard.classList.add('is-dragging-top');
    const rotateDeg = Math.max(-12, Math.min(12, dx * 0.045));
    topCard.style.transform = `translate3d(${dx}px, ${Math.abs(dx) * -0.04}px, 0) rotate(${rotateDeg}deg)`;
  });

  function releasePointer(event) {
    if (!isPointerDown) return;
    if (event && activePointerId !== null && event.pointerId !== activePointerId) return;
    isPointerDown = false;
    if (activePointerId !== null && track.hasPointerCapture(activePointerId)) {
      track.releasePointerCapture(activePointerId);
    }
    activePointerId = null;
    track.classList.remove('is-dragging');

    const topCard = getTopCard();
    const threshold = Math.min(95, track.clientWidth * 0.22);

    if (isHorizontalSwipe && Math.abs(currentX) >= threshold) {
      cycleCard(currentX < 0 ? 'next' : 'prev');
      return;
    }

    if (topCard) {
      topCard.classList.remove('is-dragging-top');
      topCard.style.transform = '';
      topCard.style.opacity = '';
    }
  }

  track.addEventListener('pointerup', releasePointer);
  track.addEventListener('pointercancel', releasePointer);
  track.addEventListener('dragstart', (event) => event.preventDefault());

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goToCard(i));
    dot.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        const next = (i + 1) % total;
        dots[next].focus();
        goToCard(next);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        const prev = (i - 1 + total) % total;
        dots[prev].focus();
        goToCard(prev);
      }
    });
  });

  track.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      cycleCard('next');
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      cycleCard('prev');
    }
  });

  renderStack(0);
}
