// Ajoute flèches, points et défilement automatique à chaque .carroussel
// Sans ce script, le carrousel reste utilisable au swipe / à la molette.
document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const AUTOPLAY_DELAY = 5000;

  document.querySelectorAll('.carroussel').forEach((track) => {
    const items = [...track.querySelectorAll('.carroussel-item')];
    if (items.length < 2) return;

    // Enveloppe pour positionner les contrôles
    const wrap = document.createElement('div');
    wrap.className = 'carroussel-wrap';
    track.parentNode.insertBefore(wrap, track);
    wrap.appendChild(track);

    track.setAttribute('tabindex', '0');
    track.setAttribute('role', 'region');
    track.setAttribute('aria-roledescription', 'carrousel');
    track.setAttribute('aria-label', 'Nos bougies');

    const makeButton = (className, label, symbol) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `carroussel-btn ${className}`;
      btn.setAttribute('aria-label', label);
      btn.textContent = symbol;
      wrap.appendChild(btn);
      return btn;
    };

    const prevBtn = makeButton('carroussel-btn--prev', 'Bougie précédente', '‹');
    const nextBtn = makeButton('carroussel-btn--next', 'Bougie suivante', '›');

    const dotsBox = document.createElement('div');
    dotsBox.className = 'carroussel-dots';
    const dots = items.map((_, i) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'carroussel-dot';
      dot.setAttribute('aria-label', `Aller à la bougie ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      dotsBox.appendChild(dot);
      return dot;
    });
    wrap.appendChild(dotsBox);

    let current = 0;

    const maxScroll = () => track.scrollWidth - track.clientWidth;

    function goTo(index) {
      const i = Math.max(0, Math.min(items.length - 1, index));
      const item = items[i];
      const left = item.offsetLeft - (track.clientWidth - item.clientWidth) / 2;
      track.scrollTo({ left, behavior: reduceMotion ? 'auto' : 'smooth' });
    }

    function update() {
      const max = maxScroll();
      wrap.classList.toggle('is-static', max <= 2);

      if (track.scrollLeft <= 2) {
        current = 0;
      } else if (track.scrollLeft >= max - 2) {
        current = items.length - 1;
      } else {
        const center = track.scrollLeft + track.clientWidth / 2;
        let best = Infinity;
        items.forEach((item, i) => {
          const d = Math.abs(item.offsetLeft + item.clientWidth / 2 - center);
          if (d < best) {
            best = d;
            current = i;
          }
        });
      }

      dots.forEach((dot, i) => dot.setAttribute('aria-current', i === current ? 'true' : 'false'));
      prevBtn.disabled = track.scrollLeft <= 2;
      nextBtn.disabled = track.scrollLeft >= max - 2;
    }

    prevBtn.addEventListener('click', () => goTo(current - 1));
    nextBtn.addEventListener('click', () => goTo(current + 1));

    let ticking = false;
    track.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        update();
        ticking = false;
      });
    }, { passive: true });

    window.addEventListener('resize', update);
    window.addEventListener('load', update);
    update();

    // Défilement automatique, en pause au survol / focus / après un swipe
    if (!reduceMotion) {
      let paused = false;
      wrap.addEventListener('mouseenter', () => { paused = true; });
      wrap.addEventListener('mouseleave', () => { paused = false; });
      wrap.addEventListener('focusin', () => { paused = true; });
      wrap.addEventListener('focusout', () => { paused = false; });
      track.addEventListener('touchstart', () => { paused = true; }, { passive: true });

      setInterval(() => {
        if (paused || document.hidden || wrap.classList.contains('is-static')) return;
        goTo(current >= items.length - 1 ? 0 : current + 1);
      }, AUTOPLAY_DELAY);
    }
  });
});