/* ============================================================
   BASE CORRETOR DE IMÓVEIS — MAIN.JS
   Navegação · WhatsApp · Formulário · FAQ · GSAP
   ============================================================ */

(() => {
  'use strict';

  const SITE_CONFIG = window.CRVSITE?.CONFIG || {};

  const CONFIG = {
    adminUrl: SITE_CONFIG.adminUrl || 'https://painel.seudominio.com.br/',
    whatsapp: SITE_CONFIG.fallbackWhatsApp || '5515999999999',
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
  document.addEventListener('crv:organization-ready', updateOrganizationContact);

  function init() {
    initIcons();
    initHeader();
    initMobileMenu();
    initAdminLinks();
    initSmoothAnchors();
    initActiveNavigation();
    initWhatsAppLinks();
    initPropertyCarousel();
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
        if (!id || id === '#' || !id.startsWith('#')) return;

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

  function initAdminLinks() {
    document.querySelectorAll('.js-admin-link').forEach((link) => {
      link.setAttribute('href', CONFIG.adminUrl);
    });
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

  function updateOrganizationContact(event) {
    const organization = event.detail || {};
    CONFIG.whatsapp = organization.whatsapp || organization.phone || CONFIG.whatsapp;
    initWhatsAppLinks();
  }

  function initPropertyCarousel() {
    const carousel = document.getElementById('propertiesCarousel');
    if (!carousel) return;

    const viewport = carousel.querySelector('[data-carousel-viewport]');
    const track = carousel.querySelector('[data-carousel-track]');
    const previousButton = carousel.querySelector('[data-carousel-prev]');
    const nextButton = carousel.querySelector('[data-carousel-next]');
    const dotsContainer = document.querySelector('[data-carousel-dots]');
    const counter = document.querySelector('[data-carousel-counter]');

    if (!viewport || !track) return;

    let cards = [];
    let currentIndex = 0;
    let lastRenderedSteps = 0;
    let scrollFrame;

    const getGap = () => {
      const styles = window.getComputedStyle(track);
      return Number.parseFloat(styles.columnGap || styles.gap) || 0;
    };

    const getVisibleCards = () => {
      const firstCard = cards[0];
      if (!firstCard) return 1;

      return Math.max(1, Math.round((viewport.clientWidth + getGap()) / (firstCard.offsetWidth + getGap())));
    };

    const getTotalSteps = () => Math.max(1, cards.length - getVisibleCards() + 1);

    const updateControls = () => {
      const totalSteps = getTotalSteps();
      currentIndex = Math.min(currentIndex, totalSteps - 1);

      previousButton?.toggleAttribute('disabled', currentIndex === 0);
      nextButton?.toggleAttribute('disabled', currentIndex >= totalSteps - 1);
      carousel.classList.toggle('is-static', totalSteps === 1);

      dotsContainer?.querySelectorAll('button').forEach((dot, index) => {
        const isActive = index === currentIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });

      if (counter) {
        counter.textContent = `${String(Math.min(currentIndex + 1, cards.length)).padStart(2, '0')} / ${String(cards.length).padStart(2, '0')}`;
      }
    };

    const renderDots = () => {
      const totalSteps = getTotalSteps();
      if (!dotsContainer || totalSteps === lastRenderedSteps) return;

      lastRenderedSteps = totalSteps;
      dotsContainer.replaceChildren();

      for (let index = 0; index < totalSteps; index += 1) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.setAttribute('aria-label', `Ir para o destaque ${index + 1}`);
        dot.addEventListener('click', () => goTo(index));
        dotsContainer.appendChild(dot);
      }
    };

    const goTo = (index, behavior = reducedMotion ? 'auto' : 'smooth') => {
      const totalSteps = getTotalSteps();
      currentIndex = Math.max(0, Math.min(index, totalSteps - 1));
      const targetCard = cards[currentIndex];

      if (targetCard) {
        viewport.scrollTo({ left: targetCard.offsetLeft, behavior });
      }

      updateControls();
    };

    const findCurrentIndex = () => {
      if (!cards.length) return 0;

      return cards.reduce((closestIndex, card, index) => {
        const closestDistance = Math.abs(cards[closestIndex].offsetLeft - viewport.scrollLeft);
        const currentDistance = Math.abs(card.offsetLeft - viewport.scrollLeft);
        return currentDistance < closestDistance ? index : closestIndex;
      }, 0);
    };

    const refresh = () => {
      cards = [...track.querySelectorAll('.property-card')];
      lastRenderedSteps = 0;
      renderDots();
      goTo(Math.min(currentIndex, getTotalSteps() - 1), 'auto');
    };

    previousButton?.addEventListener('click', () => goTo(currentIndex - 1));
    nextButton?.addEventListener('click', () => goTo(currentIndex + 1));

    viewport.addEventListener('scroll', () => {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(() => {
        currentIndex = Math.min(findCurrentIndex(), getTotalSteps() - 1);
        updateControls();
      });
    }, { passive: true });

    viewport.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goTo(currentIndex - 1);
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        goTo(currentIndex + 1);
      }
    });

    if ('ResizeObserver' in window) {
      const resizeObserver = new ResizeObserver(refresh);
      resizeObserver.observe(viewport);
    } else {
      window.addEventListener('resize', refresh, { passive: true });
    }

    const mutationObserver = new MutationObserver(refresh);
    mutationObserver.observe(track, { childList: true });

    refresh();
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
