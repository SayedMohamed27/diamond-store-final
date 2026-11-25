// ============================================================================
// DIAMOND STORE - ADMIN APP DASHBOARD ENGINE (admin-app/app.js)
// ============================================================================

(() => {
  const $ = (id) => document.getElementById(id);
  const config = window.DIAMOND_SUPABASE_CONFIG;
  const isReady = Boolean(
    config?.url &&
    config?.anonKey &&
    !config.url.includes("YOUR-PROJECT-REF") &&
    !config.anonKey.includes("YOUR_SUPABASE")
  );

  const show = (id) => { const el = $(id); if (el) el.hidden = false; };
  const hide = (id) => { const el = $(id); if (el) el.hidden = true; };

  if (!isReady || !window.supabase?.createClient) {
    show("setupNotice");
    return;
  }

  // Initialize client with authenticated session persistence
  const client = window.supabase.createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  // State
  let currentAdmin = null;
  let productsCache = [];
  let categoriesCache = [];
  let ordersCache = [];
  let heroSlidesCache = [];
  let couponsCache = [];
  let reviewsCache = [];
  let siteContentCache = {};
  let settingsCache = {};
  let selectedOrderId = null;

  // Toast Helper
  function showAdminToast(msg, type = "info") {
    const stack = $("adminToastStack");
    if (!stack) return;
    const toast = document.createElement("div");
    toast.className = `admin-toast ${type}`;
    const icon = type === "success" ? "fa-circle-check" : type === "error" ? "fa-circle-xmark" : "fa-circle-info";
    toast.innerHTML = `<i class="fa-solid ${icon}"></i> <span></span>`;
    toast.querySelector("span").textContent = msg;
    stack.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transition = "opacity 0.3s";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  function formatEGP(num) {
    return (Number(num) || 0).toLocaleString('en-US') + ' ج.م';
  }

  function escapeHTML(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function resolveAdminImageUrl(img) {
    const raw = String(img || '').trim();
    if (!raw) return '../assets/products/airfryer.jpg';
    if (/^(https?:|data:|blob:|\/)/i.test(raw)) return raw;
    return '../' + raw.replace(/^\.?\//, '');
  }

  // Modals
  window.openAdminModal = function(id) {
    const el = $(id);
    if (el) el.classList.add("active");
  };

  window.closeAdminModal = function(id) {
    const el = $(id);
    if (el) el.classList.remove("active");
  };

  // Switch Tabs
  window.switchTab = function(tabName) {
    document.querySelectorAll(".nav-tab-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-tab") === tabName);
    });
    document.querySelectorAll(".tab-section").forEach(sec => {
      sec.classList.toggle("active", sec.id === `tab-${tabName}`);
    });
  };

  // Auth & Session Handling
  async function renderSession(session) {
    if (!session?.user) {
      hide("dashboardPanel");
      show("loginPanel");
      $("appShell").classList.add("auth-mode");
      return;
    }

    try {
      const { data: admin, error } = await client
        .from("admin_users")
        .select("role, active, display_name")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (error || !admin?.active) {
        await client.auth.signOut();
        hide("dashboardPanel");
        show("loginPanel");
        $("appShell").classList.add("auth-mode");
        $("loginMessage").textContent = "هذا الحساب غير معتمد كمسؤول في المتجر. يرجى التواصل مع مالك المتجر.";
        return;
      }

      currentAdmin = admin;
      hide("loginPanel");
      show("dashboardPanel");
      $("appShell").classList.remove("auth-mode");

      $("signedInAs").textContent = `${(session.user.email || "").split("@")[0]} (${admin.display_name || 'مسؤول المتجر'})`;
      $("roleBadge").textContent = admin.role === 'super_admin' ? 'مشرف رئيسي (Super Admin)' : 'مشرف (Admin)';
      $("navUsersTab").style.display = admin.role === 'super_admin' ? '' : 'none';
      if (admin.role === 'super_admin') loadAdminUsers();

      // Initial data fetch
      await loadAllAdminData();
    } catch (err) {
      console.error("[Admin App] Session verification error:", err);
      $("loginMessage").textContent = "حدث خطأ أثناء التحقق من صلاحيات الحساب.";
    }
  }

  // Master Data Loader
  async function loadAllAdminData() {
    try {
      await Promise.all([
        loadProducts(),
        loadCategories(),
        loadOrders(),
        loadHeroSlides(),
        loadCoupons(),
        loadReviews(),
        loadSiteContent(),
        loadStoreSettings()
      ]);
      renderOverviewKPIs();
    } catch (err) {
      console.error("[Admin App] Master load error:", err);
      showAdminToast("تعذر تحميل بعض البيانات من السيرفر", "error");
    }
  }

  // ==========================================================================
  // 1. PRODUCTS MANAGEMENT
  // ==========================================================================
  async function loadProducts() {
    const { data, error } = await client
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("loadProducts error:", error);
      return;
    }

    productsCache = data || [];
    $("badgeProductsCount").textContent = productsCache.length;
    renderProductsTable();
  }

  function renderProductsTable() {
    const body = $("productsTableBody");
    if (!body) return;

    const searchTerm = ($("prodSearchInput")?.value || "").trim().toLowerCase();
    const catFilter = $("prodCategoryFilter")?.value || "all";
    const stockFilter = $("prodStockFilter")?.value || "all";

    const filtered = productsCache.filter(p => {
      const matchSearch = !searchTerm ||
        (p.name && p.name.toLowerCase().includes(searchTerm)) ||
        (p.model && p.model.toLowerCase().includes(searchTerm)) ||
        (p.id && p.id.toLowerCase().includes(searchTerm));
      const matchCat = catFilter === "all" || p.category === catFilter;
      const matchStock = stockFilter === "all" ||
        (stockFilter === "inStock" && p.in_stock) ||
        (stockFilter === "outStock" && !p.in_stock);
      return matchSearch && matchCat && matchStock;
    });

    if (filtered.length === 0) {
      body.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:32px;" class="muted">لا توجد أجهزة مطابقة للبحث أو التصفية.</td></tr>`;
      return;
    }

    body.innerHTML = filtered.map(p => `
      <tr>
        <td>
          <img src="${escapeHTML(resolveAdminImageUrl(p.image))}" alt="${escapeHTML(p.name)}" class="thumb-img" loading="lazy" decoding="async" width="64" height="64" onerror="this.src='../assets/products/airfryer.jpg'" />
        </td>
        <td><strong>${escapeHTML(p.model || '—')}</strong></td>
        <td>
          <div style="font-weight:800; max-width:280px;">${escapeHTML(p.name)}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(p.id)}</div>
        </td>
        <td><span class="badge badge-gray">${escapeHTML(p.category_label || p.category)}</span></td>
        <td>
          <div style="font-weight:900; color:var(--brand-dark);">${formatEGP(p.price)}</div>
          ${p.old_price ? `<div style="text-decoration:line-through; font-size:0.75rem; color:var(--text-muted);">${formatEGP(p.old_price)}</div>` : ''}
        </td>
        <td>
          <span style="font-weight:800;">${p.stock_qty ?? 100}</span> قطعة
        </td>
        <td>
          <button type="button" class="badge ${p.in_stock ? 'badge-success' : 'badge-danger'}" style="cursor:pointer;" onclick="toggleProductStock('${escapeHTML(p.id)}', ${!p.in_stock})">
            ${p.in_stock ? 'متوفر' : 'غير متوفر'}
          </button>
        </td>
        <td>
          <div class="action-btns">
            <button type="button" class="btn-outline btn-sm" onclick="editProductModal('${escapeHTML(p.id)}')">
              <i class="fa-solid fa-pen-to-square"></i> تعديل
            </button>
            <button type="button" class="btn-danger btn-sm" onclick="deleteProduct('${escapeHTML(p.id)}')">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join("");
  }

  window.toggleProductStock = async function(id, nextState) {
    const { error } = await client
      .from("products")
      .update({ in_stock: nextState })
      .eq("id", id);

    if (error) {
      showAdminToast("تعذر تحديث حالة المخزون", "error");
    } else {
      showAdminToast(`تم تحديث حالة المنتج إلى ${nextState ? 'متوفر' : 'غير متوفر'}`, "success");
      await loadProducts();
      renderOverviewKPIs();
    }
  };

  window.editProductModal = function(id) {
    const p = productsCache.find(x => x.id === id);
    if (!p) return;

    $("productModalTitle").innerHTML = `<i class="fa-solid fa-pen-to-square"></i> تعديل جهاز: ${escapeHTML(p.model || p.name)}`;
    $("pIsEdit").value = "true";
    $("pId").value = p.id;
    $("pId").disabled = true;
    $("pModel").value = p.model || "";
    $("pName").value = p.name || "";
    $("pCategory").value = p.category || "kitchen";
    $("pCategoryLabel").value = p.category_label || "";
    $("pPrice").value = p.price || 0;
    $("pOldPrice").value = p.old_price || "";
    $("pWattage").value = p.wattage || "";
    $("pCapacity").value = p.capacity || "";
    $("pBadge").value = p.badge || "";
    $("pStockQty").value = p.stock_qty ?? 100;
    $("pImage").value = p.image || "";
    $("pShortDesc").value = p.short_desc || "";
    $("pInStock").checked = p.in_stock !== false;

    window.openAdminModal("productModal");
  };

  window.deleteProduct = async function(id) {
    const p = productsCache.find(x => x.id === id);
    if (!confirm(`هل أنت متأكد من حذف المنتج "${p?.name || id}" نهائياً؟`)) return;

    const { error } = await client
      .from("products")
      .delete()
      .eq("id", id);

    if (error) {
      showAdminToast("تعذر حذف المنتج من قاعدة البيانات", "error");
    } else {
      showAdminToast("تم حذف المنتج بنجاح", "success");
      await loadProducts();
      renderOverviewKPIs();
    }
  };

  $("btnAddProduct").addEventListener("click", () => {
    $("productModalTitle").innerHTML = `<i class="fa-solid fa-plus"></i> إضافة جهاز جديد إلى المتجر`;
    $("pIsEdit").value = "false";
    $("pId").value = "";
    $("pId").disabled = false;
    $("productForm").reset();
    $("pInStock").checked = true;
    $("pStockQty").value = 100;
    window.openAdminModal("productModal");
  });

  // Shared image upload into the product-media bucket (products, categories, sub-categories)
  async function uploadImageToProductMedia(file, folder) {
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `${folder}/${folder === 'products' ? 'prod' : 'media'}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const { error } = await client.storage
      .from("product-media")
      .upload(filePath, file, { upsert: true });
    if (error) {
      console.error("Storage upload error:", error);
      showAdminToast("تعذر رفع الصورة إلى التخزين: " + error.message, "error");
      return null;
    }
    return client.storage.from("product-media").getPublicUrl(filePath).data.publicUrl;
  }

  // Live Font Awesome icon preview next to an icon input
  function wireIconPreview(input, previewEl) {
    if (!input || !previewEl) return;
    const update = () => {
      const icon = (input.value.trim() || "fa-tag").replace(/[^a-zA-Z0-9_-]/g, "");
      previewEl.innerHTML = `<i class="fa-solid ${escapeHTML(icon)}"></i>`;
    };
    input.addEventListener("input", update);
    update();
  }

  $("pImageUpload").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showAdminToast("جارٍ رفع الصورة إلى مساحة التخزين...", "info");
    const publicUrl = await uploadImageToProductMedia(file, "products");
    if (publicUrl) {
      $("pImage").value = publicUrl;
      showAdminToast("تم رفع الصورة بنجاح وتعيين الرابط", "success");
    }
  });

  $("productForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("btnSaveProduct");
    btn.disabled = true;
    btn.textContent = "جارٍ الحفظ...";

    const isEdit = $("pIsEdit").value === "true";
    const payload = {
      id: $("pId").value.trim(),
      model: $("pModel").value.trim(),
      name: $("pName").value.trim(),
      category: $("pCategory").value,
      category_label: $("pCategoryLabel").value.trim(),
      price: Number($("pPrice").value) || 0,
      old_price: $("pOldPrice").value ? Number($("pOldPrice").value) : null,
      wattage: $("pWattage").value.trim(),
      capacity: $("pCapacity").value.trim(),
      badge: $("pBadge").value.trim(),
      stock_qty: Number($("pStockQty").value) || 0,
      image: $("pImage").value.trim(),
      short_desc: $("pShortDesc").value.trim(),
      in_stock: $("pInStock").checked
    };

    let result;
    if (isEdit) {
      result = await client.from("products").update(payload).eq("id", payload.id);
    } else {
      payload.sort_order = productsCache.length + 1;
      result = await client.from("products").insert(payload);
    }

    btn.disabled = false;
    btn.textContent = "حفظ الجهاز";

    if (result.error) {
      console.error("Save product error:", result.error);
      showAdminToast("حدث خطأ أثناء الحفظ: " + result.error.message, "error");
    } else {
      showAdminToast("تم حفظ بيانات الجهاز بنجاح", "success");
      window.closeAdminModal("productModal");
      await loadProducts();
      renderOverviewKPIs();
    }
  });

  // Filter Listeners
  $("prodSearchInput")?.addEventListener("input", renderProductsTable);
  $("prodCategoryFilter")?.addEventListener("change", renderProductsTable);
  $("prodStockFilter")?.addEventListener("change", renderProductsTable);

  // ==========================================================================
  // 2. CATEGORIES MANAGEMENT
  // ==========================================================================
  async function loadCategories() {
    const { data, error } = await client
      .from("categories")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("loadCategories error:", error);
      return;
    }

    categoriesCache = data || [];
    renderCategoriesTable();
  }

  function renderCategoriesTable() {
    const body = $("categoriesTableBody");
    if (!body) return;

    body.innerHTML = categoriesCache.map((c, idx) => `
      <tr>
        <td><strong>${escapeHTML(c.id)}</strong></td>
        <td>
          <div style="font-weight:800;">${escapeHTML(c.name)}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(c.subtitle || '')}</div>
        </td>
        <td><i class="fa-solid ${escapeHTML(c.icon || 'fa-tag')}"></i> ${escapeHTML(c.icon || '')}</td>
        <td>
          <span class="badge badge-brand">${Array.isArray(c.sub_items) ? c.sub_items.length : 0} فئات فرعية</span>
        </td>
        <td>
          <button type="button" class="btn-outline btn-sm" title="تحريك لأعلى" ${idx === 0 ? "disabled" : ""} onclick="moveCategory('${escapeHTML(c.id)}', -1)"><i class="fa-solid fa-arrow-up"></i></button>
          <button type="button" class="btn-outline btn-sm" title="تحريك لأسفل" ${idx === categoriesCache.length - 1 ? "disabled" : ""} onclick="moveCategory('${escapeHTML(c.id)}', 1)"><i class="fa-solid fa-arrow-down"></i></button>
        </td>
        <td>
          <span class="badge ${c.is_active === false ? 'badge-danger' : 'badge-success'}">${c.is_active === false ? 'مخفي' : 'ظاهر'}</span>
        </td>
        <td style="white-space:nowrap;">
          <button type="button" class="btn-outline btn-sm" onclick="editSubcategoriesModal('${escapeHTML(c.id)}')">
            <i class="fa-solid fa-pen"></i> تعديل
          </button>
          <button type="button" class="btn-outline btn-sm" onclick="toggleCategoryActive('${escapeHTML(c.id)}')">
            <i class="fa-solid ${c.is_active === false ? 'fa-eye' : 'fa-eye-slash'}"></i>
          </button>
          <button type="button" class="btn-danger btn-sm" onclick="deleteCategory('${escapeHTML(c.id)}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");
  }

  window.moveCategory = async function(catId, dir) {
    const idx = categoriesCache.findIndex(x => x.id === catId);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= categoriesCache.length) return;

    const a = categoriesCache[idx];
    const b = categoriesCache[swapIdx];
    const { error } = await client.from("categories").upsert([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order }
    ]);
    if (error) {
      showAdminToast("تعذر تغيير الترتيب: " + error.message, "error");
      return;
    }
    await loadCategories();
  };

  window.toggleCategoryActive = async function(catId) {
    const c = categoriesCache.find(x => x.id === catId);
    if (!c) return;
    const next = c.is_active === false;
    const { error } = await client.from("categories").update({ is_active: next }).eq("id", catId);
    if (error) {
      showAdminToast("تعذر التغيير: " + error.message, "error");
      return;
    }
    showAdminToast(next ? "القسم ظاهر في الموقع الآن" : "تم إخفاء القسم من الموقع", "success");
    await loadCategories();
  };

  window.deleteCategory = async function(catId) {
    if (!confirm("سيتم حذف القسم وكل فئاته الفرعية نهائياً. هل أنت متأكد؟")) return;

    // Block the delete while any product still uses this category
    const { count, error: cntError } = await client
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("category", catId);
    if (!cntError && count > 0) {
      showAdminToast(`لا يمكن حذف القسم: يوجد ${count} جهاز يستخدمه. انقل الأجهزة لقسم آخر أولاً.`, "error");
      return;
    }

    const { error } = await client.from("categories").delete().eq("id", catId);
    if (error) {
      showAdminToast("تعذر الحذف: " + error.message, "error");
      return;
    }
    showAdminToast("تم حذف القسم", "success");
    await loadCategories();
  };

  // Structured sub-items editor inside the category modal
  function subItemRow(item = {}) {
    const row = document.createElement("div");
    row.className = "subitem-row";
    // Keep the existing sub-item id stable; a new id is only minted if the item has none
    row.dataset.subId = item.id || "";
    row.style.cssText = "display:grid; grid-template-columns: 1.3fr 0.9fr 0.9fr 1.1fr auto; gap:8px; align-items:center;";
    row.innerHTML = `
      <input type="text" class="si-label" placeholder="الاسم (خلاطات)" value="${escapeHTML(item.label || '')}" />
      <input type="text" class="si-query" placeholder="كلمة البحث (خلاط)" value="${escapeHTML(item.query || '')}" />
      <span style="display:flex; gap:4px; align-items:center;">
        <input type="text" class="si-icon" placeholder="fa-blender" value="${escapeHTML(item.icon || 'fa-tag')}" style="min-width:0;" />
        <span class="si-icon-preview" title="معاينة الأيقونة" style="font-size:0.95rem;"></span>
      </span>
      <span style="display:flex; gap:4px; align-items:center; min-width:0;">
        <input type="text" class="si-image" placeholder="رابط الصورة" value="${escapeHTML(item.image || '')}" style="min-width:0;" />
        <label class="btn-outline btn-sm" style="margin:0; cursor:pointer; display:flex; align-items:center;" title="رفع صورة">
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <input type="file" class="si-image-upload" accept="image/*" style="display:none;" />
        </label>
      </span>
      <span style="display:flex; gap:4px;">
        <button type="button" class="btn-outline btn-sm si-up" title="لأعلى"><i class="fa-solid fa-arrow-up"></i></button>
        <button type="button" class="btn-outline btn-sm si-down" title="لأسفل"><i class="fa-solid fa-arrow-down"></i></button>
        <button type="button" class="btn-danger btn-sm si-del" title="حذف"><i class="fa-solid fa-times"></i></button>
      </span>
    `;
    wireIconPreview(row.querySelector(".si-icon"), row.querySelector(".si-icon-preview"));
    row.querySelector(".si-image-upload").addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      showAdminToast("جارٍ رفع الصورة إلى مساحة التخزين...", "info");
      const publicUrl = await uploadImageToProductMedia(file, "categories");
      if (publicUrl) {
        row.querySelector(".si-image").value = publicUrl;
        showAdminToast("تم رفع الصورة بنجاح وتعيين الرابط", "success");
      }
    });
    row.querySelector(".si-del").addEventListener("click", () => row.remove());
    row.querySelector(".si-up").addEventListener("click", () => {
      const list = $("catSubItemsList");
      if (row.previousElementSibling) list.insertBefore(row, row.previousElementSibling);
    });
    row.querySelector(".si-down").addEventListener("click", () => {
      const list = $("catSubItemsList");
      if (row.nextElementSibling) list.insertBefore(row.nextElementSibling, row);
    });
    return row;
  }

  window.editSubcategoriesModal = function(catId) {
    const c = categoriesCache.find(x => x.id === catId);
    if (!c) return;
    $("categoryModalTitle").innerHTML = '<i class="fa-solid fa-layer-group"></i> تعديل القسم والفئات الفرعية';
    $("catIdInput").value = c.id;
    $("catIdInput").readOnly = true;
    $("catNameInput").value = c.name || "";
    $("catIconInput").value = c.icon || "fa-tag";
    $("catImage").value = c.image || "";
    $("catSubtitleInput").value = c.subtitle || "";
    $("catActiveInput").checked = c.is_active !== false;
    $("catFormError").style.display = "none";
    wireIconPreview($("catIconInput"), $("catIconPreview"));

    const list = $("catSubItemsList");
    list.innerHTML = "";
    (Array.isArray(c.sub_items) ? c.sub_items : []).forEach(s => list.appendChild(subItemRow(s)));
    window.openAdminModal("categoryModal");
  };

  $("btnAddCategory")?.addEventListener("click", () => {
    $("categoryModalTitle").innerHTML = '<i class="fa-solid fa-plus"></i> قسم جديد';
    $("catIdInput").value = "";
    $("catIdInput").readOnly = false;
    $("catNameInput").value = "";
    $("catIconInput").value = "fa-tag";
    $("catImage").value = "";
    $("catSubtitleInput").value = "";
    $("catActiveInput").checked = true;
    $("catFormError").style.display = "none";
    wireIconPreview($("catIconInput"), $("catIconPreview"));
    $("catSubItemsList").innerHTML = "";
    window.openAdminModal("categoryModal");
  });

  $("btnAddSubItem")?.addEventListener("click", () => {
    $("catSubItemsList").appendChild(subItemRow({}));
  });

  // Category image upload into the product-media bucket
  $("catImageUpload")?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    showAdminToast("جارٍ رفع الصورة إلى مساحة التخزين...", "info");
    const publicUrl = await uploadImageToProductMedia(file, "categories");
    if (publicUrl) {
      $("catImage").value = publicUrl;
      showAdminToast("تم رفع الصورة بنجاح وتعيين الرابط", "success");
    }
  });

  $("categoryForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const errBox = $("catFormError");
    const showCatError = (msg) => {
      errBox.textContent = msg;
      errBox.style.display = "block";
      showAdminToast(msg, "error");
    };
    errBox.style.display = "none";

    // Category code: use what's typed, or auto-generate from the name; never fail silently
    let catId = $("catIdInput").value.trim();
    if (!catId) {
      const slug = $("catNameInput").value.trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 30);
      catId = slug || `cat-${Date.now().toString(36)}`;
      $("catIdInput").value = catId;
    }
    if (!/^[A-Za-z0-9_-]+$/.test(catId)) {
      showCatError("كود القسم يجب أن يكون حروفًا إنجليزية وأرقامًا فقط بدون مسافات (مثال: kitchen)");
      return;
    }
    const isNewCategory = !categoriesCache.some(x => x.id === catId);

    const btn = $("btnSaveCategory");
    btn.disabled = true;
    btn.textContent = "جارٍ الحفظ...";

    const sub_items = Array.from($("catSubItemsList").querySelectorAll(".subitem-row")).map((row, idx) => {
      const label = row.querySelector(".si-label").value.trim() || `فئة ${idx + 1}`;
      const query = row.querySelector(".si-query").value.trim() || label;
      const icon = row.querySelector(".si-icon").value.trim() || "fa-tag";
      const image = row.querySelector(".si-image").value.trim();
      // Keep the stored sub-item id; mint one only for rows that never had an id
      let subId = row.dataset.subId;
      if (!subId) {
        subId = `${catId}-sub-${Date.now().toString(36)}-${idx}`;
        row.dataset.subId = subId;
      }
      return { id: subId, label, query, icon, image };
    });

    const payload = {
      id: catId,
      name: $("catNameInput").value.trim(),
      icon: $("catIconInput").value.trim() || "fa-tag",
      image: $("catImage").value.trim(),
      subtitle: $("catSubtitleInput").value.trim(),
      sub_items,
      is_active: $("catActiveInput").checked
    };
    // New categories go to the end of the list
    if (isNewCategory) {
      payload.sort_order = categoriesCache.reduce((max, c) => Math.max(max, Number(c.sort_order) || 0), 0) + 1;
    }
    const { error } = await client.from("categories").upsert(payload);

    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-check"></i> حفظ القسم والفئات`;

    if (error) {
      showCatError("تعذر حفظ القسم: " + error.message);
    } else {
      showAdminToast("تم حفظ بيانات القسم والفئات الفرعية بنجاح", "success");
      window.closeAdminModal("categoryModal");
      await loadCategories();
    }
  });

  // ==========================================================================
  // 3. ORDERS MANAGEMENT
  // ==========================================================================
  async function loadOrders() {
    const { data, error } = await client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("loadOrders error:", error);
      return;
    }

    ordersCache = data || [];
    $("badgeOrdersCount").textContent = ordersCache.length;
    renderOrdersTable();
    renderOverviewOrders();
  }

  function getStatusPillClass(status) {
    switch (status) {
      case 'جديد': return 'status-new';
      case 'قيد التجهيز': return 'status-processing';
      case 'تم الشحن': return 'status-shipped';
      case 'تم التوصيل': return 'status-delivered';
      case 'ملغي': return 'status-cancelled';
      case 'مؤجل': return 'status-postponed';
      default: return 'status-new';
    }
  }

  function renderOrdersTable() {
    const body = $("ordersTableBody");
    if (!body) return;

    const searchTerm = ($("orderSearchInput")?.value || "").trim().toLowerCase();
    const statusFilter = $("orderStatusFilter")?.value || "all";

    const filtered = ordersCache.filter(o => {
      const matchSearch = !searchTerm ||
        (o.order_code && o.order_code.toLowerCase().includes(searchTerm)) ||
        (o.customer && o.customer.toLowerCase().includes(searchTerm)) ||
        (o.phone && o.phone.includes(searchTerm));
      const matchStatus = statusFilter === "all" || o.status === statusFilter;
      return matchSearch && matchStatus;
    });

    if (filtered.length === 0) {
      body.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:32px;" class="muted">لا توجد طلبات مطابقة للبحث أو التصفية.</td></tr>`;
      return;
    }

    body.innerHTML = filtered.map(o => `
      <tr>
        <td><strong style="color:var(--brand-dark);">${escapeHTML(o.order_code)}</strong></td>
        <td><strong>${escapeHTML(o.customer)}</strong></td>
        <td><a href="tel:${escapeHTML(o.phone)}" style="color:inherit; text-decoration:none;">${escapeHTML(o.phone)}</a></td>
        <td>${escapeHTML(o.gov)}</td>
        <td><span class="badge badge-gray">${escapeHTML(o.payment)}</span></td>
        <td><strong>${formatEGP(o.total)}</strong></td>
        <td><span class="status-pill ${getStatusPillClass(o.status)}">${escapeHTML(o.status)}</span></td>
        <td style="font-size:0.75rem; color:var(--text-muted);">${new Date(o.created_at).toLocaleDateString('ar-EG')}</td>
        <td>
          <button type="button" class="btn-outline btn-sm" onclick="viewOrderDetailsModal('${escapeHTML(o.id)}')">
            <i class="fa-solid fa-eye"></i> تفاصيل
          </button>
        </td>
      </tr>
    `).join("");
  }

  function renderOverviewOrders() {
    const body = $("overviewOrdersBody");
    if (!body) return;

    const recent = ordersCache.slice(0, 5);
    if (recent.length === 0) {
      body.innerHTML = `<tr><td colspan="7" style="text-align:center; padding:24px;" class="muted">لا توجد طلبات مسجلة بعد في قاعدة البيانات.</td></tr>`;
      return;
    }

    body.innerHTML = recent.map(o => `
      <tr>
        <td><strong style="color:var(--brand-dark);">${escapeHTML(o.order_code)}</strong></td>
        <td><strong>${escapeHTML(o.customer)}</strong></td>
        <td>${escapeHTML(o.gov)}</td>
        <td>${escapeHTML(o.payment)}</td>
        <td><strong>${formatEGP(o.total)}</strong></td>
        <td><span class="status-pill ${getStatusPillClass(o.status)}">${escapeHTML(o.status)}</span></td>
        <td style="font-size:0.75rem; color:var(--text-muted);">${new Date(o.created_at).toLocaleDateString('ar-EG')}</td>
      </tr>
    `).join("");
  }

  window.viewOrderDetailsModal = async function(orderId) {
    selectedOrderId = orderId;
    const o = ordersCache.find(x => x.id === orderId);
    if (!o) return;

    $("modalOrderCode").textContent = o.order_code;
    $("modalOrderStatusSelect").value = o.status;

    // Fetch order items from public.order_items
    const { data: items, error } = await client
      .from("order_items")
      .select("*")
      .eq("order_id", orderId);

    const itemsList = items || [];
    const waPhone = o.phone.startsWith("0") ? "2" + o.phone : o.phone;
    const waText = `مرحباً ${o.customer}، نتواصل معك من متجر Diamond Store بخصوص طلبك رقم ${o.order_code}`;
    $("modalOrderWaBtn").href = `https://wa.me/${waPhone}?text=${encodeURIComponent(waText)}`;

    let receiptSignedUrl = null;
    if (o.payment_screenshot_path) {
      const { data: signedData } = await client.storage
        .from("payment-proofs")
        .createSignedUrl(o.payment_screenshot_path, 3600);
      if (signedData?.signedUrl) {
        receiptSignedUrl = signedData.signedUrl;
      }
    }

    $("modalOrderDetailsBody").innerHTML = `
      <div style="background:#FAF8F5; border:1px solid var(--border); border-radius:12px; padding:16px; margin-bottom:16px; font-size:0.88rem;">
        <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:10px;">
          <div><strong>الاسم:</strong> ${escapeHTML(o.customer)}</div>
          <div><strong>الهاتف:</strong> ${escapeHTML(o.phone)}</div>
          <div><strong>المحافظة:</strong> ${escapeHTML(o.gov)}</div>
          <div><strong>العنوان:</strong> ${escapeHTML(o.address)}</div>
          <div><strong>طريقة الدفع:</strong> ${escapeHTML(o.payment)}</div>
          <div><strong>تاريخ الطلب:</strong> ${new Date(o.created_at).toLocaleString('ar-EG')}</div>
          ${o.transfer_ref ? `<div style="grid-column:span 2;"><strong>رقم إيصال التحويل:</strong> ${escapeHTML(o.transfer_ref)}</div>` : ''}
          ${receiptSignedUrl ? `<div style="grid-column:span 2; margin-top:4px;"><strong>صورة إيصال التحويل:</strong> <a href="${escapeHTML(receiptSignedUrl)}" target="_blank" rel="noopener noreferrer" style="color:var(--brand-dark); font-weight:800;">فتح صورة الإيصال في تبويب جديد</a></div>` : ''}
          ${o.notes ? `<div style="grid-column:span 2;"><strong>ملاحظات العميل:</strong> ${escapeHTML(o.notes)}</div>` : ''}
        </div>
      </div>

      <h4 style="margin-bottom:8px; font-size:0.95rem;">المنتجات المطلوبة:</h4>
      <div class="table-responsive" style="margin-bottom:16px;">
        <table>
          <thead>
            <tr>
              <th>المنتج</th>
              <th>الموديل</th>
              <th>الكمية</th>
              <th>سعر القطعة</th>
              <th>الإجمالي</th>
            </tr>
          </thead>
          <tbody>
            ${itemsList.map(it => `
              <tr>
                <td><strong>${escapeHTML(it.name)}</strong></td>
                <td>${escapeHTML(it.model || '—')}</td>
                <td>${it.qty}</td>
                <td>${formatEGP(it.unit_price)}</td>
                <td><strong>${formatEGP(it.line_total)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="background:#fff; border:1.5px solid var(--border); border-radius:12px; padding:14px; text-align:left;">
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.86rem;">
          <span>المجموع الفرعي:</span>
          <span>${formatEGP(o.subtotal)}</span>
        </div>
        ${o.discount > 0 ? `
          <div style="display:flex; justify-content:space-between; margin-bottom:4px; color:var(--brand-dark); font-size:0.86rem; font-weight:800;">
            <span>الخصم المطبق:</span>
            <span>- ${formatEGP(o.discount)}</span>
          </div>
        ` : ''}
        <div style="display:flex; justify-content:space-between; margin-bottom:4px; font-size:0.86rem;">
          <span>مصاريف الشحن:</span>
          <span>مجاني (0 ج.م)</span>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:1.1rem; font-weight:900; color:var(--text-dark); border-top:1px solid var(--border); padding-top:8px; margin-top:6px;">
          <span>الإجمالي النهائي:</span>
          <span>${formatEGP(o.total)}</span>
        </div>
      </div>
    `;

    window.openAdminModal("orderModal");
  };

  $("btnUpdateOrderStatus")?.addEventListener("click", async () => {
    if (!selectedOrderId) return;
    const newStatus = $("modalOrderStatusSelect").value;
    const btn = $("btnUpdateOrderStatus");
    btn.disabled = true;
    btn.textContent = "جارٍ التحديث...";

    const { error } = await client
      .from("orders")
      .update({ status: newStatus })
      .eq("id", selectedOrderId);

    btn.disabled = false;
    btn.textContent = "تحديث";

    if (error) {
      showAdminToast("تعذر تحديث حالة الطلب: " + error.message, "error");
    } else {
      showAdminToast(`تم تحديث حالة الطلب إلى "${newStatus}" وتسجيل السجل`, "success");
      await loadOrders();
      renderOverviewKPIs();
    }
  });

  $("btnRefreshOrders")?.addEventListener("click", loadOrders);
  $("orderSearchInput")?.addEventListener("input", renderOrdersTable);
  $("orderStatusFilter")?.addEventListener("change", renderOrdersTable);

  // ==========================================================================
  // 4. HERO SLIDES MANAGEMENT
  // ==========================================================================
  async function loadHeroSlides() {
    const { data, error } = await client
      .from("hero_slides")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("loadHeroSlides error:", error);
      return;
    }

    heroSlidesCache = data || [];
    renderHeroSlidesTable();
  }

  function renderHeroSlidesTable() {
    const body = $("heroSlidesTableBody");
    if (!body) return;

    body.innerHTML = heroSlidesCache.map(s => `
      <tr>
        <td><strong>#${escapeHTML(s.num)}</strong></td>
        <td>
          <img src="${escapeHTML(resolveAdminImageUrl(s.image))}" alt="${escapeHTML(s.title)}" class="thumb-img" loading="lazy" decoding="async" width="64" height="64" onerror="this.src='../assets/products/airfryer.jpg'" />
        </td>
        <td>
          <div style="font-weight:800; max-width:280px;">${escapeHTML(s.title)}</div>
          <div style="font-size:0.75rem; color:var(--text-muted);">${escapeHTML(s.subtitle || '')}</div>
        </td>
        <td><strong>${escapeHTML(s.model || '—')}</strong></td>
        <td>${escapeHTML(s.power || '')} ${s.capacity ? `(${escapeHTML(s.capacity)})` : ''}</td>
        <td><strong style="color:var(--brand-dark);">${escapeHTML(s.price || '')}</strong></td>
        <td><span class="badge badge-success">مفعل</span></td>
        <td>
          <button type="button" class="btn-outline btn-sm" onclick="editHeroSlideModal(${Number(s.id)})">
            <i class="fa-solid fa-pen"></i> تعديل
          </button>
        </td>
      </tr>
    `).join("");
  }

  window.editHeroSlideModal = function(slideId) {
    const s = heroSlidesCache.find(x => Number(x.id) === Number(slideId));
    if (!s) return;
    $("hsIdInput").value = s.id;
    $("hsTitleInput").value = s.title || "";
    $("hsSubtitleInput").value = s.subtitle || "";
    $("hsModelInput").value = s.model || "";
    $("hsPriceInput").value = s.price || "";
    $("hsPowerInput").value = s.power || "";
    $("hsCapacityInput").value = s.capacity || "";
    $("hsImageInput").value = s.image || "";
    window.openAdminModal("heroSlideModal");
  };

  $("heroSlideForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const slideId = Number($("hsIdInput").value);
    if (!slideId) return;

    const btn = $("btnSaveHeroSlide");
    btn.disabled = true;
    btn.textContent = "جارٍ الحفظ...";

    const { error } = await client
      .from("hero_slides")
      .update({
        title: $("hsTitleInput").value.trim(),
        subtitle: $("hsSubtitleInput").value.trim(),
        model: $("hsModelInput").value.trim(),
        price: $("hsPriceInput").value.trim(),
        power: $("hsPowerInput").value.trim(),
        capacity: $("hsCapacityInput").value.trim(),
        image: $("hsImageInput").value.trim()
      })
      .eq("id", slideId);

    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-check"></i> حفظ الشريحة`;

    if (error) {
      showAdminToast("تعذر حفظ الشريحة: " + error.message, "error");
    } else {
      showAdminToast("تم تحديث شريحة الهيرو بنجاح", "success");
      window.closeAdminModal("heroSlideModal");
      await loadHeroSlides();
    }
  });

  // ==========================================================================
  // 5. COUPONS MANAGEMENT
  // ==========================================================================
  async function loadCoupons() {
    const { data, error } = await client
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("loadCoupons error:", error);
      return;
    }

    couponsCache = data || [];
    renderCouponsTable();
  }

  function renderCouponsTable() {
    const body = $("couponsTableBody");
    if (!body) return;

    body.innerHTML = couponsCache.map(c => `
      <tr>
        <td><strong style="color:var(--brand-dark); font-size:1rem;">${escapeHTML(c.code)}</strong></td>
        <td><span class="badge badge-gray">${c.discount_type === 'percent' ? 'نسبة مئوية' : 'خصم ثابت'}</span></td>
        <td><strong>${c.discount_type === 'percent' ? c.discount_value + '%' : formatEGP(c.discount_value)}</strong></td>
        <td>${c.min_order_total > 0 ? formatEGP(c.min_order_total) : 'بدون حد أدنى'}</td>
        <td>${c.used_count || 0} مرات</td>
        <td>
          <span class="badge ${c.is_active ? 'badge-success' : 'badge-danger'}">
            ${c.is_active ? 'مفعل' : 'معطل'}
          </span>
        </td>
        <td>
          <button type="button" class="btn-danger btn-sm" onclick="deleteCoupon('${escapeHTML(c.code)}')">
            <i class="fa-solid fa-trash"></i>
          </button>
        </td>
      </tr>
    `).join("");
  }

  $("btnAddCoupon")?.addEventListener("click", async () => {
    const code = prompt("أدخل كود الخصم الجديد (مثال: SUMMER10):");
    if (!code) return;
    const val = prompt("أدخل نسبة الخصم المئوية (مثال: 10):", "10");
    if (!val) return;

    const { error } = await client
      .from("coupons")
      .insert({
        code: code.trim().toUpperCase(),
        discount_type: "percent",
        discount_value: Number(val) || 10,
        min_order_total: 0,
        is_active: true
      });

    if (error) {
      showAdminToast("تعذر إضافة الكود: " + error.message, "error");
    } else {
      showAdminToast("تم إضافة كود الخصم بنجاح", "success");
      await loadCoupons();
    }
  });

  window.deleteCoupon = async function(code) {
    if (!confirm(`هل أنت متأكد من حذف كود الخصم "${code}"؟`)) return;
    const { error } = await client.from("coupons").delete().eq("code", code);
    if (error) showAdminToast("تعذر حذف الكود", "error");
    else {
      showAdminToast("تم حذف الكود بنجاح", "success");
      await loadCoupons();
    }
  };

  // ==========================================================================
  // 5b. CUSTOMER REVIEWS MANAGEMENT
  // ==========================================================================
  async function loadReviews() {
    const { data, error } = await client
      .from("customer_reviews")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("loadReviews error:", error);
      return;
    }

    reviewsCache = data || [];
    const badge = $("badgeReviewsCount");
    if (badge) badge.textContent = String(reviewsCache.filter(r => r.is_active !== false).length);
    renderReviewsTable();
  }

  function renderReviewsTable() {
    const body = $("reviewsTableBody");
    if (!body) return;

    if (!reviewsCache.length) {
      body.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:24px;" class="muted">لا توجد تقييمات بعد — أضف أول تقييم.</td></tr>';
      return;
    }

    body.innerHTML = reviewsCache.map((r, idx) => `
      <tr>
        <td style="font-weight:800;">${escapeHTML(r.author_name)}</td>
        <td>${escapeHTML(r.location_line || '')}</td>
        <td style="max-width:280px; font-size:0.8rem;">${escapeHTML((r.review_text || '').slice(0, 90))}${(r.review_text || '').length > 90 ? '…' : ''}</td>
        <td>${escapeHTML(r.product_tag || '')}</td>
        <td>${r.rating} <i class="fa-solid fa-star" style="color:#f5a623;"></i></td>
        <td>
          <span class="badge ${r.is_active === false ? 'badge-danger' : 'badge-success'}">${r.is_active === false ? 'مخفي' : 'ظاهر'}</span>
        </td>
        <td style="white-space:nowrap;">
          <button type="button" class="btn-outline btn-sm" title="تحريك لأعلى" ${idx === 0 ? "disabled" : ""} onclick="moveReview('${r.id}', -1)"><i class="fa-solid fa-arrow-up"></i></button>
          <button type="button" class="btn-outline btn-sm" title="تحريك لأسفل" ${idx === reviewsCache.length - 1 ? "disabled" : ""} onclick="moveReview('${r.id}', 1)"><i class="fa-solid fa-arrow-down"></i></button>
          <button type="button" class="btn-outline btn-sm" onclick="editReviewModal('${r.id}')"><i class="fa-solid fa-pen"></i></button>
          <button type="button" class="btn-outline btn-sm" onclick="toggleReviewActive('${r.id}')">
            <i class="fa-solid ${r.is_active === false ? 'fa-eye' : 'fa-eye-slash'}"></i>
          </button>
          <button type="button" class="btn-danger btn-sm" onclick="deleteReview('${r.id}')"><i class="fa-solid fa-trash"></i></button>
        </td>
      </tr>
    `).join("");
  }

  window.editReviewModal = function(reviewId) {
    const r = reviewsCache.find(x => x.id === reviewId);
    if (!r) return;
    $("reviewModalTitle").innerHTML = '<i class="fa-solid fa-star"></i> تعديل التقييم';
    $("reviewIdInput").value = r.id;
    $("reviewNameInput").value = r.author_name || "";
    $("reviewInitialsInput").value = r.avatar_initials || "";
    $("reviewMetaInput").value = r.location_line || "";
    $("reviewTextInput").value = r.review_text || "";
    $("reviewTagInput").value = r.product_tag || "";
    $("reviewRatingInput").value = String(r.rating || 5);
    $("reviewActiveInput").checked = r.is_active !== false;
    window.openAdminModal("reviewModal");
  };

  $("btnAddReview")?.addEventListener("click", () => {
    $("reviewModalTitle").innerHTML = '<i class="fa-solid fa-plus"></i> تقييم جديد';
    $("reviewIdInput").value = "";
    $("reviewNameInput").value = "";
    $("reviewInitialsInput").value = "";
    $("reviewMetaInput").value = "";
    $("reviewTextInput").value = "";
    $("reviewTagInput").value = "";
    $("reviewRatingInput").value = "5";
    $("reviewActiveInput").checked = true;
    window.openAdminModal("reviewModal");
  });

  $("reviewForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("btnSaveReview");
    btn.disabled = true;
    btn.textContent = "جارٍ الحفظ...";

    const editId = $("reviewIdInput").value;
    const payload = {
      author_name: $("reviewNameInput").value.trim(),
      avatar_initials: $("reviewInitialsInput").value.trim(),
      location_line: $("reviewMetaInput").value.trim(),
      review_text: $("reviewTextInput").value.trim(),
      product_tag: $("reviewTagInput").value.trim(),
      rating: Number($("reviewRatingInput").value) || 5,
      is_active: $("reviewActiveInput").checked
    };

    let error;
    if (editId) {
      ({ error } = await client.from("customer_reviews").update(payload).eq("id", editId));
    } else {
      const maxOrder = reviewsCache.reduce((m, r) => Math.max(m, Number(r.sort_order) || 0), 0);
      ({ error } = await client.from("customer_reviews").insert({ ...payload, sort_order: maxOrder + 10 }));
    }

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> حفظ التقييم';

    if (error) {
      showAdminToast("تعذر حفظ التقييم: " + error.message, "error");
    } else {
      showAdminToast("تم حفظ التقييم — يظهر في الموقع مباشرة", "success");
      window.closeAdminModal("reviewModal");
      await loadReviews();
    }
  });

  window.toggleReviewActive = async function(reviewId) {
    const r = reviewsCache.find(x => x.id === reviewId);
    if (!r) return;
    const next = r.is_active === false;
    const { error } = await client.from("customer_reviews").update({ is_active: next }).eq("id", reviewId);
    if (error) {
      showAdminToast("تعذر التغيير: " + error.message, "error");
      return;
    }
    showAdminToast(next ? "التقييم ظاهر في الموقع الآن" : "تم إخفاء التقييم", "success");
    await loadReviews();
  };

  window.deleteReview = async function(reviewId) {
    if (!confirm("سيتم حذف هذا التقييم نهائياً. هل أنت متأكد؟")) return;
    const { error } = await client.from("customer_reviews").delete().eq("id", reviewId);
    if (error) {
      showAdminToast("تعذر الحذف: " + error.message, "error");
      return;
    }
    showAdminToast("تم حذف التقييم", "success");
    await loadReviews();
  };

  window.moveReview = async function(reviewId, dir) {
    const idx = reviewsCache.findIndex(x => x.id === reviewId);
    const swapIdx = idx + dir;
    if (idx < 0 || swapIdx < 0 || swapIdx >= reviewsCache.length) return;
    const a = reviewsCache[idx];
    const b = reviewsCache[swapIdx];
    const { error } = await client.from("customer_reviews").upsert([
      { id: a.id, sort_order: b.sort_order },
      { id: b.id, sort_order: a.sort_order }
    ]);
    if (error) {
      showAdminToast("تعذر تغيير الترتيب: " + error.message, "error");
      return;
    }
    await loadReviews();
  };

  // ==========================================================================
  // 5c. SITE CONTENT MANAGEMENT (topbar, footer, social, shipping)
  // ==========================================================================
  async function loadSiteContent() {
    const { data, error } = await client.from("site_content").select("key, value");
    if (error) {
      console.error("loadSiteContent error:", error);
      return;
    }
    siteContentCache = {};
    (data || []).forEach(row => { siteContentCache[row.key] = row.value; });
    renderSiteContentEditors();
  }

  function topbarLineRow(line = {}) {
    const row = document.createElement("div");
    row.style.cssText = "display:grid; grid-template-columns: 1fr 1fr auto auto; gap:8px; align-items:center;";
    row.innerHTML = `
      <input type="text" class="tb-text" placeholder="نص السطر" value="${escapeHTML(line.text || '')}" />
      <input type="text" class="tb-icon" placeholder="fa-truck-fast" value="${escapeHTML(line.icon || 'fa-circle-info')}" />
      <label style="display:flex; align-items:center; gap:6px; font-size:0.8rem;"><input type="checkbox" class="tb-active" ${line.active !== false ? "checked" : ""} style="width:16px; height:16px;" /> ظاهر</label>
      <button type="button" class="btn-danger btn-sm tb-del" title="حذف"><i class="fa-solid fa-times"></i></button>
    `;
    row.querySelector(".tb-del").addEventListener("click", () => row.remove());
    return row;
  }

  function socialLinkRow(link = {}) {
    const row = document.createElement("div");
    row.style.cssText = "display:grid; grid-template-columns: 1fr 2fr 1fr auto auto; gap:8px; align-items:center;";
    row.innerHTML = `
      <input type="text" class="so-label" placeholder="Facebook" value="${escapeHTML(link.label || '')}" />
      <input type="text" class="so-url" placeholder="https://..." value="${escapeHTML(link.url || '')}" />
      <input type="text" class="so-icon" placeholder="fa-facebook-f" value="${escapeHTML(link.icon || 'fa-link')}" />
      <label style="display:flex; align-items:center; gap:6px; font-size:0.8rem;"><input type="checkbox" class="so-active" ${link.active !== false ? "checked" : ""} style="width:16px; height:16px;" /> ظاهر</label>
      <button type="button" class="btn-danger btn-sm so-del" title="حذف"><i class="fa-solid fa-times"></i></button>
    `;
    row.querySelector(".so-del").addEventListener("click", () => row.remove());
    return row;
  }

  function renderSiteContentEditors() {
    const tb = $("topbarEditor");
    if (tb) {
      tb.innerHTML = "";
      (Array.isArray(siteContentCache.topbar) ? siteContentCache.topbar : []).forEach(l => tb.appendChild(topbarLineRow(l)));
    }
    const so = $("socialEditor");
    if (so) {
      so.innerHTML = "";
      (Array.isArray(siteContentCache.social_links) ? siteContentCache.social_links : []).forEach(l => so.appendChild(socialLinkRow(l)));
    }
    const ship = siteContentCache.shipping || {};
    if ($("shippingBadgeInput")) $("shippingBadgeInput").value = ship.hero_badge || "";
    if ($("shippingNoteInput")) $("shippingNoteInput").value = ship.note || "";
    const footer = siteContentCache.footer || {};
    if ($("footerAboutInput")) $("footerAboutInput").value = footer.about || "";
  }

  $("btnAddTopbarLine")?.addEventListener("click", () => $("topbarEditor")?.appendChild(topbarLineRow({})));
  $("btnAddSocialLink")?.addEventListener("click", () => $("socialEditor")?.appendChild(socialLinkRow({})));

  $("btnSaveSiteContent")?.addEventListener("click", async () => {
    const btn = $("btnSaveSiteContent");
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الحفظ...';

    const topbar = Array.from($("topbarEditor").querySelectorAll(":scope > div")).map(row => ({
      text: row.querySelector(".tb-text").value.trim(),
      icon: row.querySelector(".tb-icon").value.trim() || "fa-circle-info",
      active: row.querySelector(".tb-active").checked
    })).filter(l => l.text);

    const social_links = Array.from($("socialEditor").querySelectorAll(":scope > div")).map(row => ({
      label: row.querySelector(".so-label").value.trim(),
      url: row.querySelector(".so-url").value.trim(),
      icon: row.querySelector(".so-icon").value.trim() || "fa-link",
      active: row.querySelector(".so-active").checked
    })).filter(l => l.label || l.url);

    const updates = [
      { key: "topbar", value: topbar },
      { key: "social_links", value: social_links },
      {
        key: "shipping",
        value: {
          hero_badge: $("shippingBadgeInput").value.trim(),
          note: $("shippingNoteInput").value.trim()
        }
      },
      {
        key: "footer",
        value: { about: $("footerAboutInput").value.trim() }
      }
    ];

    const { error } = await client.from("site_content").upsert(updates, { onConflict: "key" });

    btn.disabled = false;
    btn.innerHTML = '<i class="fa-solid fa-check"></i> حفظ كل التغييرات';

    if (error) {
      showAdminToast("تعذر حفظ المحتوى: " + error.message, "error");
    } else {
      showAdminToast("تم حفظ محتوى الموقع — يظهر للزوار مباشرة", "success");
      await loadSiteContent();
    }
  });

  // ==========================================================================
  // 6. STORE SETTINGS & LOCAL DATA MIGRATION
  // ==========================================================================
  async function loadStoreSettings() {
    const { data, error } = await client
      .from("store_settings")
      .select("data")
      .eq("id", "default")
      .maybeSingle();

    if (error || !data) return;

    settingsCache = data.data || {};
    $("setStoreName").value = settingsCache.storeName || "Diamond Store";
    $("setWhatsapp").value = settingsCache.whatsappNumber || "201000000000";
    $("setWarranty").value = settingsCache.warrantyText || "ضمان معتمد رسمي من شركة المغربي لمدة سنة";
    $("setShipping").value = settingsCache.shippingText || "شحن مجاني لجميع المحافظات";
    $("setVodafone").value = settingsCache.vodafoneCashNumber || "";
    $("setInstapay").value = settingsCache.instapayHandle || "";
    $("setTopBar1").value = settingsCache.topBarText1 || "";
    $("setTopBar2").value = settingsCache.topBarText2 || "";

    if ($("setRateLimitEnabled")) $("setRateLimitEnabled").checked = settingsCache.rateLimitEnabled !== false;
    if ($("setRateLimitMaxOrders")) $("setRateLimitMaxOrders").value = settingsCache.rateLimitMaxOrders ?? 3;
    if ($("setRateLimitWindowMinutes")) $("setRateLimitWindowMinutes").value = settingsCache.rateLimitWindowMinutes ?? 10;

    if ($("setBundleEnabled")) $("setBundleEnabled").checked = settingsCache.bundleEnabled !== false;
    if ($("setBundleTier2")) $("setBundleTier2").value = settingsCache.bundleTier2 ?? 10;
    if ($("setBundleTier3")) $("setBundleTier3").value = settingsCache.bundleTier3 ?? 18;
    if ($("setBundleTier4")) $("setBundleTier4").value = settingsCache.bundleTier4 ?? 25;
    if ($("setBundleCustomFixedPrice")) $("setBundleCustomFixedPrice").value = settingsCache.bundleCustomFixedPrice ?? 0;
  }

  $("storeSettingsForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("btnSaveSettings");
    btn.disabled = true;
    btn.textContent = "جارٍ الحفظ...";

    const updatedData = {
      ...settingsCache,
      storeName: $("setStoreName").value.trim(),
      whatsappNumber: $("setWhatsapp").value.trim(),
      warrantyText: $("setWarranty").value.trim(),
      shippingText: $("setShipping").value.trim(),
      vodafoneCashNumber: $("setVodafone").value.trim(),
      instapayHandle: $("setInstapay").value.trim(),
      topBarText1: $("setTopBar1").value.trim(),
      topBarText2: $("setTopBar2").value.trim(),
      rateLimitEnabled: $("setRateLimitEnabled") ? $("setRateLimitEnabled").checked : true,
      rateLimitMaxOrders: Math.max(1, Number($("setRateLimitMaxOrders")?.value) || 3),
      rateLimitWindowMinutes: Math.max(1, Number($("setRateLimitWindowMinutes")?.value) || 10),
      bundleEnabled: $("setBundleEnabled") ? $("setBundleEnabled").checked : true,
      bundleTier2: Math.max(0, Number($("setBundleTier2")?.value) || 10),
      bundleTier3: Math.max(0, Number($("setBundleTier3")?.value) || 18),
      bundleTier4: Math.max(0, Number($("setBundleTier4")?.value) || 25),
      bundleCustomFixedPrice: Math.max(0, Number($("setBundleCustomFixedPrice")?.value) || 0)
    };

    const { error } = await client
      .from("store_settings")
      .upsert({ id: "default", data: updatedData });

    btn.disabled = false;
    btn.textContent = "حفظ الإعدادات";

    if (error) {
      showAdminToast("تعذر حفظ الإعدادات: " + error.message, "error");
    } else {
      settingsCache = updatedData;
      showAdminToast("تم حفظ إعدادات المتجر بنجاح على السيرفر", "success");
    }
  });

  // LocalStorage Migration Tool
  $("btnInspectLocalData")?.addEventListener("click", () => {
    const box = $("localDataInspectBox");
    box.hidden = false;
    const cat = localStorage.getItem("diamond_catalog_v4");
    const parsedCat = cat ? JSON.parse(cat) : [];
    const orders = localStorage.getItem("diamond_orders");
    const parsedOrders = orders ? JSON.parse(orders) : [];

    box.innerHTML = `
      <div style="background:#fff; border:1px solid var(--border); padding:12px; border-radius:8px;">
        <strong>نتائج فحص المتصفح الحالي:</strong><br />
        • عدد المنتجات المخزنة محلياً: <strong>${parsedCat.length}</strong> جهاز.<br />
        • عدد الطلبات القديمة بالمتصفح: <strong>${parsedOrders.length}</strong> طلب.<br />
        ${parsedCat.length > 0 ? '<span style="color:var(--brand-dark);">جاهز للمزامنة مع قاعدة البيانات السحابية.</span>' : 'لا توجد بيانات محلية معدلة على هذا المتصفح.'}
      </div>
    `;
  });

  $("btnImportLocalData")?.addEventListener("click", async () => {
    const rawProds = localStorage.getItem("diamond_catalog_v4");
    if (!rawProds) {
      showAdminToast("لا توجد منتجات محلية لنقلها في هذا المتصفح", "info");
      return;
    }

    try {
      const prods = JSON.parse(rawProds);
      if (!Array.isArray(prods) || prods.length === 0) return;

      if (!confirm(`هل ترغب في رفع ومزامنة ${prods.length} منتج من المتصفح إلى Supabase؟`)) return;

      showAdminToast("جارٍ رفع المنتجات إلى قاعدة البيانات...", "info");
      // Single batched upsert (one round-trip) instead of one request per product
      const rows = prods.map(p => ({
        id: p.id,
        model: p.model || "",
        name: p.name,
        category: p.category || "kitchen",
        category_label: p.categoryLabel || "",
        price: Number(p.price) || 0,
        old_price: p.oldPrice ? Number(p.oldPrice) : null,
        wattage: p.wattage || "",
        capacity: p.capacity || "",
        badge: p.badge || "",
        in_stock: p.inStock !== false,
        image: p.image || "",
        short_desc: p.shortDesc || "",
        specs: p.specs || {},
        features: p.features || []
      }));
      const { error: upsertError } = await client.from("products").upsert(rows);
      if (upsertError) throw upsertError;
      const count = rows.length;

      showAdminToast(`تم رفع ${count} منتج بنجاح إلى Supabase!`, "success");
      await loadProducts();
      renderOverviewKPIs();
    } catch (err) {
      console.error("Migration error:", err);
      showAdminToast("حدث خطأ أثناء نقل البيانات", "error");
    }
  });

  // Overview KPIs Calculator
  function renderOverviewKPIs() {
    $("kpiTotalProducts").textContent = productsCache.length;
    const inStock = productsCache.filter(p => p.in_stock).length;
    $("kpiInStockProducts").textContent = inStock;
    $("kpiTotalOrders").textContent = ordersCache.length;

    const revenue = ordersCache
      .filter(o => o.status === 'تم التوصيل' || o.status === 'تم الشحن' || o.status === 'قيد التجهيز')
      .reduce((sum, o) => sum + (Number(o.total) || 0), 0);
    $("kpiTotalRevenue").textContent = formatEGP(revenue);
  }

  // ============================
  // ADMIN USERS MANAGEMENT (super admin only, via admin-users Edge Function)
  // ============================
  let adminUsersCache = [];
  let currentAdminUser = null;

  async function callAdminUsersApi(payload) {
    const { data: sessionData } = await client.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (!token) throw new Error("لا توجد جلسة نشطة");

    const res = await fetch(`${config.url}/functions/v1/admin-users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "فشل الاتصال بالسيرفر");
    return data;
  }

  async function loadAdminUsers() {
    const tbody = $("adminUsersTableBody");
    if (!tbody) return;
    try {
      const data = await callAdminUsersApi({ action: "list" });
      adminUsersCache = data.users || [];
      if (adminUsersCache.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px;" class="muted">لا يوجد مستخدمون مسجلون.</td></tr>';
        return;
      }
      tbody.innerHTML = adminUsersCache.map((u) => `
        <tr>
          <td><strong>${escapeHTML(u.username || (u.email || '—').split('@')[0])}</strong></td>
          <td>${escapeHTML(u.display_name || '—')}</td>
          <td><span class="user-badge">${u.role === 'super_admin' ? 'مشرف رئيسي' : 'مشرف'}</span></td>
          <td>${u.active ? '<i class="fa-solid fa-circle-check" style="color:#15803d;"></i> نشط' : '<i class="fa-solid fa-circle-xmark" style="color:#b91c1c;"></i> معطّل'}</td>
          <td class="muted">${u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString('ar-EG') : 'لم يسجّل بعد'}</td>
          <td>
            <button class="btn-outline btn-sm" onclick="openEditAdminUser('${escapeHTML(u.user_id)}')"><i class="fa-solid fa-pen"></i> تعديل</button>
            <button class="btn-secondary btn-sm" onclick="deleteAdminUser('${escapeHTML(u.user_id)}')"><i class="fa-solid fa-trash"></i> حذف</button>
          </td>
        </tr>`).join('');
    } catch (err) {
      console.error("loadAdminUsers error:", err);
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px;" class="muted">تعذر تحميل المستخدمين.</td></tr>';
      showAdminToast("تعذر تحميل المستخدمين: " + err.message, "error");
    }
  }

  window.openAddAdminUser = function() {
    currentAdminUser = null;
    $("adminUserModalTitle").innerHTML = '<i class="fa-solid fa-user-plus"></i> إضافة مشرف جديد';
    $("auUserId").value = "";
    $("auUsername").value = "";
    $("auUsername").disabled = false;
    $("auDisplayName").value = "";
    $("auRole").value = "admin";
    $("auPassword").value = "";
    $("auPassword").required = true;
    $("auPasswordHint").textContent = "";
    $("auActiveGroup").style.display = "none";
    window.openAdminModal("adminUserModal");
  };

  window.openEditAdminUser = function(userId) {
    const u = adminUsersCache.find(x => x.user_id === userId);
    if (!u) return;
    currentAdminUser = u;
    $("adminUserModalTitle").innerHTML = '<i class="fa-solid fa-user-pen"></i> تعديل بيانات المشرف';
    $("auUserId").value = u.user_id;
    $("auUsername").value = u.username || (u.email || "").split("@")[0] || "";
    $("auUsername").disabled = false;
    $("auDisplayName").value = u.display_name || "";
    $("auRole").value = u.role;
    $("auPassword").value = "";
    $("auPassword").required = false;
    $("auPasswordHint").textContent = "(اتركها فارغة للاحتفاظ بالحالية)";
    $("auActiveGroup").style.display = "";
    $("auActive").checked = Boolean(u.active);
    window.openAdminModal("adminUserModal");
  };

  window.deleteAdminUser = async function(userId) {
    const u = adminUsersCache.find(x => x.user_id === userId);
    if (!u) return;
    if (!confirm(`هل أنت متأكد من حذف المشرف ${u.username || u.display_name || userId} نهائياً؟`)) return;
    try {
      await callAdminUsersApi({ action: "delete", user_id: userId });
      showAdminToast("تم حذف المشرف من Supabase", "success");
      await loadAdminUsers();
    } catch (err) {
      showAdminToast("تعذر الحذف: " + err.message, "error");
    }
  };

  $("btnAddAdminUser")?.addEventListener("click", () => window.openAddAdminUser());

  $("adminUserForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("btnSaveAdminUser");
    btn.disabled = true;
    btn.textContent = "جارٍ الحفظ في Supabase...";
    try {
      if (currentAdminUser) {
        await callAdminUsersApi({
          action: "update",
          user_id: $("auUserId").value,
          username: $("auUsername").value.trim(),
          display_name: $("auDisplayName").value,
          role: $("auRole").value,
          active: $("auActive").checked,
          password: $("auPassword").value || undefined
        });
        showAdminToast("تم تحديث بيانات المشرف مباشرة في Supabase", "success");
      } else {
        await callAdminUsersApi({
          action: "create",
          username: $("auUsername").value.trim(),
          password: $("auPassword").value,
          display_name: $("auDisplayName").value,
          role: $("auRole").value
        });
        showAdminToast("تم إنشاء المشرف ويمكنه تسجيل الدخول فوراً", "success");
      }
      window.closeAdminModal("adminUserModal");
      await loadAdminUsers();
    } catch (err) {
      showAdminToast("تعذر الحفظ: " + err.message, "error");
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-check"></i> حفظ المشرف';
    }
  });

  // Navigation tab clicks
  document.querySelectorAll(".nav-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const tab = btn.getAttribute("data-tab");
      window.switchTab(tab);
    });
  });

  // Login Form Submission
  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("loginButton");
    btn.disabled = true;
    btn.textContent = "جارٍ التحقق والتسجيل...";
    $("loginMessage").textContent = "";

    const username = $("username").value.trim().toLowerCase();
    const password = $("password").value;

    // Login is by username; Supabase Auth stores it as <username>@admin.diamondstore.local
    const email = `${username}@admin.diamondstore.local`;
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-lock"></i> دخول آمن`;

    if (error) {
      $("loginMessage").textContent = "تعذر تسجيل الدخول. يرجى التأكد من اسم المستخدم وكلمة المرور.";
      return;
    }

    await renderSession(data.session);
  });

  // Logout Button
  $("logoutButton").addEventListener("click", async () => {
    await client.auth.signOut();
    currentAdmin = null;
    hide("dashboardPanel");
    show("loginPanel");
    $("appShell").classList.add("auth-mode");
    showAdminToast("تم تسجيل الخروج بأمان", "info");
  });

  // Listen to Auth State changes
  client.auth.onAuthStateChange((_event, session) => {
    window.setTimeout(() => renderSession(session), 0);
  });

  // Check initial session
  client.auth.getSession().then(({ data }) => renderSession(data.session));
})();
