// ── UTILITY: Character-level text splitter ────────────────────────────────────
// Wraps each character in an overflow:hidden outer span (mask) and an
// animatable inner span (.split-char). Spaces become non-breaking spaces.
// Skips elements that contain child HTML (icons etc.) to avoid breaking them.
function splitText(el) {
  if (el.children.length > 0) return;
  var text = el.innerText;
  el.innerHTML = '';
  text.split('').forEach(function (char) {
    var outer = document.createElement('span');
    outer.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:bottom;line-height:1.15;';
    var inner = document.createElement('span');
    inner.classList.add('split-char');
    inner.style.display = 'inline-block';
    inner.textContent = char === ' ' ? ' ' : char;
    outer.appendChild(inner);
    el.appendChild(outer);
  });
}


// ── CUSTOM CURSOR ─────────────────────────────────────────────────────────────
// Runs on DOMContentLoaded — doesn't need images to be ready
document.addEventListener('DOMContentLoaded', function () {
  if (!window.matchMedia('(pointer: fine)').matches) return;

  var dot    = document.querySelector('.cursor-dot');
  var ring   = document.querySelector('.cursor-ring');
  var mouseX = window.innerWidth  / 2;
  var mouseY = window.innerHeight / 2;
  var ringX  = mouseX;
  var ringY  = mouseY;

  // Dot snaps instantly; ring lerps behind for a trailing feel
  document.addEventListener('mousemove', function (e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + 'px';
    dot.style.top  = mouseY + 'px';
  });

  (function lerpRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    ring.style.left = (Math.round(ringX * 10) / 10) + 'px';
    ring.style.top  = (Math.round(ringY * 10) / 10) + 'px';
    requestAnimationFrame(lerpRing);
  })();

  // Expand + recolour on interactive elements
  var interactives = document.querySelectorAll(
    'a, button, input[type="submit"], ' +
    '.services-card, .portfolio-card, ' +
    '.education .box, #darkmode, #menu-icon, .tab-links'
  );
  interactives.forEach(function (el) {
    el.addEventListener('mouseenter', function () {
      dot.classList.add('cursor-hover');
      ring.classList.add('cursor-hover');
    });
    el.addEventListener('mouseleave', function () {
      dot.classList.remove('cursor-hover');
      ring.classList.remove('cursor-hover');
    });
  });

  // Fade out when mouse leaves the browser window
  document.addEventListener('mouseleave', function () {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', function () {
    dot.style.opacity  = '1';
    ring.style.opacity = '1';
  });
});


// ── PAGE LOADER ───────────────────────────────────────────────────────────────
// Runs immediately when the script is parsed (GSAP is already loaded above it).
// sessionStorage flag ensures the loader only plays once per browser session.
(function initLoader() {
  var wrapper  = document.querySelector('.loader-wrapper');
  var counter  = document.querySelector('.loader-counter');
  var fill     = document.querySelector('.loader-bar-fill');
  var panelTop = document.querySelector('.loader-panel.top');
  var panelBot = document.querySelector('.loader-panel.bottom');

  if (!wrapper) return;

  // Fires after panels retract — animates the hero section entrance
  function revealHero() {
    var heroH1   = document.querySelector('.home-text h1');
    var heroSpan = document.querySelector('.home-text > span');
    var heroP    = document.querySelector('.home-text p');
    var heroBtns = document.querySelectorAll('.home-text .btn, .home-text .btn1');

    if (heroH1) {
      splitText(heroH1);
      gsap.from(heroH1.querySelectorAll('.split-char'), {
        y: '110%',
        rotateX: -15,
        opacity: 0,
        stagger: 0.04,
        duration: 0.75,
        ease: 'power3.out',
        delay: 0.1,
      });
    }
    if (heroSpan) {
      gsap.from(heroSpan, { y: 20, opacity: 0, duration: 0.5, ease: 'power3.out' });
    }
    if (heroP) {
      gsap.from(heroP, { y: 20, opacity: 0, duration: 0.5, delay: 0.15, ease: 'power3.out' });
    }
    if (heroBtns.length) {
      gsap.from(heroBtns, { y: 20, opacity: 0, duration: 0.5, delay: 0.28, stagger: 0.1, ease: 'power3.out' });
    }
    // Social icons slide in from left, staggered, slightly after buttons
    gsap.from('.social a', {
      x: -22, opacity: 0, duration: 0.45, delay: 0.42,
      stagger: 0.07, ease: 'power3.out',
    });
  }

  // Skip loader on repeat visits within the same browser session
  if (sessionStorage.getItem('devroy_loaded')) {
    wrapper.style.display = 'none';
    revealHero();
    return;
  }
  sessionStorage.setItem('devroy_loaded', '1');

  // Animate counter 0 → 100 in sync with the bar
  var proxy = { val: 0 };
  gsap.to(proxy, {
    val: 100,
    duration: 1.8,
    ease: 'power1.inOut',
    onUpdate: function () {
      if (counter) counter.textContent = Math.round(proxy.val);
    },
  });

  // Main loader timeline: fill bar → pause → tear screen apart
  gsap.timeline()
    .to(fill, { width: '100%', duration: 1.8, ease: 'power1.inOut' })
    .to({}, { duration: 0.25 })   // brief hold at 100 before reveal
    .call(function () {
      // Screen tear: top panel flies up, bottom panel flies down
      gsap.timeline({
        onComplete: function () {
          wrapper.style.display = 'none';
          revealHero();
        },
      })
        .to(counter,            { opacity: 0, duration: 0.25, ease: 'power2.out' }, 0)
        .to('.loader-bar-track',{ opacity: 0, duration: 0.25, ease: 'power2.out' }, 0)
        .to(panelTop, { yPercent: -100, duration: 0.9, ease: 'power4.inOut' }, 0.1)
        .to(panelBot, { yPercent:  100, duration: 0.9, ease: 'power4.inOut' }, 0.1);
    });
})();


// ── SCROLL-BASED ANIMATIONS ───────────────────────────────────────────────────
window.addEventListener('load', function () {

  // ── LENIS SMOOTH SCROLL ──────────────────────────────────────────────────
  var lenis = new Lenis({ lerp: 0.07, smoothTouch: false, normalizeWheel: true });
  window.lenis = lenis;
  gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
  gsap.ticker.lagSmoothing(0);
  lenis.on('scroll', ScrollTrigger.update);

  // ── SECTION TOP-LINE REVEAL ───────────────────────────────────────────────
  // Injects a .section-line div into each non-hero section and sweeps its
  // width from 0→100% as the section enters the viewport.
  gsap.utils.toArray('section:not(.home)').forEach(function (sec) {
    var line = document.createElement('div');
    line.className = 'section-line';
    sec.prepend(line);
    gsap.to(line, {
      scrollTrigger: { trigger: sec, start: 'top 88%', once: true },
      width: '100%',
      duration: 1.1,
      ease: 'power2.inOut',
    });
  });

  // ── HERO PARALLAX EXIT ───────────────────────────────────────────────────
  gsap.to('.home-text', {
    scrollTrigger: { trigger: '.home', start: 'top top', end: 'bottom top', scrub: 1 },
    y: -80, opacity: 0,
  });
  gsap.to('.home-img', {
    scrollTrigger: { trigger: '.home', start: 'top top', end: 'bottom top', scrub: 1.5 },
    y: -40, scale: 0.92, opacity: 0,
  });

  // ── SECTION HEADING: character splits + span label ────────────────────────
  gsap.utils.toArray('.heading h2').forEach(function (h2) {
    splitText(h2);
    var tl = gsap.timeline({
      scrollTrigger: { trigger: h2, start: 'top 88%', toggleActions: 'play none none reverse' },
    });
    tl.from(h2.querySelectorAll('.split-char'), {
      y: '110%', rotateX: -15, opacity: 0,
      stagger: 0.032, duration: 0.62, ease: 'power3.out',
    });
    // Animate the sibling span / span2 label (if present) after the chars land
    var label = h2.parentElement.querySelector('span, span2');
    if (label) {
      tl.from(label, { y: 10, opacity: 0, duration: 0.45, ease: 'power2.out' }, '-=0.2');
    }
  });

  // ── ABOUT: columns + stats count-up ──────────────────────────────────────
  gsap.from('.about-col-1', {
    scrollTrigger: { trigger: '.about', start: 'top 80%', toggleActions: 'play none none reverse' },
    x: -70, opacity: 0, duration: 0.85, ease: 'power3.out',
  });
  gsap.from('.about-col-2', {
    scrollTrigger: { trigger: '.about', start: 'top 80%', toggleActions: 'play none none reverse' },
    x: 70, opacity: 0, duration: 0.85, ease: 'power3.out',
  });

  // Stat items stagger in, then each number counts up
  gsap.from('.about-stats .stat-item', {
    scrollTrigger: { trigger: '.about-stats', start: 'top 88%', toggleActions: 'play none none reverse' },
    y: 24, opacity: 0, duration: 0.5, stagger: 0.14, ease: 'power2.out',
  });
  document.querySelectorAll('.stat-number').forEach(function (el) {
    var raw    = el.textContent.trim();
    var suffix = raw.replace(/[0-9]/g, '');
    var target = parseInt(raw, 10);
    var proxy  = { val: 0 };
    el.textContent = '0' + suffix;
    ScrollTrigger.create({
      trigger: el, start: 'top 88%', once: true,
      onEnter: function () {
        gsap.to(proxy, {
          val: target, duration: 1.6, ease: 'power2.out',
          onUpdate: function () { el.textContent = Math.round(proxy.val) + suffix; },
        });
      },
    });
  });

  // ── EDUCATION: quote + boxes alternating slide ────────────────────────────
  gsap.from('.qoute', {
    scrollTrigger: { trigger: '.qoute', start: 'top 88%', toggleActions: 'play none none reverse' },
    y: 18, opacity: 0, duration: 0.6, ease: 'power2.out',
  });
  gsap.utils.toArray('.education .box').forEach(function (box, i) {
    gsap.from(box, {
      scrollTrigger: { trigger: box, start: 'top 88%', toggleActions: 'play none none reverse' },
      x: i % 2 === 0 ? -65 : 65, opacity: 0, duration: 0.72, ease: 'power3.out',
    });
  });

  // ── SERVICES: staggered wave ──────────────────────────────────────────────
  gsap.from('.services-card', {
    scrollTrigger: { trigger: '.services-content', start: 'top 85%', toggleActions: 'play none none reverse' },
    y: 50, opacity: 0, duration: 0.52,
    stagger: { amount: 0.55, from: 'start' },
    ease: 'power2.out',
  });

  // ── PORTFOLIO: cards scale-pop + morebtn ─────────────────────────────────
  gsap.from('.portfolio-card', {
    scrollTrigger: { trigger: '.portfolio-content', start: 'top 88%', toggleActions: 'play none none reverse' },
    y: 40, scale: 0.90, opacity: 0, duration: 0.52,
    stagger: { amount: 0.5, from: 'start' },
    ease: 'back.out(1.3)',
  });
  gsap.from('.portfolio .morebtn', {
    scrollTrigger: { trigger: '.portfolio .morebtn', start: 'top 95%', toggleActions: 'play none none reverse' },
    y: 20, opacity: 0, duration: 0.5, ease: 'power2.out',
  });

  // ── EXPERIENCE: each item slides from its own side ────────────────────────
  gsap.utils.toArray('.experience .container').forEach(function (item) {
    gsap.from(item, {
      scrollTrigger: { trigger: item, start: 'top 85%', toggleActions: 'play none none reverse' },
      x: item.classList.contains('left') ? -75 : 75, opacity: 0, duration: 0.68, ease: 'power3.out',
    });
  });

  // ── CONTACT FORM ─────────────────────────────────────────────────────────
  gsap.from('#contact_form', {
    scrollTrigger: { trigger: '#contact_form', start: 'top 85%', toggleActions: 'play none none reverse' },
    y: 55, opacity: 0, duration: 0.85, ease: 'power3.out',
  });

  // ── FOOTER ───────────────────────────────────────────────────────────────
  gsap.from('footer', {
    scrollTrigger: { trigger: 'footer', start: 'top 95%', toggleActions: 'play none none reverse' },
    y: 28, opacity: 0, duration: 0.6, ease: 'power2.out',
  });

  // Refresh after splitText DOM mutations settle
  ScrollTrigger.refresh();

  // ── VANILLA TILT ─────────────────────────────────────────────────────────
  // Skip on touch/coarse-pointer devices — tilt only makes sense with a mouse
  if (window.VanillaTilt && window.matchMedia('(pointer: fine)').matches) {

    VanillaTilt.init(document.querySelectorAll('.services-card'), {
      max: 10,
      speed: 400,
      scale: 1.04,
      glare: true,
      'max-glare': 0.10,
      perspective: 700,
    });

    VanillaTilt.init(document.querySelectorAll('.portfolio-card'), {
      max: 7,
      speed: 400,
      scale: 1.05,
      glare: true,
      'max-glare': 0.18,
      perspective: 700,
    });

    VanillaTilt.init(document.querySelectorAll('.education .box'), {
      max: 6,
      speed: 400,
      scale: 1.03,
      glare: true,
      'max-glare': 0.08,
      perspective: 800,
    });
  }
});
