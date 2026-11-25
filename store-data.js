// ============================================================================
// DIAMOND STORE - DATA LAYER ADAPTER (store-data.js)
// ============================================================================
// Provides a resilient data layer for the Diamond Store frontend.
// Automatically connects to Supabase when configured, with seamless fallback
// to local defaults if offline or unconfigured.
// ============================================================================

(() => {
  let supabaseClient = null;

  function isSupabaseConfigured() {
    const cfg = window.DIAMOND_SUPABASE_CONFIG;
    return Boolean(
      cfg &&
      typeof cfg.url === 'string' &&
      typeof cfg.anonKey === 'string' &&
      cfg.url.trim() !== '' &&
      cfg.anonKey.trim() !== '' &&
      !cfg.url.includes('YOUR-PROJECT-REF') &&
      !cfg.anonKey.includes('YOUR_SUPABASE') &&
      window.supabase &&
      typeof window.supabase.createClient === 'function'
    );
  }

  function getClient() {
    if (!isSupabaseConfigured()) return null;
    if (!supabaseClient) {
      supabaseClient = window.supabase.createClient(
        window.DIAMOND_SUPABASE_CONFIG.url,
        window.DIAMOND_SUPABASE_CONFIG.anonKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false
          }
        }
      );
    }
    return supabaseClient;
  }

  function getLocalFallbackProducts() {
    if (typeof getStoreProducts === 'function') return getStoreProducts();
    if (typeof DEFAULT_PRODUCTS !== 'undefined' && Array.isArray(DEFAULT_PRODUCTS)) return DEFAULT_PRODUCTS;
    return [];
  }

  function getLocalFallbackCategories() {
    if (typeof getStoreCategories === 'function') return getStoreCategories();
    if (typeof DEFAULT_CATEGORIES !== 'undefined' && Array.isArray(DEFAULT_CATEGORIES)) return DEFAULT_CATEGORIES;
    return [];
  }

  function getLocalFallbackHeroSlides() {
    if (typeof getHeroSlides === 'function') return getHeroSlides();
    if (typeof DEFAULT_HERO_SLIDES !== 'undefined' && Array.isArray(DEFAULT_HERO_SLIDES)) return DEFAULT_HERO_SLIDES;
    return [];
  }

  function getLocalFallbackSettings() {
    if (typeof getStoreSettings === 'function') return getStoreSettings();
    if (typeof DEFAULT_STORE_SETTINGS !== 'undefined' && DEFAULT_STORE_SETTINGS) return { ...DEFAULT_STORE_SETTINGS };
    return {};
  }

  // Map database product row to frontend product format (matching products.js structure)
  function mapDbProductToLocal(dbProd) {
    if (!dbProd) return null;
    return {
      id: dbProd.id,
      model: dbProd.model || '',
      name: dbProd.name || '',
      category: dbProd.category || 'kitchen',
      categoryLabel: dbProd.category_label || '',
      wattage: dbProd.wattage || '',
      capacity: dbProd.capacity || '',
      warranty: dbProd.warranty || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      shipping: dbProd.shipping || 'شحن مجاني لجميع المحافظات',
      price: Number(dbProd.price) || 0,
      oldPrice: dbProd.old_price ? Number(dbProd.old_price) : null,
      rating: Number(dbProd.rating) || 4.8,
      reviewsCount: Number(dbProd.reviews_count) || 0,
      badge: dbProd.badge || '',
      inStock: dbProd.in_stock !== false && (dbProd.stock_qty === undefined || Number(dbProd.stock_qty) > 0),
      stockQty: dbProd.stock_qty !== undefined ? Number(dbProd.stock_qty) : 100,
      image: dbProd.image || '',
      gallery: Array.isArray(dbProd.gallery) && dbProd.gallery.length ? dbProd.gallery : [dbProd.image],
      fallbackImage: dbProd.fallback_image || '',
      shortDesc: dbProd.short_desc || '',
      specs: typeof dbProd.specs === 'object' && dbProd.specs !== null ? dbProd.specs : {},
      features: Array.isArray(dbProd.features) ? dbProd.features : [],
      videoUrl: dbProd.video_url || null,
      sortOrder: Number(dbProd.sort_order) || 0
    };
  }

  // Map database category row to frontend category format
  function mapDbCategoryToLocal(dbCat) {
    if (!dbCat) return null;
    return {
      id: dbCat.id,
      name: dbCat.name,
      navTitle: dbCat.nav_title || dbCat.name,
      enName: dbCat.en_name || '',
      subtitle: dbCat.subtitle || '',
      icon: dbCat.icon || 'fa-tag',
      image: dbCat.image || '',
      subItems: Array.isArray(dbCat.sub_items) ? dbCat.sub_items : [],
      sortOrder: Number(dbCat.sort_order) || 0
    };
  }

  // Map database hero slide row to frontend hero format
  function mapDbHeroSlideToLocal(dbSlide) {
    if (!dbSlide) return null;
    return {
      id: dbSlide.id,
      num: dbSlide.num,
      tag: dbSlide.tag || '',
      title: dbSlide.title || '',
      subtitle: dbSlide.subtitle || '',
      model: dbSlide.model || '',
      power: dbSlide.power || '',
      capacity: dbSlide.capacity || '',
      price: dbSlide.price || '',
      image: dbSlide.image || '',
      fitMode: dbSlide.fit_mode || 'contain',
      productId: dbSlide.product_id || null,
      categoryId: dbSlide.category_id || null,
      sortOrder: Number(dbSlide.sort_order) || 0
    };
  }

  // Helper to convert DataURL string into a Blob for Supabase Storage upload
  function dataUrlToBlob(dataUrl) {
    const parts = String(dataUrl).split(',');
    if (parts.length !== 2) return null;
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  }

  const CATALOG_CACHE_KEY = 'diamond_catalog_cache_v1';
  const CATALOG_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  function readCatalogCache() {
    try {
      const raw = sessionStorage.getItem(CATALOG_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.ts || (Date.now() - parsed.ts) > CATALOG_CACHE_TTL_MS) return null;
      return parsed.data && parsed.data.source === 'supabase' ? parsed.data : null;
    } catch (e) {
      return null;
    }
  }

  function writeCatalogCache(data) {
    try {
      sessionStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
    } catch (e) {
      // Storage full or unavailable: caching is best-effort only
    }
  }

  const StoreData = {
    isConfigured: isSupabaseConfigured,
    getClient,

    // Fetch store catalog from Supabase with fallback to local defaults.
    // Served from a 5-minute sessionStorage cache when fresh to avoid
    // re-querying Supabase on every page visit.
    async loadCatalog({ skipCache = false } = {}) {
      if (!skipCache) {
        const cached = readCatalogCache();
        if (cached) return { ...cached, fromCache: true };
      }

      const client = getClient();
      if (!client) {
        return {
          source: 'local_fallback',
          products: getLocalFallbackProducts(),
          categories: getLocalFallbackCategories(),
          heroSlides: getLocalFallbackHeroSlides(),
          settings: getLocalFallbackSettings()
        };
      }

      try {
        const [prodRes, catRes, heroRes, setRes] = await Promise.all([
          client.from('products').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
          client.from('categories').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
          client.from('hero_slides').select('*').eq('is_active', true).order('sort_order', { ascending: true }),
          client.from('store_settings').select('data').eq('id', 'default').maybeSingle()
        ]);

        const hasDbProducts = !prodRes.error && Array.isArray(prodRes.data) && prodRes.data.length > 0;
        const products = hasDbProducts
          ? prodRes.data.map(mapDbProductToLocal)
          : getLocalFallbackProducts();

        const hasDbCategories = !catRes.error && Array.isArray(catRes.data) && catRes.data.length > 0;
        const categories = hasDbCategories
          ? catRes.data.map(mapDbCategoryToLocal)
          : getLocalFallbackCategories();

        const hasDbHero = !heroRes.error && Array.isArray(heroRes.data) && heroRes.data.length > 0;
        const heroSlides = hasDbHero
          ? heroRes.data.map(mapDbHeroSlideToLocal)
          : getLocalFallbackHeroSlides();

        const defaultSettings = getLocalFallbackSettings();
        const settings = (!setRes.error && setRes.data && typeof setRes.data.data === 'object')
          ? { ...defaultSettings, ...setRes.data.data }
          : defaultSettings;

        const catalog = {
          source: 'supabase',
          products,
          categories,
          heroSlides,
          settings
        };
        writeCatalogCache(catalog);
        return catalog;
      } catch (err) {
        console.warn('[Diamond StoreData] Supabase catalog fetch failed, using local fallback:', err);
        return {
          source: 'local_fallback',
          products: getLocalFallbackProducts(),
          categories: getLocalFallbackCategories(),
          heroSlides: getLocalFallbackHeroSlides(),
          settings: getLocalFallbackSettings()
        };
      }
    },

    // Server-side price quotation RPC
    async quoteCart({ items, coupon = null, bundleIds = null }) {
      const client = getClient();
      if (!client) {
        return { success: false, reason: 'unconfigured' };
      }

      try {
        const payload = {
          p_items: items.map(it => ({ id: it.id, qty: Number(it.qty) || 1 })),
          p_coupon: coupon ? String(coupon).trim() : null,
          p_bundle_ids: Array.isArray(bundleIds) && bundleIds.length ? bundleIds : null
        };

        const { data, error } = await client.rpc('quote_cart', payload);
        if (error) throw error;
        return { success: true, quote: data };
      } catch (err) {
        console.warn('[Diamond StoreData] quote_cart RPC error:', err);
        return { success: false, error: err.message || 'خطأ في حساب الأسعار من السيرفر' };
      }
    },

    // Server-side safe order creation RPC
    async createOrder({ customer, items, coupon = null, bundleIds = null }) {
      const client = getClient();
      if (!client) {
        return { success: false, reason: 'unconfigured' };
      }

      try {
        const payload = {
          p_customer: customer,
          p_items: items.map(it => ({ id: it.id, qty: Number(it.qty) || 1 })),
          p_coupon: coupon ? String(coupon).trim() : null,
          p_bundle_ids: Array.isArray(bundleIds) && bundleIds.length ? bundleIds : null
        };

        const { data, error } = await client.rpc('create_order', payload);
        if (error) throw error;
        return { success: true, result: data };
      } catch (err) {
        console.error('[Diamond StoreData] create_order RPC error:', err);
        return { success: false, error: err.message || 'تعذر تسجيل الطلب على السيرفر' };
      }
    },

    // Upload of customer payment proof screenshot (accepts File, Blob, or DataURL string)
    async uploadPaymentProof(fileOrDataUrl) {
      const client = getClient();
      if (!client || !fileOrDataUrl) return null;

      try {
        let uploadBlob = fileOrDataUrl;
        let ext = 'jpg';
        let contentType = 'image/jpeg';

        if (typeof fileOrDataUrl === 'string' && fileOrDataUrl.startsWith('data:')) {
          uploadBlob = dataUrlToBlob(fileOrDataUrl);
          if (!uploadBlob) return null;
          contentType = uploadBlob.type || 'image/jpeg';
          ext = contentType.split('/')[1] || 'jpg';
          if (ext === 'jpeg') ext = 'jpg';
        } else if (fileOrDataUrl.name) {
          ext = fileOrDataUrl.name.split('.').pop().toLowerCase() || 'jpg';
          contentType = fileOrDataUrl.type || 'image/jpeg';
        }

        const fileName = `proof-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
        const filePath = `receipts/${fileName}`;

        const { data, error } = await client.storage
          .from('payment-proofs')
          .upload(filePath, uploadBlob, {
            contentType,
            cacheControl: '3600',
            upsert: false
          });

        if (error) throw error;
        return data?.path || filePath;
      } catch (err) {
        console.warn('[Diamond StoreData] Payment proof upload error:', err);
        return null;
      }
    }
  };

  window.DiamondStoreData = StoreData;
})();
