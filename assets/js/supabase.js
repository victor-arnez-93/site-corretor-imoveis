/* ============================================================
   CRV IMOB — SUPABASE.JS
   Configuração pública · Organização · Catálogo · Storage
   ============================================================ */

(() => {
  'use strict';

  const CONFIG = Object.freeze({
    supabaseUrl: 'https://ppcpghnqavgaaktcjzqe.supabase.co',
    supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwY3BnaG5xYXZnYWFrdGNqenFlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTYwNTksImV4cCI6MjA5NzE5MjA1OX0.Q3bEqxkg_lOSGYU7XzhfmO_hlixCNuWOSE_CNJt2TDA',
    organizationId: '63f45b98-5ada-4b19-a6f2-4bc68f46055e',
    organizationSlug: '',
    adminUrl: 'https://victor-arnez-93.github.io/crv-imob-admin/',
    fallbackWhatsApp: '5515999999999'
  });

  const hasValidConfiguration = Boolean(
    window.supabase
    && CONFIG.supabaseUrl.startsWith('https://')
    && CONFIG.supabaseAnonKey
    && !CONFIG.supabaseAnonKey.startsWith('COLE_AQUI')
  );

  const client = hasValidConfiguration
    ? window.supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
    : null;

  async function getOrganization() {
    assertReady();

    let query = client
      .from('organizations')
      .select('id, name, slug, business_type, creci, description, whatsapp, phone, email, address, site_url, featured_limit, show_prices, is_active')
      .eq('is_active', true);

    if (CONFIG.organizationId) {
      query = query.eq('id', CONFIG.organizationId);
    } else if (CONFIG.organizationSlug) {
      query = query.eq('slug', CONFIG.organizationSlug);
    } else {
      throw new Error('Defina organizationId ou organizationSlug em assets/js/supabase.js.');
    }

    const { data, error } = await query.single();

    if (error) throw error;
    return data;
  }

  async function getPublishedProperties(organizationId) {
    assertReady();

    const { data, error } = await client
      .from('properties')
      .select(`
        id,
        organization_id,
        title,
        slug,
        reference_code,
        property_type,
        purpose,
        location,
        description,
        price,
        condominium_fee,
        property_tax,
        status,
        is_featured,
        bedrooms,
        bathrooms,
        suites,
        parking_spaces,
        area_m2,
        land_area_m2,
        features,
        cover_image_path,
        published_at,
        created_at,
        property_images (
          id,
          storage_path,
          alt_text,
          sort_order,
          is_cover
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error) throw error;
    return normalizeProperties(data || []);
  }

  async function getPublishedProperty(organizationId, identifier) {
    assertReady();

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identifier);

    let query = client
      .from('properties')
      .select(`
        id,
        organization_id,
        title,
        slug,
        reference_code,
        property_type,
        purpose,
        location,
        description,
        price,
        condominium_fee,
        property_tax,
        status,
        is_featured,
        bedrooms,
        bathrooms,
        suites,
        parking_spaces,
        area_m2,
        land_area_m2,
        features,
        cover_image_path,
        published_at,
        created_at,
        property_images (
          id,
          storage_path,
          alt_text,
          sort_order,
          is_cover
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'published');

    query = isUuid ? query.eq('id', identifier) : query.eq('slug', identifier);

    const { data, error } = await query.single();

    if (error) throw error;
    return normalizeProperty(data);
  }

  function normalizeProperties(properties) {
    return properties.map(normalizeProperty);
  }

  function normalizeProperty(property) {
    const images = [...(property.property_images || [])]
      .sort((first, second) => {
        if (first.is_cover !== second.is_cover) return first.is_cover ? -1 : 1;
        return Number(first.sort_order || 0) - Number(second.sort_order || 0);
      })
      .map((image) => ({
        ...image,
        publicUrl: getPublicImageUrl(image.storage_path)
      }));

    const coverPath = property.cover_image_path || images[0]?.storage_path || '';

    return {
      ...property,
      property_images: images,
      coverUrl: coverPath ? getPublicImageUrl(coverPath) : ''
    };
  }

  function getPublicImageUrl(storagePath) {
    if (!client || !storagePath) return '';

    const { data } = client.storage
      .from('property-images')
      .getPublicUrl(storagePath);

    return data?.publicUrl || '';
  }

  function assertReady() {
    if (!hasValidConfiguration || !client) {
      throw new Error('Configure a chave pública do Supabase em assets/js/supabase.js.');
    }
  }

  window.CRVSITE = {
    CONFIG,
    client,
    isReady: hasValidConfiguration,
    organization: null,
    getOrganization,
    getPublishedProperties,
    getPublishedProperty,
    getPublicImageUrl
  };
})();
