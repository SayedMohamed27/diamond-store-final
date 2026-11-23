# دليل إعداد وتشغيل قاعدة بيانات Supabase لمتجر Diamond Store

> **معلومات المشروع:**
> - المنظمة (Organization): `daimond-store`
> - اسم المشروع (Project): `diamond-store`
> - الخطة: Free Plan
> - المنطقة: West EU (Ireland)

---

## 1. محتويات ملفات الـ Migrations

تم تجهيز المخطط وقاعدة البيانات عبر الملفات التالية داخل مجلد `supabase/migrations/`:

| الملف | الوظيفة |
|---|---|
| `001_initial_schema.sql` | *(ملغي ومؤرشف)* تم استبداله بالمخطط الآمن 002. |
| `002_secure_store_schema.sql` | **المخطط الرئيسي الآمن:** ينشئ الجداول المنمطة، وسياسات الأمان RLS، ودوال الـ RPC الحساسة (`quote_cart` و`create_order`)، وحماية المشرف، وتتبع الطلبات، ومساحات التخزين (Storage Buckets). |
| `003_seed_catalog.sql` | **بيانات الكتالوج الرسمية:** يدخل الـ 27 جهاز لسوكاني، الأقسام الأربعة، شرائح الهيرو الـ 5، الإعدادات، وكوبونات الخصم، بصيغة `ON CONFLICT DO UPDATE` الآمنة. |

---

## 2. خطوات التشغيل على لوحة تحكم Supabase (SQL Editor)

### الخطوة 1: تشغيل المخطط الأساسي (`002_secure_store_schema.sql`)
1. ادخل على لوحة تحكم مشروعك في [Supabase Dashboard](https://supabase.com/dashboard).
2. اختر مشروع `diamond-store`.
3. من القائمة الجانبية ادخل على **SQL Editor**.
4. اضغط على **+ New Query**.
5. انسخ محتوى الملف [002_secure_store_schema.sql](file:///d:/daimond%20storeس/daimond%20store/supabase/migrations/002_secure_store_schema.sql) بالكامل والصقه في المحرر.
6. اضغط على زر **Run** (أو `Ctrl + Enter`).
7. ستظهر رسالة `Success. No rows returned`.

### الخطوة 2: تشغيل بذور البيانات الافتراضية (`003_seed_catalog.sql`)
1. في **SQL Editor**، افتح استعلاماً جديداً **+ New Query**.
2. انسخ محتوى الملف [003_seed_catalog.sql](file:///d:/daimond%20storeس/daimond%20store/supabase/migrations/003_seed_catalog.sql) بالكامل والصقه.
3. اضغط على زر **Run**.
4. سيتم فوراً إدراج الـ 27 منتج مع أسعارها ومواصفاتها، والأقسام، والإعدادات.

---

## 3. إنشاء حساب المشرف الأول (Admin User Setup)

حتى تتمكن من تسجيل الدخول إلى لوحة التحكم `admin-app/`:

### 1. إنشاء الحساب في Supabase Auth:
1. من القائمة الجانبية في Supabase، ادخل على **Authentication** -> **Users**.
2. اضغط على **Add User** ثم **Create User**.
3. أدخل البريد الإلكتروني للمسؤول (مثلاً: `admin@daimondstore.com`) وكلمة مرور قوية.
4. فعّل خيار **Auto Confirm User** لتخطي تأكيد البريد الإلكتروني.
5. اضغط **Create user**.
6. **انسخ المعرف الخاص بالمستخدم (User UID)** الذي تم إنشاؤه (يكون على شكل رمز مثل: `a1b2c3d4-e5f6-...`).

### 2. اعتماد المستخدم في جدول المشرفين (`admin_users`):
في **SQL Editor**، شغّل الاستعلام التالي (مع استبدال `YOUR_USER_UID_HERE` بالمعرف المنسوخ):

```sql
insert into public.admin_users (user_id, role, active, display_name)
values ('YOUR_USER_UID_HERE', 'super_admin', true, 'المدير العام')
on conflict (user_id) do update set
  role = 'super_admin',
  active = true;
```

---

## 4. إعداد مفاتيح الاتصال في ملفات المتصفح

### 1. إعداد المتجر الرئيسي (Storefront):
1. انسخ ملف `supabase-config.example.js` الموجود في المجلد الرئيسي إلى ملف جديد باسم `supabase-config.js`.
2. افتح `supabase-config.js` وضع رابط مشروعك ومفتاح النشر العام (Anon Key):
```javascript
window.DAIMOND_SUPABASE_CONFIG = {
  url: "https://your-project-ref.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
};
```

### 2. إعداد لوحة تحكم الإدارة (`admin-app`):
1. انسخ ملف `admin-app/config.example.js` إلى `admin-app/config.js`.
2. ضع نفس الرابط ومفتاح الـ Anon.

> [!WARNING]
> **ممنوع منعاً باتاً وضع مفتاح `service_role` في أي من ملفات المتصفح (`config.js`).**
> النظام مصمم ليعمل بالكامل عبر الـ `anon` key المحمي بسياسات RLS ودوال RPC المحمية.

---

## 5. مساحات التخزين (Supabase Storage)

المخطط ينشئ تلقائياً الـ Buckets التالية:
1. `product-media`:
   - **الوصول:** عام (Public Read) لجميع الزوار لعرض صور المنتجات.
   - **الرفع والتعديل:** مقتصر على المشرفين المسجلين فقط (`is_store_admin()`).
2. `payment-proofs`:
   - **الوصول:** خاص (Private)، بحد أقصى 5MB للصورة وصيغ صور فقط (`jpeg/png/webp`).
   - **الرفع:** متاح للعملاء أثناء إرسال إيصال التحويل داخل مجلد `receipts/` فقط وبدون `..`.
   - **الاطلاع:** مقتصر على المشرفين المعتمدين فقط عبر روابط موقعة مؤقتة (Signed URLs).

---

## 6. قواعد الأمان وحساب الأسعار (Security Architecture)

1. **حساب الأسعار والتحقق من المخزون على السيرفر (Server-side Authoritative Pricing & Stock):**
   - العميل في المتصفح لا يحدد إجمالي السعر ولا الخصم.
   - عند إرسال الطلب، تستدعي الواجهة دالة `create_order` في السيرفر.
   - السيرفر يقوم بجلب سعر كل منتج وحالة توفره (`in_stock` و`stock_qty`) من جدول `public.products` مباشرة، ويرفض أي تكرار للعناصر في السلة (`p_items`) أو في باكدج العروسة (`p_bundle_ids`)، ويتحقق أن عناصر الباكدج ضمن القائمة المسموحة (`bundleProductIds`)، ثم يخصم الكمية المطلوبة ذرياً (Atomically) داخل نفس المعاملة (Transaction).

2. **قواعد عدم تراكم الخصومات (Non-Stacking Discounts):**
   - خصم باكدج العروسة وخصم كود الكوبون لا يتراكمان؛ السيرفر يطبق الخصم الأكبر تلقائياً لصالح العميل.

3. **الحد من الطلبات العشوائية القابل للضبط (Configurable Rate Limiting):**
   - دالة `create_order` تقرأ إعدادات الحماية ديناميكياً من جدول `store_settings` (`rateLimitEnabled`, `rateLimitMaxOrders`, `rateLimitWindowMinutes`).
   - القيم الافتراضية هي **3 طلبات خلال 10 دقائق لكل رقم هاتف مصري**، ويمكن للمشرف تعديل العدد أو الدقائق أو تفعيل/تعطيل الحماية مباشرة من تبويب **إعدادات المتجر** في `admin-app`.

4. **حماية سجلات الطلبات من التلاعب (`protect_order_items`):**
   - يمنع السيرفر تعديل أسعار أو كميات عناصر الطلب بعد إنشائه عبر Trigger `trg_protect_order_items`.

4. **التحقق من صحة رقم الموبايل:**
   - السيرفر يفرض تحقق Regex لرقم الهاتف المصري (`^01[0125][0-9]{8}$`).

5. **استمرارية العمل (Resilient Fallback):**
   - إذا كان اتصال Supabase غير متوفر أو غير مهيأ، يعمل المتجر تلقائياً بالبيانات الافتراضية المخزنة محلياً في `products.js` بدون أي توقف في واجهة الزوار.

---

## 7. فحص واختبار النظام (Verification Checklist)

- [ ] تشغيل `002_secure_store_schema.sql` في SQL Editor وتأكيد خلوه من الأخطاء.
- [ ] تشغيل `003_seed_catalog.sql` وتأكيد ملء جدول `products` بـ 27 منتج.
- [ ] إنشاء مستخدم في Auth وإضافته لجدول `admin_users`.
- [ ] إنشاء `supabase-config.js` و`admin-app/config.js`.
- [ ] فتح المتجر `index.html` والتأكد من ظهور المنتجات بشكل سليم.
- [ ] تجربة إضافة منتجات للسلة وإرسال طلب تجريبي، والتأكد من ظهوره في جدول `orders`.
- [ ] فتح لوحة التحكم `admin-app/index.html` وتسجيل الدخول ورؤية الطلب الجديد وتحديث حالته.
