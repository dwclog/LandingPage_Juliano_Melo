/* ==========================================================================
   HALO — Interactions & Motion
   Smooth scroll (Lenis) + scroll reveals + parallax + cursor + glow (GSAP)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // Render Lucide icons
  if (window.lucide) lucide.createIcons();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     Smooth scroll — Lenis
  ------------------------------------------------------------------ */
  let lenis;
  if (!prefersReducedMotion && window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 1.2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    lenis.on('scroll', () => {
      if (window.ScrollTrigger) ScrollTrigger.update();
    });
  }

  /* ------------------------------------------------------------------
     GSAP setup
  ------------------------------------------------------------------ */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);

    if (lenis) {
      gsap.ticker.add((time) => lenis.raf(time * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    // Scroll reveal for every [data-reveal] element
    const reveals = gsap.utils.toArray('[data-reveal]');
    reveals.forEach((el, i) => {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        filter: 'blur(0px)',
        duration: 1.1,
        ease: 'power3.out',
        delay: (i % 4) * 0.06,
        scrollTrigger: {
          trigger: el,
          start: 'top 88%',
          toggleActions: 'play none none reverse',
        },
      });
    });

    // Hero load-in sequence (plays immediately, not tied to scroll)
    const heroEls = document.querySelectorAll('.hero [data-reveal]');
    gsap.timeline({ defaults: { ease: 'power3.out' } })
      .to(heroEls, {
        opacity: 1, y: 0, filter: 'blur(0px)',
        duration: 1.2, stagger: 0.12,
      }, 0.15);

    // Hero stage (mockup) — slight extra float-in
    gsap.set('.hero__stage', { opacity: 0, y: 60, scale: .96, filter: 'blur(10px)' });
    gsap.to('.hero__stage', {
      opacity: 1, y: 0, scale: 1, filter: 'blur(0px)',
      duration: 1.4, ease: 'power3.out', delay: 0.55,
    });

    // Gentle floating loop for the hero mockup
    if (!prefersReducedMotion) {
      gsap.to('.mockup', {
        y: -14, duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.8,
      });
      gsap.to('.mockup__satellite', {
        y: 16, x: -8, rotate: 4, duration: 5.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1.5,
      });
    }

    // Parallax on ambient orbs as user scrolls
    if (!prefersReducedMotion) {
      gsap.to('.orb--a', {
        y: 160, x: 40,
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1.2 },
      });
      gsap.to('.orb--b', {
        y: -180, x: -30,
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1.2 },
      });
      gsap.to('.orb--c', {
        y: 120, x: -50,
        scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1.2 },
      });
    }

    // Nav condenses slightly on scroll
    ScrollTrigger.create({
      start: 80,
      end: 99999,
      toggleClass: { targets: '.nav__inner', className: 'is-scrolled' },
    });
  }

  /* ------------------------------------------------------------------
     Scroll progress indicator
  ------------------------------------------------------------------ */
  const progressFill = document.querySelector('.scroll-indicator__fill');
  function updateProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressFill) progressFill.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  if (lenis) lenis.on('scroll', updateProgress);
  updateProgress();

  /* ------------------------------------------------------------------
     Custom cursor with magnetic glow on interactive elements
  ------------------------------------------------------------------ */
  const cursor = document.querySelector('.cursor');
  const cursorDot = document.querySelector('.cursor-dot');

  if (cursor && cursorDot && window.matchMedia('(min-width: 861px)').matches) {
    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%,-50%)`;
    });

    function animateCursor() {
      cursorX += (mouseX - cursorX) * 0.18;
      cursorY += (mouseY - cursorY) * 0.18;
      cursor.style.transform = `translate(${cursorX}px, ${cursorY}px) translate(-50%,-50%)`;
      requestAnimationFrame(animateCursor);
    }
    animateCursor();

    const interactiveEls = document.querySelectorAll('a, button, summary, [data-tilt]');
    interactiveEls.forEach((el) => {
      el.addEventListener('mouseenter', () => cursor.classList.add('is-active'));
      el.addEventListener('mouseleave', () => cursor.classList.remove('is-active'));
    });
  }

  /* ------------------------------------------------------------------
     Mouse-glow / subtle tilt on glass cards
  ------------------------------------------------------------------ */
  const tiltEls = document.querySelectorAll('[data-tilt]');
  tiltEls.forEach((el) => {
    let bounds;

    function updateGlow(e) {
      bounds = bounds || el.getBoundingClientRect();
      const x = ((e.clientX - bounds.left) / bounds.width) * 100;
      const y = ((e.clientY - bounds.top) / bounds.height) * 100;
      el.style.setProperty('--mx', x + '%');
      el.style.setProperty('--my', y + '%');
      el.style.background =
        `radial-gradient(320px circle at ${x}% ${y}%, rgba(0,122,255,.14), transparent 60%), var(--glass-fill)`;
    }

    el.addEventListener('mouseenter', () => { bounds = el.getBoundingClientRect(); });
    el.addEventListener('mousemove', updateGlow);
    el.addEventListener('mouseleave', () => {
      el.style.background = 'var(--glass-fill)';
    });
  });

  /* ------------------------------------------------------------------
     Smooth in-page anchor scrolling (works with Lenis if present)
  ------------------------------------------------------------------ */
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetId = link.getAttribute('href');
      if (targetId.length < 2) return;
      const target = document.querySelector(targetId);
      if (!target) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(target, { offset: -20, duration: 1.3 });
      } else {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

});
