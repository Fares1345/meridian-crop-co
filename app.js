const body = document.body;
const header = document.querySelector('[data-header]');
const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.site-nav');
const heroMedia = document.querySelector('.hero-media');
const hero = document.querySelector('.hero');
const intro = document.querySelector('[data-intro]');
const introStage = document.querySelector('[data-intro-stage]');
const primaryFilmCopy = document.querySelector('[data-film-primary]');
const secondaryFilmCopy = document.querySelector('[data-film-secondary]');
const filmProgress = document.querySelector('[data-film-progress]');
const atmosphere = document.querySelector('[data-atmosphere]');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

const setHeaderState = () => {
  const darkStoryHeight = (intro?.offsetHeight || 0) + (hero?.offsetHeight || 0) - 80;
  header.classList.toggle('scrolled', window.scrollY > Math.max(40, darkStoryHeight));
};
setHeaderState();
window.addEventListener('scroll', setHeaderState, { passive: true });
window.addEventListener('load', setHeaderState, { once: true });

menuButton?.addEventListener('click', () => {
  const open = body.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(open));
});

nav?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  body.classList.remove('menu-open');
  menuButton?.setAttribute('aria-expanded', 'false');
}));

if (!reducedMotion) {
  window.addEventListener('scroll', () => {
    const heroRect = hero.getBoundingClientRect();
    if (heroRect.top < window.innerHeight && heroRect.bottom > 0) {
      const heroTravel = Math.max(0, -heroRect.top);
      heroMedia.style.transform = `scale(1.04) translateY(${heroTravel * 0.08}px)`;
    }
  }, { passive: true });
}

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const range = (value, start, end) => clamp((value - start) / (end - start));

if (intro && introStage) {
  requestAnimationFrame(() => requestAnimationFrame(() => body.classList.add('film-ready')));

  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;
  let introVisible = true;
  let animationFrame;
  let canvasContext;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let particles = [];
  let paused = false;
  let previousTime = 0;
  let lastProgress = -1;
  const motionButton = document.querySelector('[data-film-motion]');
  const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const isStill = () => motionPreference.matches;
  const isLightweight = () => !finePointer || window.innerWidth <= 740;
  const canAnimate = () => introVisible && !document.hidden && !paused && !isStill() && !isLightweight();

  const resizeAtmosphere = () => {
    canvasContext = undefined;
    if (!atmosphere || isStill() || isLightweight()) return;
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
    canvasWidth = introStage.clientWidth;
    canvasHeight = introStage.clientHeight;
    atmosphere.width = Math.round(canvasWidth * pixelRatio);
    atmosphere.height = Math.round(canvasHeight * pixelRatio);
    canvasContext = atmosphere.getContext('2d', { alpha: true });
    if (!canvasContext) return;
    canvasContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const particleCount = Math.min(64, Math.max(34, Math.round(canvasWidth / 24)));
    particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvasWidth,
      y: Math.random() * canvasHeight,
      radius: .35 + Math.random() * 1.4,
      depth: .2 + Math.random() * .8,
      drift: Math.random() * Math.PI * 2
    }));
  };

  const drawAtmosphere = (time, delta) => {
    if (!canvasContext || !introVisible) return;
    canvasContext.clearRect(0, 0, canvasWidth, canvasHeight);
    canvasContext.fillStyle = '#eff6d2';
    particles.forEach((particle) => {
      particle.x += ((.045 + particle.depth * .11) + pointerX * particle.depth * .025) * delta;
      particle.y += (Math.sin(time * .00035 + particle.drift) * .035 - .012) * delta;
      if (particle.x > canvasWidth + 8) particle.x = -8;
      if (particle.y < -8) particle.y = canvasHeight + 8;
      if (particle.y > canvasHeight + 8) particle.y = -8;
      canvasContext.globalAlpha = .07 + particle.depth * .22;
      canvasContext.beginPath();
      canvasContext.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      canvasContext.fill();
    });
    canvasContext.globalAlpha = 1;
  };

  const updateFilm = (time = 0) => {
    animationFrame = undefined;
    if (isStill()) return;
    const delta = previousTime ? Math.min((time - previousTime) / 16.667, 3) : 1;
    previousTime = time;
    const scrollDistance = Math.max(1, intro.offsetHeight - window.innerHeight);
    const progress = clamp(-intro.getBoundingClientRect().top / scrollDistance);
    const smoothing = 1 - Math.pow(.925, delta);
    if (!paused) {
      pointerX += (pointerTargetX - pointerX) * smoothing;
      pointerY += (pointerTargetY - pointerY) * smoothing;
    }

    if (!isLightweight() && !paused) {
      introStage.style.setProperty('--far-x', `${pointerX * -4}px`);
      introStage.style.setProperty('--far-y', `${pointerY * -2 - progress * 5}px`);
      introStage.style.setProperty('--field-x', `${pointerX * -9}px`);
      introStage.style.setProperty('--field-y', `${pointerY * -5 - progress * 12}px`);
      introStage.style.setProperty('--near-x', `${pointerX * -17}px`);
      introStage.style.setProperty('--near-y', `${pointerY * -9 - progress * 20}px`);
      introStage.style.setProperty('--far-scale', String(1.055 + progress * .035));
      introStage.style.setProperty('--field-scale', String(1.07 + progress * .075));
      introStage.style.setProperty('--near-scale', String(1.12 + progress * .14));
      introStage.style.setProperty('--reticle-scale', String(.86 + progress * 1.15));
      introStage.style.setProperty('--reticle-opacity', String(.34 * (1 - progress)));
      introStage.style.setProperty('--light-drift-x', `${pointerX * 80}px`);
      introStage.style.setProperty('--light-drift-y', `${pointerY * 45}px`);
    }

    if (Math.abs(progress - lastProgress) > .0001) {
    lastProgress = progress;
    introStage.style.setProperty('--scroll-progress', String(progress));
    if (filmProgress) filmProgress.textContent = String(Math.round(progress * 100)).padStart(2, '0');

    const primaryOpacity = 1 - range(progress, .2, .43);
    primaryFilmCopy.style.opacity = String(primaryOpacity);
    primaryFilmCopy.style.transform = `translate3d(0, ${progress * -46}px, 0)`;

    const secondaryOpacity = range(progress, .31, .49) * (1 - range(progress, .8, .96));
    secondaryFilmCopy.style.opacity = String(secondaryOpacity);
    secondaryFilmCopy.style.transform = `translate3d(0, ${(1 - range(progress, .31, .49)) * 34 - range(progress, .8, .96) * 28}px, 0)`;
    }

    if (canAnimate()) drawAtmosphere(time, delta);
    if (canAnimate()) animationFrame = requestAnimationFrame(updateFilm);
  };

  const scheduleFilm = () => {
    if (!animationFrame && !isStill() && !document.hidden && introVisible) animationFrame = requestAnimationFrame(updateFilm);
  };
  const stopFilm = () => {
    cancelAnimationFrame(animationFrame);
    animationFrame = undefined;
    previousTime = 0;
  };
  {
    if (finePointer) {
      introStage.addEventListener('pointermove', (event) => {
        pointerTargetX = (event.clientX / window.innerWidth - .5) * 2;
        pointerTargetY = (event.clientY / window.innerHeight - .5) * 2;
      }, { passive: true });
      introStage.addEventListener('pointerleave', () => {
        pointerTargetX = 0;
        pointerTargetY = 0;
      });
    }

    const introObserver = new IntersectionObserver(([entry]) => {
      introVisible = entry.isIntersecting;
      intro.classList.toggle('film-offscreen', !introVisible);
      if (introVisible) scheduleFilm();
      else stopFilm();
    });
    introObserver.observe(intro);
    resizeAtmosphere();
    window.addEventListener('resize', () => {
      resizeAtmosphere();
      setHeaderState();
      scheduleFilm();
    }, { passive: true });
    window.addEventListener('scroll', scheduleFilm, { passive: true });
    document.addEventListener('visibilitychange', () => {
      intro.classList.toggle('film-offscreen', document.hidden || !introVisible);
      if (document.hidden) stopFilm(); else scheduleFilm();
    });
    motionButton?.addEventListener('click', () => {
      paused = !paused;
      intro.classList.toggle('film-paused', paused);
      motionButton.setAttribute('aria-pressed', String(paused));
      motionButton.textContent = paused ? 'Resume motion' : 'Pause motion';
      if (paused) stopFilm(); else scheduleFilm();
    });
    motionPreference.addEventListener('change', () => {
      stopFilm();
      primaryFilmCopy.style.removeProperty('opacity');
      primaryFilmCopy.style.removeProperty('transform');
      lastProgress = -1;
      resizeAtmosphere();
      scheduleFilm();
    });
    scheduleFilm();
  }
}

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px' });
document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

const filterButtons = document.querySelectorAll('.filter-btn');
const lotCards = document.querySelectorAll('.lot-card');
filterButtons.forEach((button) => button.addEventListener('click', () => {
  filterButtons.forEach((btn) => {
    btn.classList.toggle('active', btn === button);
    btn.setAttribute('aria-pressed', String(btn === button));
  });
  const filter = button.dataset.filter;
  lotCards.forEach((card) => {
    const show = filter === 'all' || card.dataset.process === filter;
    card.classList.toggle('hidden', !show);
  });
}));

const origins = {
  colombia: { number: '01 / 05', country: 'Colombia', region: 'Huila & Nariño', producers: '43', altitude: '1,650—2,100m', harvest: 'Apr—Aug', note: 'High-elevation pink bourbon, caturra and regional landraces from independent family farms.' },
  ethiopia: { number: '02 / 05', country: 'Ethiopia', region: 'Gedeo & Guji', producers: '214', altitude: '1,900—2,280m', harvest: 'Oct—Jan', note: 'Floral heirloom selections from community washing stations and single-producer garden lots.' },
  kenya: { number: '03 / 05', country: 'Kenya', region: 'Kirinyaga & Nyeri', producers: '167', altitude: '1,650—1,950m', harvest: 'Oct—Dec', note: 'Structured SL28 and SL34 lots selected for vivid acidity, black fruit and exceptional density.' },
  costarica: { number: '04 / 05', country: 'Costa Rica', region: 'West Valley', producers: '18', altitude: '1,300—1,750m', harvest: 'Dec—Mar', note: 'Compact family micro-mills known for rigorous honey processing and highly controlled drying.' },
  indonesia: { number: '05 / 05', country: 'Indonesia', region: 'Kerinci & Aceh', producers: '92', altitude: '1,400—1,800m', harvest: 'May—Sep', note: 'Clean washed and wet-hulled profiles from forest-edge farms with careful moisture management.' }
};

const originFields = {
  number: document.querySelector('#origin-number'),
  country: document.querySelector('#origin-country'),
  region: document.querySelector('#origin-region'),
  producers: document.querySelector('#origin-producers'),
  altitude: document.querySelector('#origin-altitude'),
  harvest: document.querySelector('#origin-harvest'),
  note: document.querySelector('#origin-note')
};

const selectOrigin = (marker) => {
  const origin = origins[marker.dataset.origin];
  document.querySelectorAll('.map-marker').forEach((item) => item.classList.toggle('active', item === marker));
  document.querySelectorAll('[data-origin-label]').forEach((label) => label.classList.toggle('active', label.dataset.originLabel === marker.dataset.origin));
  Object.entries(originFields).forEach(([key, element]) => {
    element.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { duration: 340, easing: 'ease-out' });
    element.textContent = origin[key];
  });
};

document.querySelectorAll('.map-marker').forEach((marker) => {
  marker.addEventListener('click', () => selectOrigin(marker));
  marker.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      selectOrigin(marker);
    }
  });
});

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const el = entry.target;
    const target = Number(el.dataset.count);
    const decimals = Number(el.dataset.decimals || 0);
    const start = performance.now();
    const duration = 1400;
    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = (target * eased).toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    counterObserver.unobserve(el);
  });
}, { threshold: .6 });
document.querySelectorAll('[data-count]').forEach((counter) => counterObserver.observe(counter));

const dialog = document.querySelector('#inquiry-dialog');
const inquiryForm = document.querySelector('#inquiry-form');
const success = document.querySelector('.form-success');
const lotSelect = document.querySelector('#lot-select');

const closeDialog = () => {
  dialog.close();
  body.classList.remove('dialog-open');
};

document.querySelectorAll('[data-open-inquiry]').forEach((button) => button.addEventListener('click', () => {
  if (button.dataset.lot) lotSelect.value = button.dataset.lot;
  inquiryForm.hidden = false;
  success.hidden = true;
  dialog.showModal();
  body.classList.add('dialog-open');
}));

document.querySelector('.dialog-close')?.addEventListener('click', closeDialog);
document.querySelector('.dialog-done')?.addEventListener('click', closeDialog);
dialog?.addEventListener('click', (event) => {
  const rect = dialog.getBoundingClientRect();
  const outside = event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom;
  if (outside) closeDialog();
});
dialog?.addEventListener('close', () => body.classList.remove('dialog-open'));

inquiryForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  inquiryForm.hidden = true;
  success.hidden = false;
});
