/* ============================================================
   BASE CORRETOR DE IMÓVEIS — MAIN.JS
   Navegação · WhatsApp · Formulário · FAQ · GSAP
   ============================================================ */

(() => {
  'use strict';

  const CONFIG = {
    whatsapp: '5515999999999',
    whatsappGreeting: 'Olá! Vim pelo site e gostaria de conversar sobre imóveis.'
  };

  const body = document.body;
  const header = document.getElementById('siteHeader');
  const menuToggle = document.getElementById('menuToggle');
  const mobileNav = document.getElementById('mobileNav');
  const navLinks = document.querySelectorAll('.desktop-nav a, .mobile-nav a[href^="#"]');
  const toast = document.getElementById('toast');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    initIcons();
    initHeader();
    initMobileMenu();
    initSmoothAnchors();
    initActiveNavigation();
    initWhatsAppLinks();
    initContactForm();
    initAccordion();
    initImageFallbacks();
    initAnimations();
    setCurrentYear();
  }

  function initIcons() {
    if (window.lucide) {
      window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
    }
  }

  function initHeader() {
    if (!header) return;

    const update = () => {
      header.classList.toggle('is-scrolled', window.scrollY > 24);
    };

    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  function initMobileMenu() {
    if (!menuToggle || !mobileNav) return;

    menuToggle.addEventListener('click', () => {
      const isOpen = menuToggle.classList.toggle('is-open');
      mobileNav.classList.toggle('is-open', isOpen);
      body.classList.toggle('menu-open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      mobileNav.setAttribute('aria-hidden', String(!isOpen));
    });

    mobileNav.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMobileMenu();
    });
  }

  function closeMobileMenu() {
    if (!menuToggle || !mobileNav) return;

    menuToggle.classList.remove('is-open');
    mobileNav.classList.remove('is-open');
    body.classList.remove('menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    menuToggle.setAttribute('aria-label', 'Abrir menu');
    mobileNav.setAttribute('aria-hidden', 'true');
  }

  function initSmoothAnchors() {
    document.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', (event) => {
        const id = link.getAttribute('href');
        if (!id || id === '#') return;

        const target = document.querySelector(id);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  function initActiveNavigation() {
    const sections = [...document.querySelectorAll('main section[id]')];
    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;

      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${visible.target.id}`);
      });
    }, {
      rootMargin: '-28% 0px -60% 0px',
      threshold: [0.05, 0.25, 0.55]
    });

    sections.forEach((section) => observer.observe(section));
  }

  function onlyNumbers(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function whatsappUrl(message) {
    return `https://wa.me/${onlyNumbers(CONFIG.whatsapp)}?text=${encodeURIComponent(message || CONFIG.whatsappGreeting)}`;
  }

  function initWhatsAppLinks() {
    document.querySelectorAll('.js-whatsapp').forEach((link) => {
      link.setAttribute('href', whatsappUrl(link.dataset.message));
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener');
    });
  }

  function initContactForm() {
    const form = document.getElementById('contactForm');
    if (!form) return;

    const phoneInput = document.getElementById('contactPhone');

    if (phoneInput) {
      phoneInput.addEventListener('input', () => {
        const digits = onlyNumbers(phoneInput.value).slice(0, 11);

        if (digits.length <= 2) {
          phoneInput.value = digits;
        } else if (digits.length <= 7) {
          phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        } else {
          phoneInput.value = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
        }
      });
    }

    form.addEventListener('submit', (event) => {
      event.preventDefault();

      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }

      const name = document.getElementById('contactName')?.value.trim() || '';
      const phone = phoneInput?.value.trim() || '';
      const interest = document.getElementById('contactInterest')?.value || '';
      const message = document.getElementById('contactMessage')?.value.trim() || '';

      const text = [
        `Olá! Meu nome é ${name} e vim pelo site.`,
        `Tenho interesse em: ${interest}.`,
        `Meu WhatsApp: ${phone}.`,
        message ? `Mensagem: ${message}` : ''
      ].filter(Boolean).join('\n\n');

      showToast('Abrindo o WhatsApp com sua mensagem...');
      window.open(whatsappUrl(text), '_blank', 'noopener,noreferrer');
    });
  }

  function initAccordion() {
    document.querySelectorAll('.accordion-item').forEach((item) => {
      const button = item.querySelector('button');
      if (!button) return;

      button.addEventListener('click', () => {
        const accordion = item.closest('.accordion');
        const willOpen = !item.classList.contains('is-open');

        accordion?.querySelectorAll('.accordion-item').forEach((other) => {
          other.classList.remove('is-open');
          other.querySelector('button')?.setAttribute('aria-expanded', 'false');
        });

        if (willOpen) {
          item.classList.add('is-open');
          button.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function initImageFallbacks() {
    document.querySelectorAll('.property-media img, .detail-gallery img').forEach((image) => {
      const markMissing = () => {
        image.style.display = 'none';
        image.closest('.property-media, .gallery-item')?.classList.add('is-missing');
      };

      image.addEventListener('error', markMissing, { once: true });

      if (image.complete && image.naturalWidth === 0) {
        markMissing();
      }
    });
  }

  function initAnimations() {
    if (reducedMotion || !window.gsap || !window.ScrollTrigger) return;

    window.gsap.registerPlugin(window.ScrollTrigger);

    window.gsap.from('.hero-eyebrow', {
      opacity: 0,
      y: 18,
      duration: .75,
      delay: .15,
      ease: 'power3.out'
    });

    window.gsap.from('.hero h1', {
      opacity: 0,
      y: 44,
      duration: 1.05,
      delay: .25,
      ease: 'power3.out'
    });

    window.gsap.from('.hero-copy > p, .hero-actions', {
      opacity: 0,
      y: 25,
      duration: .85,
      delay: .48,
      stagger: .12,
      ease: 'power3.out'
    });

    window.gsap.from('.hero-note', {
      opacity: 0,
      x: 35,
      duration: .85,
      delay: .7,
      ease: 'power3.out'
    });

    window.gsap.to('.hero-image', {
      scale: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: .6
      }
    });

    window.gsap.utils.toArray('.reveal-up').forEach((element) => {
      window.gsap.fromTo(element,
        { opacity: 0, y: 42 },
        {
          opacity: 1,
          y: 0,
          duration: .85,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: element,
            start: 'top 88%',
            once: true
          }
        }
      );
    });
  }

  function setCurrentYear() {
    const year = document.getElementById('currentYear');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  let toastTimer;

  function showToast(message) {
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('is-visible');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), 2800);
  }
})();
