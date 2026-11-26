// ============================================================================
// DIAMOND STORE — CUSTOMER STOREFRONT & PRODUCT PAGE ENGINE (app.js)
// Supports index.html + product.html + Smart Arabic Search + Live CMS Sync
// ============================================================================

function readJSONStorage(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed === null ? fallback : parsed;
  } catch (e) {
    return fallback;
  }
}

let state = {
  products: [],
  categories: [],
  heroSlides: [],
  settings: {},
  reviews: [],
  siteContent: {},
  activeCategory: 'all',
  searchQuery: '',
  sortBy: 'popular',
  maxPrice: 8000,
  priceCeiling: 8000,
  minPrice: 0,
  priceFloor: 0,
  cart: readJSONStorage('diamond_cart', []),
  wishlist: readJSONStorage('diamond_wishlist', []),
  compare: readJSONStorage('diamond_compare', []),
  bundleSelected: ['sk-10085', 'sk-b907', 'sk-999n'],
  bundleInitialized: false,
  activeHeroSlide: 0,
  heroTimer: null,
  heroPaused: false,
  hero3DViewMode: 'live', // 'live' (with explanation arrows) | 'exploded' (component breakdown) | 'photo' (clean)
  heroDrawerOpen: true,   // toggles the explanation arrows/callouts on the stage
  activeWorkspaceTab: 'catalog',
  compareDiffOnly: false,
  appliedCoupon: null,
  pdpQty: 1,
  catalogLoading: false,
  visibleCount: 16
};

const CATALOG_PAGE_SIZE = 16;

function formatEGP(val) {
  return Number(val || 0).toLocaleString('en-US') + ' ج.م';
}

function getSafeImageAttr(prod, customSrc = null) {
  const primary = customSrc || prod.image || 'assets/products/airfryer.jpg';
  const fallback = prod.fallbackImage || 'assets/products/hero-showcase.jpg';
  return `src="${escapeHTML(primary)}" onerror="this.onerror=null;this.src='${escapeHTML(fallback)}';" alt="${escapeHTML(prod.name)}" loading="lazy" decoding="async" width="600" height="600"`;
}

function isProductAvailable(prod) {
  return !!prod && prod.inStock !== false;
}

// Remove cart/wishlist/bundle entries that point to products deleted from the catalog
function sanitizeStoredSelections() {
  const ids = new Set(state.products.map(p => p.id));
  if (!Array.isArray(state.cart)) state.cart = [];
  if (!Array.isArray(state.wishlist)) state.wishlist = [];
  if (!Array.isArray(state.compare)) state.compare = [];
  const cleanCart = state.cart.filter(c => c && ids.has(c.id) && Number(c.qty) > 0);
  const cleanWish = state.wishlist.filter(id => ids.has(id));
  const cleanCompare = state.compare.filter(id => ids.has(id)).slice(0, 4);
  if (cleanCart.length !== state.cart.length) {
    state.cart = cleanCart;
    localStorage.setItem('diamond_cart', JSON.stringify(state.cart));
  }
  if (cleanWish.length !== state.wishlist.length) {
    state.wishlist = cleanWish;
    localStorage.setItem('diamond_wishlist', JSON.stringify(state.wishlist));
  }
  if (cleanCompare.length !== state.compare.length) {
    state.compare = cleanCompare;
    localStorage.setItem('diamond_compare', JSON.stringify(state.compare));
  }
  state.bundleSelected = state.bundleSelected.filter(id => ids.has(id));
}

// Price slider max follows the most expensive product (so products above 8000 are not hidden)
function syncPriceSliderBounds() {
  const highest = state.products.reduce((m, p) => Math.max(m, Number(p.price) || 0), 0);
  const ceiling = Math.max(1000, Math.ceil(highest / 500) * 500);
  const wasAtMax = state.maxPrice >= state.priceCeiling;
  state.priceCeiling = ceiling;
  if (wasAtMax || state.maxPrice > ceiling) state.maxPrice = ceiling;

  const slider = document.getElementById('priceSlider');
  if (slider) {
    slider.max = ceiling;
    slider.value = state.maxPrice;
  }
  const valEl = document.getElementById('priceSliderVal');
  if (valEl) valEl.textContent = formatEGP(state.maxPrice);
}

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  loadAllStoreData();
  applyDynamicCMSSettings();

  // Check URL parameters (?cat=... or ?q=... or ?id=...)
  const params = new URLSearchParams(window.location.search);
  const catParam = params.get('cat');
  const qParam = params.get('q');

  if (catParam) {
    if (catParam === 'contact') {
      setTimeout(() => handleContactCategoryAction(qParam || 'info'), 250);
    } else {
      state.activeCategory = catParam;
    }
  }
  if (qParam && catParam !== 'contact') {
    state.searchQuery = qParam;
    const catSearch = document.getElementById('catalogSearchInput');
    const headSearch = document.getElementById('headerSearchInput');
    if (catSearch) catSearch.value = qParam;
    if (headSearch) headSearch.value = qParam;
  }

  renderHeaderCategoriesNav();

  // Homepage initializers (only run if elements exist on page)
  if (document.getElementById('heroStudioStage')) {
    initHeroShowcase();
  }
  if (document.getElementById('categoriesGrid')) {
    renderCategoriesGrid();
  }
  if (document.getElementById('productsGrid')) {
    renderCatalogGrid();
    if (((catParam && catParam !== 'all' && catParam !== 'contact') || qParam) && catParam !== 'contact') {
      setTimeout(() => {
        document.getElementById('catalogSection')?.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    }
  }
  if (document.getElementById('bundleItemsGrid')) {
    renderBundleSection();
  }

  // Dedicated Product Details Page initializer (product.html)
  if (document.getElementById('productDetailPageRoot')) {
    initProductDetailsPage();
  }

  // Dedicated Category Page initializer (category.html)
  if (document.getElementById('categoryPageRoot')) {
    initCategoryDetailsPage();
  }

  updateCartView();
  updateCounters();
  renderCompareBar();
  renderCompareStudioTab();
  if (params.get('tab') === 'compare' || window.location.hash === '#compareSection') {
    switchStoreWorkspaceTab('compare', true);
  }
  initScrollReveal();
  bindStoreEvents();
  initTopUtilityTicker();
  initReviewsCarousel();
  renderEditableSiteSections();
  checkPolicyQueryOrHash();

  // Live sync if Admin Panel (admin.html) updates catalog/settings in another tab
  window.addEventListener('storage', (e) => {
    if (['diamond_catalog_v4', 'diamond_categories_v4', 'diamond_categories_v5', 'diamond_hero_v4', 'diamond_hero_v5', 'diamond_hero_v6', 'diamond_settings_v4'].includes(e.key)) {
      if (e.key === 'diamond_settings_v4') state.bundleInitialized = false;
      loadAllStoreData();
      applyDynamicCMSSettings();
      renderHeaderCategoriesNav();
      renderEditableSiteSections();
      if (document.getElementById('heroStudioStage')) renderHeroSlide(state.activeHeroSlide);
      renderCategoriesGrid();
      renderCatalogGrid();
      renderCompareStudioTab();
      renderBundleSection();
      updateCartView();
      updateCounters();
      if (document.getElementById('productDetailPageRoot')) {
        initProductDetailsPage();
      }
      if (document.getElementById('categoryPageRoot')) {
        initCategoryDetailsPage();
      }
    } else if (e.key === 'diamond_cart' || e.key === 'diamond_wishlist' || e.key === 'diamond_compare') {
      // Keep cart, wishlist & compare in sync between open tabs
      state.cart = readJSONStorage('diamond_cart', []);
      state.wishlist = readJSONStorage('diamond_wishlist', []);
      state.compare = readJSONStorage('diamond_compare', []);
      sanitizeStoredSelections();
      updateCartView();
      updateCounters();
      renderCompareBar();
      renderCompareStudioTab();
    }
  });
});

function loadAllStoreData() {
  state.products = getStoreProducts();
  state.categories = getStoreCategories();
  state.heroSlides = getHeroSlides();
  state.settings = getStoreSettings();
  if (!state.bundleInitialized) {
    const defIds = Array.isArray(state.settings.bundleDefaultSelectedIds) && state.settings.bundleDefaultSelectedIds.length
      ? state.settings.bundleDefaultSelectedIds
      : ['sk-10085', 'sk-b907', 'sk-999n'];
    state.bundleSelected = [...defIds];
    state.bundleInitialized = true;
  }
  sanitizeStoredSelections();
  syncPriceSliderBounds();

  // Async sync from Supabase if configured.
  // Cached catalogs (sessionStorage, 5-min TTL) render instantly with no skeleton.
  if (window.DiamondStoreData && window.DiamondStoreData.isConfigured()) {
    state.catalogLoading = true;
    if (document.getElementById('productsGrid')) renderCatalogSkeleton();
    window.DiamondStoreData.loadCatalog({ skipCache: true }).then(catalog => {
      state.catalogLoading = false;
      if (catalog && catalog.source === 'supabase') {
        state.products = catalog.products;
        state.categories = catalog.categories;
        state.heroSlides = catalog.heroSlides;
        state.settings = catalog.settings;
        state.reviews = catalog.reviews || [];
        state.siteContent = catalog.siteContent || {};
        sanitizeStoredSelections();
        syncPriceSliderBounds();
        applyDynamicCMSSettings();
        renderHeaderCategoriesNav();
        renderEditableSiteSections();
        if (document.getElementById('heroStudioStage')) renderHeroSlide(state.activeHeroSlide);
        if (document.getElementById('categoriesGrid')) renderCategoriesGrid();
        if (document.getElementById('productsGrid')) renderCatalogGrid();
        if (typeof renderCompareStudioTab === 'function') renderCompareStudioTab();
        if (document.getElementById('bundleItemsGrid')) renderBundleSection();
        if (typeof updateCartView === 'function') updateCartView();
        if (typeof updateCounters === 'function') updateCounters();
        if (document.getElementById('productDetailPageRoot') && typeof initProductDetailsPage === 'function') {
          initProductDetailsPage();
        }
        if (document.getElementById('categoryPageRoot') && typeof initCategoryDetailsPage === 'function') {
          initCategoryDetailsPage();
        }
      }
    }).catch(err => {
      state.catalogLoading = false;
      console.warn('[Diamond] Catalog sync notice:', err);
    });
  }
}

function formatBrandNameHTML(rawName) {
  const clean = (rawName || 'Diamond Store').trim();
  const parts = clean.split(/\s+/);
  const last = parts.length > 1 ? parts.pop() : '';
  return `${escapeHTML(parts.join(' '))}${last ? ` <span>${escapeHTML(last)}</span>` : ''}`;
}

function applyDynamicCMSSettings() {
  const s = state.settings;
  if (!s) return;

  const storeName = (s.storeName || 'Diamond Store').trim();
  const warrantyText = (s.warrantyText || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة').trim();

  const tb1 = document.getElementById('topBarText1');
  const tb2 = document.getElementById('topBarText2');
  const tb3 = document.getElementById('topBarText3');
  if (tb1 && s.topBarText1) tb1.innerHTML = `<i class="fa-solid fa-truck-fast"></i> ${escapeHTML(normalizeDigits(s.topBarText1))}`;
  if (tb2 && s.topBarText2) tb2.innerHTML = `<i class="fa-solid fa-shield-halved"></i> ${escapeHTML(normalizeDigits(s.topBarText2))}`;
  if (tb3 && s.topBarText3) tb3.innerHTML = `<i class="fa-solid fa-tag"></i> ${escapeHTML(normalizeDigits(s.topBarText3))}`;

  const nameEl = document.getElementById('headerStoreName');
  if (nameEl) nameEl.innerHTML = formatBrandNameHTML(storeName);

  const footerNameEl = document.getElementById('footerStoreName');
  if (footerNameEl) footerNameEl.innerHTML = formatBrandNameHTML(storeName);

  document.querySelectorAll('.js-store-name-inline').forEach(el => {
    el.textContent = storeName;
  });

  document.querySelectorAll('.js-warranty-text').forEach(el => {
    el.textContent = warrantyText;
  });

  const taglineEl = document.getElementById('headerStoreTagline');
  if (taglineEl && s.tagline) taglineEl.textContent = s.tagline;

  const footerTaglineEl = document.getElementById('footerStoreTagline');
  if (footerTaglineEl && s.tagline) footerTaglineEl.textContent = s.tagline;

  const homeTitle = document.getElementById('homePageTitle');
  if (homeTitle) {
    document.title = `${storeName} | ${s.tagline || 'متجر أجهزة سوكاني SOKANY المنزلية'} — شحن مجاني و${warrantyText}`;
  }

  const navBrideTxt = document.getElementById('navBridePromoTxt');
  const wsBrideTxt = document.getElementById('wsBrideTabTxt');
  const t4 = s.bundleTier4 ?? 25;
  if (navBrideTxt) navBrideTxt.textContent = `باكدج العروسة (خصم ${t4}%)`;
  if (wsBrideTxt) wsBrideTxt.textContent = `باكدج العروسة والتوفير (خصم ${t4}%)`;

  const waFloat = document.getElementById('floatingWhatsappLink');
  if (waFloat && s.whatsappNumber) {
    waFloat.href = `https://wa.me/${getStoreWhatsapp()}?text=${encodeURIComponent('مرحباً ' + storeName + '، أرغب في الاستفسار عن أجهزة سوكاني')}`;
  }
}

// WhatsApp number of the store, digits only (wa.me rejects "+", spaces or dashes)
function getStoreWhatsapp() {
  const digits = normalizeDigits(state.settings.whatsappNumber || '').replace(/\D/g, '');
  return digits || '201000000000';
}

// ==================== INTERSECTION OBSERVER SCROLL REVEAL ====================
let revealObserver;
function resolveCategoryDisplayName(catId) {
  const cats = state.categories.length ? state.categories : DEFAULT_CATEGORIES;
  for (const cat of cats) {
    if (cat.id === catId) return cat.name || cat.label || catId;
    const sub = (cat.subItems || []).find(s => (s.sCat || s.cat) === catId);
    if (sub) return sub.label || sub.sCat;
  }
  const matching = state.products.filter(p => doesProductMatchCategory(p, catId));
  const label = matching.find(p => p.categoryLabel)?.categoryLabel;
  return label || catId;
}

function initCategoryDetailsPage() {
  const root = document.getElementById('categoryPageRoot');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const catId = params.get('cat') || 'all';
  const q = (params.get('q') || '').trim();
  state.activeCategory = catId;
  state.searchQuery = q;
  const headSearch = document.getElementById('headerSearchInput');
  if (headSearch && q) headSearch.value = q;

  renderHeaderCategoriesNav();

  const titleEl = document.getElementById('catPageTitle');
  const bcEl = document.getElementById('catPageBreadcrumb');
  const name = catId === 'all' ? 'كل الأقسام' : resolveCategoryDisplayName(catId);
  if (titleEl) titleEl.textContent = name;
  if (bcEl) {
    bcEl.innerHTML = `
      <li><a href="index.html">الرئيسية</a></li>
      <li><span class="bc-sep">/</span></li>
      <li class="bc-current">${escapeHTML(name)}</li>`;
  }
  document.title = `${name} — Diamond Store`;

  const catProducts = state.products.filter(p => doesProductMatchCategory(p, catId));
  const prices = catProducts.map(p => Number(p.price)).filter(v => v > 0);
  state.priceFloor = prices.length ? Math.max(0, Math.floor(Math.min(...prices))) : 0;
  state.priceCeiling = prices.length ? Math.ceil(Math.max(...prices)) : 8000;
  if (!prices.length) state.priceCeiling = Math.max(state.priceCeiling, 1000);
  state.minPrice = state.priceFloor;
  state.maxPrice = state.priceCeiling;
  state.catVisibleCount = 16;

  const minSlider = document.getElementById('catPriceMin');
  const maxSlider = document.getElementById('catPriceMax');
  if (minSlider && maxSlider && !minSlider.dataset.bound) {
    minSlider.dataset.bound = '1';
    minSlider.min = maxSlider.min = state.priceFloor;
    minSlider.max = maxSlider.max = state.priceCeiling;
    minSlider.step = maxSlider.step = Math.max(1, Math.round((state.priceCeiling - state.priceFloor) / 500) * 5);
    minSlider.value = state.priceFloor;
    maxSlider.value = state.priceCeiling;
    const updateLabels = () => {
      const lbl = document.getElementById('catPriceLabel');
      if (lbl) lbl.textContent = `${Number(state.minPrice).toLocaleString('ar-EG')} — ${Number(state.maxPrice).toLocaleString('ar-EG')} ج.م`;
    };
    minSlider.addEventListener('input', () => {
      let v = Number(minSlider.value);
      if (v > state.maxPrice) { v = state.maxPrice; minSlider.value = v; }
      state.minPrice = v;
      updateLabels();
      state.catVisibleCount = 16;
      renderCategoryPageGrid();
    });
    maxSlider.addEventListener('input', () => {
      let v = Number(maxSlider.value);
      if (v < state.minPrice) { v = state.minPrice; maxSlider.value = v; }
      state.maxPrice = v;
      updateLabels();
      state.catVisibleCount = 16;
      renderCategoryPageGrid();
    });
    updateLabels();
  }

  const sortSel = document.getElementById('catSortSelect');
  if (sortSel && !sortSel.dataset.bound) {
    sortSel.dataset.bound = '1';
    sortSel.value = state.sortBy;
    sortSel.addEventListener('change', () => {
      state.sortBy = sortSel.value;
      state.catVisibleCount = 16;
      renderCategoryPageGrid();
    });
  }

  const resetBtn = document.getElementById('catFiltersReset');
  if (resetBtn && !resetBtn.dataset.bound) {
    resetBtn.dataset.bound = '1';
    resetBtn.addEventListener('click', () => {
      state.minPrice = state.priceFloor;
      state.maxPrice = state.priceCeiling;
      state.sortBy = 'popular';
      state.catVisibleCount = 16;
      if (minSlider) minSlider.value = state.priceFloor;
      if (maxSlider) maxSlider.value = state.priceCeiling;
      if (minSlider || maxSlider) {
        const lbl = document.getElementById('catPriceLabel');
        if (lbl) lbl.textContent = `${Number(state.minPrice).toLocaleString('ar-EG')} — ${Number(state.maxPrice).toLocaleString('ar-EG')} ج.م`;
      }
      if (sortSel) sortSel.value = 'popular';
      renderCategoryPageGrid();
    });
  }

  renderCategoryPageGrid();
  initScrollReveal();
}

function renderCategoryPageGrid() {
  const grid = document.getElementById('categoryProductsGrid');
  if (!grid) return;

  const countEl = document.getElementById('catPageCount');
  const all = state.products.filter(p => doesProductMatchCategory(p, state.activeCategory));
  const list = getFilteredProducts();

  if (countEl) {
    countEl.textContent = `${list.length.toLocaleString('ar-EG')} منتج في هذا القسم`;
  }
  const rangeNote = document.getElementById('catPriceRangeNote');
  if (rangeNote) {
    rangeNote.textContent = list.length === all.length
      ? ''
      : `معروض بعد الفرز والسعر: ${list.length.toLocaleString('ar-EG')} من ${all.length.toLocaleString('ar-EG')}`;
  }

  if (!list.length) {
    grid.innerHTML = `
      <div class="catalog-empty">
        <i class="fa-solid fa-box-open"></i>
        <p>مفيش منتجات مطابقة في هذا القسم بالفلتر الحالي.</p>
        <button type="button" id="catEmptyReset" class="btn btn-outline-gold">إعادة ضبط الفلتر</button>
      </div>`;
    const emptyReset = document.getElementById('catEmptyReset');
    if (emptyReset) emptyReset.addEventListener('click', () => {
      const btn = document.getElementById('catFiltersReset');
      if (btn) btn.click();
    });
    const more = document.getElementById('catLoadMoreWrap');
    if (more) more.innerHTML = '';
    return;
  }

  const visible = list.slice(0, state.catVisibleCount);
  grid.innerHTML = visible.map((p, idx) => buildProductCardHTML(p, idx)).join('');
  if (typeof observeNewElements === 'function') observeNewElements();

  const more = document.getElementById('catLoadMoreWrap');
  if (more) {
    more.innerHTML = list.length > visible.length
      ? `<button type="button" class="btn btn-outline-gold" id="catLoadMoreBtn">عرض المزيد (${(list.length - visible.length).toLocaleString('ar-EG')} منتج)</button>`
      : '';
    const btn = document.getElementById('catLoadMoreBtn');
    if (btn) btn.addEventListener('click', () => {
      state.catVisibleCount += CATALOG_PAGE_SIZE;
      renderCategoryPageGrid();
    });
  }
}

function initScrollReveal() {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

  observeNewElements();
}

function observeNewElements() {
  if (!revealObserver) return;
  document.querySelectorAll('.section-head:not(.reveal-up), .trust-item:not(.reveal-up), .feature-card:not(.reveal-up), .bundle-shell:not(.reveal-up)').forEach((el, idx) => {
    el.classList.add('reveal-up');
    el.style.setProperty('--delay', `${(idx % 5) * 45}ms`);
  });
  document.querySelectorAll('.reveal-up:not(.is-visible)').forEach(el => {
    revealObserver.observe(el);
  });
  bind3DProductCards();
}

function bind3DProductCards() {
  if (!window.matchMedia('(min-width: 992px)').matches) return;
  document.querySelectorAll('.product-card:not([data-tilt-bound])').forEach(card => {
    card.setAttribute('data-tilt-bound', '1');
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rx = ((py - 0.5) * -7).toFixed(2);
      const ry = ((px - 0.5) * 8).toFixed(2);
      card.style.transform = `translateY(-8px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      card.style.setProperty('--card-mx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--card-my', `${(py * 100).toFixed(1)}%`);
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  });
}

// ==================== INTERACTIVE PRODUCT EXHIBITION STAGE (3D PEDESTAL & REAL PRODUCT) ====================
function initHeroShowcase() {
  renderHeroSlide(0);
  startHeroLoop();

  const stage = document.getElementById('heroStudioStage');
  const rig = document.getElementById('hero3DRig');
  const card = document.getElementById('heroGalleryCard');
  const frame = document.getElementById('heroProductFrame');
  const pedShadow = document.getElementById('heroPedestalShadow');

  if (!stage) return;

  let isDraggingStage = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let currentRotY = 0;
  let currentRotX = 0;

  const applyStageTransform = (rotX, rotY, glareX = 50, glareY = 42) => {
    if (rig) {
      rig.style.transform = `rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
    }
    if (card) {
      card.style.setProperty('--glare-x', `${glareX.toFixed(1)}%`);
      card.style.setProperty('--glare-y', `${glareY.toFixed(1)}%`);
    }
    if (frame) {
      frame.style.transform = `translate3d(${(rotY * -0.9).toFixed(1)}px, ${(rotX * 0.7).toFixed(1)}px, 44px)`;
    }
    if (pedShadow) {
      pedShadow.style.transform = `translate3d(${(rotY * 1.1).toFixed(1)}px, ${(rotX * -0.5).toFixed(1)}px, 0) scale(${1 - Math.abs(rotY) * 0.003})`;
    }
  };

  stage.addEventListener('mouseenter', () => {
    state.heroPaused = true;
    stage.classList.add('is-interacting');
  });

  stage.addEventListener('mouseleave', () => {
    state.heroPaused = false;
    isDraggingStage = false;
    stage.classList.remove('is-interacting', 'is-dragging');
    currentRotX = 0;
    currentRotY = 0;
    if (rig) rig.style.transform = '';
    if (frame) frame.style.transform = '';
    if (pedShadow) pedShadow.style.transform = '';
  });

  stage.addEventListener('mousedown', (e) => {
    if (e.target.closest('button, a, .exploded-layer-card, .stage-hotspot-pin')) return;
    isDraggingStage = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    stage.classList.add('is-dragging');
  });

  window.addEventListener('mouseup', () => {
    if (isDraggingStage) {
      isDraggingStage = false;
      stage.classList.remove('is-dragging');
    }
  });

  stage.addEventListener('mousemove', (e) => {
    const r = (card || stage).getBoundingClientRect();
    if (!r.width || !r.height) return;
    const px = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width));
    const py = Math.min(1, Math.max(0, (e.clientY - r.top) / r.height));

    if (isDraggingStage) {
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      currentRotY = Math.max(-24, Math.min(24, dx * 0.14));
      currentRotX = Math.max(-12, Math.min(12, dy * -0.08));
      applyStageTransform(currentRotX, currentRotY, px * 100, py * 100);
    } else if (window.matchMedia('(min-width: 992px)').matches) {
      const x = px - 0.5;
      const y = py - 0.5;
      const rotX = y * -9;
      const rotY = x * 12;
      applyStageTransform(rotX, rotY, px * 100, py * 100);
    }
  });

  // Touch rotation & swipe support on mobile / tablet
  let touchStartX = 0;
  let touchStartY = 0;
  stage.addEventListener('touchstart', (e) => {
    state.heroPaused = true;
    touchStartX = e.changedTouches[0]?.clientX || 0;
    touchStartY = e.changedTouches[0]?.clientY || 0;
  }, { passive: true });

  stage.addEventListener('touchmove', (e) => {
    const cx = e.changedTouches[0]?.clientX || 0;
    const cy = e.changedTouches[0]?.clientY || 0;
    const dx = cx - touchStartX;
    const dy = cy - touchStartY;
    if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      const rotY = Math.max(-18, Math.min(18, dx * 0.12));
      const rotX = Math.max(-8, Math.min(8, dy * -0.06));
      applyStageTransform(rotX, rotY, 50 + rotY * 1.5, 45 - rotX * 1.5);
    }
  }, { passive: true });

  stage.addEventListener('touchend', (e) => {
    state.heroPaused = false;
    const dx = (e.changedTouches[0]?.clientX || 0) - touchStartX;
    if (rig) rig.style.transform = '';
    if (frame) frame.style.transform = '';
    if (pedShadow) pedShadow.style.transform = '';
    if (Math.abs(dx) > 65) {
      stepHeroSlide(dx > 0 ? 1 : -1);
    }
  }, { passive: true });
}

function startHeroLoop() {
  clearInterval(state.heroTimer);
  state.heroTimer = setInterval(() => {
    if (state.heroPaused) return;
    const slides = state.heroSlides.length ? state.heroSlides : DEFAULT_HERO_SLIDES;
    const next = (state.activeHeroSlide + 1) % slides.length;
    renderHeroSlide(next);
  }, 6500);
}

window.stepHeroSlide = function(delta) {
  const slides = state.heroSlides.length ? state.heroSlides : DEFAULT_HERO_SLIDES;
  const next = (state.activeHeroSlide + delta + slides.length) % slides.length;
  renderHeroSlide(next);
  startHeroLoop();
};

window.addHeroActiveProductToCart = function(evt) {
  const slides = state.heroSlides.length ? state.heroSlides : DEFAULT_HERO_SLIDES;
  const s = slides[state.activeHeroSlide];
  if (!s || !s.productId) return;
  addToCartWithAnimation(s.productId, evt, false);
};

window.compareHeroActiveProduct = function() {
  const slides = state.heroSlides.length ? state.heroSlides : DEFAULT_HERO_SLIDES;
  const s = slides[state.activeHeroSlide];
  if (!s || !s.productId) return;
  toggleCompareProduct(s.productId);
  const cmpBtn = document.getElementById('stageCompareBtn');
  if (cmpBtn) cmpBtn.classList.toggle('active', state.compare.includes(s.productId));
};

window.quickViewHeroActiveProduct = function() {
  const slides = state.heroSlides.length ? state.heroSlides : DEFAULT_HERO_SLIDES;
  const s = slides[state.activeHeroSlide];
  if (!s || !s.productId) return;
  if (typeof openQuickView === 'function') {
    openQuickView(s.productId);
  } else {
    openProductPage(s.productId);
  }
};

function renderHeroSlide(index) {
  const slides = state.heroSlides.length ? state.heroSlides : DEFAULT_HERO_SLIDES;
  state.activeHeroSlide = ((index % slides.length) + slides.length) % slides.length;
  const s = slides[state.activeHeroSlide];
  if (!s) return;

  const tagEl = document.getElementById('heroTagText');
  const titleEl = document.getElementById('heroHeading');
  const descEl = document.getElementById('heroDescription');
  const imgWrap = document.getElementById('heroProductFrame');

  if (tagEl) tagEl.textContent = s.tag;

  if (titleEl) {
    titleEl.style.animation = 'none';
    void titleEl.offsetWidth;
    titleEl.style.animation = null;
    titleEl.textContent = s.title;
  }
  if (descEl) {
    descEl.style.animation = 'none';
    void descEl.offsetWidth;
    descEl.style.animation = null;
    descEl.textContent = s.subtitle;
  }

  const mModel = document.getElementById('heroMetricModel');
  const mPower = document.getElementById('heroMetricPower');
  const mCap = document.getElementById('heroMetricCap');
  const mPrice = document.getElementById('heroMetricPrice');
  if (mModel) mModel.textContent = normalizeDigits(s.model);
  if (mPower) mPower.textContent = normalizeDigits(s.power);
  if (mCap) mCap.textContent = normalizeDigits(s.capacity);
  if (mPrice) mPrice.textContent = normalizeDigits(s.price);

  if (imgWrap) {
    imgWrap.classList.remove('stage-switching');
    void imgWrap.offsetWidth;
    imgWrap.classList.add('stage-switching');
    imgWrap.innerHTML = buildHero3DApplianceHTML(s);
  }

  // Sync compact toolbar mode & explanation arrows buttons
  document.querySelectorAll('#hero3DModeBar .hero-mode-btn[data-mode]').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-mode') === state.hero3DViewMode);
  });

  const inspBtn = document.getElementById('stageInspectBtn');
  if (inspBtn) inspBtn.classList.toggle('active', !!state.heroDrawerOpen && state.hero3DViewMode === 'live');

  const cmpBtn = document.getElementById('stageCompareBtn');
  if (cmpBtn) cmpBtn.classList.toggle('active', state.compare.includes(s.productId));

  const expBtnTxt = document.getElementById('heroExplodeBtnTxt');
  if (expBtnTxt) {
    expBtnTxt.textContent = state.hero3DViewMode === 'exploded' ? 'شرح أجزاء الجهاز' : 'المكونات بالتفصيل';
  }

  const floatTop = document.getElementById('heroFloatTopText');
  const floatBot = document.getElementById('heroFloatBottomText');
  const floatPrice = document.getElementById('heroFloatPriceVal');
  const slideCounter = document.getElementById('heroSlideCounter');
  const warrantyTxt = state.settings?.warrantyText || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة';
  if (floatTop) floatTop.textContent = normalizeDigits(`${s.model} • ${s.power}`);
  if (floatBot) floatBot.textContent = warrantyTxt;
  if (floatPrice) floatPrice.textContent = normalizeDigits(s.price || 'شحن مجاني');
  if (slideCounter) {
    const cur = String(state.activeHeroSlide + 1).padStart(2, '0');
    const tot = String(slides.length).padStart(2, '0');
    slideCounter.textContent = `${cur} / ${tot}`;
  }

  const primaryBtn = document.getElementById('heroShopCatBtn');
  if (primaryBtn) {
    primaryBtn.onclick = () => selectCategory(s.categoryId, true);
  }
  const detailBtn = document.getElementById('heroDetailBtn');
  if (detailBtn) {
    detailBtn.onclick = () => openProductPage(s.productId);
  }

  // Render Sleek Vertical Thumbnail Sidebar
  const navStrip = document.getElementById('heroNavStrip');
  if (navStrip) {
    navStrip.innerHTML = slides.map((item, idx) => `
      <div class="hero-thumb-item ${idx === state.activeHeroSlide ? 'active' : ''}" onclick="goToHeroSlide(${idx})">
        <div class="thumb-img-box">
          <img src="${escapeHTML(item.image)}" alt="${escapeHTML(item.model)}" loading="lazy" decoding="async" width="80" height="80" onerror="this.onerror=null;this.src='assets/products/hero-showcase.jpg'" />
        </div>
        <div class="thumb-meta-col">
          <div class="thumb-sku-row">
            <span class="thumb-model">${escapeHTML(item.model)}</span>
            <span class="thumb-power">${escapeHTML(item.power)}</span>
          </div>
          <div class="thumb-price">${escapeHTML(item.price)}</div>
        </div>
        <div class="thumb-progress"></div>
      </div>
    `).join('');
  }
}

window.setHero3DViewMode = function(mode) {
  state.hero3DViewMode = mode;
  renderHeroSlide(state.activeHeroSlide);
  startHeroLoop();
};

window.toggleHero3DExplodeMode = function() {
  state.hero3DViewMode = state.hero3DViewMode === 'exploded' ? 'live' : 'exploded';
  renderHeroSlide(state.activeHeroSlide);
  startHeroLoop();
};

window.toggleHero3DDrawer = function(evt) {
  if (evt) evt.stopPropagation();
  if (state.hero3DViewMode !== 'live') {
    state.hero3DViewMode = 'live';
    state.heroDrawerOpen = true;
  } else {
    state.heroDrawerOpen = !state.heroDrawerOpen;
  }
  renderHeroSlide(state.activeHeroSlide);
};

function detectSlideSimType(s) {
  if (s.simType) return s.simType;
  const cat = (s.categoryId || '').toLowerCase();
  const mdl = (s.model || '').toLowerCase();
  if (cat === 'airfryer' || mdl.includes('10085') || mdl.includes('8015')) return 'airfryer';
  if (cat === 'sandwich' || mdl.includes('b907') || mdl.includes('907')) return 'sandwich';
  if (cat === 'oven' || mdl.includes('10071')) return 'oven';
  if (cat === 'mixer' || mdl.includes('05022') || mdl.includes('09122')) return 'mixer';
  if (cat === 'blender' || mdl.includes('999')) return 'blender';
  return 'airfryer';
}

function getHotspotsForAppliance(type, s) {
  if (type === 'sandwich') {
    return [
      { pos: 'top-right', icon: 'fa-fire-flame-curved', label: 'لمبات البيان والتسخين', val: `تسخين مزدوج ${s.power || '750W-1400W'}` },
      { pos: 'mid-left', icon: 'fa-layer-group', label: 'الألواح القابلة للفك', val: '7 غيارات تيفال بضغطة زر' },
      { pos: 'bottom-right', icon: 'fa-shield-halved', label: 'مقبض الأمان والعزل', val: 'عازل للحرارة + قفل محكم' }
    ];
  }
  if (type === 'blender') {
    return [
      { pos: 'top-right', icon: 'fa-jar', label: 'الدورق العملاق', val: '2.5 لتر مضاد للكسر + كبة' },
      { pos: 'mid-left', icon: 'fa-dharmachakra', label: 'الشفرات والتروس', val: '6 شفرات تيتانيوم لجرش الثلج' },
      { pos: 'bottom-right', icon: 'fa-sliders', label: 'لوحة التحكم والمحرك', val: `${s.power || '6000W'} + سرعات تربو` }
    ];
  }
  if (type === 'oven') {
    return [
      { pos: 'top-right', icon: 'fa-tv', label: 'شاشة التحكم الرقمية', val: 'برامج ذكية + تايمر وحرارة 230°C' },
      { pos: 'mid-left', icon: 'fa-drumstick-bite', label: 'الشواية والمروحة', val: 'شواية دوارة 360° + مروحة توزيع' },
      { pos: 'bottom-right', icon: 'fa-fire-burner', label: 'سخانات الكوارتز', val: `قدرة ${s.power || '3000W'} وعزل مزدوج` }
    ];
  }
  if (type === 'mixer') {
    return [
      { pos: 'top-right', icon: 'fa-sliders', label: 'مفتاح التحكم والسرعات', val: '6 سرعات + نبضات Pulse' },
      { pos: 'mid-left', icon: 'fa-bowl-food', label: 'وعاء العجن الاستانلس', val: `استانلس 304 سعة ${s.capacity || '8 لتر'}` },
      { pos: 'bottom-right', icon: 'fa-gears', label: 'الموتور النحاسي', val: `${s.power || '2000W'} خدمة شاقة` }
    ];
  }
  // Default: Air Fryer
  return [
    { pos: 'top-right', icon: 'fa-tablet-screen-button', label: 'شاشة اللمس الذكية', val: '10 برامج طهي • حتى 200°C' },
    { pos: 'mid-left', icon: 'fa-fan', label: 'نظام التسخين الهوائي', val: `توزيع 360° بقدرة ${s.power || '2200W'}` },
    { pos: 'bottom-right', icon: 'fa-box-open', label: 'الدرج العائلي غير اللاصق', val: `سعة ${s.capacity || '7.5L'} سهل التنظيف` }
  ];
}

function getExplodedLayersForAppliance(type, s) {
  if (type === 'sandwich') {
    return [
      { icon: 'fa-shield-halved', z: '40px', tag: '01 • الغطاء العلوي', title: 'غطاء عازل للحرارة + قفل أمان', desc: 'مقبض بارد الملمس مع لمبات بيان للجاهزية' },
      { icon: 'fa-fire-flame-curved', z: '30px', tag: '02 • التسخين السريع', title: `ملفات تسخين مزدوجة (${s.power || '750W'})`, desc: 'توزيع حراري متساوٍ لتحميص مقرمش في دقائق' },
      { icon: 'fa-layer-group', z: '20px', tag: '03 • 7 غيارات تيفال', title: '7 أطقم ألواح قابلة للفك بضغطة زر', desc: 'ساندوتش + وافل + جريل + دونات + معمول + جوزية' },
      { icon: 'fa-microchip', z: '10px', tag: '04 • القاعدة الذكية', title: 'ثرموستات فصل أوتوماتيكي', desc: 'حماية كاملة ضد زيادة الحرارة مع ضمان سنة' }
    ];
  }
  if (type === 'blender') {
    return [
      { icon: 'fa-jar', z: '40px', tag: '01 • الدورق العملاق', title: 'دورق مضاد للكسر 2.5L + كبة', desc: 'خامات صحية تتحمل الصدمات والحرارة' },
      { icon: 'fa-dharmachakra', z: '30px', tag: '02 • شفرات التيتانيوم', title: '6 شفرات فولاذية لجرش الثلج', desc: 'تطحن الثلج والمكسرات واللحوم في ثوانٍ' },
      { icon: 'fa-gears', z: '20px', tag: '03 • التروس المعدنية', title: 'تروس تعشيق معدنية 100%', desc: 'نقل حركة فائق القوة مع الاستخدام الشاق' },
      { icon: 'fa-bolt', z: '10px', tag: '04 • الموتور النحاسي', title: `موتور نحاسي ${s.power || '6000W'} تربو`, desc: 'مزود بمروحة تبريد ذاتية وفيوز حماية' }
    ];
  }
  if (type === 'oven') {
    return [
      { icon: 'fa-tv', z: '40px', tag: '01 • التحكم الرقمي', title: 'شاشة ديجيتال LED + برامج ذكية', desc: 'تحكم دقيق في الحرارة حتى 230°C والتايمر' },
      { icon: 'fa-drumstick-bite', z: '30px', tag: '02 • الشواية الدوارة', title: 'شواية 360° + مروحة Convection', desc: 'تحمير متساوٍ للمشويات والمخبوزات' },
      { icon: 'fa-fire-burner', z: '20px', tag: '03 • سخانات الكوارتز', title: `4 سخانات استانلس (${s.power || '3000W'})`, desc: 'تسخين فوري علوي وسفلي مزدوج' },
      { icon: 'fa-window-maximize', z: '10px', tag: '04 • العزل الحراري', title: 'باب زجاجي مزدوج + إضاءة داخلية', desc: 'يحفظ الحرارة ويوفر استهلاك الكهرباء' }
    ];
  }
  if (type === 'mixer') {
    return [
      { icon: 'fa-sliders', z: '40px', tag: '01 • الرأس المتحرك', title: 'رأس قابل للإمالة بـ 6 سرعات', desc: 'قفل أمان محكم لرفع الرأس وتبديل المضارب' },
      { icon: 'fa-hurricane', z: '30px', tag: '02 • الحركة الكوكبية', title: '3 مضارب (عجين + خفق + تقليب)', desc: 'دوران كوكبي يغطي كافة جوانب الوعاء' },
      { icon: 'fa-bowl-food', z: '20px', tag: '03 • وعاء الاستانلس', title: `حلة استانلس 304 سعة ${s.capacity || '8 لتر'}`, desc: 'غطاء شفاف مانع للطرطشة بفتحة إضافية' },
      { icon: 'fa-gears', z: '10px', tag: '04 • الموتور والتروس', title: `موتور نحاسي ${s.power || '2000W'}`, desc: 'ثبات كامل على الرخامة مع العجين الثقيل' }
    ];
  }
  // Default: Air Fryer ('airfryer')
  return [
    { icon: 'fa-tablet-screen-button', z: '40px', tag: '01 • الشاشة الذكية', title: 'لوحة تحكم ديجيتال تاتش LED', desc: '10 برامج طهي (80°C - 200°C) بلمسة واحدة' },
    { icon: 'fa-fan', z: '30px', tag: '02 • تكنولوجيا الهواء', title: `مروحة تربو + هيتر (${s.power || '2200W'})`, desc: 'توزيع هواء ساخن 360° لقرمشة بدون زيت' },
    { icon: 'fa-filter', z: '20px', tag: '03 • تصفية الدهون', title: 'شبكة شوي لعزل الدهون 90%', desc: 'فتحات دوران هواء لتسوية متكاملة' },
    { icon: 'fa-box-open', z: '10px', tag: '04 • الحلة العائلية', title: `درج تيفال غير لاصق (${s.capacity || '7.5L'})`, desc: 'قابل للفك الكامل والغسيل السريع بأمان' }
  ];
}

function buildHero3DApplianceHTML(s) {
  const simType = detectSlideSimType(s);
  const mode = state.hero3DViewMode || 'live';

  // Prefer the background-removed (transparent) cutout so the product sits
  // directly on the 3D pedestal with no white box behind it.
  const heroImage = String(s.image || '').replace(/\.jpe?g$/i, '-cutout.png');
  const heroImgTag = (alt) => `
        <img id="hero-img-${escapeHTML(s.productId)}"
             src="${escapeHTML(heroImage)}"
             alt="${escapeHTML(alt)}"
             class="stage-centerpiece-img"
             onerror="this.onerror=null;this.onerror=function(){this.style.display='none'};this.src='assets/products/hero-showcase.jpg'" />`;

  // Support real interactive 3D <model-viewer> if a .glb/.gltf model URL is configured on the slide,
  // otherwise display the frameless real product on the 3D circular exhibition pedestal
  const productCenterpieceHTML = s.model3dUrl
    ? `<model-viewer src="${escapeHTML(s.model3dUrl)}" poster="${escapeHTML(heroImage)}" alt="${escapeHTML(s.title)}" camera-controls auto-rotate shadow-intensity="1" class="stage-model-viewer"></model-viewer>`
    : `
      <div class="stage-product-spotlight" onclick="openProductPage('${escapeHTML(s.productId)}')" title="اضغط لفتح صفحة المنتج الكاملة">
        ${heroImgTag(s.title)}
      </div>
    `;

  // Mode 3: Pure Studio View (No Explanation Callouts)
  if (mode === 'photo') {
    return `
      <div class="sim3d-stage studio-clean-mode">
        ${productCenterpieceHTML}
      </div>
    `;
  }

  // Mode 2: Detailed Component Breakdown View (Real Product + 4 Component Explanation Cards)
  if (mode === 'exploded') {
    const layers = getExplodedLayersForAppliance(simType, s);
    return `
      <div class="sim3d-stage exploded-anatomy-mode">
        <div class="exploded-center-preview" onclick="openProductPage('${escapeHTML(s.productId)}')">
          <img id="hero-img-${escapeHTML(s.productId)}"
               src="${escapeHTML(heroImage)}"
               alt="${escapeHTML(s.model)}"
               onerror="this.onerror=null;this.onerror=function(){this.style.display='none'};this.src='assets/products/hero-showcase.jpg'" />
        </div>
        <div class="sim3d-exploded-stack">
          ${layers.map(l => `
            <div class="exploded-layer-card" style="--layer-z:${l.z};" onclick="openProductPage('${escapeHTML(s.productId)}')">
              <div class="exploded-layer-icon"><i class="fa-solid ${l.icon}"></i></div>
              <div class="exploded-layer-info">
                <div class="exploded-layer-title">
                  <span>${escapeHTML(l.title)}</span>
                  <span class="exploded-layer-tag">${escapeHTML(l.tag)}</span>
                </div>
                <div class="exploded-layer-desc">${escapeHTML(l.desc)}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  // Mode 1 (Default): Interactive Exhibition Stage with Product Explanation Arrows & Callouts (No Fake Power/Steam)
  const hotspots = getHotspotsForAppliance(simType, s);

  return `
    <div class="sim3d-stage live-exhibition-mode">
      ${productCenterpieceHTML}

      ${state.heroDrawerOpen ? `
        <div class="stage-hotspots-layer">
          ${hotspots.map((h, idx) => `
            <div class="stage-hotspot-pin pos-${h.pos}" style="--hs-delay:${idx * 90}ms" onclick="openProductPage('${escapeHTML(s.productId)}')" title="اضغط لعرض التفاصيل الكاملة">
              <span class="hotspot-beacon"><i class="fa-solid ${h.icon}"></i></span>
              <div class="hotspot-card">
                <small>${escapeHTML(h.label)}</small>
                <strong>${escapeHTML(h.val)}</strong>
              </div>
              <span class="hotspot-pointer-arrow" aria-hidden="true"></span>
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

window.goToHeroSlide = function(idx) {
  renderHeroSlide(idx);
  startHeroLoop();
};

// ==================== NAVIGATION TO DEDICATED PRODUCT PAGE ====================
window.openProductPage = function(productId) {
  if (!productId) return;
  window.location.href = `product.html?id=${encodeURIComponent(productId)}`;
};

// ==================== CATEGORIES VISUAL GRID & TOP DROPDOWN MENUS ====================
let catDropdownTimer = null;
let openDropdownCatId = null;

function ensureHeaderDropdownHost() {
  const bar = document.querySelector('.header-cat-bar');
  if (!bar) return null;
  let host = document.getElementById('headerCatDropdownHost');
  if (!host) {
    host = document.createElement('div');
    host.id = 'headerCatDropdownHost';
    host.className = 'header-cat-dropdown-host';
    host.addEventListener('mouseenter', () => {
      if (catDropdownTimer) {
        clearTimeout(catDropdownTimer);
        catDropdownTimer = null;
      }
    });
    host.addEventListener('mouseleave', () => {
      scheduleCloseCategoryDropdown(240);
    });
    bar.appendChild(host);
  }
  return host;
}

function scheduleCloseCategoryDropdown(delayMs = 240) {
  if (catDropdownTimer) clearTimeout(catDropdownTimer);
  catDropdownTimer = setTimeout(() => {
    closeHeaderCategoryDropdown();
  }, delayMs);
}

window.closeHeaderCategoryDropdown = function() {
  if (catDropdownTimer) {
    clearTimeout(catDropdownTimer);
    catDropdownTimer = null;
  }
  openDropdownCatId = null;
  const host = document.getElementById('headerCatDropdownHost');
  if (host) {
    host.classList.remove('open');
  }
  document.querySelectorAll('#headerCatNav .cat-nav-item').forEach(li => {
    li.classList.remove('dropdown-open');
  });
};

window.handleContactCategoryAction = function(actionKey = 'info', labelText = '') {
  closeHeaderCategoryDropdown();
  const key = String(actionKey || '').toLowerCase();
  const lbl = String(labelText || '');
  if (key === 'whatsapp' || lbl.includes('واتساب')) {
    if (typeof openStorePolicyModal === 'function') {
      openStorePolicyModal('contact');
    } else if (typeof openStoreWhatsappChat === 'function') {
      openStoreWhatsappChat();
    }
    return;
  }
  if (key === 'refund' || lbl.includes('استرجاع') || lbl.includes('استبدال')) {
    if (typeof openStorePolicyModal === 'function') openStorePolicyModal('refund');
    return;
  }
  if (key === 'service' || key === 'warranty' || lbl.includes('صيانة') || lbl.includes('ضمان')) {
    if (typeof openStorePolicyModal === 'function') openStorePolicyModal('warranty');
    return;
  }
  if (typeof openStorePolicyModal === 'function') {
    openStorePolicyModal('contact');
  } else if (typeof openStoreWhatsappChat === 'function') {
    openStoreWhatsappChat();
  }
};

function deriveQueryFromSubItem(sub) {
  const explicit = String(sub.query || '').trim();
  if (explicit) return explicit;
  const lbl = String(sub.label || '').trim();
  if (!lbl || /^(عرض\s*كل|جميع|كل\s)/i.test(lbl)) return '';
  // Extract primary appliance keyword if admin left the query field blank
  const stopWords = new Set(['كهربائية', 'كهربائيه', 'احترافية', 'احترافيه', 'سوكاني', 'اصلية', 'اصليه', 'ديجيتال', 'استانلس', 'ثقيلة', 'ثقيله', 'حديثة', 'حديثه', 'منزلية', 'منزليه']);
  const words = lbl.split(/\s+/).filter(w => w.length > 1 && !stopWords.has(w));
  return words[0] || lbl;
}

function buildCategoryDropdownInnerHTML(cat) {
  const isHomePage = !!document.getElementById('catalogSection');
  const icon = (cat.icon || 'fa-cube').replace(/[^a-zA-Z0-9_-]/g, '');
  const subItems = Array.isArray(cat.subItems) && cat.subItems.length
    ? cat.subItems
    : (cat.id === 'contact'
        ? [
            { label: 'تواصل مباشر عبر واتساب', cat: 'contact', query: 'whatsapp', icon: 'fa-comment-dots' },
            { label: 'طلب استبدال أو استرجاع (14 يوم)', cat: 'contact', query: 'refund', icon: 'fa-rotate-left' },
            { label: 'عناوين مراكز صيانة سوكاني المعتمدة', cat: 'contact', query: 'service', icon: 'fa-screwdriver-wrench' }
          ]
        : [{ label: `عرض كل ${cat.name}`, cat: cat.id, query: '', icon }]);

  const catProducts = cat.id === 'contact'
    ? []
    : state.products.filter(p => doesProductMatchCategory(p, cat.id)).slice(0, 3);

  const subLinksHTML = subItems.map(sub => {
    const sIcon = (sub.icon || 'fa-angle-left').replace(/[^a-zA-Z0-9_-]/g, '');
    const sCat = sub.cat || cat.id;
    const sQuery = sCat === 'contact' ? (sub.query || 'info') : deriveQueryFromSubItem(sub);

    if (sCat === 'contact') {
      return `
        <button type="button" class="cat-dropdown-item" onclick="handleContactCategoryAction('${escapeHTML(sQuery)}', '${escapeHTML(sub.label)}'); event.stopPropagation();">
          <span class="cat-dd-item-lbl"><i class="fa-solid ${sIcon}"></i> ${escapeHTML(sub.label)}</span>
          <i class="fa-solid fa-arrow-left cat-dd-arrow"></i>
        </button>
      `;
    }

    if (isHomePage) {
      return `
        <button type="button" class="cat-dropdown-item" onclick="filterBySubCategory('${escapeHTML(sCat)}', '${escapeHTML(sQuery)}'); event.stopPropagation();">
          <span class="cat-dd-item-lbl"><i class="fa-solid ${sIcon}"></i> ${escapeHTML(sub.label)}</span>
          <i class="fa-solid fa-arrow-left cat-dd-arrow"></i>
        </button>
      `;
    }
    const url = sCat === 'contact'
      ? `index.html?cat=contact#catalogSection`
      : `category.html?cat=${encodeURIComponent(sCat)}${sQuery ? `&q=${encodeURIComponent(sQuery)}` : ''}`;
    return `
      <a href="${url}" class="cat-dropdown-item">
        <span class="cat-dd-item-lbl"><i class="fa-solid ${sIcon}"></i> ${escapeHTML(sub.label)}</span>
        <i class="fa-solid fa-arrow-left cat-dd-arrow"></i>
      </a>
    `;
  }).join('');

  const topModelsHTML = cat.id === 'contact' ? `
    <div class="cat-dropdown-models">
      <div class="cat-dd-models-title">خدمة عملاء Diamond Store المباشرة:</div>
      <div style="display:grid; gap:8px;">
        <button type="button" class="btn-brand" style="width:100%; justify-content:center; padding:10px 14px; font-size:0.84rem; border-radius:12px;" onclick="openStoreWhatsappChat(); closeHeaderCategoryDropdown();">
          <i class="fa-brands fa-whatsapp" style="font-size:1.05rem;"></i> محادثة فورية عبر واتساب
        </button>
      </div>
    </div>
  ` : (catProducts.length ? `
    <div class="cat-dropdown-models">
      <div class="cat-dd-models-title">أبرز الأجهزة المتوفرة في القسم:</div>
      <div class="cat-dd-models-grid">
        ${catProducts.map(p => `
          <a href="product.html?id=${encodeURIComponent(p.id)}" class="cat-dd-model-row">
            <img ${getSafeImageAttr(p)} />
            <div class="cat-dd-model-info">
              <strong>${escapeHTML(normalizeDigits(p.name))}</strong>
              <span>${formatEGP(p.price)}</span>
            </div>
          </a>
        `).join('')}
      </div>
    </div>
  ` : '');

  const viewAllAction = cat.id === 'contact'
    ? `onclick="handleContactCategoryAction('info'); event.stopPropagation();"`
    : (isHomePage
        ? `onclick="filterBySubCategory('${escapeHTML(cat.id)}', ''); event.stopPropagation();"`
        : `onclick="window.location.href='${cat.id === 'contact' ? `index.html?cat=contact#catalogSection` : `category.html?cat=${encodeURIComponent(cat.id)}`}'"`);

  return `
    <div class="cat-dropdown-panel" id="catDropdownPanelCard">
      <div class="cat-dropdown-head">
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <span><i class="fa-solid ${icon}"></i> ${escapeHTML(cat.navTitle || cat.name)}</span>
          <div style="display:flex; align-items:center; gap:8px;">
            <button type="button" class="cat-dd-viewall-btn" ${viewAllAction}>
              ${cat.id === 'contact' ? 'تواصل معنا' : 'عرض الكل'} <i class="fa-solid fa-arrow-left"></i>
            </button>
            <button type="button" class="cat-dd-close-btn" onclick="closeHeaderCategoryDropdown(); event.stopPropagation();" aria-label="إغلاق القائمة">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
        <small>${escapeHTML(cat.subtitle || 'تشكيلة أجهزة سوكاني الأصلية بضمان شركة المغربي')}</small>
      </div>
      <div class="cat-dropdown-list">
        ${subLinksHTML}
      </div>
      ${topModelsHTML}
    </div>
  `;
}

window.openHeaderCategoryDropdown = function(catId, liEl) {
  if (catDropdownTimer) {
    clearTimeout(catDropdownTimer);
    catDropdownTimer = null;
  }
  const cats = state.categories.length ? state.categories : DEFAULT_CATEGORIES;
  const cat = cats.find(c => c.id === catId);
  if (!cat) return;

  const host = ensureHeaderDropdownHost();
  if (!host) return;

  openDropdownCatId = catId;
  host.innerHTML = buildCategoryDropdownInnerHTML(cat);
  host.classList.add('open');

  document.querySelectorAll('#headerCatNav .cat-nav-item').forEach(li => {
    li.classList.toggle('dropdown-open', li.getAttribute('data-cat-li') === catId);
  });

  // Align panel horizontally under the hovered/clicked category button on desktop
  const panel = document.getElementById('catDropdownPanelCard');
  if (panel && liEl && window.innerWidth > 768) {
    const barRect = host.parentElement.getBoundingClientRect();
    const liRect = liEl.getBoundingClientRect();
    const panelWidth = Math.min(380, window.innerWidth - 24);
    // Align right edge of panel with right edge of the category button (RTL)
    let rightOffset = barRect.right - liRect.right;
    const maxRight = Math.max(12, barRect.width - panelWidth - 12);
    rightOffset = Math.max(12, Math.min(maxRight, rightOffset));
    panel.style.right = `${Math.round(rightOffset)}px`;
    panel.style.left = 'auto';
  } else if (panel) {
    panel.style.right = '';
    panel.style.left = '';
  }
};

window.handleHeaderCategoryClick = function(evt, catId, liEl) {
  evt.preventDefault();
  evt.stopPropagation();

  const isMobileOrTouch = window.innerWidth <= 991 || ('ontouchstart' in window && openDropdownCatId !== catId);

  // On mobile/tablet (or first tap on touch device), tapping opens/toggles the dropdown menu underneath!
  if (isMobileOrTouch) {
    if (openDropdownCatId === catId) {
      closeHeaderCategoryDropdown();
    } else {
      openHeaderCategoryDropdown(catId, liEl);
    }
    return false;
  }

  // On desktop when dropdown is already open via hover, clicking selects the category and scrolls
  closeHeaderCategoryDropdown();
  if (catId === 'contact') {
    handleContactCategoryAction('info');
    return false;
  }
  window.location.href = `category.html?cat=${encodeURIComponent(catId)}`;
  return false;
};

function renderHeaderCategoriesNav() {
  const nav = document.getElementById('headerCatNav');
  if (!nav) return;
  const cats = state.categories.length ? state.categories : DEFAULT_CATEGORIES;
  ensureHeaderDropdownHost();

  nav.innerHTML = cats.map(cat => {
    const label = cat.navTitle || cat.name;
    const icon = (cat.icon || 'fa-cube').replace(/[^a-zA-Z0-9_-]/g, '');
    const active = state.activeCategory === cat.id ? 'active' : '';

  const isSectionsCatalog = cat.id === 'sections';

  return `
      <li class="cat-nav-item has-dropdown"
          data-cat-li="${escapeHTML(cat.id)}"
          ${isSectionsCatalog ? '' : `onmouseenter="if(window.innerWidth > 991) openHeaderCategoryDropdown('${escapeHTML(cat.id)}', this)"
          onmouseleave="if(window.innerWidth > 991) scheduleCloseCategoryDropdown(240)"`}>
        <a href="#catalogSection"
           data-cat="${escapeHTML(cat.id)}"
           class="cat-nav-link ${active}"
           onclick="return handleHeaderCategoryClick(event, '${escapeHTML(cat.id)}', this.parentElement)">
          <i class="fa-solid ${icon}"></i>
          <span>${escapeHTML(label)}</span>
          ${isSectionsCatalog ? '' : '<i class="fa-solid fa-chevron-down cat-chevron"></i>'}
        </a>
      </li>
    `;
  }).join('');
}

window.filterBySubCategory = function(catId, query = '') {
  closeHeaderCategoryDropdown();
  if (catId === 'contact') {
    handleContactCategoryAction(query || 'info');
    return;
  }
  const url = `category.html?cat=${encodeURIComponent(catId || 'all')}${query ? `&q=${encodeURIComponent(query)}` : ''}`;
  window.location.href = url;
};

window.submitHeaderSearch = function() {
  const val = (document.getElementById('headerSearchInput')?.value || '').trim();
  closeLiveSearchDropdown();
  if (document.getElementById('categoryPageRoot')) {
    const catNow = new URLSearchParams(window.location.search).get('cat') || 'all';
    window.location.href = val
      ? `category.html?cat=${encodeURIComponent(catNow)}&q=${encodeURIComponent(val)}`
      : `category.html?cat=${encodeURIComponent(catNow)}`;
  } else if (val) {
    window.location.href = `category.html?cat=all&q=${encodeURIComponent(val)}`;
  } else {
    window.location.href = 'category.html?cat=all';
  }
};

function renderCategoriesGrid() {
  const container = document.getElementById('categoriesGrid');
  if (!container) return;

  const cats = state.categories.length ? state.categories : DEFAULT_CATEGORIES;

  container.innerHTML = cats.map((cat, idx) => {
    const isContact = cat.id === 'contact';
    const count = isContact
      ? 0
      : state.products.filter(p => doesProductMatchCategory(p, cat.id)).length;
    const badgeLabel = isContact ? 'خدمة العملاء 24/7' : `${count} جهاز`;
    const icon = (cat.icon || 'fa-cube').replace(/[^a-zA-Z0-9_-]/g, '');

    return `
      <div class="cat-visual-card reveal-up ${!isContact && state.activeCategory === cat.id ? 'active' : ''}"
           style="--delay: ${idx * 40}ms"
           onclick="selectCategory('${cat.id}', true)">
        <div class="cat-thumb-circle">
          ${cat.image
            ? `<img src="${escapeHTML(cat.image)}" alt="${escapeHTML(cat.name)}" loading="lazy" decoding="async" width="400" height="300" onerror="this.onerror=null;this.style.display='none';this.nextElementSibling.style.display='flex';" />
               <i class="fa-solid ${icon}" style="display:none; font-size:2rem; color:var(--accent);"></i>`
            : `<i class="fa-solid ${icon}" style="font-size:2rem; color:var(--accent);"></i>`}
        </div>
        <div class="cat-card-title">${escapeHTML(cat.name)}</div>
        <span class="cat-card-count">${badgeLabel}</span>
      </div>
    `;
  }).join('');

  // Sync navbar active category state
  document.querySelectorAll('#headerCatNav a').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-cat') === state.activeCategory);
  });

  observeNewElements();
}

window.selectCategory = function(catId, scroll = false) {
  if (catId === 'contact') {
    handleContactCategoryAction('info');
    return;
  }
  window.location.href = `category.html?cat=${encodeURIComponent(catId)}`;
};

// ==================== SMART ARABIC SEARCH & CATALOG FILTER ====================
function getFilteredProducts() {
  return state.products
    .filter(p => {
      const matchCat = doesProductMatchCategory(p, state.activeCategory);
      const matchSearch = smartProductSearchMatch(p, state.searchQuery);
      const matchPrice = Number(p.price) >= (state.minPrice || 0) && Number(p.price) <= state.maxPrice;
      return matchCat && matchSearch && matchPrice;
    })
    .sort((a, b) => {
      if (state.sortBy === 'price-asc') return a.price - b.price;
      if (state.sortBy === 'price-desc') return b.price - a.price;
      if (state.sortBy === 'rating') return (b.rating || 4.8) - (a.rating || 4.8);
      if (state.sortBy === 'name-asc') return String(a.name || '').localeCompare(String(b.name || ''), 'ar');
      if (state.sortBy === 'discount') {
        const disc = (p) => (p.oldPrice && p.oldPrice > p.price ? (p.oldPrice - p.price) / p.oldPrice : 0);
        return disc(b) - disc(a);
      }
      if (state.sortBy === 'newest') return (b.sortOrder || 0) - (a.sortOrder || 0);
      return (b.reviewsCount || 100) - (a.reviewsCount || 100);
    });
}

function buildProductCardHTML(prod, idx = 0) {
  const discountPct = prod.oldPrice > prod.price
    ? Math.round(((prod.oldPrice - prod.price) / prod.oldPrice) * 100)
    : 0;
  const isWish = state.wishlist.includes(prod.id);
  const isComp = state.compare.includes(prod.id);
  const warrantyTxt = prod.warranty || state.settings.warrantyText || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة';

  return `
    <article class="product-card reveal-up" style="--delay: ${(idx % 8) * 45}ms" data-id="${prod.id}">
      <div class="card-header-row">
        <span class="card-badge">${escapeHTML(prod.badge || prod.categoryLabel)}</span>
        ${discountPct > 0 ? `<span class="discount-pill">خصم ${discountPct}%</span>` : ''}
      </div>

      <div class="card-image-stage" onclick="openProductPage('${prod.id}')">
        <div class="card-hover-tools" onclick="event.stopPropagation()">
          <button class="hover-icon-btn ${isWish ? 'active' : ''}" onclick="toggleWishlist('${prod.id}')" title="أضف للمفضلة">
            <i class="fa-regular fa-heart"></i>
          </button>
          <button class="hover-icon-btn" onclick="openQuickView('${prod.id}')" title="معاينة سريعة">
            <i class="fa-regular fa-eye"></i>
          </button>
          <button class="hover-icon-btn ${isComp ? 'active' : ''}" onclick="toggleCompareProduct('${prod.id}')" title="مقارنة المواصفات">
            <i class="fa-solid fa-scale-balanced"></i>
          </button>
        </div>
        <img id="img-${prod.id}" ${getSafeImageAttr(prod)} />
      </div>

      <div class="card-meta-row">
        <span class="sku-tag">${escapeHTML(normalizeDigits(prod.model))}</span>
        <span class="spec-mini">${escapeHTML(normalizeDigits(prod.wattage))} • ${escapeHTML(normalizeDigits(prod.capacity))}</span>
      </div>

      <h3 class="card-title" onclick="openProductPage('${prod.id}')">${escapeHTML(normalizeDigits(prod.name))}</h3>

      <div class="card-trust-row">
        <span class="trust-mini-pill"><i class="fa-solid fa-truck-fast"></i> شحن مجاني</span>
        <span class="trust-mini-pill warranty-pill"><i class="fa-solid fa-shield-halved"></i> ${escapeHTML(warrantyTxt)}</span>
      </div>

      <p class="card-desc">${escapeHTML(normalizeDigits(prod.shortDesc))}</p>

      <div class="card-footer-row">
        <div class="price-col">
          ${prod.oldPrice > prod.price ? `<span class="price-was">${formatEGP(prod.oldPrice)}</span>` : ''}
          <span class="price-now">${Number(prod.price).toLocaleString('en-US')} <small>ج.م</small></span>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="btn-outline" style="padding:9px 11px; border-radius:11px; font-size:0.8rem;" onclick="openProductPage('${prod.id}')" title="صفحة تفاصيل المنتج">
            التفاصيل
          </button>
          <button class="btn-card-add" onclick="addToCartWithAnimation('${prod.id}', event)" ${isProductAvailable(prod) ? '' : 'disabled style="opacity:0.55; cursor:not-allowed;" title="غير متوفر حالياً"'}>
            ${isProductAvailable(prod) ? '<i class="fa-solid fa-plus"></i> للسلة' : 'نفذت الكمية'}
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderCatalogGrid() {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('catalogCountText');
  if (!grid) return;

  const list = getFilteredProducts();
  const filterSignature = `${state.activeCategory}|${state.searchQuery}`;
  if (filterSignature !== renderCatalogGrid.lastFilterSignature) {
    renderCatalogGrid.lastFilterSignature = filterSignature;
    state.visibleCount = CATALOG_PAGE_SIZE;
  }
  if (countEl) {
    const activeCatObj = (state.categories || []).find(c => c.id === state.activeCategory);
    const activeCatLabel = activeCatObj ? (activeCatObj.navTitle || activeCatObj.name) : '';
    const hasFilter = (state.activeCategory && state.activeCategory !== 'all') || !!state.searchQuery;
    const filterInfo = hasFilter
      ? ` <span style="color:var(--brand-dark); font-size:0.84rem;">(${activeCatLabel ? escapeHTML(activeCatLabel) : 'الكل'}${state.searchQuery ? ' • ' + escapeHTML(state.searchQuery) : ''})</span> <button type="button" onclick="resetCatalogFilters()" style="margin-right:8px; background:var(--brand-soft); border:1px solid var(--brand-tint); color:var(--brand-dark); padding:3px 10px; border-radius:99px; font-family:inherit; font-size:0.76rem; font-weight:800; cursor:pointer;"><i class="fa-solid fa-rotate-left"></i> عرض كل المنتجات</button>`
      : '';
    countEl.innerHTML = `إجمالي المعروض: ${list.length} جهاز${filterInfo}`;
  }

  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1; text-align:center; padding:60px 20px; background:var(--bg-white); border-radius:20px; border:1.5px solid var(--border);">
        <i class="fa-solid fa-magnifying-glass" style="font-size:2.4rem; color:var(--brand); margin-bottom:12px;"></i>
        <h3>لم يتم العثور على نتائج مطابقة${state.searchQuery ? ` لـ "${escapeHTML(state.searchQuery)}"` : ''}</h3>
        <p style="color:var(--text-muted); margin:6px 0 18px;">جرب كتابة كلمة مثل: قلايه، ميكر، فرن، خلاط، كبه، أو عرض جميع المنتجات.</p>
        <button class="btn-brand" onclick="resetCatalogFilters()">عرض جميع المنتجات</button>
      </div>
    `;
    return;
  }

  grid.innerHTML = list.slice(0, state.visibleCount).map((prod, idx) => buildProductCardHTML(prod, idx)).join('');
  observeNewElements();
  renderLoadMoreButton(list.length);
}

function renderLoadMoreButton(totalCount) {
  let holder = document.getElementById('loadMoreHolder');
  if (!holder) {
    holder = document.createElement('div');
    holder.id = 'loadMoreHolder';
    holder.style.cssText = 'grid-column:1/-1; text-align:center; padding:8px 0 24px;';
    const grid = document.getElementById('productsGrid');
    if (grid) grid.after(holder);
  }
  if (totalCount > state.visibleCount) {
    const remaining = totalCount - state.visibleCount;
    holder.innerHTML = `<button class="btn-brand" type="button" onclick="loadMoreProducts()">تحميل المزيد (${remaining} منتج متبقي)</button>`;
  } else {
    holder.innerHTML = '';
  }
}

window.loadMoreProducts = function() {
  state.visibleCount += CATALOG_PAGE_SIZE;
  renderCatalogGrid();
};

function renderCatalogSkeleton() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;
  const card = `
    <div class="product-card-skeleton" aria-hidden="true" style="background:var(--bg-white); border-radius:20px; border:1.5px solid var(--border); padding:16px;">
      <div style="width:100%; aspect-ratio:1; border-radius:14px; background:linear-gradient(90deg,#eceff3 25%,#f6f8fa 50%,#eceff3 75%); background-size:200% 100%; animation:diamondSkeletonShimmer 1.3s infinite;"></div>
      <div style="height:14px; width:70%; margin:14px 0 8px; border-radius:7px; background:linear-gradient(90deg,#eceff3 25%,#f6f8fa 50%,#eceff3 75%); background-size:200% 100%; animation:diamondSkeletonShimmer 1.3s infinite;"></div>
      <div style="height:12px; width:45%; margin:0 0 12px; border-radius:6px; background:linear-gradient(90deg,#eceff3 25%,#f6f8fa 50%,#eceff3 75%); background-size:200% 100%; animation:diamondSkeletonShimmer 1.3s infinite;"></div>
      <div style="height:30px; width:100%; border-radius:10px; background:linear-gradient(90deg,#eceff3 25%,#f6f8fa 50%,#eceff3 75%); background-size:200% 100%; animation:diamondSkeletonShimmer 1.3s infinite;"></div>
    </div>`;
  grid.innerHTML = Array.from({ length: CATALOG_PAGE_SIZE }, () => card).join('');
}

window.resetCatalogFilters = function() {
  state.activeCategory = 'all';
  state.searchQuery = '';
  state.maxPrice = state.priceCeiling;
  const s1 = document.getElementById('catalogSearchInput');
  const s2 = document.getElementById('headerSearchInput');
  if (s1) s1.value = '';
  if (s2) s2.value = '';
  syncPriceSliderBounds();
  closeLiveSearchDropdown();
  renderCategoriesGrid();
  renderCatalogGrid();
};

// ==================== INSTANT LIVE SEARCH DROPDOWN ====================
function renderLiveSearchDropdown(rawQuery) {
  const dropdown = document.getElementById('headerLiveSearchDropdown');
  if (!dropdown) return;

  const q = (rawQuery || '').trim();
  if (!q) {
    dropdown.classList.remove('open');
    dropdown.innerHTML = '';
    return;
  }

  // Search across ALL products regardless of active category so user always finds what they type
  const matched = state.products.filter(p => smartProductSearchMatch(p, q));

  if (matched.length === 0) {
    dropdown.innerHTML = `
      <div style="padding:18px; text-align:center; color:var(--text-muted); font-size:0.86rem;">
        لا توجد أجهزة مطابقة لـ "<strong>${escapeHTML(q)}</strong>" — جرب كتابة: قلايه، ميكر، فرن، خلاط، مكواه
      </div>
    `;
    dropdown.classList.add('open');
    return;
  }

  dropdown.innerHTML = `
    <div class="search-live-header">
      <span>نتائج البحث الذكي (${matched.length} جهاز)</span>
      <span style="color:var(--brand-dark);">شحن مجاني + ضمان سنة</span>
    </div>
    ${matched.slice(0, 8).map(p => `
      <a href="product.html?id=${encodeURIComponent(p.id)}" class="search-live-item">
        <img ${getSafeImageAttr(p)} />
        <div class="search-live-info">
          <div class="search-live-title">${escapeHTML(p.name)}</div>
          <div class="search-live-meta">
            <span class="sku-tag" style="font-size:0.68rem;">${escapeHTML(p.model)}</span>
            <span>${escapeHTML(p.categoryLabel)}</span>
            <span>• ${escapeHTML(p.wattage)}</span>
          </div>
        </div>
        <div class="search-live-price">${formatEGP(p.price)}</div>
      </a>
    `).join('')}
  `;
  dropdown.classList.add('open');
}

function closeLiveSearchDropdown() {
  const dropdown = document.getElementById('headerLiveSearchDropdown');
  if (dropdown) dropdown.classList.remove('open');
}

window.focusMobileSearch = function() {
  const input = document.getElementById('headerSearchInput');
  if (input) {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => input.focus(), 300);
  }
};

// ==================== PRODUCT VIDEO EMBED & SHOWCASE ENGINE ====================
function parseVideoEmbedInfo(rawUrl) {
  const url = String(rawUrl || '').trim();
  if (!url) return null;

  // 0. Admin-uploaded video stored in IndexedDB (idb://video_...)
  if (url.startsWith('idb://')) {
    return { type: 'idb-video', videoKey: url };
  }

  // 1. Direct video file (.mp4, .webm, .ogg, .mov) or Data URL (data:video/...)
  if (/^(data:video\/|.*\.(mp4|webm|ogg|mov)(\?.*)?$)/i.test(url)) {
    return { type: 'video', src: url };
  }

  // 2. YouTube (watch?v=, youtu.be/, youtube.com/shorts/, youtube.com/embed/)
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,15})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'iframe',
      src: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`,
      externalUrl: url,
      platform: 'YouTube'
    };
  }

  // 3. Facebook video / Reel
  if (/facebook\.com|fb\.watch/i.test(url)) {
    return {
      type: 'iframe',
      src: `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false`,
      externalUrl: url,
      platform: 'Facebook'
    };
  }

  // 4. Generic embeddable URL or external link
  return {
    type: 'iframe',
    src: url,
    externalUrl: url,
    platform: 'الفيديو'
  };
}

function buildProductVideoTabHTML(product) {
  const embed = parseVideoEmbedInfo(product.videoUrl);
  const warrantyTxt = product.warranty || state.settings.warrantyText || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة';
  const gallery = Array.isArray(product.gallery) && product.gallery.length ? product.gallery : [product.image];

  if (embed) {
    let playerHTML = '';
    if (embed.type === 'idb-video') {
      playerHTML = `
        <video id="pdpIdbVideoPlayer"
               data-idb-key="${escapeHTML(embed.videoKey)}"
               class="pdp-video-native"
               controls
               playsinline
               preload="metadata"
               poster="${escapeHTML(product.image || 'assets/products/hero-showcase.jpg')}">
          متصفحك لا يدعم تشغيل الفيديو المباشر.
        </video>
      `;
    } else if (embed.type === 'video') {
      playerHTML = `
        <video class="pdp-video-native" controls playsinline preload="metadata" poster="${escapeHTML(product.image || 'assets/products/hero-showcase.jpg')}">
          <source src="${escapeHTML(embed.src)}" />
          متصفحك لا يدعم تشغيل الفيديو المباشر.
        </video>
      `;
    } else {
      playerHTML = `
        <iframe class="pdp-video-iframe"
                src="${escapeHTML(embed.src)}"
                title="${escapeHTML(product.name)}"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen></iframe>
      `;
    }

    return `
      <div class="pdp-video-showcase">
        <div class="pdp-video-header">
          <div>
            <span class="section-kicker"><i class="fa-solid fa-circle-play"></i> فيديو توضيحي رسمي للجهاز</span>
            <h3 style="font-size:1.2rem; font-weight:900; margin-top:4px;">شاهد ${escapeHTML(normalizeDigits(product.name))} على الطبيعة</h3>
          </div>
          ${embed.externalUrl ? `
            <a href="${escapeHTML(embed.externalUrl)}" target="_blank" rel="noopener noreferrer" class="btn-outline" style="padding:8px 16px; font-size:0.84rem;">
              <i class="fa-solid fa-up-right-from-square"></i> فتح الفيديو في نافذة مستقلة
            </a>
          ` : ''}
        </div>

        <div class="pdp-video-frame">
          ${playerHTML}
        </div>

        <div class="pdp-video-footer-bar">
          <div>
            <strong><i class="fa-solid fa-shield-halved" style="color:var(--brand-dark);"></i> ${escapeHTML(warrantyTxt)}</strong>
            <span> • مع إمكانية معاينة وتجربة الجهاز عند الاستلام قبل الدفع</span>
          </div>
          <button type="button" class="btn-brand" style="padding:10px 20px; font-size:0.86rem;" onclick="addPdpProductToCart('${escapeHTML(product.id)}', true)">
            <i class="fa-solid fa-bolt"></i> اطلب الجهاز الآن بشحن مجاني
          </button>
        </div>
      </div>
    `;
  }

  // Admin-managed studio preview when the admin has not uploaded a video for this specific product yet
  return `
    <div class="pdp-video-showcase">
      <div class="pdp-video-header">
        <div>
          <span class="section-kicker"><i class="fa-solid fa-circle-play"></i> الفيديو التوضيحي للمنتج</span>
          <h3 style="font-size:1.2rem; font-weight:900; margin-top:4px;">استعراض موديل ${escapeHTML(normalizeDigits(product.model))}</h3>
        </div>
        <span class="card-badge" style="padding:6px 14px; font-size:0.8rem;">
          <i class="fa-solid fa-video"></i> يُرفع بواسطة إدارة المتجر
        </span>
      </div>

      <div class="pdp-video-interactive-stage">
        <div class="pdp-video-preview-col">
          <div class="pdp-video-sim-screen">
            <span class="pdp-video-live-badge"><i class="fa-solid fa-circle-play"></i> استوديو العرض الرسمي</span>
            <img src="${escapeHTML(gallery[0] || product.image)}" alt="${escapeHTML(product.name)}" loading="lazy" decoding="async" width="600" height="600" onerror="this.onerror=null;this.src='assets/products/hero-showcase.jpg'" />
            <div class="pdp-video-caption-bar">
              <span>${escapeHTML(normalizeDigits(product.model))} • ${escapeHTML(normalizeDigits(product.wattage))}</span>
              <strong>${formatEGP(product.price)}</strong>
            </div>
          </div>
        </div>

        <div class="pdp-video-steps-col">
          <h4><i class="fa-solid fa-clapperboard" style="color:var(--brand-dark);"></i> أبرز تفاصيل ومواصفات الجهاز:</h4>
          <ul class="pdp-video-check-list">
            <li>
              <span class="step-num">1</span>
              <div>
                <strong>القوة الفعلية وجودة الخامات</strong>
                <p>يأتي الجهاز بقدرة فعلية ${escapeHTML(normalizeDigits(product.wattage))} وسعة ${escapeHTML(normalizeDigits(product.capacity))} بخامات أصلية تتحمل التشغيل اليومي الشاق.</p>
              </div>
            </li>
            <li>
              <span class="step-num">2</span>
              <div>
                <strong>محتويات الكرتونة الأصلية بالكامل</strong>
                <p>يصل الجهاز في كرتونة المصنع الأصلية مرفقاً بكافة الملحقات وكتالوج التشغيل وشهادة الضمان المعتمدة.</p>
              </div>
            </li>
            <li>
              <span class="step-num">3</span>
              <div>
                <strong>${escapeHTML(warrantyTxt)}</strong>
                <p>مع حق العميل في فتح الكرتونة ومعاينة الجهاز على الطبيعة عند الاستلام قبل الدفع.</p>
              </div>
            </li>
          </ul>

          <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:14px;">
            <button type="button" class="btn-brand" style="padding:11px 22px; font-size:0.88rem;" onclick="addPdpProductToCart('${escapeHTML(product.id)}', true)">
              <i class="fa-solid fa-bolt"></i> اطلب الجهاز الآن بشحن مجاني
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function hydratePdpIdbVideo() {
  const videoEl = document.getElementById('pdpIdbVideoPlayer');
  if (!videoEl || typeof getAdminVideoBlob !== 'function') return;
  const key = videoEl.getAttribute('data-idb-key');
  if (!key) return;
  const blob = await getAdminVideoBlob(key);
  if (blob) {
    videoEl.src = URL.createObjectURL(blob);
  }
}

// ==================== DEDICATED PRODUCT DETAILS PAGE (product.html) ====================
function initProductDetailsPage() {
  const root = document.getElementById('productDetailPageRoot');
  if (!root) return;

  const params = new URLSearchParams(window.location.search);
  const prodId = params.get('id');
  const product = prodId
    ? state.products.find(p => p.id === prodId)
    : state.products[0];

  if (!product) {
    root.innerHTML = `<div style="padding:60px; text-align:center;"><h3 style="margin-bottom:16px;">المنتج غير موجود أو تم حذفه من المتجر</h3><a href="index.html" class="btn-brand">العودة للرئيسية</a></div>`;
    const relGrid = document.getElementById('relatedProductsGrid');
    if (relGrid) relGrid.innerHTML = '';
    return;
  }
  const available = isProductAvailable(product);
  const storeName = state.settings?.storeName || 'Diamond Store';
  const warrantyTxt = product.warranty || state.settings?.warrantyText || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة';

  state.pdpQty = 1;
  document.title = `${normalizeDigits(product.name)} | ${storeName}`;

  // Update Breadcrumb
  const bcCat = document.getElementById('bcCategoryLink');
  const bcName = document.getElementById('bcProductName');
  if (bcCat) {
    bcCat.textContent = product.categoryLabel;
    bcCat.href = `category.html?cat=${encodeURIComponent(product.category)}`;
  }
  if (bcName) bcName.textContent = normalizeDigits(product.name);

  // Highlight active category in navbar
  document.querySelectorAll('#headerCatNav a.cat-nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('data-cat') === product.category);
  });

  // Build Gallery images array
  const galleryImages = Array.isArray(product.gallery) && product.gallery.length > 0
    ? product.gallery
    : [product.image, product.fallbackImage || 'assets/products/hero-showcase.jpg'].filter(Boolean);

  const discountPct = product.oldPrice > product.price
    ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100)
    : 0;
  const savedAmount = product.oldPrice > product.price ? product.oldPrice - product.price : 0;
  const isWish = state.wishlist.includes(product.id);

  const featuresListHTML = (product.features || []).map(f => `
    <li><i class="fa-solid fa-circle-check"></i> <span>${escapeHTML(normalizeDigits(f))}</span></li>
  `).join('');

  const specsRowsHTML = Object.entries(product.specs || {
    'الموديل': product.model,
    'القدرة الكهربائية': product.wattage,
    'السعة / الغيارات': product.capacity,
    'الضمان': warrantyTxt,
    'الشحن': 'شحن مجاني لجميع المحافظات'
  }).map(([k, v]) => `
    <tr>
      <td>${escapeHTML(k)}</td>
      <td style="font-weight:700; color:var(--text-dark);">${escapeHTML(normalizeDigits(k === 'الضمان' ? warrantyTxt : v))}</td>
    </tr>
  `).join('');

  // Load saved customer reviews or default realistic Egyptian colloquial reviews
  const storedReviews = readJSONStorage(`diamond_reviews_${product.id}`, null);
  const savedReviews = (Array.isArray(storedReviews) && storedReviews.length) ? storedReviews : [
    {
      author: 'أحمد محمود — القاهرة',
      rating: 5,
      date: 'منذ 3 أيام',
      comment: 'الجهاز بجد تحفة وخامته أصلية وتقيلة جداً، وصلني في أقل من 24 ساعة والشحن فعلاً مجاني ومعاه ضمان معتمد رسمي من شركة المغربي لمدة سنة.'
    },
    {
      author: 'مريم عادل — الإسكندرية',
      rating: 5,
      date: 'منذ أسبوع',
      comment: `تجربة شراء ممتازة من ${storeName}، الموديل نفس المواصفات والصور بالظبط وأداؤه قوي وسريع جداً في الاستخدام اليومي.`
    },
    {
      author: 'محمد سعيد — المنصورة',
      rating: 5,
      date: 'منذ أسبوعين',
      comment: 'ناس ذوق ومحترمين جداً في التعامل وخلوني أفتح الكرتونة وأعاين الجهاز بنفسي عند الاستلام قبل ما أدفع. ربنا يباركلكم.'
    }
  ];

  root.innerHTML = `
    <div class="pdp-main-card">
      <div class="pdp-grid">
        <!-- Right Column: Studio Image Gallery -->
        <div class="pdp-gallery-sticky">
          <div class="pdp-main-img-stage" id="pdpMainImgStage">
            <img id="img-${product.id}" src="${escapeHTML(galleryImages[0])}" alt="${escapeHTML(product.name)}" width="600" height="600" onerror="this.onerror=null;this.src='assets/products/hero-showcase.jpg'" />
            <span class="pdp-zoom-hint"><i class="fa-solid fa-magnifying-glass-plus"></i> حرّك الماوس للتكبير</span>
          </div>

          <div class="pdp-thumbs-row" id="pdpThumbsRow">
            ${galleryImages.map((imgUrl, idx) => `
              <button type="button" class="pdp-thumb-btn ${idx === 0 ? 'active' : ''}" data-img="${escapeHTML(imgUrl)}" onclick="switchPdpGalleryImage('${product.id}', this.dataset.img, this)">
                <img src="${escapeHTML(imgUrl)}" alt="${escapeHTML(product.name)}" onerror="this.onerror=null;this.src='assets/products/hero-showcase.jpg'" />
              </button>
            `).join('')}
            <button type="button" class="pdp-thumb-btn pdp-video-thumb-shortcut" onclick="openPdpVideoTab()" title="مشاهدة فيديو توضيحي للمنتج">
              <i class="fa-solid fa-circle-play"></i>
              <span>فيديو</span>
            </button>
          </div>
        </div>

        <!-- Left Column: Product Information & Purchase Controls -->
        <div class="pdp-info-col">
          <div class="pdp-badges-top">
            <span class="sku-tag" style="font-size:0.86rem; padding:4px 12px;">موديل: ${escapeHTML(normalizeDigits(product.model))}</span>
            <span class="card-badge">${escapeHTML(normalizeDigits(product.badge || product.categoryLabel))}</span>
            <span class="card-badge" style="${available ? 'background:#e8f5e9; color:#1b5e20; border-color:#c8e6c9;' : 'background:#ffebee; color:#b71c1c; border-color:#ffcdd2;'}">
              <i class="fa-solid ${available ? 'fa-circle-check' : 'fa-circle-xmark'}"></i> ${available ? 'متوفر في المخزن — جاهز للشحن الفوري' : 'غير متوفر حالياً'}
            </span>
          </div>

          <h1 class="pdp-title">${escapeHTML(normalizeDigits(product.name))}</h1>

          <div class="pdp-rating-row">
            <div class="pdp-stars">
              <i class="fa-solid fa-star"></i>
              <i class="fa-solid fa-star"></i>
              <i class="fa-solid fa-star"></i>
              <i class="fa-solid fa-star"></i>
              <i class="fa-solid fa-star"></i>
              <span style="color:var(--text-dark); margin-right:6px;">${Number(product.rating) || 4.9}</span>
            </div>
            <span style="color:var(--text-muted);">(${Number(product.reviewsCount) || 180} تقييم من عملاء اشتروا المنتج)</span>
            <span style="color:var(--brand-dark); font-weight:800;"><i class="fa-solid fa-bolt"></i> القدرة: ${escapeHTML(normalizeDigits(product.wattage))}</span>
          </div>

          <!-- Price Box -->
          <div class="pdp-price-box">
            <div>
              <div style="font-size:0.84rem; font-weight:800; color:var(--text-muted); margin-bottom:4px;">سعر العرض شامل الضريبة والشحن:</div>
              <div style="display:flex; align-items:baseline; gap:12px; flex-wrap:wrap;">
                <span class="pdp-price-current">${Number(product.price).toLocaleString('en-US')} <small>ج.م</small></span>
                ${product.oldPrice > product.price ? `<span class="pdp-price-old">${formatEGP(product.oldPrice)}</span>` : ''}
              </div>
            </div>
            ${discountPct > 0 ? `<div class="pdp-save-badge">وفر ${formatEGP(savedAmount)} (${discountPct}%)</div>` : ''}
          </div>

          <!-- Mandatory Trust Banners: Free Shipping + Official El-Maghraby 1 Year Warranty -->
          <div class="pdp-trust-banners">
            <div class="pdp-trust-card highlight">
              <div class="pdp-trust-icon"><i class="fa-solid fa-truck-fast"></i></div>
              <div>
                <strong>شحن مجاني لجميع المحافظات</strong>
                <span>توصيل سريع لباب المنزل خلال 24 - 48 ساعة مجاناً</span>
              </div>
            </div>

            <div class="pdp-trust-card highlight">
              <div class="pdp-trust-icon"><i class="fa-solid fa-shield-halved"></i></div>
              <div>
                <strong>${escapeHTML(warrantyTxt)}</strong>
                <span>ضمان معتمد رسمي لمدة عام ضد عيوب الصناعة</span>
              </div>
            </div>

            <div class="pdp-trust-card">
              <div class="pdp-trust-icon" style="background:var(--text-dark);"><i class="fa-solid fa-hand-holding-dollar"></i></div>
              <div>
                <strong>الدفع عند الاستلام</strong>
                <span>معاينة وفحص الجهاز قبل الدفع نقداً أو إنستا باي</span>
              </div>
            </div>

            <div class="pdp-trust-card">
              <div class="pdp-trust-icon" style="background:var(--text-dark);"><i class="fa-solid fa-award"></i></div>
              <div>
                <strong>منتج سوكاني SOKANY أصلي</strong>
                <span>مكونات قياسية عالية الجودة بكتالوج المصنع</span>
              </div>
            </div>
          </div>

          <p style="font-size:0.96rem; color:var(--text-body); margin-bottom:20px; line-height:1.75;">
            ${escapeHTML(normalizeDigits(product.shortDesc))}
          </p>

          <!-- Key Features Summary -->
          ${featuresListHTML ? `
            <div class="pdp-highlights-box">
              <h4><i class="fa-solid fa-star" style="color:var(--brand);"></i> أبرز مميزات ومواصفات الجهاز:</h4>
              <ul class="pdp-feature-list">${featuresListHTML}</ul>
            </div>
          ` : ''}

          <!-- Upgraded Purchase Action Module -->
          <div class="pdp-purchase-box">
            <div class="pdp-purchase-top-row">
              <div class="pdp-qty-wrap">
                <span class="pdp-qty-label">الكمية المطلوبة:</span>
                <div class="pdp-qty-selector">
                  <button type="button" onclick="changePdpQty(-1)" aria-label="تقليل الكمية">-</button>
                  <span id="pdpQtyVal">1</span>
                  <button type="button" onclick="changePdpQty(1)" aria-label="زيادة الكمية">+</button>
                </div>
                <span class="pdp-qty-subtotal" id="pdpQtySubtotal" data-unit-price="${Number(product.price)}">
                  الإجمالي: ${formatEGP(product.price)}
                </span>
              </div>

              <div class="pdp-aux-btns">
                <button type="button" class="pdp-aux-pill ${isWish ? 'active' : ''}" id="pdpWishBtn" onclick="toggleWishlist('${product.id}')" title="إضافة للمفضلة">
                  <i class="fa-regular fa-heart"></i>
                  <span>المفضلة</span>
                </button>
                <button type="button" class="pdp-aux-pill ${state.compare.includes(product.id) ? 'active' : ''}" id="pdpCompareBtn" onclick="toggleCompareProduct('${product.id}')" title="إضافة للمقارنة">
                  <i class="fa-solid fa-scale-balanced"></i>
                  <span>قارن</span>
                </button>
              </div>
            </div>

            <div class="pdp-cta-grid">
              <button type="button" class="pdp-btn-add-cart" id="pdpAddCartBtn" ${available ? '' : 'disabled style="opacity:0.55; cursor:not-allowed;"'} onclick="addPdpProductToCart('${product.id}', false)">
                <i class="fa-solid fa-bag-shopping"></i>
                <span id="pdpAddCartBtnTxt">${available ? 'إضافة إلى السلة' : 'غير متوفر حالياً'}</span>
              </button>

              <button type="button" class="pdp-btn-buy-now" ${available ? '' : 'disabled style="opacity:0.55; cursor:not-allowed;"'} onclick="addPdpProductToCart('${product.id}', true)">
                <i class="fa-solid fa-bolt"></i>
                <span>اطلب الآن (شحن مجاني)</span>
              </button>
            </div>

            <button type="button" class="pdp-whatsapp-btn" onclick="orderDirectWhatsApp('${product.id}')">
              <i class="fa-brands fa-whatsapp" style="font-size:1.25rem; color:#16a34a;"></i>
              <span>طلب سريع عبر واتساب (شحن مجاني + ${escapeHTML(warrantyTxt)})</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Detailed Information Tabs (Features / Technical Specs / Shipping & Warranty / Reviews / Product Video) -->
    <div class="pdp-tabs-card" id="pdpTabsCard">
      <div class="pdp-tabs-header">
        <button type="button" class="pdp-tab-btn active" onclick="switchPdpTab('tab-specs', this)">
          <i class="fa-solid fa-sliders"></i> المواصفات الفنية الكاملة
        </button>
        <button type="button" class="pdp-tab-btn" onclick="switchPdpTab('tab-features', this)">
          <i class="fa-solid fa-list-check"></i> مميزات وتفاصيل التشغيل
        </button>
        <button type="button" class="pdp-tab-btn" onclick="switchPdpTab('tab-warranty', this)">
          <i class="fa-solid fa-shield-halved"></i> الضمان والشحن المجاني
        </button>
        <button type="button" class="pdp-tab-btn" onclick="switchPdpTab('tab-reviews', this)">
          <i class="fa-solid fa-comments"></i> تقييمات العملاء (${savedReviews.length})
        </button>
        <button type="button" class="pdp-tab-btn pdp-video-tab-btn" id="pdpVideoTabBtn" onclick="switchPdpTab('tab-video', this)">
          <i class="fa-solid fa-circle-play"></i> فيديو توضيحي للمنتج
          ${product.videoUrl ? '<span class="video-live-dot"></span>' : ''}
        </button>
      </div>

      <div class="pdp-tab-panel active" id="tab-specs">
        <h3 style="font-size:1.15rem; font-weight:900; margin-bottom:14px;">الجدول الفني لموديل ${escapeHTML(normalizeDigits(product.model))}</h3>
        <table class="clean-table" style="font-size:0.94rem;">
          <tbody>${specsRowsHTML}</tbody>
        </table>
      </div>

      <div class="pdp-tab-panel" id="tab-features">
        <h3 style="font-size:1.15rem; font-weight:900; margin-bottom:14px;">لماذا تختار ${escapeHTML(normalizeDigits(product.name))}؟</h3>
        <p style="margin-bottom:16px; color:var(--text-body);">${escapeHTML(normalizeDigits(product.shortDesc))}</p>
        <ul class="pdp-feature-list" style="font-size:0.96rem; gap:12px;">
          ${featuresListHTML}
          <li><i class="fa-solid fa-circle-check"></i> <span>تصميم عصري متين يتحمل الاستخدام اليومي المكثف في المطبخ والمنزل.</span></li>
          <li><i class="fa-solid fa-circle-check"></i> <span>يأتي في العبوة الأصلية الكاملة مع دليل الاستخدام وشهادة ${escapeHTML(warrantyTxt)}.</span></li>
        </ul>
      </div>

      <div class="pdp-tab-panel" id="tab-warranty">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:20px;">
          <div style="background:var(--brand-soft); border:1.5px solid var(--brand-tint); border-radius:16px; padding:20px;">
            <h4 style="color:var(--brand-dark); font-size:1.05rem; margin-bottom:8px;"><i class="fa-solid fa-truck-fast"></i> سياسة الشحن المجاني لجميع المحافظات</h4>
            <p style="font-size:0.9rem; color:var(--text-body);">
              يقدم متجر <strong>${escapeHTML(storeName)}</strong> شحناً مجانياً تماماً (0 ج.م مصاريف شحن) لجميع محافظات مصر (القاهرة، الجيزة، الإسكندرية، الدلتا، القناة، والصعيد) خلال 24 إلى 48 ساعة عمل لباب المنزل.
            </p>
          </div>
          <div style="background:var(--bg-page); border:1.5px solid var(--border); border-radius:16px; padding:20px;">
            <h4 style="color:var(--text-dark); font-size:1.05rem; margin-bottom:8px;"><i class="fa-solid fa-shield-halved" style="color:var(--brand);"></i> ${escapeHTML(warrantyTxt)}</h4>
            <p style="font-size:0.9rem; color:var(--text-body);">
              جميع أجهزة سوكاني مشمولة بـ <strong>${escapeHTML(warrantyTxt)}</strong> من تاريخ الاستلام ضد أي عيوب صناعة، مع إمكانية معاينة وتجربة الطلب عند الاستلام.
            </p>
          </div>
        </div>
      </div>

      <div class="pdp-tab-panel" id="tab-reviews">
        <div class="reviews-grid" style="margin-bottom:24px;">
          ${savedReviews.map(r => `
            <div class="review-card">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                <strong style="font-size:0.92rem;">${escapeHTML(r.author)}</strong>
                <span style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(normalizeDigits(r.date))}</span>
              </div>
              <div style="color:#f59e0b; font-size:0.82rem; margin-bottom:8px;">
                ${'<i class="fa-solid fa-star"></i>'.repeat(Math.min(5, Math.max(1, Number(r.rating) || 5)))}
              </div>
              <p style="font-size:0.86rem; color:var(--text-body);">${escapeHTML(normalizeDigits(r.comment))}</p>
            </div>
          `).join('')}
        </div>

        <form onsubmit="submitProductReview(event, '${product.id}')" style="background:var(--bg-page); padding:20px; border-radius:16px; border:1px solid var(--border);">
          <h4 style="margin-bottom:12px; font-size:0.98rem;">أضف تقييمك لهذا المنتج</h4>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:12px; margin-bottom:12px;">
            <input type="text" id="revAuthor" required placeholder="الاسم والمحافظة" style="padding:10px 14px; border-radius:10px; border:1px solid var(--border); font-family:inherit;" />
            <select id="revStars" class="clean-select">
              <option value="5">5 نجوم — ممتاز جداً</option>
              <option value="4">4 نجوم — جيد جداً</option>
            </select>
          </div>
          <textarea id="revComment" required rows="2" placeholder="اكتب رأيك في الجهاز..." style="width:100%; padding:10px 14px; border-radius:10px; border:1px solid var(--border); font-family:inherit; margin-bottom:10px;"></textarea>
          <button type="submit" class="btn-brand" style="padding:10px 20px; font-size:0.86rem;">نشر التقييم</button>
        </form>
      </div>

      <div class="pdp-tab-panel" id="tab-video">
        ${buildProductVideoTabHTML(product)}
      </div>
    </div>
  `;

  // Render Related Products Section (منتجات ذات صلة)
  renderRelatedProducts(product);
  bindPdpZoomLens();
  renderPdpStickyBuyBar(product);
  hydratePdpIdbVideo();
}

window.openPdpVideoTab = function() {
  const btn = document.getElementById('pdpVideoTabBtn');
  if (btn) {
    switchPdpTab('tab-video', btn);
    document.getElementById('pdpTabsCard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

function bindPdpZoomLens() {
  const stage = document.getElementById('pdpMainImgStage');
  if (!stage || !window.matchMedia('(min-width: 992px)').matches) return;
  const img = stage.querySelector('img');
  if (!img) return;

  stage.addEventListener('mousemove', (e) => {
    const r = stage.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    stage.classList.add('is-zooming');
    img.style.transformOrigin = `${x.toFixed(1)}% ${y.toFixed(1)}%`;
  });

  stage.addEventListener('mouseleave', () => {
    stage.classList.remove('is-zooming');
    img.style.transformOrigin = 'center center';
  });
}

function renderPdpStickyBuyBar(product) {
  const bar = document.getElementById('pdpStickyBuyBar');
  if (!bar || !product) return;
  const available = isProductAvailable(product);
  bar.innerHTML = `
    <div class="container pdp-sticky-inner">
      <div style="display:flex; align-items:center; gap:12px; min-width:0;">
        <img ${getSafeImageAttr(product)} style="width:46px; height:46px; object-fit:contain; border-radius:10px; border:1px solid var(--border); background:#fff; padding:3px;" />
        <div style="min-width:0;">
          <div style="font-size:0.88rem; font-weight:900; color:var(--text-dark); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHTML(product.name)}</div>
          <div style="font-size:0.78rem; color:var(--brand-dark); font-weight:800;">${formatEGP(product.price)} • شحن مجاني + ضمان سنة</div>
        </div>
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <button type="button" class="btn-brand" style="padding:10px 20px; font-size:0.86rem; ${available ? '' : 'opacity:0.55; cursor:not-allowed;'}" ${available ? '' : 'disabled'} onclick="addPdpProductToCart('${product.id}', false)">
          <i class="fa-solid fa-bag-shopping"></i> <span>${available ? 'أضف للسلة' : 'غير متوفر'}</span>
        </button>
        <button type="button" class="btn-brand" style="background:var(--text-dark); padding:10px 18px; font-size:0.86rem; ${available ? '' : 'opacity:0.55; cursor:not-allowed;'}" ${available ? '' : 'disabled'} onclick="addPdpProductToCart('${product.id}', true)">
          <i class="fa-solid fa-bolt"></i> <span>اطلب الآن</span>
        </button>
      </div>
    </div>
  `;
}

window.switchPdpGalleryImage = function(productId, imgUrl, btnEl) {
  const mainImg = document.getElementById(`img-${productId}`);
  if (mainImg && mainImg.getAttribute('src') !== imgUrl) {
    mainImg.classList.add('img-switching');
    setTimeout(() => {
      mainImg.src = imgUrl;
      requestAnimationFrame(() => mainImg.classList.remove('img-switching'));
    }, 150);
  }
  document.querySelectorAll('#pdpThumbsRow .pdp-thumb-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
};

window.changePdpQty = function(delta) {
  state.pdpQty = Math.max(1, state.pdpQty + delta);
  const el = document.getElementById('pdpQtyVal');
  if (el) el.textContent = state.pdpQty;
  const subEl = document.getElementById('pdpQtySubtotal');
  if (subEl) {
    const unit = Number(subEl.getAttribute('data-unit-price') || 0);
    if (unit > 0) subEl.textContent = `الإجمالي: ${formatEGP(unit * state.pdpQty)}`;
  }
};

window.addPdpProductToCart = function(productId, openCheckoutImmediately = false) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;
  if (!isProductAvailable(prod)) {
    showToast('عذراً، هذا المنتج غير متوفر حالياً');
    return;
  }

  const qtyToAdd = Math.max(1, Number(state.pdpQty) || 1);
  const found = state.cart.find(c => c.id === productId);
  if (found) found.qty += qtyToAdd;
  else state.cart.push({ id: prod.id, qty: qtyToAdd });

  localStorage.setItem('diamond_cart', JSON.stringify(state.cart));
  updateCartView();

  if (openCheckoutImmediately) {
    openCheckoutWindow();
  } else {
    addToCartWithAnimation(productId, null, true);
    const btn = document.getElementById('pdpAddCartBtn');
    const txt = document.getElementById('pdpAddCartBtnTxt');
    if (btn && txt) {
      btn.classList.add('added-flash');
      txt.textContent = `تمت إضافة (${qtyToAdd}) للسلة بنجاح ✓`;
      setTimeout(() => {
        btn.classList.remove('added-flash');
        txt.textContent = 'إضافة إلى السلة';
      }, 2000);
    }
    showRichCartToast(prod, qtyToAdd);
    setTimeout(() => {
      openDrawer('cartDrawer');
    }, 620);
  }
};

window.switchPdpTab = function(panelId, btnEl) {
  document.querySelectorAll('.pdp-tab-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll('.pdp-tab-panel').forEach(p => p.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  document.getElementById(panelId)?.classList.add('active');
};

window.submitProductReview = function(e, productId) {
  e.preventDefault();
  const author = document.getElementById('revAuthor').value.trim();
  const rating = Number(document.getElementById('revStars').value || 5);
  const comment = document.getElementById('revComment').value.trim();
  if (!author || !comment) return;

  const key = `diamond_reviews_${productId}`;
  const current = JSON.parse(localStorage.getItem(key) || '[]');
  current.unshift({ author, rating, date: 'الآن', comment });
  localStorage.setItem(key, JSON.stringify(current));
  showToast('شكراً لك! تم إضافة تقييمك بنجاح');
  initProductDetailsPage();
};

function renderRelatedProducts(currentProduct) {
  const relGrid = document.getElementById('relatedProductsGrid');
  if (!relGrid) return;

  // First get products from the same category, then fill up to 4 with top sellers
  const sameCategory = state.products.filter(p => p.category === currentProduct.category && p.id !== currentProduct.id);
  const otherPopular = state.products.filter(p => p.category !== currentProduct.category && p.id !== currentProduct.id);
  const relatedList = [...sameCategory, ...otherPopular].slice(0, 4);

  relGrid.innerHTML = relatedList.map((prod, idx) => buildProductCardHTML(prod, idx)).join('');
  observeNewElements();
}

// ==================== SPECTACULAR 3D PARABOLIC FLY-TO-CART ANIMATION ====================
function spawnCartImpactEffects(targetX, targetY, targetBtn) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // 1. Expanding Shockwave Ring
  const wave = document.createElement('span');
  wave.className = 'cart-impact-shockwave';
  wave.style.left = `${targetX}px`;
  wave.style.top = `${targetY}px`;
  document.body.appendChild(wave);
  setTimeout(() => wave.remove(), 650);

  // 2. Radial Spark Particles (Brand Orange + Gold Palette)
  const palette = ['#E85D04', '#FF7B29', '#C84B00', '#FFB703', '#181512'];
  const sparkCount = 12;
  for (let i = 0; i < sparkCount; i++) {
    const spark = document.createElement('span');
    spark.className = 'cart-spark-particle';
    const angle = (Math.PI * 2 * i) / sparkCount + (Math.random() * 0.25 - 0.12);
    const dist = 28 + Math.random() * 28;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    spark.style.left = `${targetX - 4}px`;
    spark.style.top = `${targetY - 4}px`;
    spark.style.setProperty('--dx', `${dx.toFixed(1)}px`);
    spark.style.setProperty('--dy', `${dy.toFixed(1)}px`);
    spark.style.setProperty('--spark-color', palette[i % palette.length]);
    document.body.appendChild(spark);
    setTimeout(() => spark.remove(), 680);
  }

  // 3. Floating "+1" Celebration Pill
  const plusOne = document.createElement('div');
  plusOne.className = 'cart-plus-one-float';
  plusOne.style.left = `${targetX}px`;
  plusOne.style.top = `${targetY - 12}px`;
  plusOne.innerHTML = `<i class="fa-solid fa-check"></i> +1`;
  document.body.appendChild(plusOne);
  setTimeout(() => plusOne.remove(), 880);

  // 4. Elastic Bounce on Cart Button & Badge Pop
  if (targetBtn) {
    targetBtn.classList.remove('cart-hit-bounce');
    void targetBtn.offsetWidth;
    targetBtn.classList.add('cart-hit-bounce');
    setTimeout(() => targetBtn.classList.remove('cart-hit-bounce'), 600);
  }
  triggerBadgePop('cartCountPill');
  triggerBadgePop('mobCartBadge');
}

function triggerBadgePop(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove('badge-pop');
  void el.offsetWidth;
  el.classList.add('badge-pop');
}

window.addToCartWithAnimation = function(productId, evt, skipCartAdd = false) {
  const prodForAnim = state.products.find(p => p.id === productId);
  if (!skipCartAdd && !isProductAvailable(prodForAnim)) {
    showToast('عذراً، هذا المنتج غير متوفر حالياً');
    return;
  }

  // Visual Button Feedback on the clicked Add-to-Cart Button
  const clickedBtn = evt?.currentTarget || (evt?.target && evt.target.closest ? evt.target.closest('button') : null);
  if (clickedBtn && clickedBtn.classList.contains('btn-card-add') && !clickedBtn.dataset.animating) {
    clickedBtn.dataset.animating = '1';
    const origHTML = clickedBtn.innerHTML;
    clickedBtn.classList.add('is-added');
    clickedBtn.innerHTML = `<i class="fa-solid fa-check"></i> تمت الإضافة`;
    setTimeout(() => {
      clickedBtn.classList.remove('is-added');
      clickedBtn.innerHTML = origHTML;
      delete clickedBtn.dataset.animating;
    }, 1350);
  }

  const cardOrHeroContainer = evt?.target?.closest ? evt.target.closest('.product-card, .hero-showcase') : null;
  const sourceImg =
    (cardOrHeroContainer && cardOrHeroContainer.querySelector('img')) ||
    document.getElementById(`img-${productId}`) ||
    document.getElementById(`hero-img-${productId}`);
  const headerCartBtn = document.getElementById('cartTriggerBtn');
  const mobCartBtn = document.getElementById('mobCartBadge')?.closest('button');
  const cartBtn = (headerCartBtn && headerCartBtn.offsetWidth > 0) ? headerCartBtn : (mobCartBtn || headerCartBtn);

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (sourceImg && cartBtn && !reduceMotion) {
    const srcRect = sourceImg.getBoundingClientRect();
    const destRect = cartBtn.getBoundingClientRect();

    const startX = srcRect.left + srcRect.width / 2;
    const startY = srcRect.top + srcRect.height / 2;
    const endX = destRect.left + destRect.width / 2;
    const endY = destRect.top + destRect.height / 2;

    const clone = document.createElement('img');
    clone.src = sourceImg.src;
    clone.className = 'flying-img-clone';
    clone.style.top = `${startY - 36}px`;
    clone.style.left = `${startX - 36}px`;
    document.body.appendChild(clone);

    const dx = endX - startX;
    const dy = endY - startY;
    const midX = dx * 0.5;
    const arcLift = Math.min(-95, Math.max(-210, dy * 0.45 - 90));

    if (typeof clone.animate === 'function') {
      clone.style.transition = 'none';
      clone.animate([
        { transform: 'translate3d(0, 0, 0) scale(0.9) rotate(0deg)', opacity: 1, offset: 0 },
        { transform: `translate3d(${midX.toFixed(1)}px, ${arcLift.toFixed(1)}px, 0) scale(1.06) rotate(-14deg)`, opacity: 0.96, offset: 0.44 },
        { transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(0.22) rotate(18deg)`, opacity: 0.25, offset: 1 }
      ], {
        duration: 740,
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'forwards'
      });
    } else {
      requestAnimationFrame(() => {
        clone.style.transform = `translate3d(${dx}px, ${dy}px, 0) scale(0.24) rotate(16deg)`;
        clone.style.opacity = '0.2';
      });
    }

    // Spawn 3 subtle glowing trail dots along the parabolic curve
    [140, 280, 420].forEach((ms, idx) => {
      setTimeout(() => {
        const r = clone.getBoundingClientRect();
        if (!r.width) return;
        const dot = document.createElement('span');
        dot.className = 'cart-trail-dot';
        dot.style.left = `${r.left + r.width / 2 - 4}px`;
        dot.style.top = `${r.top + r.height / 2 - 4}px`;
        dot.style.transform = `scale(${1 - idx * 0.2})`;
        document.body.appendChild(dot);
        setTimeout(() => dot.remove(), 480);
      }, ms);
    });

    setTimeout(() => {
      clone.remove();
      spawnCartImpactEffects(endX, endY, cartBtn);
    }, 730);
  } else if (cartBtn) {
    const destRect = cartBtn.getBoundingClientRect();
    spawnCartImpactEffects(destRect.left + destRect.width / 2, destRect.top + destRect.height / 2, cartBtn);
  }

  if (!skipCartAdd) {
    addToCart(productId, true);
  }
};

// ==================== BUNDLE BUILDER (ADMIN-CONTROLLED BRIDE PACKAGE) ====================
const DEFAULT_BUNDLE_POOL = ['sk-10085', 'sk-b907', 'sk-999n', 'sk-10071', 'sk-7027n', 'sk-4007', 'sk-09122'];

function getBundlePoolIds() {
  const configured = state.settings?.bundleProductIds;
  if (Array.isArray(configured) && configured.length > 0) {
    return configured;
  }
  return DEFAULT_BUNDLE_POOL;
}

function getBundleDefaultSelectedIds() {
  const pool = getBundlePoolIds();
  const configured = state.settings?.bundleDefaultSelectedIds;
  if (Array.isArray(configured) && configured.length > 0) {
    const valid = configured.filter(id => pool.includes(id));
    if (valid.length > 0) return valid;
  }
  return pool.slice(0, 3);
}

function getBundleTierPercents() {
  const pick = (val, def) => {
    const n = Number(val);
    return Number.isFinite(n) && val !== '' && val !== null && val !== undefined ? n : def;
  };
  return {
    t2: pick(state.settings.bundleTier2, 10),
    t3: pick(state.settings.bundleTier3, 18),
    t4: pick(state.settings.bundleTier4, 25)
  };
}

function getBundlePercentForCount(count) {
  const { t2, t3, t4 } = getBundleTierPercents();
  if (count >= 4) return t4;
  if (count === 3) return t3;
  if (count === 2) return t2;
  return 0;
}

function isDefaultBrideBundleSelection(selectedIds) {
  const defIds = getBundleDefaultSelectedIds();
  if (!defIds.length || selectedIds.length !== defIds.length) return false;
  const setA = new Set(selectedIds);
  return defIds.every(id => setA.has(id));
}

function calculateBundlePricing(selectedIds) {
  const count = selectedIds.length;
  const raw = selectedIds.reduce((sum, id) => {
    const item = state.products.find(x => x.id === id);
    return sum + (item ? Number(item.price) : 0);
  }, 0);

  const customFixed = Number(state.settings?.bundleCustomFixedPrice) || 0;
  if (customFixed > 0 && customFixed < raw && isDefaultBrideBundleSelection(selectedIds)) {
    const net = Math.round(customFixed);
    const saved = Math.max(0, raw - net);
    const effPct = raw > 0 ? Math.round((saved / raw) * 100) : 0;
    return { raw, net, saved, percent: effPct, isCustomFixed: true };
  }

  const pct = getBundlePercentForCount(count);
  const net = Math.round(raw * (1 - pct / 100));
  const saved = Math.max(0, raw - net);
  return { raw, net, saved, percent: pct, isCustomFixed: false };
}

function renderBundleSection() {
  const secEl = document.getElementById('bundleSection');
  const navPromoBtn = document.getElementById('navBridePromoBtn');
  const wsBrideBtn = document.getElementById('wsBrideTabBtn');
  const isEnabled = state.settings?.bundleEnabled !== false;

  if (secEl) secEl.style.display = isEnabled ? '' : 'none';
  if (navPromoBtn) navPromoBtn.style.display = isEnabled ? '' : 'none';
  if (wsBrideBtn) wsBrideBtn.style.display = isEnabled ? '' : 'none';
  if (!isEnabled) return;

  // Dynamic CMS Texts for Bride Package
  const kickerEl = document.getElementById('bundleSectionKicker');
  const titleEl = document.getElementById('bundleSectionTitle');
  const subEl = document.getElementById('bundleSectionSubtitle');
  if (kickerEl) kickerEl.textContent = state.settings.bundleKicker || 'عروض التجهيز والباكدجات المخصصة';
  if (titleEl) titleEl.textContent = state.settings.bundleTitle || 'كوّن باكدج العروسة واحصل على خصم تصاعدي حتى 25%';
  if (subEl) subEl.textContent = state.settings.bundleSubtitle || 'اختر أجهزتك المفضلة من سوكاني وشاهد التوفير الفوري مع شحن مجاني وضمان سنة كاملة';

  const grid = document.getElementById('bundleItemsGrid');
  if (!grid) return;

  const poolIds = getBundlePoolIds();
  const poolProducts = poolIds
    .map(id => state.products.find(p => p.id === id))
    .filter(p => isProductAvailable(p));
  state.bundleSelected = state.bundleSelected.filter(id => poolProducts.some(p => p.id === id));

  const defIds = getBundleDefaultSelectedIds();

  grid.innerHTML = poolProducts.map(p => {
    const sel = state.bundleSelected.includes(p.id);
    const isBridePick = defIds.includes(p.id);
    return `
      <div class="bundle-select-card ${sel ? 'selected' : ''}" onclick="toggleBundleProduct('${escapeHTML(p.id)}')">
        ${isBridePick ? `<span style="position:absolute; top:8px; right:8px; background:rgba(16,185,129,0.12); color:var(--brand-dark); font-size:0.66rem; font-weight:900; padding:2px 7px; border-radius:99px;"><i class="fa-solid fa-crown"></i> أساسي للعروسة</span>` : ''}
        <img ${getSafeImageAttr(p)} loading="lazy" />
        <div class="sku-tag" style="display:inline-block; margin-bottom:4px;">${escapeHTML(p.model)}</div>
        <h4 style="font-size:0.86rem; font-weight:800; line-height:1.35; margin-bottom:6px;">${escapeHTML(p.name)}</h4>
        <div style="font-weight:900; color:var(--brand-dark); font-size:0.94rem;">${formatEGP(p.price)}</div>
        <div style="margin-top:8px; font-size:0.76rem; font-weight:800; color:${sel ? 'var(--brand-dark)' : 'var(--text-muted)'};">
          <i class="fa-solid ${sel ? 'fa-circle-check' : 'fa-circle-plus'}"></i>
          ${sel ? 'مُختار ضمن الباكدج' : 'إضافة للباكدج'}
        </div>
      </div>
    `;
  }).join('');

  const count = state.bundleSelected.length;
  const tiers = getBundleTierPercents();

  // Keep the tier labels in sync with the admin settings
  const stepLabels = document.querySelectorAll('.bundle-steps span');
  if (stepLabels.length === 3) {
    stepLabels[0].textContent = `جهازين = خصم ${tiers.t2}% + شحن مجاني`;
    stepLabels[1].textContent = `3 أجهزة = خصم ${tiers.t3}% + شحن مجاني`;
    stepLabels[2].textContent = `4 أجهزة فأكثر = خصم ${tiers.t4}% + شحن مجاني`;
  }

  const pricing = calculateBundlePricing(state.bundleSelected);

  let msg = 'اختر جهازين أو أكثر لتفعيل خصم المجموعة الفوري + شحن مجاني وضمان سنة';
  if (pricing.isCustomFixed) {
    msg = `عرض باكدج العروسة الخاص مُفعّل: سعر موحد ${formatEGP(pricing.net)} بدلاً من ${formatEGP(pricing.raw)} + شحن مجاني`;
  } else if (count === 2) {
    msg = `تم تفعيل خصم ${tiers.t2}% + شحن مجاني وضمان سنة على المجموعة المختارة`;
  } else if (count === 3) {
    msg = `تم تفعيل خصم ${tiers.t3}% + شحن مجاني وضمان سنة على الـ 3 أجهزة`;
  } else if (count >= 4) {
    msg = `تم تفعيل أعلى شريحة توفير: خصم ${tiers.t4}% فوري + شحن مجاني وضمان سنة`;
  }

  const fillEl = document.getElementById('bundleFillBar');
  const msgEl = document.getElementById('bundleStatusMsg');
  if (fillEl) fillEl.style.width = `${Math.min((count / 4) * 100, 100)}%`;
  if (msgEl) msgEl.textContent = msg;

  const befEl = document.getElementById('bundleBeforePrice');
  const aftEl = document.getElementById('bundleAfterPrice');
  const savEl = document.getElementById('bundleSavingBadge');
  if (befEl) befEl.textContent = formatEGP(pricing.raw);
  if (aftEl) aftEl.textContent = formatEGP(pricing.net);
  if (savEl) {
    savEl.textContent = pricing.isCustomFixed
      ? `سعر خاص للعروسة! توفير فوري: ${formatEGP(pricing.saved)} (${pricing.percent}%) + شحن مجاني`
      : `إجمالي التوفير: ${formatEGP(pricing.saved)} (${pricing.percent}%) + شحن مجاني`;
  }
}

window.selectBrideBundlePreset = function(mode) {
  const poolIds = getBundlePoolIds().filter(id => {
    const p = state.products.find(x => x.id === id);
    return isProductAvailable(p);
  });
  if (mode === 'all') {
    state.bundleSelected = [...poolIds];
  } else if (mode === 'clear') {
    state.bundleSelected = [];
  } else {
    state.bundleSelected = getBundleDefaultSelectedIds().filter(id => poolIds.includes(id));
  }
  renderBundleSection();
};

window.toggleBundleProduct = function(id) {
  const i = state.bundleSelected.indexOf(id);
  if (i > -1) state.bundleSelected.splice(i, 1);
  else state.bundleSelected.push(id);
  renderBundleSection();
};

window.addSelectedBundleToCart = function() {
  if (state.bundleSelected.length === 0) {
    showToast('اختر جهازاً واحداً على الأقل');
    return;
  }
  state.bundleSelected.forEach(id => addToCart(id, false));
  const pricing = calculateBundlePricing(state.bundleSelected);
  if (pricing.saved > 0) {
    state.appliedCoupon = {
      code: pricing.isCustomFixed ? 'BRIDE_SPECIAL' : `BUNDLE${pricing.percent}`,
      percent: pricing.percent,
      fixedDiscount: pricing.isCustomFixed ? pricing.saved : 0,
      bundleIds: [...state.bundleSelected]
    };
  }

  updateCartView();
  openDrawer('cartDrawer');
  showToast('تمت إضافة باكدج العروسة مع خصم المجموعة والشحن المجاني إلى السلة');
};

// ==================== SHOPPING CART & COUPONS ====================
window.addToCart = function(productId, notify = true) {
  const prod = state.products.find(p => p.id === productId);
  if (!prod) return;
  if (!isProductAvailable(prod)) {
    if (notify) showToast('عذراً، هذا المنتج غير متوفر حالياً');
    return;
  }
  const found = state.cart.find(c => c.id === productId);
  if (found) found.qty += 1;
  else state.cart.push({ id: prod.id, qty: 1 });

  localStorage.setItem('diamond_cart', JSON.stringify(state.cart));
  updateCartView();
  if (notify) showRichCartToast(prod, 1);
};

window.updateCartQty = function(productId, delta) {
  const item = state.cart.find(c => c.id === productId);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) {
    state.cart = state.cart.filter(c => c.id !== productId);
  }
  localStorage.setItem('diamond_cart', JSON.stringify(state.cart));
  updateCartView();
};

function calculateTotals() {
  const subtotal = state.cart.reduce((sum, item) => {
    const p = state.products.find(x => x.id === item.id);
    return sum + (p ? Number(p.price) * item.qty : 0);
  }, 0);

  let discount = 0;
  const coupon = state.appliedCoupon;
  if (coupon && coupon.serverDiscount != null) {
    discount = Math.round(Number(coupon.serverDiscount));
  } else if (coupon && coupon.bundleIds) {
    // Bundle coupon stays valid only while every bundle item is still in the cart
    const stillValid = coupon.bundleIds.every(id => state.cart.some(c => c.id === id));
    if (!stillValid) {
      state.appliedCoupon = null;
    } else if (Number(coupon.fixedDiscount) > 0) {
      discount = Math.round(Number(coupon.fixedDiscount));
    } else {
      const bundleValue = coupon.bundleIds.reduce((sum, id) => {
        const p = state.products.find(x => x.id === id);
        return sum + (p ? Number(p.price) : 0);
      }, 0);
      discount = Math.round((bundleValue * coupon.percent) / 100);
    }
  } else if (coupon) {
    discount = Math.round((subtotal * coupon.percent) / 100);
  }
  if (state.cart.length === 0) state.appliedCoupon = null;

  const total = Math.max(0, subtotal - discount);
  const count = state.cart.reduce((sum, item) => sum + item.qty, 0);
  return { subtotal, discount, total, count };
}

function updateCartView() {
  const { subtotal, discount, total, count } = calculateTotals();
  const badge = document.getElementById('cartCountPill');
  const mobBadge = document.getElementById('mobCartBadge');
  if (badge) badge.textContent = count;
  if (mobBadge) mobBadge.textContent = count;

  const listEl = document.getElementById('cartDrawerList');
  if (!listEl) return;

  if (state.cart.length === 0) {
    listEl.innerHTML = `
      <div style="text-align:center; padding:55px 16px; color:var(--text-muted);">
        <i class="fa-solid fa-bag-shopping" style="font-size:2.8rem; color:var(--brand); margin-bottom:12px;"></i>
        <h4>سلة التسوق فارغة</h4>
        <p style="font-size:0.84rem; margin-top:4px;">تصفح أقسام المتجر وأضف منتجات سوكاني المفضلة لديك بشحن مجاني وضمان سنة.</p>
      </div>
    `;
  } else {
    listEl.innerHTML = state.cart.map(item => {
      const p = state.products.find(x => x.id === item.id);
      if (!p) return '';
      return `
        <div class="cart-row">
          <img ${getSafeImageAttr(p)} style="cursor:pointer;" onclick="openProductPage('${p.id}')" />
          <div style="flex:1;">
            <span class="sku-tag" style="font-size:0.7rem;">${escapeHTML(p.model)}</span>
            <h5 style="font-size:0.86rem; margin:3px 0 6px; color:var(--text-dark); cursor:pointer;" onclick="openProductPage('${p.id}')">${escapeHTML(p.name)}</h5>
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <strong style="color:var(--brand-dark); font-size:0.9rem;">${formatEGP(p.price * item.qty)}</strong>
              <div class="qty-box">
                <button onclick="updateCartQty('${p.id}', -1)">-</button>
                <span>${item.qty}</span>
                <button onclick="updateCartQty('${p.id}', 1)">+</button>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const subEl = document.getElementById('cartSubTotal');
  const discEl = document.getElementById('cartDiscountTotal');
  const grandEl = document.getElementById('cartGrandTotal');
  if (subEl) subEl.textContent = formatEGP(subtotal);
  if (discEl) discEl.textContent = discount > 0 ? `- ${formatEGP(discount)} (${state.appliedCoupon.code})` : '0 ج.م';
  if (grandEl) grandEl.textContent = formatEGP(total);
}

window.applyPromoCoupon = async function() {
  const code = (document.getElementById('promoInput')?.value || '').trim().toUpperCase();
  if (state.cart.length === 0) {
    showToast('أضف منتجات إلى السلة أولاً ثم طبّق كود الخصم');
    return;
  }
  if (!code) {
    showToast('يرجى إدخال كود الخصم');
    return;
  }

  // If Supabase is connected, validate server-side via quote_cart RPC
  if (window.DiamondStoreData && window.DiamondStoreData.isConfigured()) {
    const currentBundleIds = Array.isArray(state.appliedCoupon?.bundleIds) ? state.appliedCoupon.bundleIds : null;
    const res = await window.DiamondStoreData.quoteCart({
      items: state.cart,
      coupon: code,
      bundleIds: currentBundleIds
    });
    if (res.success && res.quote) {
      if (res.quote.coupon_valid) {
        if (res.quote.discount_type === 'bundle' && currentBundleIds) {
          showToast('خصم باكدج العروسة المطبق حالياً أكبر من قيمة الكوبون (لا يمكن الجمع بين خصمين)');
          return;
        }
        state.appliedCoupon = {
          code,
          serverDiscount: res.quote.coupon_discount,
          discountType: 'coupon'
        };
        updateCartView();
        showToast(`تم تفعيل كود الخصم ${escapeHTML(code)} بنجاح`);
        return;
      } else {
        showToast(res.quote.coupon_message || 'كود الخصم غير صحيح أو غير متاح حالياً');
        return;
      }
    }
  }

  // Local fallback
  const customCoupons = readJSONStorage('diamond_coupons', { DIAMOND10: 10, SOKANY15: 15, BRIDE25: 25 });
  const pct = Number(customCoupons[code]);
  if (code && pct > 0 && pct <= 100) {
    state.appliedCoupon = { code, percent: pct };
    updateCartView();
    showToast(`تم تفعيل كود الخصم ${escapeHTML(code)} (${pct}%)`);
  } else {
    showToast('كود الخصم غير صالح، جرب DIAMOND10 أو SOKANY15');
  }
};

// ==================== WISHLIST ====================
window.toggleWishlist = function(id) {
  const i = state.wishlist.indexOf(id);
  if (i > -1) {
    state.wishlist.splice(i, 1);
    showToast('تمت الإزالة من المفضلة');
  } else {
    state.wishlist.push(id);
    showToast('تم الحفظ في قائمة المفضلة');
  }
  localStorage.setItem('diamond_wishlist', JSON.stringify(state.wishlist));
  updateCounters();
  renderCatalogGrid();
  // On product.html: refresh related cards so their heart icons reflect the new state
  const pdpProduct = state.products.find(p => p.id === new URLSearchParams(window.location.search).get('id'));
  if (pdpProduct && document.getElementById('relatedProductsGrid')) renderRelatedProducts(pdpProduct);
  const pdpWishBtn = document.getElementById('pdpWishBtn');
  if (pdpWishBtn) pdpWishBtn.classList.toggle('active', state.wishlist.includes(id));
};

function updateCounters() {
  const w = document.getElementById('wishCountPill');
  const mw = document.getElementById('mobWishBadge');
  if (w) {
    if (w.textContent !== String(state.wishlist.length)) triggerBadgePop('wishCountPill');
    w.textContent = state.wishlist.length;
  }
  if (mw) mw.textContent = state.wishlist.length;

  const c1 = document.getElementById('compareCountPill');
  const c2 = document.getElementById('navCompareBadge');
  const c3 = document.getElementById('wsCompareTabBadge');
  if (c1) {
    if (c1.textContent !== String(state.compare.length)) triggerBadgePop('compareCountPill');
    c1.textContent = state.compare.length;
  }
  if (c2) c2.textContent = state.compare.length;
  if (c3) c3.textContent = state.compare.length;
}

window.openWishlistModal = function() {
  const body = document.getElementById('wishlistModalContent');
  if (!body) return;
  if (state.wishlist.length === 0) {
    body.innerHTML = `<p style="text-align:center; padding:32px; color:var(--text-muted);">قائمة المفضلة فارغة حالياً.</p>`;
  } else {
    const items = state.wishlist.map(id => state.products.find(p => p.id === id)).filter(Boolean);
    body.innerHTML = `
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px, 1fr)); gap:16px;">
        ${items.map(p => `
          <div style="border:1px solid var(--border); border-radius:16px; padding:14px; text-align:center;">
            <img ${getSafeImageAttr(p)} style="width:110px; height:110px; object-fit:contain; margin-bottom:8px; cursor:pointer;" onclick="openProductPage('${p.id}')" />
            <div class="sku-tag" style="display:inline-block;">${escapeHTML(p.model)}</div>
            <h4 style="font-size:0.9rem; margin:6px 0; cursor:pointer;" onclick="openProductPage('${p.id}')">${escapeHTML(p.name)}</h4>
            <div style="font-weight:900; color:var(--brand-dark); margin-bottom:10px;">${formatEGP(p.price)}</div>
            <div style="display:flex; gap:8px; justify-content:center;">
              <button class="btn-card-add" onclick="openProductPage('${p.id}')">التفاصيل</button>
              <button class="btn-card-add" ${isProductAvailable(p) ? '' : 'disabled style="opacity:0.55; cursor:not-allowed;"'} onclick="addToCart('${p.id}')">${isProductAvailable(p) ? 'للسلة' : 'نفذت'}</button>
              <button class="tool-btn" style="width:36px; height:36px; padding:0;" onclick="toggleWishlist('${p.id}'); openWishlistModal();">
                <i class="fa-solid fa-trash"></i>
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
  openModal('wishlistModal');
};

// ==================== PROFESSIONAL PRODUCT COMPARISON STUDIO & TAB ENGINE ====================
window.switchStoreWorkspaceTab = function(tabName, scroll = true) {
  state.activeWorkspaceTab = tabName === 'compare' ? 'compare' : 'catalog';
  const catSec = document.getElementById('catalogSection');
  const compSec = document.getElementById('compareSection');
  const btnCat = document.getElementById('wsTabCatalogBtn');
  const btnComp = document.getElementById('wsTabCompareBtn');

  if (catSec && compSec) {
    if (state.activeWorkspaceTab === 'compare') {
      catSec.style.display = 'none';
      compSec.style.display = 'block';
      renderCompareStudioTab();
    } else {
      compSec.style.display = 'none';
      catSec.style.display = 'block';
    }
  }

  if (btnCat) btnCat.classList.toggle('active', state.activeWorkspaceTab === 'catalog');
  if (btnComp) btnComp.classList.toggle('active', state.activeWorkspaceTab === 'compare');

  if (scroll) {
    const anchor = document.getElementById('workspaceTabsAnchor') || compSec || catSec;
    anchor?.scrollIntoView({ behavior: 'smooth' });
  }
};

window.openCompareTab = function() {
  closeAllOverlays();
  if (document.getElementById('compareSection')) {
    if (state.compare.length === 0) {
      // Pre-load default comparison on first open so user immediately sees a rich pro matrix
      const defaults = ['sk-10085', 'sk-b907', 'sk-999n'].filter(id => state.products.some(p => p.id === id));
      state.compare = defaults;
      localStorage.setItem('diamond_compare', JSON.stringify(state.compare));
      updateCounters();
      renderCompareBar();
      renderCatalogGrid();
    }
    switchStoreWorkspaceTab('compare', true);
  } else {
    // On product.html: ensure current product is in comparison, then open modal or navigate to tab
    const curId = new URLSearchParams(window.location.search).get('id');
    if (curId && !state.compare.includes(curId) && state.compare.length < 4) {
      state.compare.push(curId);
      localStorage.setItem('diamond_compare', JSON.stringify(state.compare));
    }
    window.location.href = 'index.html?tab=compare#workspaceTabsAnchor';
  }
};

window.loadComparePreset = function(categoryKey) {
  const matches = state.products.filter(p => p.category === categoryKey).slice(0, 4);
  if (matches.length === 0) return;
  state.compare = matches.map(p => p.id);
  localStorage.setItem('diamond_compare', JSON.stringify(state.compare));
  updateCounters();
  renderCompareBar();
  renderCatalogGrid();
  renderCompareStudioTab();
  showToast('تم تحميل المقارنة الاحترافية الجاهزة بنجاح');
};

window.toggleCompareDiffOnly = function(checked) {
  state.compareDiffOnly = !!checked;
  renderCompareStudioTab();
};

window.addAllComparedToCart = function() {
  const items = state.compare.map(id => state.products.find(p => p.id === id)).filter(p => isProductAvailable(p));
  if (items.length === 0) {
    showToast('اختر أجهزة متوفرة في المقارنة أولاً');
    return;
  }
  items.forEach(p => addToCart(p.id, false));
  showToast(`تمت إضافة ${items.length} أجهزة من المقارنة إلى السلة`);
  openDrawer('cartDrawer');
};

window.addCompareSlotProduct = function(productId) {
  if (!productId) return;
  if (!state.compare.includes(productId) && state.compare.length < 4) {
    state.compare.push(productId);
    localStorage.setItem('diamond_compare', JSON.stringify(state.compare));
    updateCounters();
    renderCompareBar();
    renderCatalogGrid();
    renderCompareStudioTab();
    showToast('تمت إضافة الجهاز إلى جدول المقارنة');
  }
};

window.toggleCompareProduct = function(id) {
  const i = state.compare.indexOf(id);
  if (i > -1) {
    state.compare.splice(i, 1);
    showToast('تمت الإزالة من المقارنة');
  } else {
    if (state.compare.length >= 4) {
      showToast('يمكنك مقارنة حتى 4 أجهزة في نفس الوقت');
      return;
    }
    state.compare.push(id);
    showToast('تمت الإضافة لتابه المقارنة الاحترافية');
  }
  localStorage.setItem('diamond_compare', JSON.stringify(state.compare));
  updateCounters();
  renderCompareBar();
  renderCatalogGrid();
  renderCompareStudioTab();
  const pdpProduct = state.products.find(p => p.id === new URLSearchParams(window.location.search).get('id'));
  if (pdpProduct && document.getElementById('relatedProductsGrid')) renderRelatedProducts(pdpProduct);
  const pdpCompareBtn = document.getElementById('pdpCompareBtn');
  if (pdpCompareBtn) pdpCompareBtn.classList.toggle('active', state.compare.includes(id));
};

window.clearCompareProducts = function() {
  state.compare = [];
  localStorage.setItem('diamond_compare', JSON.stringify(state.compare));
  updateCounters();
  renderCompareBar();
  renderCatalogGrid();
  renderCompareStudioTab();
  const pdpCompareBtn = document.getElementById('pdpCompareBtn');
  if (pdpCompareBtn) pdpCompareBtn.classList.remove('active');
};

function renderCompareBar() {
  const bar = document.getElementById('compareFloatingBar');
  if (!bar) return;

  const items = state.compare.map(id => state.products.find(p => p.id === id)).filter(Boolean);
  if (items.length === 0) {
    bar.classList.remove('visible', 'open');
    bar.innerHTML = '';
    return;
  }

  bar.classList.add('visible');
  bar.innerHTML = `
    <div style="display:flex; align-items:center; gap:10px;">
      <i class="fa-solid fa-scale-balanced" style="color:var(--brand-light); font-size:1.1rem;"></i>
      <div>
        <div style="font-size:0.82rem; font-weight:900;">مقارنة الأجهزة الذكية</div>
        <div style="font-size:0.72rem; color:#FFE2CC;" id="compareBarCount">${items.length} من 4 أجهزة مختارة</div>
      </div>
    </div>
    <div class="compare-thumbs-strip" id="compareBarThumbs">
      ${items.map(p => `
        <div class="compare-thumb-chip" title="${escapeHTML(p.name)}">
          <img ${getSafeImageAttr(p)} />
          <button type="button" onclick="toggleCompareProduct('${p.id}')" aria-label="إزالة">&times;</button>
        </div>
      `).join('')}
    </div>
    <div style="display:flex; align-items:center; gap:8px;">
      <button type="button" class="btn-brand" style="padding:8px 16px; font-size:0.82rem;" onclick="openCompareTab()">
        <i class="fa-solid fa-table-columns"></i> فتح تابه المقارنة (${items.length})
      </button>
      <button type="button" class="tool-btn" style="height:36px; padding:0 10px; background:rgba(255,255,255,0.1); color:#fff; border-color:rgba(255,255,255,0.2);" onclick="clearCompareProducts()" title="مسح المقارنة">
        <i class="fa-solid fa-trash-can"></i>
      </button>
    </div>
  `;
}

function parseWattageNum(wStr) {
  const nums = String(wStr || '').match(/\d+/g);
  if (!nums || !nums.length) return 800;
  return Math.max(...nums.map(Number));
}

function buildProCompareMatrixHTML(items, allowEmptyPickerSlots = true) {
  const remainingChoices = state.products.filter(p => !state.compare.includes(p.id));
  const emptyCount = allowEmptyPickerSlots ? Math.max(0, Math.min(4 - items.length, items.length === 0 ? 3 : 1)) : 0;
  const emptyCols = Array.from({ length: emptyCount });

  if (items.length === 0 && !allowEmptyPickerSlots) {
    return `<p style="text-align:center; padding:32px; color:var(--text-muted);">اختر جهازين أو أكثر للمقارنة بين المواصفات والأسعار.</p>`;
  }

  // Calculate Winner Benchmarks
  const maxWatt = items.length ? Math.max(...items.map(p => parseWattageNum(p.wattage))) : 1;
  const minPrice = items.length ? Math.min(...items.map(p => Number(p.price) || 999999)) : 0;
  const maxRating = items.length ? Math.max(...items.map(p => Number(p.rating) || 4.8)) : 5;
  const maxSaving = items.length ? Math.max(...items.map(p => Math.max(0, (Number(p.oldPrice) || 0) - (Number(p.price) || 0)))) : 0;

  const isDiff = (vals) => {
    if (vals.length <= 1) return true;
    const norm = vals.map(v => String(v || '').trim());
    return new Set(norm).size > 1;
  };

  // Collect all spec keys across selected items
  const allSpecKeys = [];
  items.forEach(p => {
    Object.keys(p.specs || {}).forEach(k => {
      if (!allSpecKeys.includes(k) && k !== 'الموديل' && k !== 'الضمان' && k !== 'الشحن') {
        allSpecKeys.push(k);
      }
    });
  });

  const emptyTd = () => `<td style="color:var(--text-muted); font-size:0.8rem;">—</td>`;

  const renderRow = (label, valuesArr, cellHtmlFn) => {
    const diff = isDiff(valuesArr);
    if (state.compareDiffOnly && !diff) return '';
    return `
      <tr class="${diff && items.length > 1 ? 'diff-highlight' : ''}">
        <th>${escapeHTML(label)}</th>
        ${items.map((p, idx) => `<td>${cellHtmlFn(p, idx)}</td>`).join('')}
        ${emptyCols.map(() => emptyTd()).join('')}
      </tr>
    `;
  };

  return `
    <div class="compare-matrix-scroll">
      <table class="compare-pro-table">
        <thead>
          <tr>
            <th>الجهاز والموديل</th>
            ${items.map(p => {
              const pWatt = parseWattageNum(p.wattage);
              const isPowerKing = items.length > 1 && pWatt === maxWatt;
              const isValueKing = items.length > 1 && Number(p.price) === minPrice;
              const crownText = isPowerKing ? '🏆 الأعلى قدرة وأداء' : (isValueKing ? '💎 الأوفر سعراً' : '✨ سوكاني أصلي');
              return `
                <td style="min-width:215px;">
                  <div class="compare-winner-crown">${crownText}</div>
                  <div style="position:relative; width:120px; height:120px; margin:0 auto 10px; cursor:pointer;" onclick="openProductPage('${p.id}')">
                    <img ${getSafeImageAttr(p)} style="width:100%; height:100%; object-fit:contain; border-radius:14px; border:1px solid var(--border); padding:6px; background:#fff;" />
                  </div>
                  <span class="sku-tag" style="display:inline-block; margin-bottom:4px;">${escapeHTML(p.model)}</span>
                  <h4 style="font-size:0.9rem; font-weight:900; line-height:1.35; margin:4px 0 10px; cursor:pointer; color:var(--text-dark);" onclick="openProductPage('${p.id}')">${escapeHTML(p.name)}</h4>
                  <button type="button" class="pdp-aux-pill" style="height:32px; font-size:0.75rem; padding:0 10px; color:#dc2626; border-color:#fecaca;" onclick="toggleCompareProduct('${p.id}')">
                    <i class="fa-solid fa-xmark"></i> إزالة
                  </button>
                </td>
              `;
            }).join('')}
            ${emptyCols.map((_, slotIdx) => `
              <td style="min-width:215px;">
                <div class="compare-slot-empty">
                  <div style="width:48px; height:48px; border-radius:50%; background:var(--brand-soft); color:var(--brand-dark); display:flex; align-items:center; justify-content:center; font-size:1.2rem;">
                    <i class="fa-solid fa-plus"></i>
                  </div>
                  <strong style="font-size:0.84rem; color:var(--text-dark);">إضافة جهاز للمقارنة #${items.length + slotIdx + 1}</strong>
                  <select class="compare-slot-select" onchange="addCompareSlotProduct(this.value)">
                    <option value="">+ اختر جهازاً من القائمة...</option>
                    ${remainingChoices.map(rp => `
                      <option value="${escapeHTML(rp.id)}">${escapeHTML(rp.model)} — ${escapeHTML(rp.name)} (${formatEGP(rp.price)})</option>
                    `).join('')}
                  </select>
                </div>
              </td>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${renderRow(
            'السعر الحالي والتوفير',
            items.map(p => p.price),
            (p) => {
              const sav = Math.max(0, (Number(p.oldPrice) || 0) - (Number(p.price) || 0));
              const isBest = items.length > 1 && Number(p.price) === minPrice;
              return `
                <div style="font-size:1.22rem; font-weight:900; color:${isBest ? '#15803d' : 'var(--brand-dark)'};">${formatEGP(p.price)}</div>
                ${p.oldPrice > p.price ? `<div style="font-size:0.76rem; text-decoration:line-through; color:var(--text-muted);">${formatEGP(p.oldPrice)}</div>` : ''}
                ${sav > 0 ? `<span class="card-badge" style="display:inline-block; margin-top:4px; ${sav === maxSaving && items.length > 1 ? 'background:#dcfce7; color:#166534; border-color:#86efac;' : ''}">وفر ${formatEGP(sav)}</span>` : ''}
              `;
            }
          )}
          ${renderRow(
            'مؤشر القدرة الفعلية (الوات)',
            items.map(p => p.wattage),
            (p) => {
              const wNum = parseWattageNum(p.wattage);
              const pct = Math.min(100, Math.max(18, Math.round((wNum / maxWatt) * 100)));
              return `
                <div class="compare-meter-wrap">
                  <strong style="font-size:0.92rem; color:var(--text-dark);">${escapeHTML(p.wattage || 'قياسي')}</strong>
                  <div class="compare-meter-track">
                    <div class="compare-meter-fill" style="width:${pct}%;"></div>
                  </div>
                </div>
              `;
            }
          )}
          ${renderRow(
            'السعة / عدد الغيارات',
            items.map(p => p.capacity),
            (p) => `<span style="font-weight:800; color:var(--text-dark);">${escapeHTML(p.capacity || 'قياسي')}</span>`
          )}
          ${renderRow(
            'الفئة والقسم',
            items.map(p => p.categoryLabel),
            (p) => `<span>${escapeHTML(p.categoryLabel)}</span>`
          )}
          ${renderRow(
            'تقييم العملاء',
            items.map(p => p.rating),
            (p) => {
              const r = Number(p.rating) || 4.9;
              const isTop = items.length > 1 && r === maxRating;
              return `
                <div style="color:#f59e0b; font-weight:900;">
                  <i class="fa-solid fa-star"></i> ${r} / 5.0
                  ${isTop ? '<span style="color:#15803d; font-size:0.72rem; display:block;">الأعلى تقييماً ⭐</span>' : ''}
                </div>
                <small style="color:var(--text-muted);">(${Number(p.reviewsCount) || 140} تقييم)</small>
              `;
            }
          )}
          ${allSpecKeys.map(specKey => renderRow(
            specKey,
            items.map(p => (p.specs && p.specs[specKey]) || '—'),
            (p) => `<span style="font-size:0.84rem; font-weight:700;">${escapeHTML((p.specs && p.specs[specKey]) || '—')}</span>`
          )).join('')}
          ${renderRow(
            'أبرز المميزات ونقاط القوة',
            items.map(p => (p.features || []).join('|')),
            (p) => `
              <ul style="list-style:none; text-align:right; font-size:0.8rem; line-height:1.65; display:grid; gap:5px;">
                ${(p.features || []).slice(0, 4).map(f => `<li><i class="fa-solid fa-circle-check" style="color:var(--brand); margin-left:5px;"></i>${escapeHTML(f)}</li>`).join('')}
              </ul>
            `
          )}
          <tr>
            <th>الضمان والشحن</th>
            ${items.map(() => `<td style="color:var(--brand-dark); font-weight:900; font-size:0.84rem;"><i class="fa-solid fa-truck-fast"></i> شحن مجاني + ضمان سنة</td>`).join('')}
            ${emptyCols.map(() => emptyTd()).join('')}
          </tr>
          <tr>
            <th>الشراء السريع</th>
            ${items.map(p => {
              const avail = isProductAvailable(p);
              return `
                <td>
                  <div style="display:grid; gap:8px;">
                    <button type="button" class="btn-brand" style="padding:10px 14px; font-size:0.84rem; justify-content:center; width:100%;" ${avail ? '' : 'disabled style="opacity:0.5;cursor:not-allowed;"'} onclick="addToCart('${p.id}')">
                      <i class="fa-solid fa-bag-shopping"></i> ${avail ? 'إضافة إلى السلة' : 'غير متوفر'}
                    </button>
                    <button type="button" class="btn-outline" style="padding:8px 12px; font-size:0.8rem; justify-content:center; width:100%;" onclick="openProductPage('${p.id}')">
                      صفحة المنتج الكاملة
                    </button>
                  </div>
                </td>
              `;
            }).join('')}
            ${emptyCols.map(() => emptyTd()).join('')}
          </tr>
        </tbody>
      </table>
    </div>
  `;
}

function renderCompareStudioTab() {
  const root = document.getElementById('compareStudioRoot');
  if (!root) return;
  const items = state.compare.map(id => state.products.find(p => p.id === id)).filter(Boolean);
  root.innerHTML = buildProCompareMatrixHTML(items, true);
}

window.openCompareModal = function() {
  if (document.getElementById('compareSection')) {
    openCompareTab();
    return;
  }
  const body = document.getElementById('compareModalBody');
  if (!body) return;
  const items = state.compare.map(id => state.products.find(p => p.id === id)).filter(Boolean);
  body.innerHTML = buildProCompareMatrixHTML(items, false);
  openModal('compareModal');
};

// ==================== QUICK VIEW MODAL ====================
window.openQuickView = function(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return;
  const available = isProductAvailable(p);

  const specsHTML = Object.entries(p.specs || {}).map(([k, v]) => `
    <tr><td>${escapeHTML(k)}</td><td>${escapeHTML(v)}</td></tr>
  `).join('');

  const featuresHTML = (p.features || []).map(f => `
    <li style="margin-bottom:6px; display:flex; align-items:center; gap:8px; font-size:0.88rem; color:var(--text-body);">
      <i class="fa-solid fa-check" style="color:var(--brand);"></i> ${escapeHTML(f)}
    </li>
  `).join('');

  document.getElementById('quickViewBody').innerHTML = `
    <div class="qv-layout">
      <div style="background:var(--bg-page); border:1.5px solid var(--border); border-radius:20px; padding:24px; text-align:center;">
        <img ${getSafeImageAttr(p)} style="width:100%; max-height:290px; object-fit:contain; border-radius:14px; background:#fff; padding:12px;" />
        <div style="display:flex; justify-content:center; gap:10px; margin-top:14px; flex-wrap:wrap;">
          <span class="sku-tag">الموديل: ${escapeHTML(p.model)}</span>
          <span class="card-badge">${escapeHTML(p.wattage)}</span>
          <span class="card-badge">شحن مجاني + ضمان سنة</span>
        </div>
      </div>

      <div>
        <span class="section-kicker">${escapeHTML(p.categoryLabel)}</span>
        <h2 style="font-size:1.35rem; font-weight:900; margin:6px 0 10px;">${escapeHTML(p.name)}</h2>
        <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:14px;">${escapeHTML(p.shortDesc)}</p>

        <div style="display:flex; align-items:baseline; gap:14px; margin-bottom:16px;">
          <span style="font-size:1.75rem; font-weight:900; color:var(--brand-dark);">${formatEGP(p.price)}</span>
          ${p.oldPrice > p.price ? `<span style="text-decoration:line-through; color:var(--text-muted);">${formatEGP(p.oldPrice)}</span>` : ''}
        </div>

        ${featuresHTML ? `<h4 style="font-size:0.92rem; margin-bottom:8px;">أبرز المميزات:</h4><ul style="list-style:none; margin-bottom:16px;">${featuresHTML}</ul>` : ''}
        ${specsHTML ? `<h4 style="font-size:0.92rem; margin-bottom:6px;">المواصفات الفنية:</h4><table class="clean-table">${specsHTML}</table>` : ''}

        <div style="display:flex; gap:10px; margin-top:20px; flex-wrap:wrap;">
          <button class="btn-brand" ${available ? '' : 'disabled style="opacity:0.55; cursor:not-allowed;"'} onclick="addToCart('${p.id}'); closeAllOverlays();">
            <i class="fa-solid fa-bag-shopping"></i> ${available ? 'أضف إلى السلة' : 'غير متوفر حالياً'}
          </button>
          <button class="btn-outline" onclick="openProductPage('${p.id}')">
            <i class="fa-solid fa-up-right-from-square"></i> فتح صفحة المنتج الكاملة
          </button>
        </div>
      </div>
    </div>
  `;

  openModal('quickViewModal');
};

// ==================== CHECKOUT & PRO INSTAPAY / QR / SCREENSHOT GATEWAY ====================
let pendingOrderScreenshotDataUrl = '';

window.copyPaymentText = function(val, msg = 'تم النسخ بنجاح') {
  if (!val) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(val).then(() => showToast(msg)).catch(() => fallbackCopyText(val, msg));
  } else {
    fallbackCopyText(val, msg);
  }
};

function fallbackCopyText(val, msg) {
  const ta = document.createElement('textarea');
  ta.value = val;
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand('copy'); } catch (e) {}
  ta.remove();
  showToast(msg);
}

window.handleCustomerScreenshotUpload = function(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 650;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width >= height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      pendingOrderScreenshotDataUrl = canvas.toDataURL('image/jpeg', 0.8);

      const lblTxt = document.getElementById('ordScreenshotLblTxt');
      const prevImg = document.getElementById('ordScreenshotPreviewImg');
      if (lblTxt) lblTxt.textContent = 'تم إرفاق اسكرين شوت التحويل بنجاح ✓';
      if (prevImg) {
        prevImg.src = pendingOrderScreenshotDataUrl;
        prevImg.style.display = 'inline-block';
      }
      showToast('تم إرفاق صورة اسكرين شوت التحويل مع الأوردر بنجاح');
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
};

function getFallbackQrSvgDataUri() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="#3b0764"><rect width="120" height="120" fill="#fff"/><path d="M10 10h34v34H10V10zm6 6v22h22V16H16zm6 6h10v10H22V22zm54-12h34v34H76V10zm6 6v22h22V16H82zm6 6h10v10H88V22zM10 76h34v34H10V76zm6 6v22h22V82H16zm6 6h10v10H22V88zm30-78h8v8h-8v-8zm12 8h8v16h-8V18zm-12 16h8v16h-8V34zm-34 22h16v8H16v-8zm24 0h16v8H40v-8zm24 0h16v8H64v-8zm24 0h22v8H88v-8zM52 72h16v8H52v-8zm24 8h16v8H76v-8zm-24 16h16v14H52V96zm28 0h14v14H80V96zm18-12h12v26H98V84z"/></svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg);
}

window.selectCheckoutPaymentMethod = function(methodName) {
  const sel = document.getElementById('ordPay');
  if (sel) sel.value = methodName;

  document.querySelectorAll('#payMethodsSelector .pay-method-card').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-pay') === methodName);
  });

  renderPaymentGatewayPanel(methodName);
};

function renderPaymentGatewayPanel(methodName) {
  const panel = document.getElementById('paymentGatewayPanel');
  if (!panel) return;

  const { total } = calculateTotals();
  const s = state.settings || DEFAULT_STORE_SETTINGS;
  const ipLink = s.instapayLink || 'https://ipn.eg/S/diamondstore/instapay/0000';
  const ipNum = s.instapayNumber || '01000000000';
  const ipHandle = s.instapayHandle || 'diamondstore@instapay';
  const ipName = s.instapayAccountName || s.storeName || 'diamond store';
  const vfNum = s.vodafoneCashNumber || ipNum || '01000000000';
  const customQr = (s.instapayQrImage || '').trim();
  const autoQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&color=3b0764&bgcolor=ffffff&data=${encodeURIComponent(ipLink)}`;
  const qrSrc = customQr || autoQrUrl;
  const fallbackSvg = getFallbackQrSvgDataUri();
  const instructionsTxt = s.paymentInstructions || DEFAULT_STORE_SETTINGS.paymentInstructions;

  if (methodName === 'InstaPay') {
    panel.innerHTML = `
      <div class="instapay-pro-gateway">
        <div class="instapay-top-banner">
          <span class="instapay-badge-pill">
            <i class="fa-solid fa-bolt"></i> بوابة الدفع اللحظي — InstaPay Egypt
          </span>
          <span class="instapay-amount-pill">
            المبلغ المطلوب تحويله: ${formatEGP(total)}
          </span>
        </div>

        <div class="instapay-grid">
          <div>
            <!-- 1. Direct Payment Link Button -->
            <a href="${escapeHTML(ipLink)}" target="_blank" rel="noopener noreferrer" class="instapay-direct-btn">
              <i class="fa-solid fa-up-right-from-square"></i>
              <span>اضغط هنا للدفع مباشرة عبر لينك InstaPay</span>
            </a>

            <!-- 2. Copyable Link -->
            <div class="copy-field-row">
              <div class="copy-field-info">
                <small>لينك الدفع المباشر (InstaPay Link):</small>
                <strong>${escapeHTML(ipLink)}</strong>
              </div>
              <button type="button" class="copy-mini-btn" data-copy="${escapeHTML(ipLink)}" onclick="copyPaymentText(this.dataset.copy, 'تم نسخ لينك إنستا باي بنجاح')">
                <i class="fa-regular fa-copy"></i> نسخ اللينك
              </button>
            </div>

            <!-- 3. Copyable Phone Number -->
            <div class="copy-field-row">
              <div class="copy-field-info">
                <small>رقم موبايل حساب إنستا باي (${escapeHTML(ipName)}):</small>
                <strong>${escapeHTML(ipNum)}</strong>
              </div>
              <button type="button" class="copy-mini-btn" data-copy="${escapeHTML(ipNum)}" onclick="copyPaymentText(this.dataset.copy, 'تم نسخ رقم إنستا باي بنجاح')">
                <i class="fa-regular fa-copy"></i> نسخ الرقم
              </button>
            </div>

            <!-- 4. Copyable IPA Handle -->
            <div class="copy-field-row" style="margin-bottom:0;">
              <div class="copy-field-info">
                <small>عنوان الدفع اللحظي (IPA Address):</small>
                <strong>${escapeHTML(ipHandle)}</strong>
              </div>
              <button type="button" class="copy-mini-btn" data-copy="${escapeHTML(ipHandle)}" onclick="copyPaymentText(this.dataset.copy, 'تم نسخ عنوان إنستا باي بنجاح')">
                <i class="fa-regular fa-copy"></i> نسخ العنوان
              </button>
            </div>
          </div>

          <!-- 5. InstaPay QR Code Stand -->
          <div class="instapay-qr-stand">
            <div class="instapay-qr-frame">
              <img src="${escapeHTML(qrSrc)}" alt="InstaPay QR Code" onerror="this.onerror=null;this.src='${fallbackSvg}';" />
              ${!customQr ? `<span class="qr-center-badge">InstaPay</span>` : ''}
            </div>
            <strong style="font-size:0.78rem; color:#4c1d95; margin-top:8px;">كود QR إنستا باي</strong>
            <span style="font-size:0.68rem; color:var(--text-muted); font-weight:700;">امسح الكود من تطبيق InstaPay للدفع الفوري</span>
          </div>
        </div>

        <!-- 6. Screenshot & Order Confirmation Instructions -->
        <div class="screenshot-instructions-box">
          <h5><i class="fa-solid fa-camera-retro"></i> تعليمات هامة لتأكيد التحويل (إرسال الاسكرين شوت مع الأوردر):</h5>
          <p style="font-size:0.78rem; font-weight:700; margin-bottom:6px; line-height:1.55;">${escapeHTML(instructionsTxt)}</p>
          <ul class="screenshot-steps-list">
            <li><i class="fa-solid fa-circle-check" style="color:#d97706;"></i> 1. حوّل إجمالي المبلغ (<strong>${formatEGP(total)}</strong>) عبر اللينك المباشر أو الرقم أو مسح الـ QR Code.</li>
            <li><i class="fa-solid fa-circle-check" style="color:#d97706;"></i> 2. خُد <strong>لقطة شاشة (اسكرين شوت Screenshot)</strong> لإيصال التحويل الناجح من تطبيق إنستا باي.</li>
            <li><i class="fa-solid fa-circle-check" style="color:#d97706;"></i> 3. أرفق صورة الاسكرين شوت بالأسفل أو أرسلها في محادثة واتساب مع رسالة تأكيد الأوردر.</li>
          </ul>
        </div>

        <!-- 7. Customer Transfer Reference & Screenshot Upload -->
        <div class="transfer-proof-box">
          <input type="text" id="ordTransferRef" placeholder="رقم الموبايل أو الحساب المحوّل منه (لتأكيد أسرع)"
                 style="background:var(--bg-page); border:1.5px solid var(--border); padding:10px 12px; border-radius:10px; font-family:inherit; font-size:0.82rem; font-weight:700;" />

          <div style="display:flex; align-items:center; gap:8px;">
            <label class="screenshot-upload-label" style="flex:1;">
              <i class="fa-solid fa-camera"></i>
              <span id="ordScreenshotLblTxt">إرفاق اسكرين شوت التحويل مع الأوردر</span>
              <input type="file" id="ordScreenshotFile" accept="image/*" style="display:none;" onchange="handleCustomerScreenshotUpload(event)" />
            </label>
            <img id="ordScreenshotPreviewImg" src="" alt="Screenshot" style="display:none; width:42px; height:42px; object-fit:cover; border-radius:8px; border:1.5px solid #6d28d9;" />
          </div>
        </div>
      </div>
    `;
    return;
  }

  if (methodName === 'Vodafone Cash') {
    panel.innerHTML = `
      <div class="instapay-pro-gateway wallet-theme">
        <div class="instapay-top-banner" style="border-bottom-color:#fecaca;">
          <span class="instapay-badge-pill" style="background:linear-gradient(135deg,#dc2626,#991b1b);">
            <i class="fa-solid fa-mobile-screen-button" style="color:#fff;"></i> الدفع عبر محفظة فودافون كاش (Vodafone Cash)
          </span>
          <span class="instapay-amount-pill" style="background:#fef2f2; border-color:#fecaca; color:#991b1b;">
            المبلغ المطلوب تحويله: ${formatEGP(total)}
          </span>
        </div>

        <div class="copy-field-row">
          <div class="copy-field-info">
            <small>رقم محفظة فودافون كاش للتحويل الفوري:</small>
            <strong style="font-size:1.05rem; color:#991b1b;">${escapeHTML(vfNum)}</strong>
          </div>
          <button type="button" class="copy-mini-btn" style="background:#fee2e2; border-color:#fca5a5; color:#991b1b;" data-copy="${escapeHTML(vfNum)}" onclick="copyPaymentText(this.dataset.copy, 'تم نسخ رقم فودافون كاش بنجاح')">
            <i class="fa-regular fa-copy"></i> نسخ رقم المحفظة
          </button>
        </div>

        <div class="screenshot-instructions-box">
          <h5><i class="fa-solid fa-camera-retro"></i> تعليمات تأكيد تحويل المحفظة (إرسال الاسكرين شوت مع الأوردر):</h5>
          <ul class="screenshot-steps-list">
            <li><i class="fa-solid fa-circle-check" style="color:#d97706;"></i> 1. حوّل مبلغ الطلب (<strong>${formatEGP(total)}</strong>) إلى رقم المحفظة الموضح أعلاه.</li>
            <li><i class="fa-solid fa-circle-check" style="color:#d97706;"></i> 2. صوّر رسالة أو إيصال التحويل <strong>(اسكرين شوت Screenshot)</strong>.</li>
            <li><i class="fa-solid fa-circle-check" style="color:#d97706;"></i> 3. أرفق الاسكرين شوت بالأسفل أو أرسله مباشرة على واتساب مع الأوردر.</li>
          </ul>
        </div>

        <div class="transfer-proof-box">
          <input type="text" id="ordTransferRef" placeholder="رقم الموبايل المحوّل منه (لتأكيد التحويل)"
                 style="background:var(--bg-page); border:1.5px solid var(--border); padding:10px 12px; border-radius:10px; font-family:inherit; font-size:0.82rem; font-weight:700;" />

          <div style="display:flex; align-items:center; gap:8px;">
            <label class="screenshot-upload-label" style="flex:1; background:#fef2f2; border-color:#f87171; color:#991b1b;">
              <i class="fa-solid fa-camera"></i>
              <span id="ordScreenshotLblTxt">إرفاق اسكرين شوت التحويل مع الأوردر</span>
              <input type="file" id="ordScreenshotFile" accept="image/*" style="display:none;" onchange="handleCustomerScreenshotUpload(event)" />
            </label>
            <img id="ordScreenshotPreviewImg" src="" alt="Screenshot" style="display:none; width:42px; height:42px; object-fit:cover; border-radius:8px; border:1.5px solid #dc2626;" />
          </div>
        </div>
      </div>
    `;
    return;
  }

  // Default: Cash on Delivery
  panel.innerHTML = `
    <div style="margin-top:12px; background:var(--brand-soft); border:1.5px solid var(--brand-tint); border-radius:12px; padding:10px 14px; font-size:0.82rem; font-weight:800; color:var(--brand-dark); display:flex; align-items:center; gap:8px;">
      <i class="fa-solid fa-shield-halved"></i>
      <span>الدفع نقداً عند الاستلام بعد معاينة وفحص الجهاز بنفسك (شامل الشحن المجاني 0 ج.م وضمان سنة كاملة).</span>
    </div>
  `;
}

window.openCheckoutWindow = function() {
  if (state.cart.length === 0) {
    showToast('السلة فارغة، أضف منتجات أولاً');
    return;
  }
  closeAllOverlays();
  pendingOrderScreenshotDataUrl = '';
  const { total, count } = calculateTotals();
  document.getElementById('checkoutSummaryBanner').textContent = `إجمالي الطلب (${count} قطعة): ${formatEGP(total)} — شحن مجاني لجميع المحافظات (0 ج.م) + ضمان سنة كاملة`;
  document.getElementById('checkoutResultBox').style.display = 'none';
  const form = document.querySelector('#checkoutModal form');
  if (form) form.style.display = 'grid';
  const currentMethod = document.getElementById('ordPay')?.value || 'الدفع عند الاستلام';
  selectCheckoutPaymentMethod(currentMethod);
  openModal('checkoutModal');
};

window.submitCustomerOrder = async function(e) {
  e.preventDefault();
  if (state.cart.length === 0) {
    showToast('السلة فارغة، لا يمكن إرسال طلب بدون منتجات');
    return;
  }
  const name = document.getElementById('ordName').value.trim();
  const phone = normalizeDigits(document.getElementById('ordPhone').value).replace(/[\s-]/g, '').replace(/^\+?20(?=1)/, '0');
  const gov = document.getElementById('ordGov').value;
  const addr = document.getElementById('ordAddr').value.trim();
  const pay = document.getElementById('ordPay').value;
  const transferRef = (document.getElementById('ordTransferRef')?.value || '').trim();

  if (!/^01[0125]\d{8}$/.test(phone)) {
    showToast('رقم الموبايل غير صحيح — اكتب رقم مصري من 11 رقم يبدأ بـ 010 أو 011 أو 012 أو 015');
    document.getElementById('ordPhone').focus();
    return;
  }

  const btnSubmit = document.querySelector('#checkoutModal form button[type="submit"]');
  if (btnSubmit) {
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'جارٍ تسجيل وتأكيد الطلب...';
  }

  let finalOrderCode = 'DM-' + Math.floor(100000 + Math.random() * 900000);
  let finalSubtotal = 0;
  let finalDiscount = 0;
  let finalAmount = 0;
  let serverOrderRecorded = false;

  const itemsDetailed = state.cart.map(item => {
    const p = state.products.find(x => x.id === item.id);
    return p ? { id: p.id, model: p.model, name: p.name, qty: item.qty, price: p.price } : null;
  }).filter(Boolean);

  // If Supabase is connected, call server-side create_order RPC
  if (window.DiamondStoreData && window.DiamondStoreData.isConfigured()) {
    try {
      let uploadedProofPath = null;
      if (pendingOrderScreenshotDataUrl) {
        uploadedProofPath = await window.DiamondStoreData.uploadPaymentProof(pendingOrderScreenshotDataUrl);
      }

      const isBundleCoupon = Array.isArray(state.appliedCoupon?.bundleIds) && state.appliedCoupon.bundleIds.length > 0;
      const serverRes = await window.DiamondStoreData.createOrder({
        customer: {
          customer: name,
          phone,
          gov,
          address: addr,
          payment: pay,
          transferRef,
          paymentScreenshotPath: uploadedProofPath
        },
        items: state.cart,
        coupon: isBundleCoupon ? null : (state.appliedCoupon?.code || null),
        bundleIds: isBundleCoupon ? state.appliedCoupon.bundleIds : null
      });

      if (serverRes.success && serverRes.result) {
        finalOrderCode = serverRes.result.order_code;
        finalSubtotal = Number(serverRes.result.subtotal) || 0;
        finalDiscount = Number(serverRes.result.discount) || 0;
        finalAmount = Number(serverRes.result.total) || 0;
        serverOrderRecorded = true;
      } else {
        showToast(serverRes.error || 'تعذر تسجيل الطلب على السيرفر، يرجى المحاولة مرة أخرى');
        if (btnSubmit) {
          btnSubmit.disabled = false;
          btnSubmit.textContent = 'تأكيد الطلب الآن';
        }
        return;
      }
    } catch (rpcErr) {
      console.error('[Diamond Checkout] Server RPC error:', rpcErr);
      showToast('تعذر تسجيل الطلب على السيرفر، يرجى المحاولة مرة أخرى');
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'تأكيد الطلب الآن';
      }
      return;
    }
  }

  if (!serverOrderRecorded) {
    // No Supabase configured (local/dev only): price locally so WhatsApp still works
    const { subtotal, discount, total } = calculateTotals();
    finalSubtotal = subtotal;
    finalDiscount = discount;
    finalAmount = total;
  }

  // Also record in localStorage for quick client-side reference
  const existingOrders = readJSONStorage('diamond_orders', []);
  existingOrders.unshift({
    id: finalOrderCode,
    date: normalizeDigits(new Date().toLocaleString('en-GB')),
    customer: name,
    phone,
    gov,
    address: addr,
    payment: pay,
    transferRef,
    paymentScreenshot: pendingOrderScreenshotDataUrl || '',
    items: itemsDetailed,
    subtotal: finalSubtotal,
    discount: finalDiscount,
    coupon: state.appliedCoupon ? state.appliedCoupon.code : '',
    shipping: 0,
    warranty: state.settings?.warrantyText || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    total: finalAmount,
    status: 'جديد'
  });
  safeSetItem('diamond_orders', JSON.stringify(existingOrders));

  const isElectronicPay = pay === 'InstaPay' || pay === 'Vodafone Cash';
  const waPhone = getStoreWhatsapp();
  const storeName = state.settings?.storeName || 'Diamond Store';
  const warrantyTxt = state.settings?.warrantyText || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة';
  const waLines = itemsDetailed.map(i => `• ${i.name} (${i.model}) × ${i.qty}`).join('\n');
  const discountLine = finalDiscount > 0 ? `\nالخصم: ${formatEGP(finalDiscount)}${state.appliedCoupon ? ` (${state.appliedCoupon.code})` : ''}` : '';
  const transferLine = isElectronicPay
    ? `\nبيانات التحويل: ${pay}${transferRef ? ` (محول من: ${transferRef})` : ''}\n📸 مرفق مع هذه الرسالة صورة (اسكرين شوت) إيصال التحويل لتأكيد الأوردر.`
    : '';
  const waMsg = `مرحباً ${storeName}،\nأرغب في تأكيد طلبي رقم: ${finalOrderCode}\nالاسم: ${name}\nالموبايل: ${phone}\nالمحافظة والعنوان: ${gov} - ${addr}\nطريقة الدفع: ${pay}${transferLine}\n\nالمنتجات:\n${waLines}${discountLine}\n\nالشحن: مجاني لجميع المحافظات (0 ج.م)\nالضمان: ${warrantyTxt}\nالإجمالي المطلوب: ${formatEGP(finalAmount)}`;

  const resBox = document.getElementById('checkoutResultBox');
  resBox.style.display = 'block';
  resBox.innerHTML = `
    <h4 style="color:var(--brand-dark); margin-bottom:6px;"><i class="fa-solid fa-circle-check"></i> تم تسجيل طلبك بنجاح رقم ${finalOrderCode}</h4>
    <p style="font-size:0.86rem; color:var(--text-body);">الإجمالي الكلي: <strong>${formatEGP(finalAmount)}</strong> (شامل الشحن المجاني لجميع المحافظات + شهادة ضمان سنة كاملة)</p>
    ${isElectronicPay ? `
      <div style="margin-top:10px; background:#fffbeb; border:1.5px solid #f59e0b; border-radius:12px; padding:10px 14px; color:#92400e; font-size:0.84rem; font-weight:800;">
        <i class="fa-solid fa-camera-retro"></i> تنبيه هام للدفع عبر ${escapeHTML(pay)}:
        بعد الضغط على زر الواتساب بالأسفل، أرسل <strong>صورة اسكرين شوت إيصال التحويل</strong> في المحادثة مع رسالة الأوردر ليتم شحن طلبك فوراً!
      </div>
    ` : ''}
    <p style="font-size:0.84rem; color:var(--brand-dark); font-weight:800; margin-top:8px;">مهم: اضغط على الزر بالأسفل لإرسال الطلب${isElectronicPay ? ' واسكرين التحويل' : ''} لنا على واتساب لتأكيده فوراً.</p>
    <div style="margin-top:12px;">
      <a class="btn-brand" target="_blank" rel="noopener noreferrer" href="https://wa.me/${encodeURIComponent(waPhone)}?text=${encodeURIComponent(waMsg)}">
        <i class="fa-brands fa-whatsapp"></i> تأكيد الطلب${isElectronicPay ? ' وإرسال اسكرين التحويل' : ''} عبر واتساب
      </a>
    </div>
  `;

  // Auto-open WhatsApp with the order details (falls back to the button if blocked)
  const waUrl = `https://wa.me/${waPhone}?text=${encodeURIComponent(waMsg)}`;
  let waOpened = false;
  try {
    waOpened = !!window.open(waUrl, '_blank', 'noopener,noreferrer');
  } catch (waErr) {
    console.warn('[Diamond Checkout] WhatsApp auto-open blocked:', waErr);
  }
  if (!waOpened) {
    showToast('المتصفح منع فتح واتساب تلقائياً — اضغط زر واتساب بالأسفل لتأكيد الطلب');
  }

  // Prevent duplicate/empty submissions and reset the checkout state
  if (btnSubmit) {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'تأكيد الطلب الآن';
  }
  const form = document.querySelector('#checkoutModal form');
  if (form) {
    form.reset();
    form.style.display = 'none';
  }
  const promo = document.getElementById('promoInput');
  if (promo) promo.value = '';
  pendingOrderScreenshotDataUrl = '';
  state.appliedCoupon = null;
  state.cart = [];
  localStorage.setItem('diamond_cart', JSON.stringify(state.cart));
  updateCartView();
};

window.orderDirectWhatsApp = function(productId) {
  const p = state.products.find(x => x.id === productId);
  if (!p) return;
  const waPhone = getStoreWhatsapp();
  const text = `مرحباً diamond store، أرغب في طلب:\n• ${p.name}\n• الموديل: ${p.model}\n• السعر: ${formatEGP(p.price)}\n• شامل الشحن المجاني لجميع المحافظات وضمان سنة كاملة`;
  window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`, '_blank');
};

// ==================== OVERLAYS & GLOBAL EVENTS ====================
window.openDrawer = function(id) {
  closeAllOverlays();
  document.getElementById('overlayBackdrop')?.classList.add('open');
  document.getElementById(id)?.classList.add('open');
};

window.openModal = function(id) {
  closeAllOverlays();
  document.getElementById('overlayBackdrop')?.classList.add('open');
  document.getElementById(id)?.classList.add('open');
};

window.closeAllOverlays = function() {
  document.getElementById('overlayBackdrop')?.classList.remove('open');
  document.querySelectorAll('.cart-drawer, .center-modal').forEach(el => el.classList.remove('open'));
};

function showToast(msg) {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'toast-item';
  el.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--brand-light);"></i> <span>${escapeHTML(msg)}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3200);
}

function showRichCartToast(prod, qty = 1) {
  const stack = document.getElementById('toastStack');
  if (!stack || !prod) return;
  // Keep stack clean (max 2 rich toasts at once)
  const existingRich = stack.querySelectorAll('.rich-cart-toast');
  if (existingRich.length >= 2) existingRich[0].remove();

  const el = document.createElement('div');
  el.className = 'toast-item rich-cart-toast';
  el.innerHTML = `
    <img class="rich-toast-thumb" ${getSafeImageAttr(prod)} />
    <div class="rich-toast-info">
      <div class="rich-toast-kicker">
        <i class="fa-solid fa-circle-check"></i>
        <span>تمت الإضافة للسلة (${qty}×) • ${escapeHTML(prod.model)}</span>
      </div>
      <div class="rich-toast-title">${escapeHTML(prod.name)}</div>
    </div>
    <button type="button" class="rich-toast-action" onclick="openDrawer('cartDrawer'); this.closest('.toast-item')?.remove();">
      عرض السلة
    </button>
  `;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px) scale(0.95)';
    el.style.transition = 'opacity 0.28s ease, transform 0.28s ease';
    setTimeout(() => el.remove(), 300);
  }, 3800);
}

function bindStoreEvents() {
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
    const header = document.getElementById('siteHeader');
    if (header) {
      header.classList.toggle('scrolled', scrollTop > 24);
      const docHeight = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progressPct = Math.min(100, Math.max(0, (scrollTop / docHeight) * 100));
      header.style.setProperty('--scroll-progress', `${progressPct.toFixed(1)}%`);
    }
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) scrollBtn.classList.toggle('visible', scrollTop > 360);
    const stickyPdp = document.getElementById('pdpStickyBuyBar');
    if (stickyPdp) stickyPdp.classList.toggle('visible', scrollTop > 520);
  }, { passive: true });

  const handleCatalogSearch = (val) => {
    state.searchQuery = val;
    renderCatalogGrid();
  };

  const catSearchInput = document.getElementById('catalogSearchInput');
  const headSearchInput = document.getElementById('headerSearchInput');

  if (catSearchInput) {
    catSearchInput.addEventListener('input', (e) => {
      if (headSearchInput) headSearchInput.value = e.target.value;
      handleCatalogSearch(e.target.value);
    });
  }

  if (headSearchInput) {
    headSearchInput.addEventListener('input', (e) => {
      const val = e.target.value;
      if (catSearchInput) catSearchInput.value = val;
      handleCatalogSearch(val);
      renderLiveSearchDropdown(val);
    });

    headSearchInput.addEventListener('focus', (e) => {
      if (e.target.value.trim()) {
        renderLiveSearchDropdown(e.target.value);
      }
    });

    headSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        submitHeaderSearch();
      }
    });
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeLiveSearchDropdown();
      closeAllOverlays();
    }
  });

  // Close live search dropdown & category dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const wrap = document.getElementById('headerSearchWrap');
    if (wrap && !wrap.contains(e.target)) {
      closeLiveSearchDropdown();
    }
    const catBar = document.querySelector('.header-cat-bar');
    if (catBar && !catBar.contains(e.target)) {
      closeHeaderCategoryDropdown();
    }
  });

  document.getElementById('sortSelect')?.addEventListener('change', (e) => {
    state.sortBy = e.target.value;
    renderCatalogGrid();
  });

  document.getElementById('priceSlider')?.addEventListener('input', (e) => {
    state.maxPrice = Number(e.target.value);
    const valEl = document.getElementById('priceSliderVal');
    if (valEl) valEl.textContent = formatEGP(state.maxPrice);
    renderCatalogGrid();
  });
}

// ==================== 1. TOP UTILITY BAR 100% AUTO-ANIMATED RIGHT FLOW ====================
let topUtilityIndex = 0;
let topUtilityTimer = null;

function initTopUtilityTicker() {
  const track = document.getElementById('utilityTickerTrack');
  if (!track) return;
  const items = Array.from(track.querySelectorAll('.utility-item'));
  if (!items.length) return;

  items.forEach((el, idx) => {
    el.classList.toggle('active-ticker-item', idx === 0);
  });
  topUtilityIndex = 0;

  if (topUtilityTimer) clearInterval(topUtilityTimer);
  topUtilityTimer = setInterval(() => {
    stepTopUtilityItem(1);
  }, 3400);
}

window.stepTopUtilityItem = function(delta = 1) {
  const track = document.getElementById('utilityTickerTrack');
  if (!track) return;
  const items = Array.from(track.querySelectorAll('.utility-item'));
  if (items.length <= 1) return;

  items[topUtilityIndex]?.classList.remove('active-ticker-item');
  topUtilityIndex = (topUtilityIndex + delta + items.length) % items.length;
  const nextEl = items[topUtilityIndex];
  if (nextEl) {
    nextEl.classList.remove('active-ticker-item');
    void nextEl.offsetWidth;
    nextEl.classList.add('active-ticker-item');
  }
};

// ==================== 2. 100% AUTO-MOVING MULTI-CARD CUSTOMER REVIEWS MARQUEE ====================
function initReviewsCarousel() {
  const track = document.getElementById('egyReviewsTrack');
  const viewport = document.getElementById('egyReviewsCarouselViewport');
  if (!track || !viewport) return;

  if (!track.hasAttribute('data-marquee-cloned')) {
    const originalCards = Array.from(track.querySelectorAll('.egy-review-card'));
    if (!originalCards.length) return;

    originalCards.forEach(card => {
      const clone = card.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      clone.classList.add('is-marquee-clone');
      track.appendChild(clone);
    });
    track.setAttribute('data-marquee-cloned', '1');
  }

  track.classList.add('auto-marquee-ready');
}

// ==================== 2b. EDITABLE SITE SECTIONS (Supabase-driven) ====================
// Renders the admin-editable homepage sections from state.reviews / state.siteContent.
// Falls back silently to the static HTML already in index.html when empty.
function renderEditableSiteSections() {
  const sc = state.siteContent || {};

  // --- Top utility bar lines ---
  if (Array.isArray(sc.topbar) && sc.topbar.length) {
    const track = document.getElementById('utilityTickerTrack');
    if (track) {
      track.innerHTML = sc.topbar.map(line => `
        <div class="utility-item">
          <i class="fa-solid ${escapeHTML(line.icon || 'fa-circle-info')}"></i>
          <span>${escapeHTML(line.text || '')}</span>
        </div>
      `).join('');
      initTopUtilityTicker();
    }
  }

  // --- Customer reviews carousel ---
  if (Array.isArray(state.reviews) && state.reviews.length) {
    const track = document.getElementById('egyReviewsTrack');
    if (track) {
      const starHTML = n => Array.from({ length: 5 }, (_, i) =>
        `<i class="fa-solid fa-star${i < n ? '' : ' fa-star-half-stroke opacity-star'}"></i>`).join('');
      track.innerHTML = state.reviews.map((r, i) => `
        <article class="egy-review-card ${i % 2 === 0 ? 'egy-card-orange' : 'egy-card-navy'}">
          <div class="egy-review-top">
            <div class="egy-avatar">${escapeHTML(r.initials || (r.name || 'م').trim().charAt(0))}</div>
            <div class="egy-author-meta">
              <strong>${escapeHTML(r.name)}</strong>
              <div class="egy-stars">${starHTML(r.rating || 5)}</div>
            </div>
            <span class="egy-verified-pill"><i class="fa-solid fa-check"></i> قرار موثوق</span>
          </div>
          <p class="egy-review-text">${escapeHTML(String(r.short || r.text || '').split(/\s+/).slice(0, 12).join(' '))}</p>
          <div class="egy-review-foot">
            <span class="egy-prod-tag"><i class="fa-solid fa-circle-check"></i> ${escapeHTML(r.tag)}</span>
          </div>
        </article>
      `).join('');
      track.removeAttribute('data-marquee-cloned');
      initReviewsCarousel();
    }
  }

  // --- Footer about text ---
  if (sc.footer && typeof sc.footer === 'object') {
    const aboutEl = document.querySelector('.js-footer-about');
    if (aboutEl && sc.footer.about) aboutEl.textContent = sc.footer.about;
    const noteEl = document.querySelector('.js-footer-note');
    if (noteEl && sc.footer.note) noteEl.textContent = sc.footer.note;
  }

  // --- Social links ---
  if (Array.isArray(sc.social_links) && sc.social_links.length) {
    const wrap = document.querySelector('.js-footer-social');
    if (wrap) {
      wrap.innerHTML = sc.social_links.map(l => `
        <a href="${escapeHTML(l.url || '#')}" target="_blank" rel="noopener noreferrer"
           aria-label="${escapeHTML(l.label)}" title="${escapeHTML(l.label)}">
          <i class="fa-brands ${escapeHTML(l.icon || 'fa-link')}"></i>
        </a>
      `).join('');
    }
  }

  // --- Shipping text ---
  if (sc.shipping && typeof sc.shipping === 'object') {
    const badge = document.querySelector('.js-shipping-badge');
    if (badge && sc.shipping.hero_badge) badge.textContent = sc.shipping.hero_badge;
    const note = document.querySelector('.js-shipping-note');
    if (note && sc.shipping.note) note.textContent = sc.shipping.note;
  }
}
window.renderEditableSiteSections = renderEditableSiteSections;

// ==================== 3. STORE POLICIES ("صفحات تهمك" & RETURN/EXCHANGE POLICY MODAL) ====================
const SOKANY_BEST_CHOPPER_IDS = [
  'sk-7044a',
  'sk-7077n',
  'sk-06028',
  'sk-7033a',
  'sk-06020n',
  'sk-7099a',
  'sk-7000n'
];

window.requestReturnOrExchangeWhatsApp = function(mode = 'exchange') {
  const waPhone = getStoreWhatsapp();
  const storeName = (state.settings && state.settings.storeName) ? state.settings.storeName : 'Diamond Store';
  const text = mode === 'refund'
    ? `مرحباً ${storeName}، أريد تقديم طلب استرجاع منتج 🔙`
    : `مرحباً ${storeName}، أريد تقديم طلب استبدال منتج 🔄`;
  window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`, '_blank');
};

window.openStoreWhatsappChat = function() {
  const waPhone = getStoreWhatsapp();
  const storeName = (state.settings && state.settings.storeName) ? state.settings.storeName : 'Diamond Store';
  const text = `مرحباً ${storeName}، أرغب في الاستفسار عن أجهزة سوكاني الأصلية`;
  window.open(`https://wa.me/${waPhone}?text=${encodeURIComponent(text)}`, '_blank');
};

window.submitNewsletterForm = function(e) {
  if (e) e.preventDefault();
  const inp = e.target?.querySelector('input[type="email"]');
  if (inp) inp.value = '';
  showToast('شكراً لاشتراكك في نشرة عروض Diamond Store!');
};

window.scrollPolicyBestSellers = function(delta = 1) {
  const track = document.getElementById('policyBestSellersTrack');
  if (!track) return;
  const step = 280;
  track.scrollBy({ left: -delta * step, behavior: 'smooth' });
};

function renderPolicyBestSellersHTML() {
  const bestProducts = SOKANY_BEST_CHOPPER_IDS
    .map(id => state.products.find(p => p.id === id))
    .filter(Boolean);

  const list = bestProducts.length ? bestProducts : state.products.slice(0, 7);

  return `
    <div class="policy-bestsellers-block">
      <div class="policy-bestsellers-head">
        <div>
          <span class="section-kicker"><i class="fa-solid fa-fire"></i> الأكثر مبيعًا في Diamond Store</span>
          <h4>الأكثر مبيعًا — كبات سوكاني الأصلية</h4>
        </div>
        <div class="policy-bs-nav">
          <button type="button" class="rev-nav-btn" onclick="scrollPolicyBestSellers(-1)" title="السابق">
            <i class="fa-solid fa-chevron-right"></i> <span>السابق</span>
          </button>
          <button type="button" class="rev-nav-btn" onclick="scrollPolicyBestSellers(1)" title="التالي">
            <span>التالي</span> <i class="fa-solid fa-chevron-left"></i>
          </button>
        </div>
      </div>

      <div class="policy-bestsellers-track" id="policyBestSellersTrack">
        ${list.map(p => `
          <div class="policy-bs-card">
            <div class="policy-bs-img" onclick="closeAllOverlays(); openProductPage('${p.id}')">
              <img ${getSafeImageAttr(p)} />
              <span class="policy-bs-sku">${escapeHTML(p.model)}</span>
            </div>
            <h5 onclick="closeAllOverlays(); openProductPage('${p.id}')">${escapeHTML(p.name)}</h5>
            <div class="policy-bs-price">LE ${Number(p.price || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <button type="button" class="btn-brand policy-bs-add" onclick="addToCart('${p.id}')">
              <i class="fa-solid fa-bag-shopping"></i> أضف إلى السلة
            </button>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

window.openStorePolicyModal = function(policyKey = 'refund') {
  const modal = document.getElementById('storePolicyModal');
  const body = document.getElementById('storePolicyModalBody');
  if (!modal || !body) return;

  const storeName = (state.settings && state.settings.storeName) ? state.settings.storeName : 'Diamond Store';
  const warrantyTxt = (state.settings && state.settings.warrantyText) ? state.settings.warrantyText : 'ضمان معتمد رسمي من شركة المغربي لمدة سنة';

  const tabs = [
    { key: 'refund', label: 'سياسة الاسترجاع والاستبدال', icon: 'fa-rotate-left' },
    { key: 'shipping', label: 'سياسة الشحن والتوصيل', icon: 'fa-truck-fast' },
    { key: 'warranty', label: 'مراكز صيانة وضمان سوكاني', icon: 'fa-screwdriver-wrench' },
    { key: 'privacy', label: 'سياسة الخصوصية', icon: 'fa-user-shield' },
    { key: 'terms', label: 'الشروط والأحكام', icon: 'fa-file-contract' },
    { key: 'contact', label: 'اتصل بنا', icon: 'fa-headset' }
  ];

  let mainContentHTML = '';

  if (policyKey === 'shipping') {
    mainContentHTML = `
      <div class="policy-hero-banner">
        <span class="policy-badge"><i class="fa-solid fa-truck-fast"></i> الشحن والتوصيل السريع</span>
        <h2>سياسة الشحن والتوصيل في دايموند ستور (${escapeHTML(storeName)})</h2>
        <p>بنوصلك كل أجهزة سوكاني الأصلية لحد باب البيت في جميع محافظات مصر مع معاينة الطلب قبل الاستلام.</p>
      </div>
      <div class="policy-cards-grid">
        <div class="policy-info-card">
          <h4><i class="fa-solid fa-clock"></i> مدة التوصيل</h4>
          <ul>
            <li>القاهرة والجيزة والإسكندرية: خلال <strong>24 إلى 48 ساعة</strong>.</li>
            <li>محافظات الدلتا والقناة والصعيد: خلال <strong>48 إلى 72 ساعة عمل</strong>.</li>
          </ul>
        </div>
        <div class="policy-info-card">
          <h4><i class="fa-solid fa-gift"></i> مصاريف الشحن والمعاينة</h4>
          <ul>
            <li>شحن مجاني تماماً لجميع المحافظات على عروض المتجر.</li>
            <li>حق المعاينة والتأكد من سلامة الكرتونة والموديل الأصلي قبل الدفع للمندوب.</li>
          </ul>
        </div>
      </div>
    `;
  } else if (policyKey === 'warranty') {
    mainContentHTML = `
      <div class="policy-hero-banner">
        <span class="policy-badge"><i class="fa-solid fa-award"></i> الضمان المعتمد والصيانة</span>
        <h2>عناوين مراكز صيانة سوكاني والضمان الرسمي</h2>
        <p>${escapeHTML(warrantyTxt)} ضد عيوب الصناعة مع توافر جميع قطع الغيار الأصلية.</p>
      </div>
      <div class="policy-cards-grid">
        <div class="policy-info-card">
          <h4><i class="fa-solid fa-shield-halved"></i> تغطية الضمان الرسمي</h4>
          <ul>
            <li><strong>${escapeHTML(warrantyTxt)}</strong> مختوم مع فاتورة الشراء الرسمية من دايموند ستور.</li>
            <li>استبدال فوري مجاناً خلال أول 14 يوم في حال ظهور أي عيب صناعة.</li>
            <li>صيانة مجانية وقطع غيار أصلية طوال فترة الضمان.</li>
          </ul>
        </div>
        <div class="policy-info-card">
          <h4><i class="fa-solid fa-location-dot"></i> التواصل مع خدمة الصيانة والضمان</h4>
          <ul>
            <li>تقدر تتواصل مع فريق خدمة عملاء دايموند ستور مباشرة على واتساب بإرسال صورة الفاتورة، وهنوجهك لأقرب مركز خدمة معتمد لشركة المغربي أو نبعتلك مندوب يستلم الجهاز من باب البيت.</li>
          </ul>
        </div>
      </div>
    `;
  } else if (policyKey === 'privacy') {
    mainContentHTML = `
      <div class="policy-hero-banner">
        <span class="policy-badge"><i class="fa-solid fa-lock"></i> حماية بيانات العملاء</span>
        <h2>سياسة الخصوصية والأمان — ${escapeHTML(storeName)}</h2>
        <p>خصوصية بياناتك وأمان معاملاتك في دايموند ستور أولوية قصوى لدينا.</p>
      </div>
      <div class="policy-cards-grid">
        <div class="policy-info-card">
          <h4><i class="fa-solid fa-user-check"></i> كيف نستخدم بياناتك؟</h4>
          <ul>
            <li>نستخدم الاسم ورقم الموبايل والعنوان فقط لتوصيل طلبك وإصدار شهادة الضمان الرسمية.</li>
            <li>لا نقوم بمشاركة بياناتك مع أي جهة خارجية غير شركة الشحن المسؤولة عن تسليم الأوردر.</li>
          </ul>
        </div>
        <div class="policy-info-card">
          <h4><i class="fa-solid fa-credit-card"></i> أمان الدفع</h4>
          <ul>
            <li>جميع عمليات الدفع عند الاستلام أو عبر InstaPay وفودافون كاش مؤمنة بالكامل ويتم توثيقها بفاتورة رسمية.</li>
          </ul>
        </div>
      </div>
    `;
  } else if (policyKey === 'terms') {
    mainContentHTML = `
      <div class="policy-hero-banner">
        <span class="policy-badge"><i class="fa-solid fa-file-signature"></i> الشروط والأحكام</span>
        <h2>الشروط والأحكام — دايموند ستور (${escapeHTML(storeName)})</h2>
        <p>بتسوقك من متجر دايموند ستور فإنك تحصل على منتجات سوكاني الأصلية بضمان رسمي كامل.</p>
      </div>
      <div class="policy-cards-grid">
        <div class="policy-info-card">
          <h4><i class="fa-solid fa-circle-check"></i> التزامات المتجر</h4>
          <ul>
            <li>توريد أجهزة سوكاني الأصلية 100% مطابقة للمواصفات والقدرة المعلنة في صفحة كل منتج.</li>
            <li>إرفاق فاتورة شراء رسمية وشهادة ${escapeHTML(warrantyTxt)}.</li>
          </ul>
        </div>
        <div class="policy-info-card">
          <h4><i class="fa-solid fa-scale-balanced"></i> الأسعار والطلبات</h4>
          <ul>
            <li>الأسعار الموضحة بالجنيه المصري شاملة الضريبة وعروض الشحن المجاني المعلنة.</li>
            <li>يحق للعميل إلغاء أو تعديل الطلب قبل خروج الشحنة بدون أي رسوم.</li>
          </ul>
        </div>
      </div>
    `;
  } else if (policyKey === 'contact') {
    const waNum = getStoreWhatsapp();
    mainContentHTML = `
      <div class="policy-hero-banner">
        <span class="policy-badge"><i class="fa-solid fa-headset"></i> خدمة العملاء السريعة 24/7</span>
        <h2>قسم اتصل بنا — فريق دعم دايموند ستور (${escapeHTML(storeName)})</h2>
        <p>متواجدين يومياً للرد الفوري على استفساراتكم، حجز الطلبات، باكدج العروسة، ومتابعة الشحن والضمان.</p>
      </div>
      <div class="policy-cards-grid">
        <div class="policy-info-card highlight-card">
          <h4><i class="fa-brands fa-whatsapp"></i> التواصل المباشر عبر واتساب</h4>
          <p class="policy-lead-text">تواصل مباشرة مع فريق مبيعات وخدمة عملاء <strong>${escapeHTML(storeName)}</strong> للرد السريع وتأكيد الطلبات:</p>
          <div style="margin-top:12px;">
            <button type="button" class="policy-wa-btn exchange" style="width:100%; justify-content:center;" onclick="openStoreWhatsappChat()">
              <i class="fa-brands fa-whatsapp"></i> محادثة فورية عبر واتساب (${escapeHTML(waNum)})
            </button>
          </div>
        </div>
        <div class="policy-info-card">
          <h4><i class="fa-solid fa-clock"></i> مواعيد العمل وخدمة الشحن</h4>
          <ul>
            <li><i class="fa-solid fa-check"></i> <strong>خدمة العملاء والواتساب:</strong> متاحون يومياً طوال أيام الأسبوع.</li>
            <li><i class="fa-solid fa-check"></i> <strong>الشحن والتوصيل:</strong> شحن مجاني تماماً لجميع محافظات مصر خلال 24 - 48 ساعة.</li>
            <li><i class="fa-solid fa-check"></i> <strong>الضمان الرسمي:</strong> ${escapeHTML(warrantyTxt)}.</li>
          </ul>
        </div>
      </div>
      <div class="policy-cta-banner">
        <div class="policy-cta-text">
          <h3>خدمات سريعة للعملاء</h3>
          <p>اختر الخدمة المطلوبة للتوجه مباشرة أو فتح محادثة واتساب مخصصة:</p>
        </div>
        <div class="policy-wa-actions">
          <button type="button" class="policy-wa-btn exchange" onclick="openStoreWhatsappChat()">
            <i class="fa-brands fa-whatsapp"></i> استفسار عن منتج أو باكدج العروسة
          </button>
          <button type="button" class="policy-wa-btn refund" onclick="openStorePolicyModal('refund')">
            <i class="fa-solid fa-rotate-left"></i> طلب استبدال أو استرجاع (14 يوم)
          </button>
        </div>
      </div>
    `;
  } else {
    // Default & Primary: FULL RETURN & EXCHANGE POLICY ("سياسة الاسترجاع والاستبدال")
    mainContentHTML = `
      <div class="policy-hero-banner">
        <span class="policy-badge"><i class="fa-solid fa-shield-heart"></i> حقك محفوظ 100%</span>
        <h2>سياسة الاسترجاع والاستبدال</h2>
        <p>في <strong>دايموند ستور (${escapeHTML(storeName)})</strong>، حقك محفوظ بالكامل… وعلشان كده بنوفرلك سياسة استرجاع واستبدال واضحة وسهلة.</p>
      </div>

      <div class="policy-cards-grid">
        <!-- 1. المدة المسموحة -->
        <div class="policy-info-card highlight-card">
          <h4><i class="fa-solid fa-calendar-check"></i> إيه هي المدة المسموحة للإرجاع أو الاستبدال؟</h4>
          <p class="policy-lead-text">عندك <strong>14 يوم من تاريخ الاستلام</strong> للاسترجاع أو الاستبدال بدون أي سبب.</p>
        </div>

        <!-- 2. مصاريف الشحن -->
        <div class="policy-info-card">
          <h4><i class="fa-solid fa-truck-ramp-box"></i> هل فيه مصاريف شحن عند الإرجاع أو الاستبدال؟</h4>
          <ul>
            <li><i class="fa-solid fa-circle-dot"></i> <strong>في حالة تغيير رأي العميل:</strong> يتم خصم مصاريف الشحن من المبلغ المُسترجع.</li>
            <li><i class="fa-solid fa-circle-check"></i> <strong>في حالة توصيل منتج غلط للعميل:</strong> الشحن والاستبدال مجانًا بالكامل.</li>
            <li><i class="fa-solid fa-circle-check"></i> <strong>في حالة المنتج به عيب:</strong> الشحن والاستبدال أو الاسترجاع مجانًا بالكامل.</li>
          </ul>
        </div>

        <!-- 3. شروط قبول المنتج -->
        <div class="policy-info-card">
          <h4><i class="fa-solid fa-box-open"></i> إيه شروط قبول المنتج؟</h4>
          <ul>
            <li><i class="fa-solid fa-check"></i> يكون المنتج في عبوتـه الأصلية.</li>
            <li><i class="fa-solid fa-check"></i> لم يتم فتحه أو استخدامه.</li>
            <li><i class="fa-solid fa-check"></i> تضمين كل الملحقات وفواتير الضمان.</li>
            <li><i class="fa-solid fa-check"></i> في حالة الفتح، لازم يكون <strong>فتح تجريبي فقط</strong> (بدون استخدام).</li>
          </ul>
        </div>

        <!-- 4. خطوات استرجاع أو استبدال المنتج -->
        <div class="policy-info-card">
          <h4><i class="fa-solid fa-list-check"></i> خطوات استرجاع أو استبدال المنتج</h4>
          <ol class="policy-numbered-steps">
            <li><span>1</span> إرسال صورة الفاتورة وصور أو فيديو توضيحي للمشكلة.</li>
            <li><span>2</span> يتم فحص المنتج من فريق مختص للتأكد من وجود المشكلة.</li>
            <li><span>3</span> بعد الموافقة، يتم استرجاع المبلغ أو استبدال المنتج.</li>
            <li><span>4</span> في حالة الاسترجاع، يتم استلام المبلغ خلال <strong>48 ساعة</strong> على الحساب البنكي أو المحفظة الإلكترونية.</li>
          </ol>
        </div>

        <!-- 5. لو المنتج فيه مشكلة بعد التشغيل & عدم وجود نفس المنتج -->
        <div class="policy-info-card">
          <h4><i class="fa-solid fa-bolt"></i> لو المنتج فيه مشكلة بعد التشغيل</h4>
          <p class="policy-lead-text">لو ظهر عيب خلال <strong>أول 14 يوم</strong>، يتم الاستبدال فورًا بدون أي مصاريف.</p>
          <div class="policy-sub-divider"></div>
          <h4><i class="fa-solid fa-arrows-rotate"></i> في حالة عدم وجود نفس المنتج</h4>
          <p class="policy-lead-text">بيتم اختيار بديل مناسب بنفس السعر أو أعلى (مع دفع الفرق فقط)، أو استرجاع المبلغ كامل.</p>
        </div>

        <!-- 6. متى يتم رفض طلب الاسترجاع؟ & إمتى يوصل الفلوس؟ -->
        <div class="policy-info-card reject-card">
          <h4><i class="fa-solid fa-triangle-exclamation"></i> متى يتم رفض طلب الاسترجاع؟</h4>
          <ul>
            <li><i class="fa-solid fa-xmark"></i> لو المنتج مستخدم استخدام كامل.</li>
            <li><i class="fa-solid fa-xmark"></i> لو ناقص أي ملحقات أو العبوة مفقودة.</li>
            <li><i class="fa-solid fa-xmark"></i> لو حصل كسر نتيجة سوء استخدام.</li>
            <li><i class="fa-solid fa-xmark"></i> لو المنتج اشتغل استعمال واضح وليس تجربة بسيطة.</li>
          </ul>
          <div class="policy-sub-divider"></div>
          <h4><i class="fa-solid fa-wallet"></i> إمتى يوصل الفلوس؟</h4>
          <p class="policy-lead-text">بعد فحص المنتج خلال <strong>2 إلى 6 أيام عمل</strong>، المبلغ بيتحول فورًا على حساب بنكي أو محفظة إلكترونية.</p>
        </div>
      </div>

      <!-- جاهز لتقديم طلبك؟ -->
      <div class="policy-cta-banner">
        <div class="policy-cta-text">
          <h3>جاهز لتقديم طلبك؟</h3>
          <p>اضغط على الزر المناسب وهيفتح معاك واتساب خدمة عملاء <strong>${escapeHTML(storeName)}</strong> مباشرة ببيانات الطلب:</p>
        </div>
        <div class="policy-wa-actions">
          <button type="button" class="policy-wa-btn exchange" onclick="requestReturnOrExchangeWhatsApp('exchange')">
            <i class="fa-solid fa-arrows-rotate"></i> طلب استبدال منتج 🔄
          </button>
          <button type="button" class="policy-wa-btn refund" onclick="requestReturnOrExchangeWhatsApp('refund')">
            <i class="fa-solid fa-rotate-left"></i> طلب استرجاع منتج 🔙
          </button>
        </div>
      </div>

      <!-- شكرا + ثقة أكثر من 50 ألف عميل -->
      <div class="policy-thanks-strip">
        <div class="policy-thanks-info">
          <span class="thanks-badge">شكراً لثقتكم</span>
          <h4>كل منتجات سوكاني الأصلية في مكان واحد، وثقة أكتر من 50 ألف عميل في ${escapeHTML(storeName)}</h4>
        </div>
        <div class="policy-thanks-actions">
          <button type="button" class="btn-brand" onclick="closeAllOverlays(); setActiveCategory('all');">
            <i class="fa-solid fa-bag-shopping"></i> تسوق الآن
          </button>
          <div class="policy-social-pills">
            <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer" title="Facebook"><i class="fa-brands fa-facebook-f"></i></a>
            <a href="https://www.instagram.com" target="_blank" rel="noopener noreferrer" title="Instagram"><i class="fa-brands fa-instagram"></i></a>
            <a href="#whatsapp" onclick="openStoreWhatsappChat(); return false;" title="WhatsApp"><i class="fa-brands fa-whatsapp"></i></a>
            <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" title="TikTok"><i class="fa-brands fa-tiktok"></i></a>
          </div>
        </div>
      </div>

      <!-- الأكثر مبيعًا (كبات سوكاني) -->
      ${renderPolicyBestSellersHTML()}
    `;
  }

  body.innerHTML = `
    <div class="policy-modal-shell">
      <div class="policy-modal-topbar">
        <div class="policy-tabs-nav">
          ${tabs.map(t => `
            <button type="button" class="policy-tab-pill ${t.key === policyKey ? 'active' : ''}" onclick="openStorePolicyModal('${t.key}')">
              <i class="fa-solid ${t.icon}"></i>
              <span>${t.label}</span>
            </button>
          `).join('')}
        </div>
        <button type="button" class="modal-close-btn" onclick="closeAllOverlays()" aria-label="إغلاق">&times;</button>
      </div>

      <div class="policy-modal-scroll-content" id="policyModalScrollRoot">
        ${mainContentHTML}

        <div class="policy-modal-bottom-bar">
          <button type="button" class="btn-outline" onclick="document.getElementById('policyModalScrollRoot')?.scrollTo({top:0, behavior:'smooth'})">
            <i class="fa-solid fa-arrow-up"></i> العودة إلى الأعلى
          </button>
          <button type="button" class="btn-brand" onclick="closeAllOverlays()">
            <i class="fa-solid fa-check"></i> إغلاق والعودة للمتجر
          </button>
        </div>
      </div>
    </div>
  `;

  closeAllOverlays();
  document.getElementById('overlayBackdrop')?.classList.add('open');
  modal.classList.add('open');
};

function checkPolicyQueryOrHash() {
  const hash = (window.location.hash || '').replace('#', '');
  if (hash.startsWith('policy-')) {
    const key = hash.replace('policy-', '') || 'refund';
    setTimeout(() => openStorePolicyModal(key), 200);
  }
}

