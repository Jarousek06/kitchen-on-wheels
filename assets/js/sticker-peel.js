/* StickerPeel (React Bits) – vanilla JS port. Needs GSAP + Draggable. */
(function () {
  if (!window.gsap || !window.Draggable) return;
  gsap.registerPlugin(Draggable);

  var uid = 0;
  function init(stage) {
    var id = ++uid;
    var src = stage.dataset.src;
    var width = Math.min(+stage.dataset.width || 200, stage.clientWidth * 0.8);
    stage.style.setProperty('--sticker-w', width + 'px');
    var rotate = +(stage.dataset.rotate || 30);
    var hover = +(stage.dataset.hover || 30);
    var active = +(stage.dataset.active || 40);
    var shadow = +(stage.dataset.shadow || 0.6);
    var light = +(stage.dataset.light || 0.1);
    var dir = +(stage.dataset.peelDirection || 0);

    var el = document.createElement('div');
    el.className = 'sticker-draggable';
    el.style.setProperty('--sticker-rotate', rotate + 'deg');
    el.style.setProperty('--sticker-peelback-hover', hover + '%');
    el.style.setProperty('--sticker-peelback-active', active + '%');
    el.style.setProperty('--sticker-width', width + 'px');
    el.style.setProperty('--peel-direction', dir + 'deg');
    el.innerHTML =
      '<svg width="0" height="0" style="position:absolute"><defs>' +
      '<filter id="pointLight-' + id + '"><feGaussianBlur stdDeviation="1" result="blur"/>' +
      '<feSpecularLighting result="spec" in="blur" specularExponent="100" specularConstant="' + light + '" lighting-color="white"><fePointLight x="100" y="100" z="300"/></feSpecularLighting>' +
      '<feComposite in="spec" in2="SourceGraphic" result="lit"/><feComposite in="lit" in2="SourceAlpha" operator="in"/></filter>' +
      '<filter id="pointLightFlipped-' + id + '"><feGaussianBlur stdDeviation="10" result="blur"/>' +
      '<feSpecularLighting result="spec" in="blur" specularExponent="100" specularConstant="' + (light * 7) + '" lighting-color="white"><fePointLight x="100" y="100" z="300"/></feSpecularLighting>' +
      '<feComposite in="spec" in2="SourceGraphic" result="lit"/><feComposite in="lit" in2="SourceAlpha" operator="in"/></filter>' +
      '<filter id="dropShadow-' + id + '"><feDropShadow dx="2" dy="4" stdDeviation="' + (3 * shadow) + '" flood-color="black" flood-opacity="' + shadow + '"/></filter>' +
      '<filter id="expandAndFill-' + id + '"><feOffset dx="0" dy="0" in="SourceAlpha" result="shape"/><feFlood flood-color="rgb(179,179,179)" result="flood"/><feComposite operator="in" in="flood" in2="shape"/></filter>' +
      '</defs></svg>' +
      '<div class="sticker-container">' +
      '<div class="sticker-main"><div class="sticker-lighting"><img src="' + src + '" alt="" class="sticker-image" draggable="false"></div></div>' +
      '<div class="flap"><div class="flap-lighting"><img src="' + src + '" alt="" class="flap-image" draggable="false"></div></div>' +
      '</div>';
    stage.appendChild(el);

    var container = el.querySelector('.sticker-container');
    function f(sel, n) { el.querySelector(sel).style.filter = 'url(#' + n + '-' + id + ')'; }
    f('.sticker-main', 'dropShadow'); f('.sticker-lighting', 'pointLight');
    f('.flap-lighting', 'pointLightFlipped'); f('.flap-image', 'expandAndFill');
    var pl = el.querySelector('#pointLight-' + id + ' fePointLight');
    var plf = el.querySelector('#pointLightFlipped-' + id + ' fePointLight');
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });

    var img = el.querySelector('.sticker-image');
    var drag = Draggable.create(el, {
      type: 'x,y', bounds: stage, inertia: false,
      onDrag: function () {
        gsap.to(el, { rotation: gsap.utils.clamp(-24, 24, this.deltaX * 0.4), duration: 0.15, ease: 'power1.out' });
      },
      onDragEnd: function () { gsap.to(el, { rotation: 0, duration: 0.8, ease: 'power2.out' }); }
    })[0];

    function center() {
      var s = stage.getBoundingClientRect(), t = el.getBoundingClientRect();
      gsap.set(el, { x: (s.width - t.width) / 2, y: (s.height - t.height) / 2 });
      drag.update();
    }
    if (window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      var st = { p: 78 };
      function apply() {
        container.style.setProperty('--scroll-peel', st.p + '%');
        container.classList.toggle('scroll-peeling', st.p > 0.5);
      }
      apply();
      gsap.fromTo(st, { p: 78 }, {
        p: 0, ease: 'none', onUpdate: apply,
        scrollTrigger: { trigger: stage, start: 'top 92%', end: 'center 55%', scrub: 0.6 }
      });
      gsap.fromTo(container, { scale: 1.12 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: stage, start: 'top 92%', end: 'center 55%', scrub: 0.6 }
      });
    }
    if (img.complete) center(); else img.addEventListener('load', center);

    container.addEventListener('mousemove', function (e) {
      var r = container.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      gsap.set(pl, { attr: { x: x, y: y } });
      gsap.set(plf, { attr: { x: x, y: r.height - y } });
    });
    container.addEventListener('touchstart', function () { container.classList.add('touch-active'); }, { passive: true });
    ['touchend', 'touchcancel'].forEach(function (n) {
      container.addEventListener(n, function () { container.classList.remove('touch-active'); });
    });

    window.addEventListener('resize', function () {
      drag.update();
      var s = stage.getBoundingClientRect(), t = el.getBoundingClientRect();
      var x = gsap.getProperty(el, 'x'), y = gsap.getProperty(el, 'y');
      gsap.to(el, { x: Math.max(0, Math.min(x, s.width - t.width)), y: Math.max(0, Math.min(y, s.height - t.height)), duration: 0.3 });
    });
  }

  document.querySelectorAll('[data-sticker-peel]').forEach(init);
})();
