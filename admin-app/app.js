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

      $("signedInAs").textContent = `${session.user.email} (${admin.display_name || 'مسؤول المتجر'})`;
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

  // Product Image Upload to Supabase Storage Bucket
  $("pImageUpload").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showAdminToast("جارٍ رفع الصورة إلى مساحة التخزين...", "info");
    const ext = file.name.split('.').pop() || 'jpg';
    const filePath = `products/prod-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;

    const { data, error } = await client.storage
      .from("product-media")
      .upload(filePath, file, { upsert: true });

    if (error) {
      console.error("Storage upload error:", error);
      showAdminToast("تعذر رفع الصورة إلى التخزين: " + error.message, "error");
    } else {
      const publicUrl = client.storage.from("product-media").getPublicUrl(filePath).data.publicUrl;
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

    body.innerHTML = categoriesCache.map(c => `
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
        <td>${c.sort_order}</td>
        <td>
          <button type="button" class="btn-outline btn-sm" onclick="editSubcategoriesModal('${escapeHTML(c.id)}')">
            <i class="fa-solid fa-list-check"></i> إدارة الفئات الفرعية
          </button>
        </td>
      </tr>
    `).join("");
  }

  window.editSubcategoriesModal = function(catId) {
    const c = categoriesCache.find(x => x.id === catId);
    if (!c) return;
    $("catIdInput").value = c.id;
    $("catNameInput").value = c.name || "";
    $("catIconInput").value = c.icon || "fa-tag";
    $("catSubtitleInput").value = c.subtitle || "";
    const subLines = Array.isArray(c.sub_items)
      ? c.sub_items.map(s => `${s.label || ''} | ${s.query || ''} | ${s.icon || 'fa-tag'}`).join('\n')
      : "";
    $("catSubItemsInput").value = subLines;
    window.openAdminModal("categoryModal");
  };

  $("categoryForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const catId = $("catIdInput").value;
    if (!catId) return;

    const btn = $("btnSaveCategory");
    btn.disabled = true;
    btn.textContent = "جارٍ الحفظ...";

    const rawLines = ($("catSubItemsInput").value || "")
      .split("\n")
      .map(l => l.trim())
      .filter(Boolean);

    const sub_items = rawLines.map((line, idx) => {
      const parts = line.split("|").map(x => x.trim());
      const label = parts[0] || `فئة ${idx + 1}`;
      const query = parts[1] || label;
      const icon = parts[2] || "fa-tag";
      return { id: `${catId}-sub-${idx + 1}`, label, query, icon };
    });

    const { error } = await client
      .from("categories")
      .update({
        name: $("catNameInput").value.trim(),
        icon: $("catIconInput").value.trim() || "fa-tag",
        subtitle: $("catSubtitleInput").value.trim(),
        sub_items
      })
      .eq("id", catId);

    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-check"></i> حفظ القسم والفئات`;

    if (error) {
      showAdminToast("تعذر تحديث القسم: " + error.message, "error");
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
          <td><strong>${escapeHTML(u.email || '—')}</strong></td>
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
    $("auEmail").value = "";
    $("auEmail").disabled = false;
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
    $("auEmail").value = u.email || "";
    $("auEmail").disabled = true;
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
    if (!confirm(`هل أنت متأكد من حذف المشرف ${u.email || u.display_name || userId} نهائياً؟`)) return;
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
          display_name: $("auDisplayName").value,
          role: $("auRole").value,
          active: $("auActive").checked,
          password: $("auPassword").value || undefined
        });
        showAdminToast("تم تحديث بيانات المشرف مباشرة في Supabase", "success");
      } else {
        await callAdminUsersApi({
          action: "create",
          email: $("auEmail").value.trim(),
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

    const email = $("email").value.trim();
    const password = $("password").value;

    const { data, error } = await client.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    btn.innerHTML = `<i class="fa-solid fa-lock"></i> دخول آمن`;

    if (error) {
      $("loginMessage").textContent = "تعذر تسجيل الدخول. يرجى التأكد من البريد وكلمة المرور المسجلة في Supabase.";
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
