/* ============================================================
   CRV IMOB — CATÁLOGO.JS
   Organização pública · Imóveis publicados · Carrossel dinâmico
   ============================================================ */

(() => {
  'use strict';

  document.addEventListener('DOMContentLoaded', loadCatalog);

  async function loadCatalog() {
    const track = document.querySelector('[data-carousel-track]');
    const state = document.getElementById('catalogState');
    const carousel = document.getElementById('propertiesCarousel');
    const carouselStatus = document.querySelector('.carousel-status');

    if (!track || !window.CRVSITE) return;

    try {
      if (!window.CRVSITE.isReady) {
        throw new Error('Conexão pendente: informe a chave pública do Supabase em assets/js/supabase.js.');
      }

      const organization = await window.CRVSITE.getOrganization();
      window.CRVSITE.organization = organization;
      applyOrganization(organization);
      notifyOrganizationReady(organization);

      const properties = await window.CRVSITE.getPublishedProperties(organization.id);

      if (!properties.length) {
        track.replaceChildren();
        toggleCatalog(false, carousel, carouselStatus);
        showState(state, {
          variant: 'empty',
          eyebrow: 'Novidades em breve',
          title: 'Estamos preparando novas oportunidades',
          message: 'Novos imóveis serão publicados aqui em breve. Enquanto isso, conte o que você procura e receba um atendimento personalizado.',
          icon: 'building-2',
          actionLabel: 'Contar o que procuro',
          actionHref: '#contato'
        });
        return;
      }

      track.innerHTML = properties
        .map((property, index) => createPropertyCard(property, index, organization))
        .join('');

      toggleCatalog(true, carousel, carouselStatus);
      hideState(state);
      initDynamicImageFallbacks(track);
      refreshVisualLibraries();
    } catch (error) {
      track.replaceChildren();
      toggleCatalog(false, carousel, carouselStatus);
      showState(state, {
        variant: 'error',
        eyebrow: 'Atualização em andamento',
        title: 'Os destaques não puderam ser exibidos agora',
        message: 'Você ainda pode falar diretamente com nossa equipe e receber as oportunidades disponíveis.',
        icon: 'refresh-cw',
        actionLabel: 'Falar com um especialista',
        actionHref: '#contato'
      });
      console.error('[CRV Imob] Falha ao carregar catálogo:', error);
    } finally {
      carousel?.classList.remove('is-catalog-loading');
    }
  }

  function createPropertyCard(property, index, organization) {
    const detailUrl = `detalhes/imovel.html?slug=${encodeURIComponent(property.slug)}`;
    const bedrooms = property.suites > 0
      ? `${formatNumber(property.suites)} ${plural(property.suites, 'suíte', 'suítes')}`
      : `${formatNumber(property.bedrooms)} ${plural(property.bedrooms, 'dormitório', 'dormitórios')}`;
    const area = `${formatNumber(property.area_m2)} m²`;
    const parking = `${formatNumber(property.parking_spaces)} ${plural(property.parking_spaces, 'vaga', 'vagas')}`;
    const badge = property.is_featured ? 'Destaque' : property.property_type;
    const image = property.coverUrl
      ? `<img src="${escapeAttribute(property.coverUrl)}" alt="${escapeAttribute(property.title)}" loading="lazy">`
      : '';

    return `
      <article class="property-card reveal-up">
        <a class="property-media" href="${detailUrl}" aria-label="Conhecer ${escapeAttribute(property.title)}">
          ${image}
          <span class="image-fallback"><i data-lucide="image"></i> Imagem em atualização</span>
          <span class="property-index">${String(index + 1).padStart(2, '0')}</span>
          <span class="property-badge">${escapeHtml(badge || property.purpose)}</span>
        </a>
        <div class="property-body">
          <div class="property-location"><i data-lucide="map-pin"></i>${escapeHtml(property.location || 'Localização sob consulta')}</div>
          <h3><a href="${detailUrl}">${escapeHtml(property.title)}</a></h3>
          <ul class="property-specs" aria-label="Características">
            <li><strong>${escapeHtml(bedrooms.split(' ')[0])}</strong> ${escapeHtml(bedrooms.split(' ').slice(1).join(' '))}</li>
            <li><strong>${escapeHtml(area)}</strong> construídos</li>
            <li><strong>${escapeHtml(parking.split(' ')[0])}</strong> ${escapeHtml(parking.split(' ').slice(1).join(' '))}</li>
          </ul>
          <div class="property-footer">
            <div><small>Valor</small><strong>${escapeHtml(formatPrice(property.price, organization.show_prices))}</strong></div>
            <a class="circle-link" href="${detailUrl}" aria-label="Ver detalhes de ${escapeAttribute(property.title)}"><i data-lucide="arrow-up-right"></i></a>
          </div>
        </div>
      </article>
    `;
  }

  function applyOrganization(organization) {
    document.querySelectorAll('.brand-copy strong, [data-organization-name]').forEach((element) => {
      element.textContent = organization.name;
    });

    document.querySelectorAll('.brand-copy small, [data-business-type]').forEach((element) => {
      element.textContent = organization.business_type;
    });

    document.querySelectorAll('.brand-mark').forEach((element) => {
      element.textContent = getInitials(organization.name);
    });

    document.querySelectorAll('.brand').forEach((element) => {
      element.setAttribute('aria-label', `${organization.name} — início`);
    });

    document.querySelectorAll('[data-organization-description]').forEach((element) => {
      if (organization.description) element.textContent = organization.description;
    });

    const copyright = document.querySelector('[data-organization-copyright]');
    if (copyright) copyright.textContent = `${organization.name}. Todos os direitos reservados.`;

    if (organization.email) {
      document.querySelectorAll('[data-organization-email]').forEach((link) => {
        link.href = `mailto:${organization.email}`;
        const value = link.querySelector('[data-contact-value]');
        if (value) value.textContent = organization.email;
      });
    }

    if (organization.whatsapp || organization.phone) {
      const value = organization.whatsapp || organization.phone;
      document.querySelectorAll('[data-organization-phone]').forEach((element) => {
        element.textContent = value;
      });
    }

    document.title = `${organization.name} | Imóveis selecionados`;
  }

  function notifyOrganizationReady(organization) {
    document.dispatchEvent(new CustomEvent('crv:organization-ready', {
      detail: organization
    }));
  }

  function toggleCatalog(isVisible, carousel, carouselStatus) {
    if (carousel) carousel.hidden = !isVisible;
    if (carouselStatus) carouselStatus.hidden = !isVisible;
  }

  function showState(container, options) {
    if (!container) return;

    const {
      variant = 'empty',
      eyebrow = '',
      title = '',
      message = '',
      icon = 'building-2',
      actionLabel = '',
      actionHref = '#contato'
    } = options;

    container.hidden = false;
    container.className = `catalog-state catalog-state-${variant}`;
    container.innerHTML = `
      <div class="catalog-state-icon" aria-hidden="true">
        <i data-lucide="${escapeAttribute(icon)}"></i>
      </div>
      <div class="catalog-state-copy">
        ${eyebrow ? `<span>${escapeHtml(eyebrow)}</span>` : ''}
        <strong>${escapeHtml(title)}</strong>
        <p>${escapeHtml(message)}</p>
        ${actionLabel ? `
          <a class="catalog-state-action" href="${escapeAttribute(actionHref)}">
            ${escapeHtml(actionLabel)}
            <i data-lucide="arrow-up-right"></i>
          </a>
        ` : ''}
      </div>
    `;
    refreshVisualLibraries();
  }

  function hideState(container) {
    if (!container) return;
    container.hidden = true;
    container.className = 'catalog-state';
    container.replaceChildren();
  }

  function refreshVisualLibraries() {
    if (window.lucide) {
      window.lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });
    }

    window.ScrollTrigger?.refresh();
  }

  function initDynamicImageFallbacks(container) {
    container.querySelectorAll('.property-media img').forEach((image) => {
      image.addEventListener('error', () => {
        image.style.display = 'none';
        image.closest('.property-media')?.classList.add('is-missing');
      }, { once: true });
    });
  }

  function formatPrice(value, showPrices) {
    if (!showPrices || Number(value || 0) <= 0) return 'Consulte-nos';

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(Number(value));
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
})();
