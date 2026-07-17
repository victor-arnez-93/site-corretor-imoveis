/* ============================================================
   CRV IMOB — DETALHES.JS
   Imóvel dinâmico · Galeria · Compartilhamento · WhatsApp
   ============================================================ */

(() => {
  'use strict';

  let organization = null;
  let property = null;
  let galleryImages = [];
  let currentImageIndex = 0;

  document.addEventListener('DOMContentLoaded', loadProperty);

  async function loadProperty() {
    try {
      const identifier = getPropertyIdentifier();

      if (!identifier) {
        throw new Error('O endereço deste imóvel está incompleto.');
      }

      if (!window.CRVSITE?.isReady) {
        throw new Error('Conexão pendente: informe a chave pública do Supabase em assets/js/supabase.js.');
      }

      organization = await window.CRVSITE.getOrganization();
      window.CRVSITE.organization = organization;
      notifyOrganizationReady();

      property = await window.CRVSITE.getPublishedProperty(organization.id, identifier);
      galleryImages = getGalleryImages(property);

      renderOrganization();
      renderProperty();
      initPropertyWhatsApp();
      initShare();
      initLightbox();
      updateSeo();
      refreshIcons();

      document.body.classList.remove('is-loading');
    } catch (error) {
      console.error('[CRV Imob] Falha ao carregar imóvel:', error);
      renderError(error.message || 'Não foi possível carregar este imóvel.');
    }
  }

  function getPropertyIdentifier() {
    const params = new URLSearchParams(window.location.search);
    return (params.get('slug') || params.get('id') || '').trim();
  }

  function renderOrganization() {
    document.querySelectorAll('.brand-copy strong').forEach((element) => {
      element.textContent = organization.name;
    });

    document.querySelectorAll('.brand-copy small').forEach((element) => {
      element.textContent = organization.business_type;
    });

    document.querySelectorAll('.brand-mark').forEach((element) => {
      element.textContent = getInitials(organization.name);
    });

    document.querySelectorAll('.brand').forEach((element) => {
      element.setAttribute('aria-label', `${organization.name} — início`);
    });

    setText('organizationName', organization.name);
    setText('organizationType', organization.business_type);
    setText('organizationInitials', getInitials(organization.name));

    const copyright = document.querySelector('[data-organization-copyright]');
    if (copyright) copyright.textContent = `${organization.name}. Todos os direitos reservados.`;
  }

  function renderProperty() {
    document.body.dataset.property = property.title;
    document.body.dataset.reference = property.reference_code;

    setText('propertyBreadcrumb', property.title);
    setText('propertyLocation', property.location || 'Localização sob consulta');
    setText('propertyTitle', property.title);
    setText('propertyPrice', formatPrice(property.price, organization.show_prices));
    setText('propertyBedrooms', formatBedrooms(property));
    setText('propertyArea', formatArea(property.area_m2));
    setText('propertyLandArea', property.land_area_m2 ? formatArea(property.land_area_m2) : 'Não informada');
    setText('propertyParking', `${formatNumber(property.parking_spaces)} ${plural(property.parking_spaces, 'vaga', 'vagas')}`);
    setText('propertyDescriptionTitle', property.title);
    setText('propertyDescription', property.description || 'Entre em contato para conhecer todos os detalhes deste imóvel.');
    setText('propertyReference', property.reference_code);

    renderGallery();
    renderFeatures();
    renderLocation();

    document.querySelectorAll('.js-property-whatsapp').forEach((link) => {
      link.setAttribute('aria-label', `Perguntar sobre ${property.title}`);
    });
  }

  function renderGallery() {
    const gallery = document.getElementById('propertyGallery');
    if (!gallery) return;

    const visibleImages = galleryImages.slice(0, 3);
    gallery.dataset.count = String(visibleImages.length);

    if (!visibleImages.length) {
      gallery.innerHTML = `
        <figure class="gallery-item gallery-item-empty">
          <span class="image-fallback"><i data-lucide="image"></i> Imagens em atualização</span>
        </figure>
      `;
      return;
    }

    gallery.innerHTML = visibleImages.map((image, index) => `
      <figure class="gallery-item" data-gallery-index="${index}">
        <img src="${escapeAttribute(image.url)}" alt="${escapeAttribute(image.alt)}" ${index > 0 ? 'loading="lazy"' : ''}>
        <span class="image-fallback"><i data-lucide="image"></i> Imagem em atualização</span>
        ${index === visibleImages.length - 1 ? `<span class="gallery-count"><i data-lucide="images"></i>${galleryImages.length} ${plural(galleryImages.length, 'foto', 'fotos')}</span>` : ''}
      </figure>
    `).join('');

    gallery.querySelectorAll('.gallery-item').forEach((item) => {
      item.addEventListener('click', () => openLightbox(Number(item.dataset.galleryIndex || 0)));
    });

    gallery.querySelectorAll('img').forEach((image) => {
      image.addEventListener('error', () => {
        image.style.display = 'none';
        image.closest('.gallery-item')?.classList.add('is-missing');
      }, { once: true });
    });
  }

  function renderFeatures() {
    const list = document.getElementById('propertyFeatures');
    if (!list) return;

    const features = Array.isArray(property.features) ? property.features.filter(Boolean) : [];
    const fallbackFeatures = [
      property.property_type,
      property.purpose,
      property.bathrooms > 0 ? `${property.bathrooms} ${plural(property.bathrooms, 'banheiro', 'banheiros')}` : '',
      property.condominium_fee > 0 ? `Condomínio: ${formatCurrency(property.condominium_fee)}` : '',
      property.property_tax > 0 ? `IPTU: ${formatCurrency(property.property_tax)}` : ''
    ].filter(Boolean);

    list.innerHTML = (features.length ? features : fallbackFeatures)
      .map((feature) => `<li>${escapeHtml(feature)}</li>`)
      .join('');
  }

  function renderLocation() {
    const location = property.location || 'Localização sob consulta';

    setText('locationTitle', location);
    setText('locationPinTitle', location);
    setText('locationPinSubtitle', organization.address || organization.name);
    setText('locationDescription', `Solicite informações sobre a localização, acessos e serviços próximos a este ${String(property.property_type || 'imóvel').toLowerCase()}.`);

    const points = document.getElementById('locationPoints');
    if (!points) return;

    points.innerHTML = [
      `${property.purpose || 'Negociação'} com atendimento direto`,
      `${formatArea(property.area_m2)} de área construída`,
      `Referência ${property.reference_code}`
    ].map((point) => `<li><i data-lucide="check-circle-2"></i>${escapeHtml(point)}</li>`).join('');
  }

  function getGalleryImages(currentProperty) {
    const images = (currentProperty.property_images || []).map((image) => ({
      url: image.publicUrl,
      alt: image.alt_text || `${currentProperty.title} — foto do imóvel`
    })).filter((image) => image.url);

    if (!images.length && currentProperty.coverUrl) {
      images.push({
        url: currentProperty.coverUrl,
        alt: `${currentProperty.title} — foto principal`
      });
    }

    return images;
  }

  function initPropertyWhatsApp() {
    const phone = organization.whatsapp || organization.phone || window.CRVSITE.CONFIG.fallbackWhatsApp;
    const message = `Olá! Tenho interesse no imóvel ${property.title}, referência ${property.reference_code}. Gostaria de saber mais e verificar a disponibilidade.`;
    const url = `https://wa.me/${onlyNumbers(phone)}?text=${encodeURIComponent(message)}`;

    document.querySelectorAll('.js-property-whatsapp').forEach((link) => {
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
    });
  }

  function initShare() {
    const button = document.getElementById('shareProperty');
    if (!button) return;

    button.addEventListener('click', async () => {
      const data = {
        title: `${property.title} | ${organization.name}`,
        text: `Conheça este imóvel: ${property.title}`,
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
    document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev')?.addEventListener('click', () => moveLightbox(-1));
    document.getElementById('lightboxNext')?.addEventListener('click', () => moveLightbox(1));

    document.getElementById('lightbox')?.addEventListener('click', (event) => {
      if (event.target.id === 'lightbox') closeLightbox();
    });

    document.addEventListener('keydown', (event) => {
      const lightbox = document.getElementById('lightbox');
      if (!lightbox?.classList.contains('is-open')) return;

      if (event.key === 'Escape') closeLightbox();
      if (event.key === 'ArrowLeft') moveLightbox(-1);
      if (event.key === 'ArrowRight') moveLightbox(1);
    });
  }

  function openLightbox(index) {
    if (!galleryImages.length) return;

    currentImageIndex = index;
    renderLightbox();

    const lightbox = document.getElementById('lightbox');
    lightbox?.classList.add('is-open');
    lightbox?.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    document.getElementById('lightboxClose')?.focus();
  }

  function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox?.classList.remove('is-open');
    lightbox?.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function moveLightbox(direction) {
    if (!galleryImages.length) return;
    currentImageIndex = (currentImageIndex + direction + galleryImages.length) % galleryImages.length;
    renderLightbox();
  }

  function renderLightbox() {
    const image = galleryImages[currentImageIndex];
    const element = document.getElementById('lightboxImage');
    const counter = document.getElementById('lightboxCounter');

    if (element && image) {
      element.src = image.url;
      element.alt = image.alt;
    }

    if (counter) counter.textContent = `${currentImageIndex + 1} / ${galleryImages.length}`;
  }

  function updateSeo() {
    document.title = `${property.title} | ${organization.name}`;

    const description = document.querySelector('meta[name="description"]');
    if (description) {
      description.content = property.description || `Conheça ${property.title}, imóvel disponível com ${organization.name}.`;
    }

    setMetaContent('meta[property="og:title"]', `${property.title} | ${organization.name}`);
    setMetaContent('meta[property="og:description"]', property.description || `Conheça ${property.title}.`);
    setMetaContent('meta[property="og:url"]', window.location.href);
    setMetaContent('meta[property="og:image"]', galleryImages[0]?.url || '');

    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.href = window.location.href.split('#')[0];

    const structuredData = document.getElementById('propertyStructuredData');
    if (structuredData) {
      structuredData.textContent = JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: property.title,
        description: property.description || undefined,
        image: galleryImages.map((image) => image.url),
        sku: property.reference_code,
        url: window.location.href,
        offers: organization.show_prices && Number(property.price) > 0 ? {
          '@type': 'Offer',
          priceCurrency: 'BRL',
          price: Number(property.price),
          availability: 'https://schema.org/InStock'
        } : undefined
      });
    }
  }

  function renderError(message) {
    document.body.classList.remove('is-loading');
    document.body.classList.add('has-detail-error');

    setText('propertyBreadcrumb', 'Imóvel indisponível');
    setText('propertyLocation', 'Catálogo');
    setText('propertyTitle', 'Imóvel não encontrado');
    setText('propertyPrice', '—');

    const gallery = document.getElementById('propertyGallery');
    if (gallery) {
      gallery.innerHTML = `
        <div class="detail-error-card">
          <i data-lucide="house-x"></i>
          <strong>Esta oportunidade não está disponível</strong>
          <p>${escapeHtml(message)}</p>
          <a class="button" href="../index.html#imoveis">Voltar aos imóveis</a>
        </div>
      `;
    }

    refreshIcons();
  }

  function notifyOrganizationReady() {
    document.dispatchEvent(new CustomEvent('crv:organization-ready', {
      detail: organization
    }));
  }

  function refreshIcons() {
    if (window.lucide) {
      window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
    }
  }

  function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function setMetaContent(selector, value) {
    const element = document.querySelector(selector);
    if (element && value) element.setAttribute('content', value);
  }

  function formatBedrooms(currentProperty) {
    if (Number(currentProperty.suites) > 0) {
      return `${formatNumber(currentProperty.suites)} ${plural(currentProperty.suites, 'suíte', 'suítes')}`;
    }

    return `${formatNumber(currentProperty.bedrooms)} ${plural(currentProperty.bedrooms, 'dormitório', 'dormitórios')}`;
  }

  function formatPrice(value, showPrices) {
    if (!showPrices || Number(value || 0) <= 0) return 'Consulte-nos';
    return formatCurrency(value, 0);
  }

  function formatCurrency(value, maximumFractionDigits = 2) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits
    }).format(Number(value || 0));
  }

  function formatArea(value) {
    return `${formatNumber(value)} m²`;
  }

  function formatNumber(value) {
    return new Intl.NumberFormat('pt-BR', {
      maximumFractionDigits: 2
    }).format(Number(value || 0));
  }

  function plural(value, singular, pluralValue) {
    return Number(value) === 1 ? singular : pluralValue;
  }

  function getInitials(value) {
    return String(value || '')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'IM';
  }

  function onlyNumbers(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function escapeHtml(value) {
    return String(value ?? '')
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  function escapeAttribute(value) {
    return escapeHtml(value);
  }

  function showDetailToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    toast.textContent = message;
    toast.classList.add('is-visible');
    window.setTimeout(() => toast.classList.remove('is-visible'), 2600);
  }
})();
