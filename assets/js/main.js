document.addEventListener('DOMContentLoaded', () => {
  // CRAV-style custom cursor: a small dot trails the mouse with a slight
  // lag, and disappears entirely over buttons/links — their own hover
  // animation (lift, rotate, color swap) is the feedback instead.
  const cursorDot = document.getElementById('cursorDot');
  if (cursorDot && window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let mx = window.innerWidth / 2, my = window.innerHeight / 2, cx = mx, cy = my;
    let started = false;
    window.addEventListener('mousemove', (e) => {
      mx = e.clientX; my = e.clientY;
      if (!started) { started = true; document.documentElement.classList.add('cursor-ready'); }
    }, { passive: true });

    const tick = () => {
      cx += (mx - cx) * 0.25;
      cy += (my - cy) * 0.25;
      cursorDot.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);

    const HIDE_SEL = 'a, button, .btn, .btn-blob, input, textarea, select';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(HIDE_SEL)) cursorDot.classList.add('hidden-over');
    });
    document.addEventListener('mouseout', (e) => {
      const stillInside = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest(HIDE_SEL);
      if (e.target.closest(HIDE_SEL) && !stillInside) cursorDot.classList.remove('hidden-over');
    });
  }

  // CRAV "SplitPop" cascade, reverse-engineered from their own component:
  // each word/letter starts scaled to 0 with a random y-drift (18-40px) and
  // random tilt (-16..16deg), then pops to place with a back.out overshoot,
  // staggered ~55ms apart — not a uniform slide, every unit lands a bit
  // differently so the cascade reads as organic rather than mechanical.
  const rand = (a, b) => a + Math.random() * (b - a);
  const splitPopText = (el, mode, baseDelay) => {
    if (!el) return;
    const label = el.textContent.trim();
    const lines = el.innerHTML.split(/<br\s*\/?>/i);
    let i = 0;
    const stagger = mode === 'letter' ? 0.04 : 0.055;
    const html = lines.map(line => {
      const units = mode === 'letter' ? line.split('') : line.split(/(\s+)/);
      return units.map(u => {
        if (u === '') return '';
        if (mode !== 'letter' && /^\s+$/.test(u)) return u;
        const delay = (baseDelay + i * stagger).toFixed(3);
        const y = rand(18, 40).toFixed(1);
        const r = rand(-16, 16).toFixed(1);
        i++;
        const cls = mode === 'letter' ? 'pop-letter' : 'pop-word';
        return `<span class="${cls}" style="--pop-y:${y}px;--pop-r:${r}deg;transition-delay:${delay}s;animation-delay:${delay}s"><span>${u === ' ' ? '&nbsp;' : u}</span></span>`;
      }).join('');
    }).join('<br>');
    el.innerHTML = html;
    el.setAttribute('aria-label', label);
    el.classList.add('pop-text-ready');
  };

  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    splitPopText(document.querySelector('.hero-giant'), 'letter', 0.1);
    document.querySelectorAll('h2.pop-text').forEach(h => splitPopText(h, 'word', 0));
  }

  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    if (sessionStorage.getItem('kow_visited')) {
      loadingScreen.classList.add('hidden');
    } else {
      sessionStorage.setItem('kow_visited', '1');
      setTimeout(() => loadingScreen.classList.add('hidden'), 1000);
    }
  }

  const titlePhrases = ['Grilujeme...', 'Pečeme bulku...', 'Přidáváme cheddar...', 'Kitchen On Wheels'];
  let titleIndex = 0;
  setInterval(() => {
    titleIndex = (titleIndex + 1) % titlePhrases.length;
    document.title = titlePhrases[titleIndex];
  }, 3200);

  const header = document.querySelector('.site-header');
  const toggle = document.querySelector('.nav-toggle');
  const overlay = document.getElementById('navOverlay');

  const onScroll = () => {
    if (window.scrollY > 40) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  if (toggle && overlay) {
    const closeOverlay = () => {
      overlay.classList.remove('open');
      toggle.classList.remove('open');
      document.body.style.overflow = '';
    };
    const openOverlay = () => {
      overlay.classList.add('open');
      toggle.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    toggle.addEventListener('click', () => {
      if (overlay.classList.contains('open')) closeOverlay();
      else openOverlay();
    });
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) closeOverlay();
    });
    overlay.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', closeOverlay);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeOverlay();
    });
  }

  // Juggle toss — the actual CRAV algorithm, not a yoyo approximation: one
  // independent GSAP timeline per ingredient. Each cycle re-rolls its own
  // apex/drift/duration/gravity/rotation/repeatDelay, runs once (no
  // repeat/yoyo), and on completion schedules its own next run via
  // delayedCall — so the four ingredients never move in sync and no two
  // tosses look alike. GSAP owns transform entirely (x/y/rotation/scale/
  // xPercent); CSS only places the element (bottom:0, left:lane%).
  const jugglers = document.querySelectorAll('.footer-ingredients img');
  if (jugglers.length && window.gsap && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const rand = (a, b) => gsap.utils.random(a, b);
    // CRAV's own restVH/apex/drift are percentages of the full page
    // viewport (their footer has a tall open lane to toss into — apex 60
    // means 60vh, over half a typical screen). Copying those as literal vh/
    // vw here would launch ingredients clean out of our compact footer and
    // into the section above it. So the exact same ranges/formulas are kept,
    // but scoped as a percentage of a dedicated stage size instead of the
    // page viewport. At these sizes the apex still reaches up into the
    // giant "Kitchen On Wheels" wordmark — that's fine and intentional: the
    // wordmark is z-index:2 vs. this layer's z-index:1, so a rising
    // ingredient dips *behind* the letters (peeking through the gaps)
    // instead of covering them, and never escapes the footer itself.
    const isDesktop = window.matchMedia('(min-width: 769px)').matches;
    const stageEl = document.querySelector('.footer-ingredients');
    const i = isDesktop
      ? { restVH: 22, apex: [38, 60], driftStart: [2, 7], driftEnd: [8, 24], upDur: [1.25, 1.7], gravityRatio: [1.1, 1.35], spin: [220, 600], repeatDelay: [.2, .9], staggerStart: .55, stageH: 240 }
      : { restVH: 8, apex: [12, 18], driftStart: [1, 3], driftEnd: [5, 10], upDur: [1.0, 1.35], gravityRatio: [1.08, 1.2], spin: [80, 180], repeatDelay: [.12, .38], staggerStart: .4, stageH: 130 };
    stageEl.style.zIndex = 3; // fly in front of the wordmark
    stageEl.style.setProperty('--juggle-scale', isDesktop ? 1 : 1.29);
    // driftStart/driftEnd are % of the container's own actual width (not a
    // guessed constant), so a lane near the left/right edge can't drift an
    // ingredient off-screen regardless of viewport size.
    const stageW = stageEl.clientWidth;
    const pctH = v => `${v * i.stageH / 100}px`;
    const pctW = v => `${v * stageW / 100}px`;

    const timelines = new Set();
    const u = (e) => {
      // apex: clear the whole two-line wordmark, then rise a bit above it
      const giantEl = document.querySelector('.footer-giant');
      const toTop = stageEl.getBoundingClientRect().bottom - giantEl.getBoundingClientRect().top;
      const apexPx = toTop + rand(30, 110);
      const r = Math.random() > 0.5 ? 1 : -1;
      const n = -(rand(...i.driftStart) * r);
      const o = rand(...i.driftEnd) * r;
      const l = rand(...i.upDur);
      const c = l * rand(...i.gravityRatio);
      const d = l + c;
      const h = rand(...i.spin) * (Math.random() > 0.5 ? 1 : -1);
      const f = rand(...i.repeatDelay);

      gsap.set(e, { xPercent: -50, x: pctW(n), y: pctH(i.restVH), rotation: 0, opacity: 0, scale: .9 });

      const p = gsap.timeline({
        defaults: { overwrite: 'auto' },
        onComplete: () => { timelines.delete(p); gsap.delayedCall(f, () => u(e)); }
      });
      timelines.add(p);

      p.to(e, { opacity: 1, scale: 1, duration: .18, ease: 'power1.out' }, 0)
        .to(e, { y: -apexPx, duration: l, ease: 'power2.out' }, 0)
        .to(e, { y: pctH(i.restVH), duration: c, ease: 'power2.in' }, l)
        .to(e, { x: pctW(o), duration: d, ease: 'sine.inOut' }, 0)
        .to(e, { rotation: h, duration: d, ease: 'none' }, 0)
        .to(e, { opacity: 0, duration: .25, ease: 'power1.in' }, d - .25);
    };

    jugglers.forEach((e, idx) => gsap.delayedCall(idx * i.staggerStart + rand(0, .4), () => u(e)));

    document.addEventListener('visibilitychange', () => {
      timelines.forEach(p => document.hidden ? p.pause() : p.play());
    });
  }

  // Hero "idle sway": same self-perpetuating principle as the footer
  // juggle-toss above (CRAV technique — pick a random target, ease to it,
  // repeat with a fresh random target so no two loops match), but scaled
  // down to a subtle ambient hover instead of a full toss, since these are
  // pinned badge stickers, not tossed ingredients. Each sticker wobbles its
  // rotation around its own --float-rot baseline (set in CSS per st-1..4)
  // instead of resetting to 0, so it keeps its designed tilt. Starts only
  // after the element's popIn entrance finishes, so it doesn't fight it.
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const sineInOut = t => -(Math.cos(Math.PI * t) - 1) / 2;
    const idleSway = (el, cfg) => {
      let x = 0, y = 0, rot = cfg.baseRot;
      const leg = () => {
        const nx = rand(...cfg.x) * (Math.random() > .5 ? 1 : -1);
        const ny = -rand(...cfg.y);
        const nr = cfg.baseRot + rand(...cfg.rot) * (Math.random() > .5 ? 1 : -1);
        const dur = rand(...cfg.dur);
        const steps = 24;
        const keyframes = Array.from({ length: steps + 1 }, (_, i) => {
          const t = sineInOut(i / steps);
          return { transform: `translate(${(x + (nx - x) * t).toFixed(2)}px, ${(y + (ny - y) * t).toFixed(2)}px) rotate(${(rot + (nr - rot) * t).toFixed(2)}deg)` };
        });
        const anim = el.animate(keyframes, { duration: dur * 1000, easing: 'linear', fill: 'forwards' });
        anim.onfinish = () => { x = nx; y = ny; rot = nr; leg(); };
      };
      leg();
    };

    const startIdle = (el, cfg) => el.addEventListener('animationend', () => idleSway(el, cfg), { once: true });

    document.querySelectorAll('.hero-stage .sticker').forEach(el => {
      const baseRot = parseFloat(getComputedStyle(el).getPropertyValue('--float-rot')) || 0;
      startIdle(el, { x: [4, 9], y: [3, 8], rot: [2, 5], dur: [2.6, 4], baseRot });
    });

    const heroPhoto = document.querySelector('.hero-photo-cutout');
    if (heroPhoto) startIdle(heroPhoto, { x: [3, 6], y: [8, 14], rot: [1, 2.4], dur: [3.4, 5], baseRot: 0 });

    document.addEventListener('visibilitychange', () => {
      document.querySelectorAll('.hero-stage .sticker, .hero-photo-cutout').forEach(el => {
        el.getAnimations().forEach(a => { document.hidden ? a.pause() : a.play(); });
      });
    });
  }

  const revealTargets = document.querySelectorAll('.reveal, .reveal-stagger');
  if ('IntersectionObserver' in window && revealTargets.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    revealTargets.forEach(el => io.observe(el));
  } else {
    revealTargets.forEach(el => el.classList.add('in-view'));
  }
});


// Marquee: repeat the items until one half is wider than the viewport, then
// duplicate it so the -50% loop never shows a gap (wide monitors, tablets).
(function () {
  const track = document.querySelector('.marquee-track');
  if (!track) return;
  const base = Array.from(track.children).slice(0, Math.ceil(track.children.length / 2));
  const build = () => {
    track.innerHTML = '';
    base.forEach(n => track.appendChild(n.cloneNode(true)));
    const half = () => track.scrollWidth;
    let guard = 0;
    while (half() < window.innerWidth + 50 && guard++ < 20) base.forEach(n => track.appendChild(n.cloneNode(true)));
    const w = half();
    Array.from(track.children).forEach(n => track.appendChild(n.cloneNode(true)));
    track.style.setProperty('--marquee-dur', Math.max(18, w / 55) + 's'); // ~55px/s
  };
  build();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);
  let t; window.addEventListener('resize', () => { clearTimeout(t); t = setTimeout(build, 250); });
})();
