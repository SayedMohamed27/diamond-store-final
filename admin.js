// ============================================================================
// DAIMOND STORE — PROFESSIONAL ADMIN DASHBOARD & CMS ENGINE (admin.js)
// Controls Products, Specs/Features, Categories, Hero Slides, Settings, Orders & Invoices
// ============================================================================

let adminState = {
  products: [],
  categories: [],
  heroSlides: [],
  settings: {},
  orders: [],
  coupons: {},
  uploadedBase64Image: ''
};

function formatEGP(val) {
  return Number(val || 0).toLocaleString('en-US') + ' ج.م';
}

document.addEventListener('DOMContentLoaded', () => {
  loadAdminAllData();
  bindImageFileUpload();
  renderAllAdminViews();

  // Re-render only when store data changes in another tab (ignore cart/wishlist changes,
  // otherwise the forms being edited here get overwritten while typing)
  const ADMIN_SYNC_KEYS = ['daimond_catalog_v4', 'daimond_categories_v4', 'daimond_categories_v5', 'daimond_hero_v4', 'daimond_hero_v5', 'daimond_hero_v6', 'daimond_settings_v4', 'daimond_orders', 'daimond_coupons'];
  window.addEventListener('storage', (e) => {
    if (e.key !== null && !ADMIN_SYNC_KEYS.includes(e.key)) return;
    loadAdminAllData();
    if (e.key === 'daimond_settings_v4') {
      populateSiteSettingsForm();
      renderAdminBrideBundleManager();
      updateNavBadges();
      return;
    }
    renderOverviewAnalytics();
    populateCategorySelects();
    renderAdminProductsTable();
    renderAdminCategoriesTable();
    renderAdminOrders();
    renderAdminBrideBundleManager();
    renderAdminHeroSlidesEditor();
    renderAdminCoupons();
    updateNavBadges();
  });
});

function readAdminJSON(key, fallback) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || 'null');
    return parsed === null ? fallback : parsed;
  } catch (e) {
    return fallback;
  }
}

// Convert a local Egyptian mobile (01xxxxxxxxx) to wa.me international format (201xxxxxxxxx)
function toWhatsappIntl(phone) {
  let digits = normalizeDigits(phone).replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '2' + digits;      // 010... -> 2010...
  else if (digits.startsWith('1') && digits.length === 10) digits = '20' + digits;
  return digits;
}

function loadAdminAllData() {
  adminState.products = getStoreProducts();
  adminState.categories = getStoreCategories();
  adminState.heroSlides = getHeroSlides();
  adminState.settings = getStoreSettings();
  adminState.orders = readAdminJSON('daimond_orders', []);
  adminState.coupons = readAdminJSON('daimond_coupons', { DAIMOND10: 10, SOKANY15: 15, BRIDE25: 25 });
}

function renderAllAdminViews() {
  populateCategorySelects();
  renderOverviewAnalytics();
  renderAdminProductsTable();
  renderAdminCategoriesTable();
  renderAdminOrders();
  renderAdminBrideBundleManager();
  populateSiteSettingsForm();
  renderAdminHeroSlidesEditor();
  renderAdminCoupons();
  updateNavBadges();
}

function updateNavBadges() {
  const bProd = document.getElementById('navBadgeProducts');
  const bCat = document.getElementById('navBadgeCategories');
  const bOrd = document.getElementById('navBadgeOrders');
  const bBnd = document.getElementById('navBadgeBundle');
  if (bProd) bProd.textContent = adminState.products.length;
  if (bCat) bCat.textContent = adminState.categories.filter(c => c.id !== 'all').length;
  if (bOrd) bOrd.textContent = adminState.orders.length;
  if (bBnd) {
    const pool = getAdminBundlePoolIds();
    bBnd.textContent = pool.length;
  }
}

window.switchAdminTab = function(tabId, btnEl) {
  document.querySelectorAll('.tab-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.admin-nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(tabId)?.classList.add('active');
  if (btnEl) btnEl.classList.add('active');
};

window.goToAddNewProduct = function() {
  const prodBtn = document.querySelectorAll('.admin-nav-btn')[1];
  switchAdminTab('productsTab', prodBtn);
  resetProductForm();
  document.getElementById('pName')?.focus();
};

// ==================== 1. OVERVIEW & ANALYTICS ====================
function renderOverviewAnalytics() {
  const validOrders = adminState.orders.filter(o => o.status !== 'ملغي');
  const totalRevenue = validOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
  const pendingOrders = adminState.orders.filter(o => o.status === 'جديد').length;
  const inStockCount = adminState.products.filter(p => p.inStock !== false).length;
  const avgPrice = adminState.products.length
    ? Math.round(adminState.products.reduce((s, p) => s + Number(p.price || 0), 0) / adminState.products.length)
    : 0;

  document.getElementById('kpiTotalRevenue').textContent = formatEGP(totalRevenue);
  document.getElementById('kpiTotalOrders').textContent = adminState.orders.length;
  document.getElementById('kpiPendingOrders').textContent = `${pendingOrders} طلب جديد بانتظار التأكيد`;
  document.getElementById('kpiTotalProducts').textContent = adminState.products.length;
  document.getElementById('kpiInStockCount').textContent = `${inStockCount} جهاز متوفر بالمخزن`;
  document.getElementById('kpiAvgPrice').textContent = formatEGP(avgPrice);

  // Category distribution bars
  const chartEl = document.getElementById('overviewCategoryChart');
  if (chartEl) {
    const cats = adminState.categories.filter(c => c.id !== 'all' && c.id !== 'contact');
    const totalProds = Math.max(1, adminState.products.length);
    chartEl.innerHTML = cats.map(c => {
      const count = adminState.products.filter(p => doesProductMatchCategory(p, c.id)).length;
      const pct = Math.round((count / totalProds) * 100);
      return `
        <div class="cat-bar-row">
          <div style="width:155px; font-size:0.84rem; font-weight:800; color:var(--text-dark);">${escapeHTML(c.name)}</div>
          <div class="cat-bar-track">
            <div class="cat-bar-fill" style="width:${pct}%;"></div>
          </div>
          <div style="width:70px; text-align:left; font-size:0.8rem; font-weight:800; color:var(--brand-dark);">${count} جهاز</div>
        </div>
      `;
    }).join('');
  }

  // Recent Orders preview
  const recEl = document.getElementById('overviewRecentOrders');
  if (recEl) {
    if (adminState.orders.length === 0) {
      recEl.innerHTML = `<p style="padding:24px; text-align:center; color:var(--text-muted); font-size:0.86rem;">لا توجد طلبات مسجلة بعد. يمكنك تجربة إرسال طلب من الموقع أو الضغط على "إضافة طلب تجريبي".</p>`;
    } else {
      recEl.innerHTML = adminState.orders.slice(0, 4).map(o => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 12px; border:1px solid var(--border); border-radius:12px; margin-bottom:8px; background:var(--bg-page);">
          <div>
            <strong style="color:var(--brand-dark); font-size:0.86rem;">${escapeHTML(o.id)}</strong> — <strong>${escapeHTML(o.customer)}</strong>
            <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(o.gov)} • ${escapeHTML(o.phone)} • ${escapeHTML(o.date)}</div>
          </div>
          <div style="text-align:left;">
            <div style="font-weight:900; font-size:0.9rem;">${formatEGP(o.total)}</div>
            <span class="card-badge" style="font-size:0.7rem;">${escapeHTML(o.status)}</span>
          </div>
        </div>
      `).join('');
    }
  }
}

// ==================== 2. ADVANCED PRODUCTS MANAGEMENT ====================
function populateCategorySelects() {
  const cats = adminState.categories.filter(c => c.id !== 'all' && c.id !== 'contact');
  const formSelect = document.getElementById('pCat');
  const filterSelect = document.getElementById('adminProdCatFilter');
  const quickCatSelect = document.getElementById('catQuickSelect');
  const targetCatSelect = document.getElementById('subItemTargetCatSelect');

  if (formSelect) {
    const currentVal = formSelect.value;
    formSelect.innerHTML = cats.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
    if (currentVal && cats.some(c => c.id === currentVal)) formSelect.value = currentVal;
  }

  if (filterSelect) {
    const currentFilter = filterSelect.value || 'all';
    filterSelect.innerHTML = `<option value="all">جميع الأقسام (${adminState.products.length})</option>` +
      cats.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
    filterSelect.value = currentFilter;
  }

  if (quickCatSelect) {
    const curQuick = quickCatSelect.value;
    quickCatSelect.innerHTML = `<option value="">-- اختر قسماً لتعديل فروع القائمة المنسدلة الخاصة به --</option>` +
      adminState.categories.map((c, i) => `<option value="${escapeHTML(c.id)}">${i + 1}- ${escapeHTML(c.navTitle || c.name)} (${escapeHTML(c.id)})</option>`).join('');
    if (curQuick) quickCatSelect.value = curQuick;
  }

  if (targetCatSelect) {
    const curTarget = targetCatSelect.value;
    targetCatSelect.innerHTML = `<option value="">نفس القسم الحالي</option>` +
      adminState.categories.map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.navTitle || c.name)} (${escapeHTML(c.id)})</option>`).join('');
    if (curTarget) targetCatSelect.value = curTarget;
  }
}

function bindImageFileUpload() {
  const fileInput = document.getElementById('pImgFile');
  if (fileInput) {
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showAdminToast('الملف المختار ليس صورة');
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        // Downscale & compress the image so it fits in localStorage (~5MB limit for the whole store)
        const img = new Image();
        img.onload = () => {
          const MAX = 900;
          const scale = Math.min(1, MAX / Math.max(img.width, img.height));
          const canvas = document.createElement('canvas');
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
          adminState.uploadedBase64Image = dataUrl;
          document.getElementById('pImg').value = dataUrl;
          showAdminToast(`تم تجهيز الصورة (${Math.round(dataUrl.length / 1024)} KB) — اضغط حفظ المنتج`);
        };
        img.onerror = () => showAdminToast('تعذر قراءة الصورة');
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  const videoInput = document.getElementById('pVideoFile');
  if (videoInput) {
    videoInput.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (!file.type.startsWith('video/')) {
        showAdminToast('الملف المختار ليس ملف فيديو');
        return;
      }
      const editId = document.getElementById('editProdId')?.value?.trim() || ('new_' + Date.now());
      const videoKey = `idb://video_${editId}_${Date.now()}`;
      try {
        if (typeof saveAdminVideoBlob === 'function') {
          await saveAdminVideoBlob(videoKey, file);
          const vInput = document.getElementById('pVideoUrl');
          if (vInput) vInput.value = videoKey;
          updateAdminVideoPreview(videoKey, file);
          showAdminToast(`تم رفع وتجهيز الفيديو (${(file.size / (1024 * 1024)).toFixed(1)} MB) بنجاح — اضغط حفظ المنتج`);
          return;
        }
      } catch (err) {
        console.warn('IndexedDB video save fallback:', err);
      }

      if (file.size <= 2.5 * 1024 * 1024) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          document.getElementById('pVideoUrl').value = ev.target.result;
          updateAdminVideoPreview(ev.target.result);
          showAdminToast(`تم تجهيز الفيديو (${Math.round(file.size / 1024)} KB) — اضغط حفظ المنتج`);
        };
        reader.readAsDataURL(file);
      } else {
        document.getElementById('pVideoUrl').value = `assets/${file.name}`;
        updateAdminVideoPreview(`assets/${file.name}`);
        showAdminToast('تم تعيين مسار الفيديو — اضغط حفظ المنتج');
      }
    });
  }
}

window.updateAdminVideoPreview = async function(rawUrl, directBlob = null) {
  const box = document.getElementById('adminVideoPreviewBox');
  if (!box) return;
  const url = String(rawUrl || '').trim();
  if (!url) {
    box.style.display = 'none';
    box.innerHTML = '';
    return;
  }

  box.style.display = 'block';
  if (url.startsWith('idb://')) {
    const blob = directBlob || (typeof getAdminVideoBlob === 'function' ? await getAdminVideoBlob(url) : null);
    if (blob) {
      const objUrl = URL.createObjectURL(blob);
      box.innerHTML = `
        <div style="color:#fff; font-size:0.78rem; font-weight:800; margin-bottom:6px;"><i class="fa-solid fa-circle-check" style="color:#22c55e;"></i> معاينة الفيديو المرفوع من جهازك:</div>
        <video src="${objUrl}" controls playsinline style="max-width:100%; max-height:240px; border-radius:8px; background:#000;"></video>
      `;
    } else {
      box.innerHTML = `<div style="color:#ffb703; font-size:0.8rem; padding:8px;">فيديو محفوظ (${escapeHTML(url)})</div>`;
    }
    return;
  }

  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,15})/);
  if (ytMatch && ytMatch[1]) {
    box.innerHTML = `
      <div style="color:#fff; font-size:0.78rem; font-weight:800; margin-bottom:6px;"><i class="fa-brands fa-youtube" style="color:#ef4444;"></i> معاينة فيديو يوتيوب:</div>
      <iframe src="https://www.youtube.com/embed/${ytMatch[1]}?rel=0" style="width:100%; height:220px; border:0; border-radius:8px;" allowfullscreen></iframe>
    `;
    return;
  }

  if (/^(data:video\/|.*\.(mp4|webm|ogg)(\?.*)?$)/i.test(url)) {
    box.innerHTML = `
      <div style="color:#fff; font-size:0.78rem; font-weight:800; margin-bottom:6px;"><i class="fa-solid fa-video" style="color:var(--brand-light);"></i> معاينة ملف الفيديو:</div>
      <video src="${escapeHTML(url)}" controls playsinline style="max-width:100%; max-height:240px; border-radius:8px; background:#000;"></video>
    `;
    return;
  }

  box.innerHTML = `<div style="color:#fff; font-size:0.8rem; padding:6px;"><i class="fa-solid fa-circle-play" style="color:var(--brand-light);"></i> رابط الفيديو جاهز للعرض في صفحة المنتج: <span dir="ltr">${escapeHTML(url)}</span></div>`;
};

window.clearAdminProductVideo = function() {
  const vInput = document.getElementById('pVideoUrl');
  const fInput = document.getElementById('pVideoFile');
  const oldVal = vInput ? vInput.value.trim() : '';
  if (oldVal.startsWith('idb://') && typeof deleteAdminVideoBlob === 'function') {
    deleteAdminVideoBlob(oldVal);
  }
  if (vInput) vInput.value = '';
  if (fInput) fInput.value = '';
  updateAdminVideoPreview('');
  showAdminToast('تم حذف الفيديو من الحقل — اضغط حفظ المنتج لتأكيد التعديل');
};

function parseSpecsTextarea(rawText) {
  const specsObj = {};
  (rawText || '').split('\n').forEach(line => {
    const idx = line.indexOf(':');
    if (idx > -1) {
      const k = line.slice(0, idx).trim();
      const v = line.slice(idx + 1).trim();
      if (k && v) specsObj[k] = v;
    }
  });
  return specsObj;
}

function formatSpecsToTextarea(specsObj) {
  if (!specsObj || typeof specsObj !== 'object') return '';
  return Object.entries(specsObj).map(([k, v]) => `${k} : ${v}`).join('\n');
}

window.saveAdminProduct = function(e) {
  e.preventDefault();
  const editId = document.getElementById('editProdId').value.trim();
  const name = document.getElementById('pName').value.trim();
  const model = document.getElementById('pModel').value.trim().toUpperCase();
  const category = document.getElementById('pCat').value;
  const catObj = adminState.categories.find(c => c.id === category);
  const categoryLabel = catObj ? catObj.name : 'أجهزة سوكاني';
  const badge = document.getElementById('pBadge').value.trim() || categoryLabel;
  const price = Number(document.getElementById('pPrice').value);
  if (!(price > 0)) {
    showAdminToast('من فضلك أدخل سعراً صحيحاً أكبر من صفر');
    return;
  }
  const oldPrice = Number(document.getElementById('pOldPrice').value) || Math.round(price * 1.18);
  const wattage = document.getElementById('pWatt').value.trim();
  const capacity = document.getElementById('pCap').value.trim();
  const warranty = document.getElementById('pWarranty').value.trim() || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة';
  const shipping = document.getElementById('pShipping').value.trim() || 'شحن مجاني لجميع المحافظات';
  const rating = Number(document.getElementById('pRating').value || 4.9);
  const inStock = document.getElementById('pInStock').value === 'true';
  const image = document.getElementById('pImg').value.trim() || adminState.uploadedBase64Image || (catObj ? catObj.image : 'assets/products/airfryer.jpg');
  const galleryRaw = document.getElementById('pGallery').value.trim();
  const gallery = galleryRaw
    ? galleryRaw.split(',').map(s => s.trim()).filter(Boolean)
    : [image];
  const videoUrl = (document.getElementById('pVideoUrl')?.value || '').trim();
  const shortDesc = document.getElementById('pDesc').value.trim();

  const features = (document.getElementById('pFeatures').value || '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  const specs = parseSpecsTextarea(document.getElementById('pSpecs').value);
  if (Object.keys(specs).length === 0) {
    specs['الموديل'] = model;
    specs['القدرة الكهربائية'] = wattage;
    specs['السعة / المواصفة'] = capacity;
    specs['الضمان'] = warranty;
    specs['الشحن'] = shipping;
  }

  const productData = {
    id: editId || ('sk-' + Date.now()),
    model,
    name,
    category,
    categoryLabel,
    wattage,
    capacity,
    warranty,
    shipping,
    price,
    oldPrice,
    rating,
    reviewsCount: editId ? (adminState.products.find(x => x.id === editId)?.reviewsCount || 180) : 145,
    badge,
    inStock,
    image,
    gallery,
    videoUrl,
    fallbackImage: 'assets/products/hero-showcase.jpg',
    shortDesc,
    features: features.length ? features : ['ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات'],
    specs
  };

  if (editId) {
    const idx = adminState.products.findIndex(p => p.id === editId);
    if (idx > -1) adminState.products[idx] = productData;
  } else {
    adminState.products.unshift(productData);
  }

  if (!saveStoreProducts(adminState.products)) {
    // Storage full — roll back to what is really saved
    loadAdminAllData();
    renderAllAdminViews();
    return;
  }
  showAdminToast(editId ? `تم تحديث بيانات "${escapeHTML(name)}" بنجاح` : `تمت إضافة "${escapeHTML(name)}" إلى المتجر بنجاح`);
  resetProductForm();
  renderAllAdminViews();
};

window.editAdminProduct = function(id) {
  const p = adminState.products.find(x => x.id === id);
  if (!p) return;

  document.getElementById('editProdId').value = p.id;
  document.getElementById('pName').value = p.name || '';
  document.getElementById('pModel').value = p.model || '';
  const mappedCat = ['sandwich', 'airfryer', 'oven', 'blender', 'coffee', 'kitchen'].includes(p.category)
    ? (adminState.categories.some(c => c.id === p.category) ? p.category : 'kitchen')
    : (p.category || 'kitchen');
  document.getElementById('pCat').value = mappedCat;
  document.getElementById('pBadge').value = p.badge || '';
  document.getElementById('pPrice').value = p.price || '';
  document.getElementById('pOldPrice').value = p.oldPrice || '';
  document.getElementById('pWatt').value = p.wattage || '';
  document.getElementById('pCap').value = p.capacity || '';
  document.getElementById('pWarranty').value = p.warranty || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة';
  document.getElementById('pShipping').value = p.shipping || 'شحن مجاني لجميع المحافظات';
  document.getElementById('pRating').value = p.rating || 4.9;
  document.getElementById('pInStock').value = p.inStock !== false ? 'true' : 'false';
  document.getElementById('pImg').value = p.image || '';
  document.getElementById('pGallery').value = Array.isArray(p.gallery) ? p.gallery.join(', ') : (p.image || '');
  const vInput = document.getElementById('pVideoUrl');
  if (vInput) vInput.value = p.videoUrl || '';
  if (typeof updateAdminVideoPreview === 'function') updateAdminVideoPreview(p.videoUrl || '');
  document.getElementById('pDesc').value = p.shortDesc || '';
  document.getElementById('pFeatures').value = Array.isArray(p.features) ? p.features.join('\n') : '';
  document.getElementById('pSpecs').value = formatSpecsToTextarea(p.specs);

  document.getElementById('formModeHeading').innerHTML = `<i class="fa-solid fa-pen-to-square"></i> تعديل المنتج: ${escapeHTML(p.name)} (${escapeHTML(p.model)})`;
  document.getElementById('productFormCard')?.scrollIntoView({ behavior: 'smooth' });
};

window.toggleProductStock = function(id) {
  const p = adminState.products.find(x => x.id === id);
  if (!p) return;
  p.inStock = p.inStock === false ? true : false;
  saveStoreProducts(adminState.products);
  renderAllAdminViews();
  showAdminToast(`تم تغيير حالة "${p.model}" إلى: ${p.inStock ? 'متوفر بالمخزن' : 'غير متوفر'}`);
};

window.deleteAdminProduct = function(id) {
  const p = adminState.products.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`هل أنت متأكد من حذف الجهاز "${p.name}"؟`)) return;
  adminState.products = adminState.products.filter(x => x.id !== id);
  saveStoreProducts(adminState.products);
  renderAllAdminViews();
  showAdminToast('تم حذف المنتج من الكتالوج');
};

window.resetProductForm = function() {
  document.getElementById('adminProductForm')?.reset();
  document.getElementById('editProdId').value = '';
  document.getElementById('pWarranty').value = 'ضمان معتمد رسمي من شركة المغربي لمدة سنة';
  document.getElementById('pShipping').value = 'شحن مجاني لجميع المحافظات';
  const vInput = document.getElementById('pVideoUrl');
  if (vInput) vInput.value = '';
  if (typeof updateAdminVideoPreview === 'function') updateAdminVideoPreview('');
  adminState.uploadedBase64Image = '';
  document.getElementById('formModeHeading').innerHTML = `<i class="fa-solid fa-circle-plus"></i> إضافة جهاز سوكاني جديد أو تعديل منتج`;
};

window.renderAdminProductsTable = function() {
  const tbody = document.getElementById('adminProductsTableBody');
  const countEl = document.getElementById('adminProdCount');
  if (!tbody) return;

  const q = document.getElementById('adminProdSearch')?.value || '';
  const catFilter = document.getElementById('adminProdCatFilter')?.value || 'all';

  const filtered = adminState.products.filter(p => {
    const matchCat = doesProductMatchCategory(p, catFilter);
    const matchSearch = smartProductSearchMatch(p, q);
    return matchCat && matchSearch;
  });

  if (countEl) countEl.textContent = filtered.length;

  tbody.innerHTML = filtered.map(p => {
    const inStock = p.inStock !== false;
    return `
      <tr>
        <td>
          <img src="${escapeHTML(p.image)}" onerror="this.onerror=null;this.src='assets/products/hero-showcase.jpg'"
               style="width:52px; height:52px; object-fit:contain; border-radius:10px; border:1px solid var(--border); background:#fff; padding:4px;" />
        </td>
        <td><span class="sku-tag">${escapeHTML(p.model)}</span></td>
        <td>
          <div style="font-weight:800; color:var(--text-dark);">${escapeHTML(p.name)}</div>
          <div style="font-size:0.74rem; color:var(--text-muted);">
            ${escapeHTML(p.warranty || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة')} • ${escapeHTML(p.shipping || 'شحن مجاني')}
            ${p.videoUrl ? `<span class="card-badge" style="margin-right:6px; background:#e8f5e9; color:#1b5e20;"><i class="fa-solid fa-circle-play"></i> فيديو مضاف</span>` : ''}
          </div>
        </td>
        <td><span class="card-badge">${p.categoryLabel}</span></td>
        <td style="font-size:0.8rem; font-weight:700;">${p.wattage} • ${p.capacity}</td>
        <td>
          <strong style="color:var(--brand-dark); font-size:0.95rem;">${formatEGP(p.price)}</strong>
          ${p.oldPrice > p.price ? `<div style="font-size:0.72rem; text-decoration:line-through; color:var(--text-muted);">${formatEGP(p.oldPrice)}</div>` : ''}
        </td>
        <td>
          <button type="button" class="status-pill ${inStock ? 'in-stock' : 'out-stock'}" onclick="toggleProductStock('${p.id}')" title="اضغط لتبديل حالة التوفر">
            <i class="fa-solid ${inStock ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>
            ${inStock ? 'متوفر' : 'نفذ'}
          </button>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <a href="product.html?id=${encodeURIComponent(p.id)}" target="_blank" class="tool-btn" style="height:34px; padding:0 10px; font-size:0.76rem; text-decoration:none;" title="معاينة صفحة المنتج">
              <i class="fa-regular fa-eye"></i>
            </a>
            <button type="button" class="tool-btn" style="height:34px; padding:0 10px; font-size:0.76rem;" onclick="editAdminProduct('${p.id}')">
              <i class="fa-solid fa-pen"></i> تعديل
            </button>
            <button type="button" class="tool-btn" style="height:34px; padding:0 10px; font-size:0.76rem; color:#b91c1c;" onclick="deleteAdminProduct('${p.id}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
};

// ==================== 3. CATEGORIES & DROPDOWN SUB-ITEMS MANAGEMENT ====================
adminState.editingSubItems = [];

window.updateSubItemFieldInCurrentCategory = function(idx, field, val) {
  if (!Array.isArray(adminState.editingSubItems) || !adminState.editingSubItems[idx]) return;
  adminState.editingSubItems[idx][field] = val;
};

window.renderAdminSubItemsEditor = function() {
  const box = document.getElementById('adminSubItemsListContainer');
  if (!box) return;
  const list = Array.isArray(adminState.editingSubItems) ? adminState.editingSubItems : [];

  if (list.length === 0) {
    box.innerHTML = `
      <div style="padding:12px; background:#ffffff; border:1px dashed var(--border-strong); border-radius:10px; font-size:0.82rem; color:var(--text-muted); text-align:center;">
        لا توجد أقسام فرعية مضافة لهذا القسم حالياً. استخدم الحقول بالأعلى لإضافة قسم فرعي جديد (مثل: خلاطات، عجانات، كبات...).
      </div>
    `;
    return;
  }

  box.innerHTML = list.map((sub, idx) => `
    <div style="display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; background:#ffffff; border:1px solid var(--border); border-radius:10px; padding:8px 12px;">
      <div style="display:flex; align-items:center; gap:8px; flex:1; flex-wrap:wrap; min-width:240px;">
        <span style="width:24px; height:24px; border-radius:50%; background:var(--brand-soft); color:var(--brand-dark); font-size:0.74rem; font-weight:900; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">${idx + 1}</span>
        <i class="fa-solid ${escapeHTML(sub.icon || 'fa-angle-left')}" style="color:var(--brand);"></i>
        <input type="text" class="form-input" value="${escapeHTML(sub.label)}"
               oninput="updateSubItemFieldInCurrentCategory(${idx}, 'label', this.value)"
               placeholder="اسم القسم الفرعي"
               style="flex:1; min-width:170px; padding:6px 10px; font-size:0.84rem; font-weight:800;" />
        <input type="text" class="form-input" value="${escapeHTML(sub.query || '')}"
               oninput="updateSubItemFieldInCurrentCategory(${idx}, 'query', this.value)"
               placeholder="كلمة الفلترة (اختياري)"
               style="width:155px; padding:6px 10px; font-size:0.78rem;" />
      </div>
      <div style="display:flex; align-items:center; gap:5px;">
        <button type="button" class="tool-btn" style="height:28px; width:28px; padding:0; font-size:0.72rem;" onclick="moveSubItemInCurrentCategory(${idx}, -1)" title="تحريك لأعلى" ${idx === 0 ? 'disabled style="opacity:0.4;"' : ''}>
          <i class="fa-solid fa-arrow-up"></i>
        </button>
        <button type="button" class="tool-btn" style="height:28px; width:28px; padding:0; font-size:0.72rem;" onclick="moveSubItemInCurrentCategory(${idx}, 1)" title="تحريك لأسفل" ${idx === list.length - 1 ? 'disabled style="opacity:0.4;"' : ''}>
          <i class="fa-solid fa-arrow-down"></i>
        </button>
        <button type="button" class="tool-btn" style="height:28px; padding:0 9px; font-size:0.72rem; color:#b91c1c;" onclick="removeSubItemFromCurrentCategory(${idx})" title="حذف هذا الفرع">
          <i class="fa-solid fa-trash"></i> حذف
        </button>
      </div>
    </div>
  `).join('');
};

window.addSubItemToCurrentCategory = function() {
  const lblInput = document.getElementById('subItemLabelInput');
  const qInput = document.getElementById('subItemQueryInput');
  const catSel = document.getElementById('subItemTargetCatSelect');
  const curCatId = (document.getElementById('catIdInput')?.value || '').trim().toLowerCase() || 'kitchen';

  const label = (lblInput?.value || '').trim();
  if (!label) {
    showAdminToast('من فضلك اكتب اسم القسم الفرعي الذي سيظهر في القائمة المنسدلة (مثال: خلاطات كهربائية)');
    lblInput?.focus();
    return;
  }
  const query = (qInput?.value || '').trim();
  const targetCat = (catSel?.value || '').trim() || curCatId;

  if (!Array.isArray(adminState.editingSubItems)) adminState.editingSubItems = [];
  adminState.editingSubItems.push({
    label,
    cat: targetCat,
    query,
    icon: 'fa-angle-left'
  });

  if (lblInput) lblInput.value = '';
  if (qInput) qInput.value = '';
  renderAdminSubItemsEditor();
  showAdminToast(`تمت إضافة القسم الفرعي "${label}" — اضغط "حفظ القسم وفروعه" لتطبيقه على الموقع`);
};

window.removeSubItemFromCurrentCategory = function(idx) {
  if (!Array.isArray(adminState.editingSubItems)) return;
  adminState.editingSubItems.splice(idx, 1);
  renderAdminSubItemsEditor();
};

window.moveSubItemInCurrentCategory = function(idx, delta) {
  if (!Array.isArray(adminState.editingSubItems)) return;
  const target = idx + delta;
  if (target < 0 || target >= adminState.editingSubItems.length) return;
  const temp = adminState.editingSubItems[idx];
  adminState.editingSubItems[idx] = adminState.editingSubItems[target];
  adminState.editingSubItems[target] = temp;
  renderAdminSubItemsEditor();
};

window.handleCategoryImageUpload = async function(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const dataUrl = await compressImageToDataURL(file, 480, 0.82);
    const imgInput = document.getElementById('catImgInput');
    if (imgInput) imgInput.value = dataUrl;
    showAdminToast('تم تجهيز صورة القسم بنجاح — اضغط حفظ القسم');
  } catch (err) {
    showAdminToast('تعذر قراءة صورة القسم');
  }
};

window.resetCategoryForm = function() {
  document.getElementById('adminCategoryForm')?.reset();
  document.getElementById('catIdInput').value = '';
  document.getElementById('catNameInput').value = '';
  document.getElementById('catNavTitleInput').value = '';
  document.getElementById('catSubInput').value = '';
  document.getElementById('catIconInput').value = 'fa-cube';
  document.getElementById('catImgInput').value = '';
  const qSel = document.getElementById('catQuickSelect');
  if (qSel) qSel.value = '';
  adminState.editingSubItems = [];
  renderAdminSubItemsEditor();
  const heading = document.getElementById('catFormHeading');
  if (heading) heading.innerHTML = `<i class="fa-solid fa-folder-plus"></i> إضافة قسم جديد وفروعه المنسدلة`;
};

window.saveAdminCategory = function(e) {
  e.preventDefault();
  const id = document.getElementById('catIdInput').value.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9_-]/g, '');
  if (!id) {
    showAdminToast('كود القسم يجب أن يحتوي على حروف إنجليزية أو أرقام (مثال: all أو blender)');
    return;
  }
  const name = document.getElementById('catNameInput').value.trim();
  const navTitle = (document.getElementById('catNavTitleInput')?.value || '').trim();
  const subtitle = document.getElementById('catSubInput').value.trim() || 'تشكيلة سوكاني الأصلية';
  const icon = (document.getElementById('catIconInput')?.value || 'fa-cube').trim();
  const image = document.getElementById('catImgInput').value.trim() || 'assets/products/hero-showcase.jpg';
  const subItems = Array.isArray(adminState.editingSubItems) ? [...adminState.editingSubItems] : [];

  const existingIdx = adminState.categories.findIndex(c => c.id === id);
  const catObj = {
    id,
    name,
    navTitle: navTitle || (id === 'all' ? 'الأجهزة المنزلية' : name),
    enName: existingIdx > -1 ? (adminState.categories[existingIdx].enName || id.toUpperCase()) : id.toUpperCase(),
    subtitle,
    icon,
    image,
    subItems
  };

  if (existingIdx > -1) {
    adminState.categories[existingIdx] = { ...adminState.categories[existingIdx], ...catObj };
    showAdminToast(`تم تحديث القسم "${escapeHTML(catObj.navTitle || name)}" وفروعه المنسدلة (${subItems.length} فرع) بنجاح`);
  } else {
    adminState.categories.push(catObj);
    showAdminToast(`تم إضافة القسم "${escapeHTML(name)}" وفروعه المنسدلة بنجاح`);
  }

  saveStoreCategories(adminState.categories);
  renderAllAdminViews();
};

window.editAdminCategory = function(id, focusSubItem = false) {
  const c = adminState.categories.find(x => x.id === id);
  if (!c) return;
  document.getElementById('catIdInput').value = c.id;
  document.getElementById('catNameInput').value = c.name || '';
  const navInput = document.getElementById('catNavTitleInput');
  if (navInput) navInput.value = c.navTitle || (c.id === 'all' ? 'الأجهزة المنزلية' : c.name);
  document.getElementById('catSubInput').value = c.subtitle || '';
  const iconInput = document.getElementById('catIconInput');
  if (iconInput) iconInput.value = c.icon || 'fa-cube';
  document.getElementById('catImgInput').value = c.image || '';
  const qSel = document.getElementById('catQuickSelect');
  if (qSel) qSel.value = c.id;

  adminState.editingSubItems = Array.isArray(c.subItems) ? c.subItems.map(s => ({ ...s })) : [];
  renderAdminSubItemsEditor();

  const heading = document.getElementById('catFormHeading');
  if (heading) {
    heading.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> تعديل القسم وفروعه المنسدلة: ${escapeHTML(c.navTitle || c.name)} (${escapeHTML(c.id)})`;
  }
  document.getElementById('adminCategoryFormCard')?.scrollIntoView({ behavior: 'smooth' });
  if (focusSubItem) {
    setTimeout(() => document.getElementById('subItemLabelInput')?.focus(), 280);
  }
};

window.deleteAdminCategory = function(id) {
  if (id === 'all') {
    showAdminToast('لا يمكن حذف قسم الأجهزة المنزلية (جميع المنتجات) الرئيسي — يمكنك تعديل اسمه وفروعه');
    return;
  }
  if (!confirm('هل تريد حذف هذا القسم؟')) return;
  adminState.categories = adminState.categories.filter(c => c.id !== id);
  saveStoreCategories(adminState.categories);
  renderAllAdminViews();
  showAdminToast('تم حذف القسم');
};

function renderAdminCategoriesTable() {
  const tbody = document.getElementById('adminCategoriesTableBody');
  if (!tbody) return;

  // Ensure sub-items editor is initialized if empty
  if (!document.getElementById('catIdInput')?.value && adminState.categories.length > 0) {
    const firstCat = adminState.categories[0];
    document.getElementById('catIdInput').value = firstCat.id;
    document.getElementById('catNameInput').value = firstCat.name || '';
    const navInput = document.getElementById('catNavTitleInput');
    if (navInput) navInput.value = firstCat.navTitle || 'الأجهزة المنزلية';
    document.getElementById('catSubInput').value = firstCat.subtitle || '';
    const iconInput = document.getElementById('catIconInput');
    if (iconInput) iconInput.value = firstCat.icon || 'fa-border-all';
    document.getElementById('catImgInput').value = firstCat.image || '';
    const qSel = document.getElementById('catQuickSelect');
    if (qSel) qSel.value = firstCat.id;
    adminState.editingSubItems = Array.isArray(firstCat.subItems) ? firstCat.subItems.map(s => ({ ...s })) : [];
    renderAdminSubItemsEditor();
  } else {
    renderAdminSubItemsEditor();
  }

  tbody.innerHTML = adminState.categories.map((c, idx) => {
    const isContact = c.id === 'contact';
    const count = isContact
      ? 0
      : adminState.products.filter(p => doesProductMatchCategory(p, c.id)).length;
    const countLabel = isContact ? 'خدمة العملاء' : `${count} جهاز`;
    const subs = Array.isArray(c.subItems) ? c.subItems : [];
    const subsBadges = subs.length
      ? subs.map(s => `<span class="card-badge" style="margin:2px; font-size:0.72rem; background:var(--brand-soft); color:var(--brand-dark); border:1px solid var(--brand-tint);">${escapeHTML(s.label)}</span>`).join('')
      : `<span style="font-size:0.76rem; color:var(--text-muted);">لا توجد فروع منسدلة</span>`;

    return `
      <tr>
        <td><img src="${escapeHTML(c.image)}" onerror="this.onerror=null;this.src='assets/products/hero-showcase.jpg'" style="width:46px; height:46px; object-fit:contain; border-radius:50%; border:1px solid var(--border); background:#fff; padding:4px;" /></td>
        <td><span class="sku-tag">${idx + 1} • ${escapeHTML(c.id)}</span></td>
        <td>
          <div style="font-weight:900; color:var(--text-dark);">${escapeHTML(c.name)}</div>
          <div style="font-size:0.75rem; color:var(--brand-dark); font-weight:800;">بالهيدر: ${escapeHTML(c.navTitle || c.name)}</div>
          <div style="color:var(--text-muted); font-size:0.74rem;">${escapeHTML(c.subtitle || '')}</div>
        </td>
        <td style="max-width:340px;">
          <div style="display:flex; flex-wrap:wrap; gap:3px; margin-bottom:6px;">${subsBadges}</div>
          <button type="button" class="btn-outline" style="padding:4px 10px; font-size:0.72rem;" onclick="editAdminCategory('${escapeHTML(c.id)}', true)">
            <i class="fa-solid fa-plus"></i> إضافة / تعديل فروع هذا القسم (${subs.length})
          </button>
        </td>
        <td><strong>${countLabel}</strong></td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="tool-btn" style="height:32px; padding:0 10px; font-size:0.76rem;" onclick="editAdminCategory('${escapeHTML(c.id)}')">
              <i class="fa-solid fa-pen"></i> تعديل
            </button>
            ${c.id !== 'all' ? `
              <button class="tool-btn" style="height:32px; padding:0 10px; font-size:0.76rem; color:#b91c1c;" onclick="deleteAdminCategory('${escapeHTML(c.id)}')">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ==================== 4. ORDERS CRM & PRINTABLE INVOICE ====================
window.renderAdminOrders = function() {
  const container = document.getElementById('adminOrdersContainer');
  const countEl = document.getElementById('adminOrdersCount');
  if (!container) return;

  const q = (document.getElementById('orderSearchInput')?.value || '').trim().toLowerCase();
  const statusFilter = document.getElementById('orderStatusFilter')?.value || 'all';

  const filtered = adminState.orders.filter(o => {
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchSearch = !q ||
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.customer && o.customer.toLowerCase().includes(q)) ||
      (o.phone && o.phone.includes(q)) ||
      (o.gov && o.gov.toLowerCase().includes(q));
    return matchStatus && matchSearch;
  });

  if (countEl) countEl.textContent = filtered.length;

  if (filtered.length === 0) {
    container.innerHTML = `<p style="padding:36px; text-align:center; color:var(--text-muted);">لا توجد طلبات مطابقة للفلتر الحالي.</p>`;
    return;
  }

  container.innerHTML = filtered.map((o) => {
    const realIdx = adminState.orders.findIndex(x => x.id === o.id);
    const itemsList = (o.items || []).map(i => `<li>${escapeHTML(i.name)} (<span class="sku-tag">${escapeHTML(i.model)}</span>) × <strong>${Number(i.qty) || 1}</strong> — ${formatEGP(Number(i.price) * Number(i.qty))}</li>`).join('');
    const waCustomerPhone = toWhatsappIntl(o.phone);

    return `
      <div style="border:1.5px solid var(--border); border-radius:16px; padding:18px; margin-bottom:14px; background:var(--bg-page);">
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:12px; padding-bottom:10px; border-bottom:1px solid var(--border);">
          <div>
            <span class="sku-tag" style="font-size:0.86rem;">${escapeHTML(o.id)}</span>
            <strong style="font-size:1.02rem; margin:0 8px;">${escapeHTML(o.customer)}</strong>
            <span style="color:var(--text-muted); font-size:0.82rem;"><i class="fa-regular fa-clock"></i> ${escapeHTML(o.date)}</span>
          </div>

          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <select class="clean-select" style="padding:6px 12px; font-size:0.8rem;" onchange="updateOrderStatus(${realIdx}, this.value)">
              <option value="جديد" ${o.status === 'جديد' ? 'selected' : ''}>جديد</option>
              <option value="تم التأكيد" ${o.status === 'تم التأكيد' ? 'selected' : ''}>تم التأكيد</option>
              <option value="جاري الشحن" ${o.status === 'جاري الشحن' ? 'selected' : ''}>جاري الشحن</option>
              <option value="تم التسليم" ${o.status === 'تم التسليم' ? 'selected' : ''}>تم التسليم</option>
              <option value="ملغي" ${o.status === 'ملغي' ? 'selected' : ''}>ملغي</option>
            </select>

            <button class="tool-btn" style="height:34px; padding:0 12px; font-size:0.78rem;" onclick="printOrderInvoice(${realIdx})">
              <i class="fa-solid fa-print"></i> طباعة فاتورة
            </button>

            <a href="https://wa.me/${waCustomerPhone}?text=${encodeURIComponent('مرحباً ' + o.customer + '، نتواصل معك من متجر daimond store بخصوص طلبك رقم ' + o.id)}"
               target="_blank" rel="noopener" class="tool-btn" style="height:34px; padding:0 12px; font-size:0.78rem; text-decoration:none; color:#15803d;">
              <i class="fa-brands fa-whatsapp"></i> واتساب العميل
            </a>

            <button class="tool-btn" style="height:34px; padding:0 10px; color:#b91c1c;" onclick="deleteAdminOrder(${realIdx})">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:14px; font-size:0.86rem;">
          <div>
            <div><strong>رقم الهاتف:</strong> ${escapeHTML(o.phone)}</div>
            <div><strong>المحافظة والعنوان:</strong> ${escapeHTML(o.gov)} — ${escapeHTML(o.address)}</div>
            <div><strong>طريقة الدفع:</strong> <span class="card-badge" style="font-size:0.75rem;">${escapeHTML(o.payment)}</span></div>
            ${o.transferRef ? `<div style="margin-top:4px; color:#6d28d9; font-weight:800;"><i class="fa-solid fa-receipt"></i> رقم/حساب التحويل: ${escapeHTML(o.transferRef)}</div>` : ''}
            ${o.paymentScreenshot ? `
              <div style="margin-top:8px; display:flex; align-items:center; gap:10px; background:#ffffff; border:1.5px solid var(--brand); border-radius:12px; padding:6px 10px; width:fit-content;">
                <img src="${escapeHTML(o.paymentScreenshot)}" alt="Screenshot" style="width:42px; height:42px; object-fit:cover; border-radius:8px; border:1px solid var(--border); cursor:pointer;" onclick="viewOrderScreenshot(${realIdx})" />
                <div>
                  <div style="font-size:0.76rem; font-weight:900; color:var(--brand-dark);">مرفق اسكرين شوت التحويل</div>
                  <button type="button" style="background:none; border:none; color:#2563eb; font-family:inherit; font-size:0.74rem; font-weight:800; cursor:pointer; padding:0;" onclick="viewOrderScreenshot(${realIdx})">
                    <i class="fa-solid fa-magnifying-glass-plus"></i> فتح الصورة بالحجم الكامل
                  </button>
                </div>
              </div>
            ` : ''}
            <div style="color:var(--brand-dark); font-weight:800; margin-top:6px;">
              <i class="fa-solid fa-truck-fast"></i> شحن مجاني (0 ج.م) • <i class="fa-solid fa-shield-halved"></i> ضمان سنة كاملة
            </div>
          </div>
          <div>
            <strong>الأجهزة المطلوبة:</strong>
            <ul style="padding-right:18px; margin-top:4px;">${itemsList}</ul>
            ${o.discount > 0 ? `<div style="margin-top:4px; font-size:0.82rem; color:var(--text-muted);">المجموع قبل الخصم: ${formatEGP(o.subtotal || (o.total + o.discount))} | الخصم: -${formatEGP(o.discount)}${o.coupon ? ` (${escapeHTML(o.coupon)})` : ''}</div>` : ''}
            <div style="margin-top:8px; font-size:1.05rem; font-weight:900; color:var(--brand-dark);">
              الإجمالي المطلوب تحصيله: ${formatEGP(o.total)}
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
};

window.updateOrderStatus = function(idx, newStatus) {
  if (!adminState.orders[idx]) return;
  adminState.orders[idx].status = newStatus;
  localStorage.setItem('daimond_orders', JSON.stringify(adminState.orders));
  renderAllAdminViews();
  showAdminToast(`تم تحديث حالة الطلب ${adminState.orders[idx].id} إلى "${newStatus}"`);
};

window.deleteAdminOrder = function(idx) {
  if (!confirm('حذف هذا الطلب نهائياً؟')) return;
  adminState.orders.splice(idx, 1);
  localStorage.setItem('daimond_orders', JSON.stringify(adminState.orders));
  renderAllAdminViews();
  showAdminToast('تم حذف الطلب');
};

window.createDemoOrder = function() {
  const sampleProd = adminState.products[0] || DEFAULT_PRODUCTS[0];
  const orderCode = 'DM-' + Math.floor(100000 + Math.random() * 900000);
  adminState.orders.unshift({
    id: orderCode,
    date: normalizeDigits(new Date().toLocaleString('en-GB')),
    customer: 'عميل تجريبي — محمد عبد الرحمن',
    phone: '01012345678',
    gov: 'القاهرة',
    address: 'مدينة نصر، شارع عباس العقاد، عمارة 14',
    payment: 'الدفع عند الاستلام',
    items: [{ id: sampleProd.id, model: sampleProd.model, name: sampleProd.name, qty: 1, price: sampleProd.price }],
    shipping: 0,
    warranty: adminState.settings?.warrantyText || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    total: sampleProd.price,
    status: 'جديد'
  });
  localStorage.setItem('daimond_orders', JSON.stringify(adminState.orders));
  renderAllAdminViews();
  showAdminToast(`تم إنشاء طلب تجريبي رقم ${orderCode}`);
};

window.printOrderInvoice = function(idx) {
  const o = adminState.orders[idx];
  if (!o) return;
  const rows = (o.items || []).map((i, n) => `
    <tr>
      <td style="padding:8px; border:1px solid #ccc;">${n + 1}</td>
      <td style="padding:8px; border:1px solid #ccc;">${escapeHTML(i.model)}</td>
      <td style="padding:8px; border:1px solid #ccc;">${escapeHTML(i.name)}</td>
      <td style="padding:8px; border:1px solid #ccc;">${Number(i.qty) || 1}</td>
      <td style="padding:8px; border:1px solid #ccc;">${formatEGP(i.price)}</td>
      <td style="padding:8px; border:1px solid #ccc; font-weight:bold;">${formatEGP(Number(i.price) * Number(i.qty))}</td>
    </tr>
  `).join('');

  const win = window.open('', '_blank', 'width=820,height=700');
  if (!win) {
    showAdminToast('يرجى السماح بالنوافذ المنبثقة (Pop-ups) في المتصفح لطباعة الفاتورة');
    return;
  }
  const discountRow = o.discount > 0
    ? `<div>المجموع قبل الخصم: <strong>${formatEGP(o.subtotal || (o.total + o.discount))}</strong> | الخصم: <strong>-${formatEGP(o.discount)}${o.coupon ? ` (${escapeHTML(o.coupon)})` : ''}</strong></div>`
    : '';
  win.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8" />
      <title>فاتورة مبيعات وضمان رقم ${escapeHTML(o.id)} - Daimond Store</title>
      <style>
        body { font-family: 'Tahoma', sans-serif; padding: 30px; color: #181512; }
        .inv-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #E85D04; padding-bottom: 16px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
        .warranty-box { background: #FFF5EE; border: 1.5px solid #E85D04; padding: 14px; border-radius: 10px; margin-top: 20px; }
      </style>
    </head>
    <body onload="window.print()">
      <div class="inv-header">
        <div>
          <h1 style="margin:0; color:#E85D04;">${escapeHTML(adminState.settings.storeName || 'Daimond Store')}</h1>
          <p style="margin:4px 0 0;">${escapeHTML(adminState.settings.tagline || 'أجهزة سوكاني SOKANY المنزلية الحديثة')}</p>
        </div>
        <div style="text-align:left;">
          <h3 style="margin:0;">فاتورة مبيعات وشهادة ضمان</h3>
          <div>رقم الفاتورة: <strong>${escapeHTML(o.id)}</strong></div>
          <div>التاريخ: ${escapeHTML(o.date)}</div>
        </div>
      </div>

      <div style="margin-bottom:16px; line-height:1.8;">
        <strong>اسم العميل:</strong> ${escapeHTML(o.customer)} &nbsp;|&nbsp; <strong>الموبايل:</strong> ${escapeHTML(o.phone)}<br/>
        <strong>العنوان:</strong> ${escapeHTML(o.gov)} — ${escapeHTML(o.address)} &nbsp;|&nbsp; <strong>طريقة الدفع:</strong> ${escapeHTML(o.payment)}
      </div>

      <table>
        <thead style="background:#FFF5EE;">
          <tr>
            <th style="padding:8px; border:1px solid #ccc;">#</th>
            <th style="padding:8px; border:1px solid #ccc;">الموديل</th>
            <th style="padding:8px; border:1px solid #ccc;">الصنف</th>
            <th style="padding:8px; border:1px solid #ccc;">الكمية</th>
            <th style="padding:8px; border:1px solid #ccc;">سعر الوحدة</th>
            <th style="padding:8px; border:1px solid #ccc;">الإجمالي</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="text-align:left; font-size:16px;">
        ${discountRow}
        <div>مصاريف الشحن: <strong>مجاني لجميع المحافظات (0 ج.م)</strong></div>
        <div style="font-size:20px; color:#C84B00; margin-top:6px;"><strong>الإجمالي النهائي المطلوب: ${formatEGP(o.total)}</strong></div>
      </div>

      <div class="warranty-box">
        <strong>${escapeHTML(adminState.settings.warrantyText || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة')}:</strong>
        تضمن إدارة <strong>${escapeHTML(adminState.settings.storeName || 'Daimond Store')}</strong> الأجهزة الموضحة أعلاه بضمان معتمد رسمي من شركة المغربي لمدة سنة من تاريخ الفاتورة ضد عيوب الصناعة.
      </div>
    </body>
    </html>
  `);
  win.document.close();
};

// ==================== 5. SITE CMS & HERO SHOWCASE EDITOR ====================
window.viewOrderScreenshot = function(idx) {
  const o = adminState.orders[idx];
  if (!o || !o.paymentScreenshot) return;
  const win = window.open('', '_blank', 'width=640,height=780');
  if (!win) {
    showAdminToast('يرجى السماح بالنوافذ المنبثقة لعرض صورة التحويل');
    return;
  }
  win.document.write(`
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head><meta charset="UTF-8"><title>إيصال تحويل الطلب ${escapeHTML(o.id)}</title></head>
    <body style="margin:0; padding:20px; background:#181512; color:#fff; font-family:Tahoma,sans-serif; text-align:center;">
      <h3 style="margin-bottom:8px;">اسكرين شوت التحويل — طلب رقم ${escapeHTML(o.id)}</h3>
      <p style="margin:0 0 16px; color:#FFE2CC;">العميل: ${escapeHTML(o.customer)} | الوسيلة: ${escapeHTML(o.payment)} ${o.transferRef ? `| الرقم المحول منه: ${escapeHTML(o.transferRef)}` : ''}</p>
      <img src="${escapeHTML(o.paymentScreenshot)}" style="max-width:95%; max-height:80vh; border-radius:14px; border:2px solid #E85D04; background:#fff;" />
    </body>
    </html>
  `);
  win.document.close();
};

function populateSiteSettingsForm() {
  const s = adminState.settings;
  if (!s) return;
  const storeName = s.storeName || 'Daimond Store';
  document.getElementById('setStoreName').value = storeName;
  document.getElementById('setTagline').value = s.tagline || '';
  document.getElementById('setWhatsapp').value = s.whatsappNumber || '201000000000';
  document.getElementById('setWarranty').value = s.warrantyText || 'ضمان معتمد رسمي من شركة المغربي لمدة سنة';
  document.getElementById('setTop1').value = s.topBarText1 || '';
  document.getElementById('setTop2').value = s.topBarText2 || '';
  document.getElementById('setTop3').value = s.topBarText3 || '';
  document.getElementById('setTier2').value = s.bundleTier2 ?? 10;
  document.getElementById('setTier3').value = s.bundleTier3 ?? 18;
  document.getElementById('setTier4').value = s.bundleTier4 ?? 25;

  const sideBrand = document.getElementById('adminSidebarStoreName');
  if (sideBrand) {
    const parts = storeName.trim().split(/\s+/);
    const last = parts.length > 1 ? parts.pop() : '';
    sideBrand.innerHTML = `${escapeHTML(parts.join(' '))}${last ? ` <span>${escapeHTML(last)}</span>` : ''}`;
  }
  const topBrand = document.getElementById('adminTopbarStoreName');
  if (topBrand) topBrand.textContent = storeName;

  const ipLink = document.getElementById('setInstapayLink');
  const ipNum = document.getElementById('setInstapayNumber');
  const ipHandle = document.getElementById('setInstapayHandle');
  const ipName = document.getElementById('setInstapayAccountName');
  const vfNum = document.getElementById('setVodafoneCash');
  const ipQr = document.getElementById('setInstapayQr');
  const payInst = document.getElementById('setPaymentInstructions');
  const qrPrev = document.getElementById('adminQrPreviewImg');

  if (ipLink) ipLink.value = s.instapayLink || 'https://ipn.eg/S/daimondstore/instapay/0000';
  if (ipNum) ipNum.value = s.instapayNumber || '01000000000';
  if (ipHandle) ipHandle.value = s.instapayHandle || 'daimondstore@instapay';
  if (ipName) ipName.value = s.instapayAccountName || storeName;
  if (vfNum) vfNum.value = s.vodafoneCashNumber || '01000000000';
  if (ipQr) ipQr.value = s.instapayQrImage || '';
  if (payInst) payInst.value = s.paymentInstructions || DEFAULT_STORE_SETTINGS.paymentInstructions;
  if (qrPrev) {
    if (s.instapayQrImage) {
      qrPrev.src = s.instapayQrImage;
      qrPrev.style.display = 'inline-block';
    } else {
      qrPrev.style.display = 'none';
    }
  }
}

function compressImageToDataURL(file, maxDim = 520, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('File read error'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image load error'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

window.handleAdminInstapayQrUpload = async function(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const dataUrl = await compressImageToDataURL(file, 520, 0.85);
    const ipQr = document.getElementById('setInstapayQr');
    const qrPrev = document.getElementById('adminQrPreviewImg');
    if (ipQr) ipQr.value = dataUrl;
    if (qrPrev) {
      qrPrev.src = dataUrl;
      qrPrev.style.display = 'inline-block';
    }
    showAdminToast('تم رفع صورة QR إنستا باي بنجاح — اضغط حفظ الإعدادات لتطبيقها');
  } catch (err) {
    showAdminToast('تعذر قراءة صورة الـ QR');
  }
};

window.clearAdminInstapayQr = function() {
  const ipQr = document.getElementById('setInstapayQr');
  const qrPrev = document.getElementById('adminQrPreviewImg');
  if (ipQr) ipQr.value = '';
  if (qrPrev) qrPrev.style.display = 'none';
  showAdminToast('سيتم توليد كود الـ QR تلقائياً من لينك إنستا باي');
};

window.saveSiteSettingsForm = function(e) {
  e.preventDefault();
  const readTier = (id, def) => {
    const raw = document.getElementById(id).value;
    const n = Number(raw);
    return raw !== '' && Number.isFinite(n) ? Math.max(0, Math.min(80, n)) : def;
  };
  let wa = normalizeDigits(document.getElementById('setWhatsapp').value).replace(/\D/g, '');
  if (wa.startsWith('0')) wa = '2' + wa;
  else if (wa.startsWith('1') && wa.length === 10) wa = '20' + wa;
  document.getElementById('setWhatsapp').value = wa || '201000000000';

  const updated = {
    ...adminState.settings,
    storeName: document.getElementById('setStoreName').value.trim(),
    tagline: document.getElementById('setTagline').value.trim(),
    whatsappNumber: wa || '201000000000',
    warrantyText: document.getElementById('setWarranty').value.trim(),
    shippingText: 'شحن مجاني لجميع المحافظات',
    topBarText1: document.getElementById('setTop1').value.trim(),
    topBarText2: document.getElementById('setTop2').value.trim(),
    topBarText3: document.getElementById('setTop3').value.trim(),
    bundleTier2: readTier('setTier2', 10),
    bundleTier3: readTier('setTier3', 18),
    bundleTier4: readTier('setTier4', 25),
    instapayLink: (document.getElementById('setInstapayLink')?.value || '').trim() || 'https://ipn.eg/S/daimondstore/instapay/0000',
    instapayNumber: normalizeDigits(document.getElementById('setInstapayNumber')?.value || '').trim() || '01000000000',
    instapayHandle: (document.getElementById('setInstapayHandle')?.value || '').trim() || 'daimondstore@instapay',
    instapayAccountName: (document.getElementById('setInstapayAccountName')?.value || '').trim() || 'daimond store',
    instapayQrImage: (document.getElementById('setInstapayQr')?.value || '').trim(),
    vodafoneCashNumber: normalizeDigits(document.getElementById('setVodafoneCash')?.value || '').trim() || '01000000000',
    paymentInstructions: (document.getElementById('setPaymentInstructions')?.value || '').trim() || DEFAULT_STORE_SETTINGS.paymentInstructions
  };
  adminState.settings = updated;
  saveStoreSettings(updated);
  populateSiteSettingsForm();
  renderAdminBrideBundleManager();
  showAdminToast('تم حفظ إعدادات المتجر وبيانات إنستا باي والـ QR بنجاح');
};

// ==================== 4B. BRIDE PACKAGE & BUNDLE BUILDER MANAGER ====================
const DEFAULT_ADMIN_BUNDLE_POOL = ['sk-10085', 'sk-b907', 'sk-999n', 'sk-10071', 'sk-7027n', 'sk-4007', 'sk-09122'];

function getAdminBundlePoolIds() {
  const s = adminState.settings || {};
  const validCatalogIds = new Set(adminState.products.map(p => p.id));
  if (Array.isArray(s.bundleProductIds) && s.bundleProductIds.length > 0) {
    const cleaned = s.bundleProductIds.filter(id => validCatalogIds.has(id));
    if (cleaned.length > 0) return cleaned;
  }
  return DEFAULT_ADMIN_BUNDLE_POOL.filter(id => validCatalogIds.has(id));
}

function getAdminBundleDefaultIds() {
  const pool = getAdminBundlePoolIds();
  const s = adminState.settings || {};
  if (Array.isArray(s.bundleDefaultSelectedIds) && s.bundleDefaultSelectedIds.length > 0) {
    const cleaned = s.bundleDefaultSelectedIds.filter(id => pool.includes(id));
    if (cleaned.length > 0) return cleaned;
  }
  return pool.slice(0, 3);
}

function renderAdminBrideBundleManager() {
  const s = adminState.settings || {};
  const enabledEl = document.getElementById('bndEnabled');
  if (!enabledEl) return;

  enabledEl.value = s.bundleEnabled !== false ? 'true' : 'false';
  document.getElementById('bndKicker').value = s.bundleKicker || 'عروض التجهيز والباكدجات المخصصة';
  document.getElementById('bndTitle').value = s.bundleTitle || 'كوّن باكدج العروسة واحصل على خصم تصاعدي حتى 25%';
  document.getElementById('bndSubtitle').value = s.bundleSubtitle || 'اختر أجهزتك المفضلة من سوكاني وشاهد التوفير الفوري مع شحن مجاني وضمان سنة كاملة';
  document.getElementById('bndTier2').value = s.bundleTier2 ?? 10;
  document.getElementById('bndTier3').value = s.bundleTier3 ?? 18;
  document.getElementById('bndTier4').value = s.bundleTier4 ?? 25;
  document.getElementById('bndFixedPrice').value = Number(s.bundleCustomFixedPrice) > 0 ? Number(s.bundleCustomFixedPrice) : 0;

  updateAdminBundleLivePreview();
  renderAdminBrideBundleProductsGrid();
}

window.updateAdminBundleLivePreview = function() {
  const summaryEl = document.getElementById('adminBundleLiveSummary');
  if (!summaryEl) return;

  const poolIds = getAdminBundlePoolIds();
  const defIds = getAdminBundleDefaultIds();
  const t2 = Number(document.getElementById('bndTier2')?.value ?? adminState.settings.bundleTier2 ?? 10);
  const t3 = Number(document.getElementById('bndTier3')?.value ?? adminState.settings.bundleTier3 ?? 18);
  const t4 = Number(document.getElementById('bndTier4')?.value ?? adminState.settings.bundleTier4 ?? 25);
  const fixedPrice = Number(document.getElementById('bndFixedPrice')?.value || 0);
  const isEnabled = (document.getElementById('bndEnabled')?.value || 'true') === 'true';

  const rawTotal = defIds.reduce((sum, id) => {
    const p = adminState.products.find(x => x.id === id);
    return sum + (p ? Number(p.price) : 0);
  }, 0);

  const count = defIds.length;
  const tierPct = count >= 4 ? t4 : count === 3 ? t3 : count === 2 ? t2 : 0;
  let finalPrice = Math.round(rawTotal * (1 - tierPct / 100));
  let isCustomFixed = false;
  if (fixedPrice > 0 && fixedPrice < rawTotal) {
    finalPrice = Math.round(fixedPrice);
    isCustomFixed = true;
  }
  const saved = Math.max(0, rawTotal - finalPrice);
  const effPct = rawTotal > 0 ? Math.round((saved / rawTotal) * 100) : 0;

  summaryEl.innerHTML = `
    <div>
      <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:4px;">
        <span class="status-pill ${isEnabled ? 'in-stock' : 'out-stock'}" style="cursor:default;">
          <i class="fa-solid ${isEnabled ? 'fa-circle-check' : 'fa-eye-slash'}"></i>
          ${isEnabled ? 'القسم نشط في المتجر' : 'القسم مخفي حالياً'}
        </span>
        <span style="font-size:0.84rem; font-weight:800; color:var(--text-dark);">
          الأجهزة المتاحة بالباكدج: <strong>${poolIds.length}</strong> جهاز | المختار افتراضياً للعروسة: <strong>${count}</strong> أجهزة
        </span>
      </div>
      <div style="font-size:0.78rem; color:var(--text-muted);">
        ${isCustomFixed
          ? `تم تفعيل سعر خاص موحد لباكدج العروسة الافتراضي (${formatEGP(finalPrice)} بدلاً من ${formatEGP(rawTotal)})`
          : `يتم حساب الخصم التصاعدي تلقائياً (${effPct}% على الـ ${count} أجهزة المختارة افتراضياً)`}
      </div>
    </div>
    <div style="display:flex; align-items:center; gap:16px; flex-wrap:wrap;">
      <div style="text-align:center;">
        <div style="font-size:0.72rem; color:var(--text-muted);">سعر الباكدج قبل الخصم</div>
        <div style="font-size:0.95rem; font-weight:800; text-decoration:line-through; color:var(--text-muted);">${formatEGP(rawTotal)}</div>
      </div>
      <div style="text-align:center;">
        <div style="font-size:0.72rem; color:var(--brand-dark); font-weight:800;">سعر باكدج العروسة النهائي</div>
        <div style="font-size:1.25rem; font-weight:900; color:var(--brand-dark);">${formatEGP(finalPrice)}</div>
      </div>
      <div style="background:#e8f5e9; color:#1b5e20; padding:6px 12px; border-radius:10px; font-size:0.78rem; font-weight:900;">
        توفير العميل: ${formatEGP(saved)} (${effPct}%)
      </div>
    </div>
  `;
};

window.renderAdminBrideBundleProductsGrid = function() {
  const grid = document.getElementById('adminBundleProductsGrid');
  if (!grid) return;

  const q = (document.getElementById('adminBundleProdSearch')?.value || '').trim();
  const poolIds = getAdminBundlePoolIds();
  const defIds = getAdminBundleDefaultIds();

  const list = adminState.products.filter(p => smartProductSearchMatch(p, q));

  grid.innerHTML = list.map(p => {
    const inPool = poolIds.includes(p.id);
    const isDefault = defIds.includes(p.id);
    return `
      <div style="border:${inPool ? '2px solid var(--brand)' : '1.5px solid var(--border)'}; border-radius:14px; padding:12px; background:${inPool ? '#ffffff' : 'var(--bg-page)'}; display:flex; flex-direction:column; justify-content:space-between; gap:10px; transition:all 0.2s;">
        <div style="display:flex; gap:10px; align-items:center;">
          <img src="${escapeHTML(p.image)}" onerror="this.onerror=null;this.src='assets/products/hero-showcase.jpg'" style="width:54px; height:54px; object-fit:contain; border-radius:10px; border:1px solid var(--border); background:#fff; padding:4px; flex-shrink:0;" />
          <div style="min-width:0; flex:1;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <span class="sku-tag" style="font-size:0.72rem;">${escapeHTML(p.model)}</span>
              <strong style="color:var(--brand-dark); font-size:0.84rem;">${formatEGP(p.price)}</strong>
            </div>
            <div style="font-size:0.82rem; font-weight:800; color:var(--text-dark); line-height:1.35; margin-top:2px;">${escapeHTML(p.name)}</div>
          </div>
        </div>

        <div style="display:flex; gap:6px; flex-wrap:wrap; padding-top:8px; border-top:1px dashed var(--border);">
          <button type="button"
                  class="${inPool ? 'btn-brand' : 'btn-outline'}"
                  style="flex:1; padding:6px 10px; font-size:0.75rem; justify-content:center;"
                  onclick="toggleAdminBundlePoolItem('${escapeHTML(p.id)}')">
            <i class="fa-solid ${inPool ? 'fa-circle-check' : 'fa-plus'}"></i>
            ${inPool ? 'مُدرج بالباكدج' : 'إدراج بالباكدج'}
          </button>

          ${inPool ? `
            <button type="button"
                    class="tool-btn"
                    style="height:32px; padding:0 10px; font-size:0.74rem; border-color:${isDefault ? 'var(--brand)' : 'var(--border)'}; background:${isDefault ? 'var(--brand-tint)' : '#fff'}; color:${isDefault ? 'var(--brand-dark)' : 'var(--text-muted)'}; font-weight:800;"
                    onclick="toggleAdminBundleDefaultItem('${escapeHTML(p.id)}')"
                    title="تحديد كجهاز مختار تلقائياً عند فتح باكدج العروسة">
              <i class="fa-solid fa-crown"></i>
              ${isDefault ? 'مختار افتراضياً' : 'جعله افتراضياً'}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');
};

window.toggleAdminBundlePoolItem = function(productId) {
  const pool = [...getAdminBundlePoolIds()];
  const defs = [...getAdminBundleDefaultIds()];
  const idx = pool.indexOf(productId);
  if (idx > -1) {
    if (pool.length <= 2) {
      showAdminToast('يجب الإبقاء على جهازين على الأقل داخل باكدج العروسة');
      return;
    }
    pool.splice(idx, 1);
  } else {
    pool.push(productId);
  }
  const cleanDefs = defs.filter(id => pool.includes(id));
  adminState.settings = {
    ...adminState.settings,
    bundleProductIds: pool,
    bundleDefaultSelectedIds: cleanDefs.length ? cleanDefs : pool.slice(0, Math.min(3, pool.length))
  };
  saveStoreSettings(adminState.settings);
  updateAdminBundleLivePreview();
  renderAdminBrideBundleProductsGrid();
  updateNavBadges();
};

window.toggleAdminBundleDefaultItem = function(productId) {
  const pool = getAdminBundlePoolIds();
  if (!pool.includes(productId)) return;
  const defs = [...getAdminBundleDefaultIds()];
  const idx = defs.indexOf(productId);
  if (idx > -1) {
    if (defs.length <= 1) {
      showAdminToast('يجب تحديد جهاز واحد على الأقل كاختيار افتراضي');
      return;
    }
    defs.splice(idx, 1);
  } else {
    defs.push(productId);
  }
  adminState.settings = {
    ...adminState.settings,
    bundleProductIds: pool,
    bundleDefaultSelectedIds: defs
  };
  saveStoreSettings(adminState.settings);
  updateAdminBundleLivePreview();
  renderAdminBrideBundleProductsGrid();
};

window.setAdminBundleQuickPreset = function(mode) {
  if (mode === 'allPool') {
    const allIds = adminState.products.filter(p => p.inStock !== false).map(p => p.id);
    adminState.settings = {
      ...adminState.settings,
      bundleProductIds: allIds,
      bundleDefaultSelectedIds: getAdminBundleDefaultIds()
    };
    saveStoreSettings(adminState.settings);
    showAdminToast(`تم إتاحة جميع الأجهزة المتوفرة (${allIds.length} جهاز) في باكدج العروسة`);
  } else if (mode === 'top7') {
    const validIds = new Set(adminState.products.map(p => p.id));
    const top7 = DEFAULT_ADMIN_BUNDLE_POOL.filter(id => validIds.has(id));
    adminState.settings = {
      ...adminState.settings,
      bundleProductIds: top7,
      bundleDefaultSelectedIds: top7.slice(0, 3)
    };
    saveStoreSettings(adminState.settings);
    showAdminToast('تم تحديد أفضل 7 أجهزة أساسية لباكدج العروسة');
  }
  updateAdminBundleLivePreview();
  renderAdminBrideBundleProductsGrid();
  updateNavBadges();
};

window.resetAdminBrideBundleDefaults = function() {
  const validIds = new Set(adminState.products.map(p => p.id));
  const pool = DEFAULT_ADMIN_BUNDLE_POOL.filter(id => validIds.has(id));
  adminState.settings = {
    ...adminState.settings,
    bundleEnabled: true,
    bundleKicker: DEFAULT_STORE_SETTINGS.bundleKicker,
    bundleTitle: DEFAULT_STORE_SETTINGS.bundleTitle,
    bundleSubtitle: DEFAULT_STORE_SETTINGS.bundleSubtitle,
    bundleTier2: 10,
    bundleTier3: 18,
    bundleTier4: 25,
    bundleCustomFixedPrice: 0,
    bundleProductIds: pool,
    bundleDefaultSelectedIds: pool.slice(0, 3)
  };
  saveStoreSettings(adminState.settings);
  renderAdminBrideBundleManager();
  populateSiteSettingsForm();
  updateNavBadges();
  showAdminToast('تمت استعادة الإعدادات الافتراضية لباكدج العروسة');
};

window.saveAdminBrideBundleForm = function(e) {
  e.preventDefault();
  const clampPct = (id, def) => {
    const v = Number(document.getElementById(id)?.value);
    return Number.isFinite(v) ? Math.max(0, Math.min(80, v)) : def;
  };
  const updated = {
    ...adminState.settings,
    bundleEnabled: document.getElementById('bndEnabled').value === 'true',
    bundleKicker: document.getElementById('bndKicker').value.trim() || DEFAULT_STORE_SETTINGS.bundleKicker,
    bundleTitle: document.getElementById('bndTitle').value.trim() || DEFAULT_STORE_SETTINGS.bundleTitle,
    bundleSubtitle: document.getElementById('bndSubtitle').value.trim() || DEFAULT_STORE_SETTINGS.bundleSubtitle,
    bundleTier2: clampPct('bndTier2', 10),
    bundleTier3: clampPct('bndTier3', 18),
    bundleTier4: clampPct('bndTier4', 25),
    bundleCustomFixedPrice: Math.max(0, Number(document.getElementById('bndFixedPrice').value || 0)),
    bundleProductIds: getAdminBundlePoolIds(),
    bundleDefaultSelectedIds: getAdminBundleDefaultIds()
  };
  adminState.settings = updated;
  saveStoreSettings(updated);
  populateSiteSettingsForm();
  renderAdminBrideBundleManager();
  updateNavBadges();
  showAdminToast('تم حفظ إعدادات باكدج العروسة وتحديث المتجر بنجاح');
};

function renderAdminHeroSlidesEditor() {
  const container = document.getElementById('adminHeroSlidesContainer');
  if (!container) return;

  container.innerHTML = adminState.heroSlides.map((s, idx) => `
    <div class="admin-hero-slide-card" style="border:1.5px solid var(--border); border-radius:16px; padding:16px; background:var(--bg-page); display:grid; grid-template-columns:120px 1fr; gap:16px; align-items:center;">
      <img src="${escapeHTML(s.image)}" onerror="this.onerror=null;this.src='assets/products/hero-showcase.jpg'" style="width:110px; height:90px; object-fit:contain; background:#fff; border-radius:12px; border:1px solid var(--border); padding:6px;" />
      <div class="form-grid">
        <div class="form-field">
          <label>عنوان الشريحة #${idx + 1}</label>
          <input type="text" class="form-input" value="${escapeHTML(s.title)}" onchange="updateHeroSlideField(${idx}, 'title', this.value)" />
        </div>
        <div class="form-field">
          <label>الموديل</label>
          <input type="text" class="form-input" value="${escapeHTML(s.model)}" onchange="updateHeroSlideField(${idx}, 'model', this.value)" />
        </div>
        <div class="form-field">
          <label>السعر المعروض</label>
          <input type="text" class="form-input" value="${escapeHTML(s.price)}" onchange="updateHeroSlideField(${idx}, 'price', this.value)" />
        </div>
        <div class="form-field">
          <label>رابط الصورة</label>
          <input type="text" class="form-input" value="${escapeHTML(s.image)}" onchange="updateHeroSlideField(${idx}, 'image', this.value)" />
        </div>
      </div>
    </div>
  `).join('');
}

window.updateHeroSlideField = function(idx, field, val) {
  if (!adminState.heroSlides[idx]) return;
  adminState.heroSlides[idx][field] = val;
  saveHeroSlides(adminState.heroSlides);
  renderAdminHeroSlidesEditor();
  showAdminToast(`تم تحديث الشريحة #${idx + 1} في الهيرو`);
};

window.resetHeroSlidesToDefault = function() {
  localStorage.removeItem('daimond_hero_v4');
  localStorage.removeItem('daimond_hero_v5');
  localStorage.removeItem('daimond_hero_v6');
  adminState.heroSlides = getHeroSlides();
  renderAdminHeroSlidesEditor();
  showAdminToast('تم استعادة شرائح الهيرو الافتراضية');
};

// ==================== 6. COUPONS & BACKUP ====================
window.addAdminCoupon = function(e) {
  e.preventDefault();
  const code = document.getElementById('couponCodeInput').value.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
  const pct = Number(document.getElementById('couponPctInput').value);
  if (!code || !(pct > 0 && pct <= 80)) {
    showAdminToast('أدخل كود خصم بحروف إنجليزية وأرقام ونسبة بين 1% و 80%');
    return;
  }
  adminState.coupons[code] = pct;
  localStorage.setItem('daimond_coupons', JSON.stringify(adminState.coupons));
  e.target.reset();
  renderAdminCoupons();
  showAdminToast(`تم حفظ كود الخصم ${escapeHTML(code)} بنسبة ${pct}%`);
};

window.deleteAdminCoupon = function(code) {
  delete adminState.coupons[code];
  localStorage.setItem('daimond_coupons', JSON.stringify(adminState.coupons));
  renderAdminCoupons();
  showAdminToast(`تم حذف الكود ${escapeHTML(code)}`);
};

function renderAdminCoupons() {
  const list = document.getElementById('adminCouponsList');
  if (!list) return;
  list.innerHTML = Object.entries(adminState.coupons).map(([code, pct]) => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:10px 14px; border:1px solid var(--border); border-radius:12px; margin-bottom:8px; background:var(--bg-page);">
      <div>
        <span class="sku-tag" style="font-size:0.88rem;">${escapeHTML(code)}</span>
        <strong style="margin-right:10px; color:var(--brand-dark);">خصم ${Number(pct)}%</strong>
      </div>
      <button class="tool-btn" style="height:32px; width:32px; padding:0; color:#b91c1c;" data-code="${escapeHTML(code)}" onclick="deleteAdminCoupon(this.dataset.code)">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

window.exportFullStoreBackup = function() {
  const backupPayload = {
    version: 'daimond_v4',
    exportedAt: new Date().toISOString(),
    products: adminState.products,
    categories: adminState.categories,
    heroSlides: adminState.heroSlides,
    settings: adminState.settings,
    orders: adminState.orders,
    coupons: adminState.coupons
  };
  const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `daimond-store-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showAdminToast('تم تصدير النسخة الاحتياطية الكاملة بنجاح');
};

window.importFullStoreBackup = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      if (Array.isArray(data.products)) saveStoreProducts(data.products);
      if (Array.isArray(data.categories)) saveStoreCategories(data.categories);
      if (Array.isArray(data.heroSlides)) saveHeroSlides(data.heroSlides);
      if (data.settings) saveStoreSettings(data.settings);
      if (Array.isArray(data.orders)) safeSetItem('daimond_orders', JSON.stringify(data.orders));
      if (data.coupons) safeSetItem('daimond_coupons', JSON.stringify(data.coupons));
      loadAdminAllData();
      renderAllAdminViews();
      showAdminToast('تم استيراد النسخة الاحتياطية وتحديث المتجر بنجاح');
    } catch (err) {
      showAdminToast('ملف النسخة الاحتياطية غير صالح');
    } finally {
      e.target.value = '';
    }
  };
  reader.readAsText(file);
};

window.factoryResetAllStoreData = function() {
  if (!confirm('هل تريد استعادة ضبط المصنع الافتراضي لجميع المنتجات والأقسام والإعدادات؟')) return;
  localStorage.removeItem('daimond_catalog_v4');
  localStorage.removeItem('daimond_categories_v4');
  localStorage.removeItem('daimond_categories_v5');
  localStorage.removeItem('daimond_hero_v4');
  localStorage.removeItem('daimond_hero_v5');
  localStorage.removeItem('daimond_hero_v6');
  localStorage.removeItem('daimond_settings_v4');
  loadAdminAllData();
  renderAllAdminViews();
  showAdminToast('تمت استعادة ضبط المصنع الافتراضي بنجاح');
};

function showAdminToast(msg) {
  const stack = document.getElementById('toastStack');
  if (!stack) return;
  const el = document.createElement('div');
  el.className = 'toast-item';
  el.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--brand-light);"></i> <span>${escapeHTML(msg)}</span>`;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.opacity = '0';
    setTimeout(() => el.remove(), 300);
  }, 3000);
}
