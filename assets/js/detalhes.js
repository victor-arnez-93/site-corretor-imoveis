/* ============================================================
   BASE CORRETOR DE IMÓVEIS — DETALHES.JS
   Galeria · Compartilhamento · WhatsApp contextual
   ============================================================ */

(() => {
  'use strict';

  const WHATSAPP = '5515999999999';
  const propertyName = document.body.dataset.property || 'este imóvel';
  const propertyCode = document.body.dataset.reference || '';

  document.addEventListener('DOMContentLoaded', () => {
    initPropertyWhatsApp();
    initShare();
    initLightbox();
  });

  function onlyNumbers(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function whatsappUrl(message) {
    return `https://wa.me/${onlyNumbers(WHATSAPP)}?text=${encodeURIComponent(message)}`;
  }

  function initPropertyWhatsApp() {
    const message = `Olá! Tenho interesse no imóvel ${propertyName}${propertyCode ? `, referência ${propertyCode}` : ''}. Gostaria de saber mais e verificar a disponibilidade.`;

    document.querySelectorAll('.js-property-whatsapp').forEach((link) => {
      link.href = whatsappUrl(message);
      link.target = '_blank';
      link.rel = 'noopener';
    });
  }

  function initShare() {
    const button = document.getElementById('shareProperty');
    if (!button) return;

    button.addEventListener('click', async () => {
      const data = {
        title: `${propertyName} | Lucas Almeida Imóveis`,
        text: `Conheça este imóvel: ${propertyName}`,
        url: window.location.href
      };

      try {
        if (navigator.share) {
          await navigator.share(data);
          return;
        }

        await navigator.clipboard.writeText(window.location.href);
        showDetailToast('Link do imóvel copiado.');
      } catch (error) {
        if (error?.name !== 'AbortError') {
          showDetailToast('Não foi possível compartilhar agora.');
        }
      }
    });
  }

  function initLightbox() {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightboxImage');
    const counter = document.getElementById('lightboxCounter');
    const images = [...document.querySelectorAll('.gallery-item img')]
      .filter((image) => image.getAttribute('src'));

    if (!lightbox || !lightboxImage || !images.length) return;

    let currentIndex = 0;

    const render = () => {
      const image = images[currentIndex];
      lightboxImage.src = image.src;
      lightboxImage.alt = image.alt;
      if (counter) counter.textContent = `${currentIndex + 1} / ${images.length}`;
    };

    const open = (index) => {
      currentIndex = index;
      render();
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      document.getElementById('lightboxClose')?.focus();
    };

    const close = () => {
      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      lightboxImage.removeAttribute('src');
    };

    const move = (direction) => {
      currentIndex = (currentIndex + direction + images.length) % images.length;
      render();
    };

    images.forEach((image, index) => image.addEventListener('click', () => open(index)));
    document.getElementById('lightboxClose')?.addEventListener('click', close);
    document.getElementById('lightboxPrev')?.addEventListener('click', () => move(-1));
    document.getElementById('lightboxNext')?.addEventListener('click', () => move(1));

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox) close();
    });

    document.addEventListener('keydown', (event) => {
      if (!lightbox.classList.contains('is-open')) return;

      if (event.key === 'Escape') close();
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
    });
  }

  function showDetailToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('is-visible');
    window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }
})();
