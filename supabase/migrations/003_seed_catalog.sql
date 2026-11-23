-- ============================================================================
-- DAIMOND STORE - INITIAL SEED CATALOG (MIGRATION 003)
-- Auto-generated from products.js
-- Safe & Idempotent: Uses ON CONFLICT DO UPDATE for all catalog entities
-- ============================================================================

-- 1. Store Settings
insert into public.store_settings (id, data)
values ('default', '{"storeName":"Daimond Store","tagline":"أجهزة SOKANY المنزلية الحديثة","whatsappNumber":"201000000000","warrantyText":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","shippingText":"شحن مجاني لجميع المحافظات","topBarText1":"شحن مجاني تماماً لجميع محافظات مصر خلال 24 - 48 ساعة","topBarText2":"ضمان معتمد رسمي من شركة المغربي لمدة سنة على جميع الأجهزة","topBarText3":"خصم إضافي 10% باستخدام كود: DAIMOND10 — الدفع عند الاستلام","bundleEnabled":true,"bundleKicker":"باكدج العروسة والتوفير الذكي","bundleTitle":"جهّزي مطبخك بأقوى باكدج عروسة بخصم يصل إلى 25% فوري","bundleSubtitle":"اختاري الأجهزة التي ترغبين بها من القائمة ليتم احتساب خصم باكدج العروسة تلقائياً مع شحن مجاني وضمان معتمد رسمي من شركة المغربي لمدة سنة","bundleTier2":10,"bundleTier3":18,"bundleTier4":25,"bundleCustomFixedPrice":0,"bundleProductIds":["sk-10085","sk-b907","sk-999n","sk-10071","sk-7027n","sk-4007","sk-09122"],"bundleDefaultSelectedIds":["sk-10085","sk-b907","sk-999n","sk-09122"],"instapayLink":"https://ipn.eg/S/daimondstore/instapay/0000","instapayNumber":"01000000000","instapayHandle":"daimondstore@instapay","instapayAccountName":"Daimond Store","instapayQrImage":"","vodafoneCashNumber":"01000000000","paymentInstructions":"بعد إتمام التحويل عبر إنستا باي أو المحفظة، يرجى أخذ لقطة شاشة (اسكرين شوت Screenshot) لإيصال التحويل وإرفاقها مع الطلب أو إرسالها مباشرة مع رسالة تأكيد الأوردر على واتساب ليتم شحن طلبك فوراً.","rateLimitEnabled":true,"rateLimitMaxOrders":3,"rateLimitWindowMinutes":10}'::jsonb)
on conflict (id) do update set
  data = excluded.data,
  updated_at = now();

-- 2. Categories (4 Core Categories)
insert into public.categories (id, name, nav_title, en_name, subtitle, icon, image, sub_items, sort_order, is_active)
values ('kitchen', 'أجهزة المطبخ', 'أجهزة المطبخ', 'Kitchen Appliances', 'خلاطات، كبات، عجانات، قلايات هوائية، ساندوتش ميكر، أفران وماكينات قهوة', 'fa-blender', 'assets/products/blender.jpg', '[{"label":"خلاطات كهربائية احترافية","cat":"kitchen","query":"خلاط","icon":"fa-blender"},{"label":"كبات ومفارم لحوم","cat":"kitchen","query":"كبة","icon":"fa-utensils"},{"label":"عجانات استانلس ثقيلة","cat":"kitchen","query":"عجان","icon":"fa-bowl-food"},{"label":"قلايات هوائية ديجيتال","cat":"kitchen","query":"قلاية","icon":"fa-fire-burner"},{"label":"ساندوتش ميكر وجريل ووافل","cat":"kitchen","query":"ساندوتش","icon":"fa-bread-slice"},{"label":"أفران كهربائية ومايكروويف","cat":"kitchen","query":"فرن","icon":"fa-temperature-high"},{"label":"ماكينات القهوة والغلايات","cat":"kitchen","query":"قهوة","icon":"fa-mug-hot"},{"label":"عرض كل أجهزة المطبخ","cat":"kitchen","query":"","icon":"fa-border-all"}]'::jsonb, 1, true)
on conflict (id) do update set
  name = excluded.name,
  nav_title = excluded.nav_title,
  en_name = excluded.en_name,
  subtitle = excluded.subtitle,
  icon = excluded.icon,
  image = excluded.image,
  sub_items = excluded.sub_items,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.categories (id, name, nav_title, en_name, subtitle, icon, image, sub_items, sort_order, is_active)
values ('home', 'الأجهزة المنزلية', 'الأجهزة المنزلية', 'Home Appliances', 'مكاوي بخار سيراميك وعمودية ومكانس كهربائية وأجهزة المنزل', 'fa-shirt', 'assets/products/home.jpg', '[{"label":"مكاوي بخار سيراميك وعمودية","cat":"home","query":"مكواة","icon":"fa-shirt"},{"label":"مكانس كهربائية برميلية وعصا","cat":"home","query":"مكنسة","icon":"fa-broom"},{"label":"عرض كل الأجهزة المنزلية","cat":"home","query":"","icon":"fa-border-all"}]'::jsonb, 2, true)
on conflict (id) do update set
  name = excluded.name,
  nav_title = excluded.nav_title,
  en_name = excluded.en_name,
  subtitle = excluded.subtitle,
  icon = excluded.icon,
  image = excluded.image,
  sub_items = excluded.sub_items,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.categories (id, name, nav_title, en_name, subtitle, icon, image, sub_items, sort_order, is_active)
values ('care', 'العناية الشخصية', 'العناية الشخصية', 'Personal Care', 'مكاوي شعر سيراميك، مجففات شعر، استايلر وأجهزة العناية الشخصية', 'fa-wand-magic-sparkles', 'assets/products/care.jpg', '[{"label":"مكواة شعر سيراميك وبيبي ليس","cat":"care","query":"مكواة","icon":"fa-wand-magic-sparkles"},{"label":"سشوار ومجففات شعر احترافية","cat":"care","query":"مجفف","icon":"fa-wind"},{"label":"فرشاة شعر حرارية ومصففات","cat":"care","query":"فرشاة","icon":"fa-spa"},{"label":"عرض كل أجهزة العناية الشخصية","cat":"care","query":"","icon":"fa-border-all"}]'::jsonb, 3, true)
on conflict (id) do update set
  name = excluded.name,
  nav_title = excluded.nav_title,
  en_name = excluded.en_name,
  subtitle = excluded.subtitle,
  icon = excluded.icon,
  image = excluded.image,
  sub_items = excluded.sub_items,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.categories (id, name, nav_title, en_name, subtitle, icon, image, sub_items, sort_order, is_active)
values ('contact', 'قسم اتصل بنا', 'قسم اتصل بنا', 'Contact Us', 'تواصل مباشر مع خدمة عملاء Daimond Store عبر واتساب ومراكز الصيانة', 'fa-headset', 'assets/logo.jpg', '[{"label":"تواصل مباشر عبر واتساب","cat":"contact","query":"whatsapp","icon":"fa-comment-dots"},{"label":"طلب استبدال أو استرجاع (14 يوم)","cat":"contact","query":"refund","icon":"fa-rotate-left"},{"label":"عناوين مراكز صيانة سوكاني المعتمدة","cat":"contact","query":"service","icon":"fa-screwdriver-wrench"},{"label":"أرقام ومواعيد خدمة العملاء","cat":"contact","query":"info","icon":"fa-phone-volume"}]'::jsonb, 4, true)
on conflict (id) do update set
  name = excluded.name,
  nav_title = excluded.nav_title,
  en_name = excluded.en_name,
  subtitle = excluded.subtitle,
  icon = excluded.icon,
  image = excluded.image,
  sub_items = excluded.sub_items,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- 3. Products (27 Official SOKANY Products)
insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-b907', 'SK-B907', 'ساندوتش ميكر سوكاني 7×1 متعدد الاستخدامات 750 وات', 'sandwich', 'ساندوتش ميكر وجريل', '750W', '7 غيارات تيفال قابلة للفك', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  2150, 2550, 4.9, 342, 'الأكثر مبيعاً', true, 100, 'assets/products/sandwich.jpg', '["assets/products/sandwich.jpg","assets/products/grill.jpg","assets/products/hero-showcase.jpg"]'::jsonb,
  'assets/products/grill.jpg', 'جهاز متكامل بـ 7 أزواج من الألواح القابلة للتبديل لعمل الساندوتشات، الوافل، الجريل، الدونات، المعمول، الجوزية، والبسكويت.', '{"الموديل":"SK-B907","القدرة الكهربائية":"750 وات","عدد الغيارات":"7 أطقم ألواح قابلة للفك والغسيل","خامة الألواح":"طبقة تيفال غير لاصقة عالية الجودة","مؤشرات التشغيل":"لمبة بيان للتشغيل والجاهزية","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["7 وظائف مختلفة في جهاز واحد مدمج يوفر مساحة المطبخ","فك وتركيب الألواح بضغطة زر لسهولة الغسيل والتنظيف","مقبض عازل للحرارة مع قفل أمان محكم","توزيع حراري مزدوج من الأعلى والأسفل لتحميص متساوٍ"]'::jsonb, true, 1
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-08064n', 'SK-08064N', 'ساندوتش ميكر وجريل ووافل سوكاني 3×1 بقوة 1400 وات', 'sandwich', 'ساندوتش ميكر وجريل', '1400W', '3 ألواح جامبو + فتح 180°', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  1890, 2250, 4.9, 218, 'قوة 1400 وات', true, 100, 'assets/products/grill.jpg', '["assets/products/grill.jpg","assets/products/sandwich.jpg"]'::jsonb,
  'assets/products/sandwich.jpg', 'قدرة عالية 1400 وات لتسخين فائق السرعة مع 3 ألواح قابلة للفك وإمكانية فتح الجهاز 180 درجة كشواية مسطحة.', '{"الموديل":"SK-08064N","القدرة الكهربائية":"1400 وات","عدد الألواح":"3 أطقم (ساندوتش، جريل، وافل)","زاوية الفتح":"يفتح حتى 180 درجة للشوي المفتوح","الخامة الخارجية":"ستانلس ستيل مع باكيليت حراري","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["قوة 1400 وات تمنح تحميصاً وقرمشة سريعة","ألواح تيفال عميقة قابلة للإزالة والغسل","ثرموستات أوتوماتيكي للتحكم في الحرارة"]'::jsonb, true, 2
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-07084', 'SK-07084', 'جريل وصانع ساندوتشات بانيني سوكاني ستانلس 2000 وات', 'sandwich', 'ساندوتش ميكر وجريل', '2000W', 'مقاس عائلي - فتح 180°', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  2290, 2650, 4.8, 164, 'شواية وبانيني', true, 100, 'assets/products/grill.jpg', '["assets/products/grill.jpg","assets/products/sandwich.jpg"]'::jsonb,
  'assets/products/sandwich.jpg', 'شواية وجريل بانيني بسطح غير لاصق ومفصلة متحركة تتكيف مع سُمك الساندوتشات والبرجر والستيك.', '{"الموديل":"SK-07084","القدرة الكهربائية":"2000 وات","السطح":"جرانيت مضلع غير لاصق","التحكم":"بكرة ضبط درجات الحرارة","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["مثالي للكريب، الساندوتشات السوري، واللحوم المشوية","درج مدمج لتجميع الدهون الزائدة","جسم خارجي من الاستانلس ستيل المصقول"]'::jsonb, true, 3
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-08085', 'SK-08085', 'ماكينة الوافل البلجيكي سوكاني مزدوجة القالب 1200 وات', 'sandwich', 'ساندوتش ميكر وجريل', '1200W', 'قالب وافل عميق غير لاصق', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  1290, 1550, 4.8, 119, 'وافل كافيهات', true, 100, 'assets/products/sandwich.jpg', '["assets/products/sandwich.jpg","assets/products/grill.jpg"]'::jsonb,
  'assets/products/grill.jpg', 'ماكينة تحضير الوافل المقرمش بتصميم عصري وألواح تيفال مانعة للالتصاق وتوزيع حراري متوازن.', '{"الموديل":"SK-08085","القدرة الكهربائية":"1200 وات","السطح":"تيفال مزدوج عميق","الأمان":"مقبض بارد الملمس + قواعد تثبيت","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["تحضير الوافل الذهبي في دقائق معدودة","سهلة التنظيف والتخزين الرأسي"]'::jsonb, true, 4
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-10085', 'SK-10085', 'قلاية هوائية سوكاني ديجيتال 7.5 لتر 2200 وات (2 سخان)', 'airfryer', 'قلايات هوائية', '2200W', '7.5 لتر - سخان مزدوج', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  3850, 4450, 5, 485, 'الأعلى طلباً', true, 100, 'assets/products/airfryer.jpg', '["assets/products/airfryer.jpg","assets/products/hero-showcase.jpg"]'::jsonb,
  'assets/products/hero-showcase.jpg', 'قلاية سوكاني الديجيتال المزودة بـ 2 سخان (علوي وسفلي) لتسوية مثالية بدون تقليب، سعة 7.5 لتر وشاشة تاتش بـ 10 برامج.', '{"الموديل":"SK-10085","القدرة الكهربائية":"2200 وات (سخان علوي وسفلي)","السعة اللترية":"7.5 لتر حجم عائلي","لوحة التحكم":"شاشة لمس ديجيتال LED بـ 10 برامج + فك تجميد","درجة الحرارة":"80°C إلى 200°C مع مؤقت 60 دقيقة","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["سخان مزدوج يضمن قرمشة متساوية من جميع الجوانب","طهي صحي بأقل نسبة دهون حتى 90%","حلة داخلية مطلية بالتيفال غير القابل للالتصاق وسهلة الفك","فصل تلقائي عند سحب الدرج مع ذاكرة استكمال التشغيل"]'::jsonb, true, 5
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-10117', 'SK-10117', 'قلاية هوائية سوكاني ديجيتال بنافذة رؤية 11 لتر 2000 وات', 'airfryer', 'قلايات هوائية', '2000W', '11 لتر + نافذة رؤية مضيئة', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  4490, 5150, 4.9, 274, 'سعة عملاقة 11L', true, 100, 'assets/products/airfryer.jpg', '["assets/products/airfryer.jpg","assets/products/oven.jpg"]'::jsonb,
  'assets/products/oven.jpg', 'سعة ضخمة 11 لتر للعائلات والعزومات مع نافذة زجاجية حرارية وإضاءة داخلية لمتابعة الطعام أثناء التحمير دون فتح الدرج.', '{"الموديل":"SK-10117","القدرة الكهربائية":"2000 وات","السعة اللترية":"11 لتر جامبو","شباك الرؤية":"زجاج حراري مزدوج مع إضاءة داخلية","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["متابعة نضج الطعام مباشرة من خلال النافذة المضيئة","تكفي دجاجة كاملة كبيرة أو كميات وفيرة من البطاطس والمشويات","شاشة لمس ذكية متعددة البرامج"]'::jsonb, true, 6
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-8042', 'SK-8042', 'قلاية هوائية سوكاني ديجيتال 8 لتر 1700 وات متعددة البرامج', 'airfryer', 'قلايات هوائية', '1700W', '8 لتر ديجيتال', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  3450, 3990, 4.8, 195, 'موفر للطاقة', true, 100, 'assets/products/airfryer.jpg', '["assets/products/airfryer.jpg"]'::jsonb,
  'assets/products/hero-showcase.jpg', 'تصميم انسيابي أنيق بسعة 8 لتر وقدرة 1700 وات موفرة للكهرباء مع توزيع هواء ساخن 360 درجة.', '{"الموديل":"SK-8042","القدرة الكهربائية":"1700 وات","السعة اللترية":"8 لتر","التحكم":"شاشة ديجيتال تاتش","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["حلة كبيرة غير لاصقة سهلة التنظيف","برامج جاهزة للبطاطس، الدجاج، اللحم، الأسماك، والفرن"]'::jsonb, true, 7
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-10071', 'SK-10071', 'فرن كهربائي سوكاني 3×1 بالشواية والمروحة 3000 وات', 'oven', 'أفران ومايكروويف', '3000W', 'شواية دوارة + مروحة توزيع', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  3890, 4450, 4.9, 178, 'شواية + 3000W', true, 100, 'assets/products/oven.jpg', '["assets/products/oven.jpg","assets/products/hero-showcase.jpg"]'::jsonb,
  'assets/products/hero-showcase.jpg', 'فرن كهربائي قوي 3000 وات مزود بسيخ شواية، مروحة توزيع حراري Convection، صينية خبيز، وشبكة شوي ستانلس.', '{"الموديل":"SK-10071","القدرة الكهربائية":"3000 وات تسخين سريع","التحكم":"شاشة رقمية + مفاتيح تحكم دقيقة","الملحقات":"سيخ شواية + صينية + شبكة ستانلس + مقبض","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["عناصر تسخين من الاستانلس ستيل المقاوم للصدأ","باب زجاجي حراري مزدوج بإضاءة داخلية لمتابعة التسوية","تحكم كامل في درجات الحرارة ومستويات التسخين العلوي والسفلي"]'::jsonb, true, 8
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-10020', 'SK-10020', 'مايكروويف وفرن سوكاني ديجيتال 42 لتر 1560 وات', 'oven', 'أفران ومايكروويف', '1560W', '42 لتر حجم عائلي', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  6250, 7100, 4.9, 142, 'سعة 42 لتر', true, 100, 'assets/products/oven.jpg', '["assets/products/oven.jpg"]'::jsonb,
  'assets/products/hero-showcase.jpg', 'مايكروويف وفرن عائلي ضخم بسعة 42 لتر ولوحة تحكم ديجيتال وبرامج متعددة للتسخين السريع وفك التجميد والشوي.', '{"الموديل":"SK-10020","القدرة الكهربائية":"1560 وات","السعة اللترية":"42 لتر","التحكم":"لوحة ديجيتال ذكية + مقبض دوار","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["سعة داخلية كبيرة تستوعب الأطباق والصواني العائلية","خاصية فك التجميد السريع حسب الوزن أو الوقت","قفل أمان للأطفال وإضاءة داخلية"]'::jsonb, true, 9
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-10096', 'SK-10096', 'مايكروويف سوكاني ديجيتال 20 لتر 1100 وات بتصميم ستانلس', 'oven', 'أفران ومايكروويف', '1100W', '20 لتر', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  4190, 4750, 4.8, 156, 'تسخين فوري', true, 100, 'assets/products/oven.jpg', '["assets/products/oven.jpg"]'::jsonb,
  'assets/products/hero-showcase.jpg', 'مايكروويف عملي بسعة 20 لتر وقدرة 1100 وات مثالي للتسخين اليومي السريع وإذابة المجمدات بـ 5 مستويات طاقة.', '{"الموديل":"SK-10096","القدرة الكهربائية":"1100 وات","السعة اللترية":"20 لتر","الصينية":"طبق زجاجي دوار لتوزيع الحرارة","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["تشغيل سهل وسريع مع مؤقت رقمي","تجويف داخلي مطلي يسهل مسحه وتنظيفه"]'::jsonb, true, 10
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-999n', 'SK-999N', 'خلاط سوكاني العملاق كاسر الثلج والمحضر 6000 وات 2.5 لتر', 'blender', 'خلاطات وعجانات وكبات', '6000W', '2.5 لتر + كبة/مطحنة', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  2150, 2590, 4.9, 512, 'وحش الـ 6000W', true, 100, 'assets/products/blender.jpg', '["assets/products/blender.jpg","assets/products/mixer.jpg"]'::jsonb,
  'assets/products/mixer.jpg', 'خلاط الخدمة الشاقة للبيت والكافيهات بقوة 6000 وات، يجرش الثلج ويطحن البن والمكسرات بشفرات فولاذية سداسية.', '{"الموديل":"SK-999N","القدرة الكهربائية":"6000 وات","السعة":"2.5 لتر شفشق ضد الكسر + ملحق فرم","السرعات":"تحكم رقمي متدرج في السرعات + خاصية النبضات Pulse","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["شفرات من الفولاذ المقاوم للصدأ تفرم الثلج والفواكه المجمدة","تروس معدنية متينة لعمر افتراضي طويل","ملحق إضافي للفرم والطحن السريع"]'::jsonb, true, 11
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-05022', 'SK-05022', 'عجان سوكاني الاحترافي ستانلس ستيل 8 لتر 2000 وات', 'blender', 'خلاطات وعجانات وكبات', '2000W', 'حلة ستانلس 8 لتر', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  4490, 5200, 4.9, 168, 'عجان احترافي', true, 100, 'assets/products/mixer.jpg', '["assets/products/mixer.jpg","assets/products/blender.jpg"]'::jsonb,
  'assets/products/blender.jpg', 'عجان المخبوزات والبيتزا والحلويات بحلة ستانلس ستيل مصقولة، 6 سرعات مع حركة كوكبية دائرية لعجن متجانس.', '{"الموديل":"SK-05022","القدرة الكهربائية":"2000 وات","الحلة":"ستانلس ستيل 304 مقاوم للصدأ بمقبض مريح","السرعات":"6 سرعات + نبضات","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["خطاف عجن ثقيل + مضرب كف + مضرب خفق من المعدن","قواعد تثبيت قوية مانعة للاهتزاز أثناء التشغيل"]'::jsonb, true, 12
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-7027n', 'SK-7027N', 'كبة ومحضرة طعام سوكاني بـ 6 شفرات فولاذية 1500 وات', 'blender', 'خلاطات وعجانات وكبات', '1500W', 'فرم لحوم وخضروات', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  1290, 1590, 4.8, 390, 'سلاح سداسي', true, 100, 'assets/products/blender.jpg', '["assets/products/blender.jpg","assets/products/mixer.jpg"]'::jsonb,
  'assets/products/mixer.jpg', 'كبة فرم اللحوم والخضروات والبصل بـ 6 شفرات فولاذية مزدوجة وسرعات متعددة لفرم ناعم أو خشن في ثوانٍ.', '{"الموديل":"SK-7027N","القدرة الكهربائية":"1500 وات","الشفرات":"6 شفرات ستانلس ستيل مقاومة للصدأ","التروس":"تروس معدنية بالكامل","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["مثالية لفرم الكفتة، البصل، الثوم، الملوخية، والمكسرات","سهلة الفك والغسيل مع قاعدة مانعة للانزلاق"]'::jsonb, true, 13
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-06031', 'SK-06031', 'مفرمة لحوم سوكاني الكهربائية الاحترافية ستانلس ستيل 2500 وات', 'blender', 'خلاطات وعجانات وكبات', '2500W', 'فرم لحوم + سبت كبيبة وسجق', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  2790, 3250, 4.9, 132, 'مفرمة ستانلس', true, 100, 'assets/products/mixer.jpg', '["assets/products/mixer.jpg","assets/products/blender.jpg"]'::jsonb,
  'assets/products/blender.jpg', 'مفرمة لحوم قوية بتروس معدنية و3 أوشاش فرم مختلفة مع ملحقات عمل السجق والكبيبة وخاصية الدوران العكسي.', '{"الموديل":"SK-06031","القدرة القصوى":"2500 وات","الخامة":"جسم ورأس فرم من الاستانلس ستيل المصقول","الملحقات":"3 مصافي فرم + قمع سجق + أداة كبيبة","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["زر Reverse لفك أي عوائق أثناء الفرم فوراً","سلاح قطع فولاذي حاد يدوم طويلاً"]'::jsonb, true, 14
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-7044a', 'SK-7044A', 'كبة سوكاني ستانلس ستيل 3.5 لتر 900 وات 3 سرعات مع قطعة سلاح إضافي موديل SK-7044A', 'blender', 'خلاطات وعجانات وكبات', '900W', '3.5 لتر ستانلس ستيل', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  1300, 1590, 4.9, 318, 'الأكثر مبيعاً', true, 100, 'assets/products/blender.jpg', '["assets/products/blender.jpg","assets/products/mixer.jpg"]'::jsonb,
  'assets/products/mixer.jpg', 'كبة سوكاني الأصلية بحلة ستانلس ستيل 3.5 لتر وقدرة 900 وات، 3 سرعات مع قطعة سلاح إضافي لفرم اللحوم والخضروات بكفاءة عالية.', '{"الموديل":"SK-7044A","القدرة الكهربائية":"900 وات","السعة":"3.5 لتر ستانلس ستيل","السرعات":"3 سرعات + سلاح إضافي","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["وعاء ستانلس ستيل 3.5 لتر صحي ومقاوم للصدأ","3 سرعات فرم مختلفة مع سلاح فولاذي إضافي","تروس معدنية قوية تتحمل فرم اللحوم والخضروات"]'::jsonb, true, 15
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-7077n', 'SK-7077N', 'كبة سوكاني ستانلس ستيل 5.5 لتر 1000 وات 3 سرعات مع قطعة سلاح إضافي موديل SK-7077N', 'blender', 'خلاطات وعجانات وكبات', '1000W', '5.5 لتر ستانلس ستيل', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  1550, 1890, 4.9, 284, 'سعة كبيرة 5.5L', true, 100, 'assets/products/blender.jpg', '["assets/products/blender.jpg","assets/products/mixer.jpg"]'::jsonb,
  'assets/products/mixer.jpg', 'كبة سوكاني العائلية سعة 5.5 لتر ستانلس ستيل بقدرة 1000 وات و3 سرعات مع قطعة سلاح إضافي لتحضير الكفتة والمفروم في ثوانٍ.', '{"الموديل":"SK-7077N","القدرة الكهربائية":"1000 وات","السعة":"5.5 لتر ستانلس ستيل","السرعات":"3 سرعات + سلاح إضافي","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["حلة ستانلس ستيل ضخمة 5.5 لتر للعزومات والكميات الكبيرة","موتور نحاسي 1000 وات بـ 3 سرعات وسلاح إضافي"]'::jsonb, true, 16
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-06028', 'SK-06028', 'كبة سوكاني 400 وات 2 دورق (2 لتر ستانلس ستيل مع 7 لتر إكليريك) سرعتين موديل SK-06028', 'blender', 'خلاطات وعجانات وكبات', '400W', '2 دورق (2L ستانلس + 7L إكليريك)', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  970, 1250, 4.8, 219, '2 دورق اقتصادي', true, 100, 'assets/products/blender.jpg', '["assets/products/blender.jpg"]'::jsonb,
  'assets/products/mixer.jpg', 'كبة سوكاني العملية بـ 2 دورق (دورق 2 لتر ستانلس ستيل + دورق 7 لتر إكليريك مقوى) وسرعتين لتلبية كافة احتياجات المطبخ.', '{"الموديل":"SK-06028","القدرة الكهربائية":"400 وات","السعة":"2 دورق (2 لتر ستانلس + 7 لتر إكليريك)","السرعات":"سرعتين","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["مزودة بـ 2 دورق بأحجام مختلفة للحوم والخضروات","سعر اقتصادي ممتاز مع ضمان شركة المغربي الرسمي"]'::jsonb, true, 17
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-7033a', 'SK-7033A', 'كبة سوكاني ستانلس ستيل 6.5 لتر 1500 وات 3 سرعات مع قطعة سلاح إضافي موديل SK-7033A', 'blender', 'خلاطات وعجانات وكبات', '1500W', '6.5 لتر ستانلس ستيل', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  2200, 2650, 4.9, 342, 'خدمة شاقة 6.5L', true, 100, 'assets/products/blender.jpg', '["assets/products/blender.jpg","assets/products/mixer.jpg"]'::jsonb,
  'assets/products/mixer.jpg', 'كبة سوكاني الجبارة 6.5 لتر ستانلس ستيل بقوة 1500 وات و3 سرعات مع قطعة سلاح إضافي للفرم الثقيل والخدمة الشاقة.', '{"الموديل":"SK-7033A","القدرة الكهربائية":"1500 وات","السعة":"6.5 لتر ستانلس ستيل","السرعات":"3 سرعات + سلاح إضافي","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["سعة 6.5 لتر ستانلس ستيل مقاوم للصدأ","موتور 1500 وات جبار مع سلاح فولاذي إضافي"]'::jsonb, true, 18
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-06020n', 'SK-06020N', 'كبة سوكاني ستانلس ستيل 6×1 سعة 5 لتر 1000 وات 3 سرعات موديل SK-06020N', 'blender', 'خلاطات وعجانات وكبات', '1000W', '5 لتر ستانلس 6×1', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  1700, 2050, 4.9, 246, 'متعددة 6×1', true, 100, 'assets/products/blender.jpg', '["assets/products/blender.jpg"]'::jsonb,
  'assets/products/mixer.jpg', 'كبة ومحضرة سوكاني 6×1 بحلة ستانلس ستيل 5 لتر وقدرة 1000 وات و3 سرعات للفرم والخلط والتقطيع وتقشير الثوم.', '{"الموديل":"SK-06020N","القدرة الكهربائية":"1000 وات","السعة":"5 لتر ستانلس ستيل (6×1)","السرعات":"3 سرعات","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["منظومة 6×1 متكاملة للفرم والخفق والتقطيع","وعاء ستانلس ستيل 5 لتر متين وسهل التنظيف"]'::jsonb, true, 19
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-7099a', 'SK-7099A', 'كبة سوكاني ستانلس ستيل سعة 8 لتر بقدرة 1800 وات 3 سرعات + سلاح إضافي موديل SK-7099A', 'blender', 'خلاطات وعجانات وكبات', '1800W', '8 لتر ستانلس ستيل جامبو', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  2450, 2950, 5, 295, 'حجم جامبو 8L', true, 100, 'assets/products/blender.jpg', '["assets/products/blender.jpg","assets/products/mixer.jpg"]'::jsonb,
  'assets/products/mixer.jpg', 'كبة سوكاني الجامبو سعة 8 لتر ستانلس ستيل بقدرة 1800 وات و3 سرعات مع سلاح إضافي لأقوى أداء فرم منزلي واحترافي.', '{"الموديل":"SK-7099A","القدرة الكهربائية":"1800 وات","السعة":"8 لتر ستانلس ستيل","السرعات":"3 سرعات + سلاح إضافي","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["أكبر سعة 8 لتر من الاستانلس ستيل الأصلي","قدرة 1800 وات بـ 3 سرعات وتروس معدنية فولاذية"]'::jsonb, true, 20
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-7000n', 'SK-7000N', 'كبة سوكاني ستانلس ستيل 7 لتر 1700 وات 3 سرعات موديل SK-7000N', 'blender', 'خلاطات وعجانات وكبات', '1700W', '7 لتر ستانلس ستيل', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  3150, 3650, 4.9, 198, 'إصدار احترافي 7L', true, 100, 'assets/products/blender.jpg', '["assets/products/blender.jpg","assets/products/mixer.jpg"]'::jsonb,
  'assets/products/mixer.jpg', 'كبة سوكاني الاحترافية سعة 7 لتر ستانلس ستيل بقدرة 1700 وات و3 سرعات لفرم اللحوم والمكونات الصلبة بسرعة فائقة.', '{"الموديل":"SK-7000N","القدرة الكهربائية":"1700 وات","السعة":"7 لتر ستانلس ستيل","السرعات":"3 سرعات","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["حلة ستانلس 7 لتر فائقة السماكة مع مقبض مريح","قدرة 1700 وات لفرم ناعم ومتجانس في ثوانٍ"]'::jsonb, true, 21
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-04042', 'SK-04042', 'ماكينة قهوة إسبريسو وكابتشينو سوكاني ستانلس 20 بار', 'coffee', 'القهوة والغلايات', '1350W', 'ضغط 20 بار + ذراع تبخير', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  4590, 5250, 4.9, 154, 'باريستا منزلي', true, 100, 'assets/products/coffee.jpg', '["assets/products/coffee.jpg","assets/products/hero-showcase.jpg"]'::jsonb,
  'assets/products/hero-showcase.jpg', 'ماكينة تحضير الإسبريسو، الكابتشينو، واللاتيه بضغط 20 بار وعداد حرارة كلاسيكي لاستخلاص كريما غنية مع فوهة خفق الحليب.', '{"الموديل":"SK-04042","القدرة الكهربائية":"1350 وات — ضغط 20 بار","خزان المياه":"شفاف قابل للفك والتنظيف","المميزات":"ذراع تبخير الفوم + صينية تقطير ستانلس","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["تحضير كوب أو كوبين إسبريسو في نفس الوقت","جسم كامل من الاستانلس ستيل المصقول مع سطح تدفئة الأكواب"]'::jsonb, true, 22
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-09122', 'SK-09122', 'غلاية مياه كهربائية (كاتل) سوكاني بايركس مضيئة LED سعة 2 لتر', 'coffee', 'القهوة والغلايات', '2200W', '2.0 لتر زجاج بايركس حراري', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  790, 990, 4.8, 310, 'إضاءة LED', true, 100, 'assets/products/coffee.jpg', '["assets/products/coffee.jpg"]'::jsonb,
  'assets/products/hero-showcase.jpg', 'كاتل زجاج بايركس نقي بسعة 2 لتر وقدرة 2200 وات لغلي المياه في ثوانٍ مع إضاءة LED زرقاء وقاعدة دوارة 360 درجة.', '{"الموديل":"SK-09122","القدرة الكهربائية":"2200 وات","السعة اللترية":"2.0 لتر بايركس","الأمان":"فصل تلقائي عند الغليان وحماية من الجفاف","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["قاعدة داخلية صحية من الاستانلس ستيل 304","إضاءة LED ساحرة حول القاعدة أثناء التشغيل"]'::jsonb, true, 23
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-4007', 'SK-4007', 'مكواة بخار عمودية بالستاند سوكاني 2200 وات خزان 2.2 لتر', 'home', 'مكاوي بخار ومكانس', '2200W', 'خزان 2.2 لتر + ستاند تلسكوبي', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  2590, 3100, 4.9, 221, 'بخار احترافي', true, 100, 'assets/products/home.jpg', '["assets/products/home.jpg"]'::jsonb,
  'assets/products/hero-showcase.jpg', 'مكواة بخار عمودية لفرد الملابس، العبايات، البدل، والستائر وهي معلقة بسرعة فائقة مع تحكم في درجات البخار.', '{"الموديل":"SK-4007","القدرة الكهربائية":"2200 وات","سعة الخزان":"2.2 لتر شفاف","الملحقات":"عمود تلسكوبي قابل للتعلية + فرشاة بخار","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["جاهزة لإطلاق البخار خلال 35 ثانية فقط","آمنة تماماً على الحرير، الشيفون، والأقمشة الرقيقة"]'::jsonb, true, 24
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-3386', 'SK-3386', 'مكنسة سوكاني العمودية اللاسلكية / الكهربائية بشاشة ديجيتال', 'home', 'مكاوي بخار ومكانس', '2600W', 'شفط تيربو + فلتر HEPA', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  3650, 4200, 4.9, 147, 'شفط فائق', true, 100, 'assets/products/home.jpg', '["assets/products/home.jpg"]'::jsonb,
  'assets/products/hero-showcase.jpg', 'مكنسة سوكاني الحديثة بقوة شفط عالية وشاشة رقمية وفرشاة مضيئة بـ LED للوصول إلى أدق الأتربة تحت الأثاث.', '{"الموديل":"SK-3386","القدرة":"2600 وات / شفط تيربو","الفلتر":"نظام فلترة HEPA متعدد المراحل","الفرشاة":"فرشاة دوارة بإضاءة LED أمامية","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["خفيفة الوزن وسهلة المناورة لتنظيف الأرضيات والسجاد والستائر","تفريغ سلة الأتربة بضغطة زر واحدة"]'::jsonb, true, 25
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-15016', 'SK-15016', 'مكواة فرد الشعر سوكاني سيراميك ديجيتال احترافية روز جولد', 'care', 'العناية الشخصية والشعر', 'Pro 210°C+', 'ألواح سيراميك + شاشة LED', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  980, 1250, 4.9, 276, 'شاشة ديجيتال', true, 100, 'assets/products/care.jpg', '["assets/products/care.jpg"]'::jsonb,
  'assets/products/hero-showcase.jpg', 'مكواة فرد الشعر بألواح سيراميك روز جولد ناعمة وشاشة رقمية تمنح الشعر انسيابية ولمعاناً طبيعياً من أول تمريرة.', '{"الموديل":"SK-15016","الألواح":"سيراميك تيتانيوم متكيف","التسخين":"تسخين فوري خلال 30 ثانية مع شاشة حرارة","السلك":"دوار 360 درجة","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["تحافظ على رطوبة الشعر وتمنع الهيشان","مناسبة للاستخدام الشخصي والصالونات"]'::jsonb, true, 26
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

insert into public.products (
  id, model, name, category, category_label, wattage, capacity, warranty, shipping,
  price, old_price, rating, reviews_count, badge, in_stock, stock_qty, image, gallery,
  fallback_image, short_desc, specs, features, is_active, sort_order
) values (
  'sk-2227', 'SK-2227', 'مجفف شعر (استشوار) سوكاني الاحترافي 2400 وات بموتور صالونات', 'care', 'العناية الشخصية والشعر', '2400W', 'بارد وساخن + فوهة تركيز', 'ضمان معتمد رسمي من شركة المغربي لمدة سنة', 'شحن مجاني لجميع المحافظات',
  890, 1150, 4.8, 198, 'قوة 2400W', true, 100, 'assets/products/care.jpg', '["assets/products/care.jpg"]'::jsonb,
  'assets/products/hero-showcase.jpg', 'مجفف شعر احترافي بتصميم أسود وروز جولد أنيق، بقوة دفع هواء عالية ومستويات حرارة وسرعة متعددة.', '{"الموديل":"SK-2227","القدرة الكهربائية":"2400 وات","المستويات":"سرعتان + 3 درجات حرارة + زر الهواء البارد","الضمان":"ضمان معتمد رسمي من شركة المغربي لمدة سنة","الشحن":"شحن مجاني لجميع المحافظات"}'::jsonb, '["مزود بفوهة تركيز الهواء لتصفيف دقيق وسريع","فلتر خلفي قابل للفك للتنظيف"]'::jsonb, true, 27
) on conflict (id) do update set
  model = excluded.model,
  name = excluded.name,
  category = excluded.category,
  category_label = excluded.category_label,
  wattage = excluded.wattage,
  capacity = excluded.capacity,
  warranty = excluded.warranty,
  shipping = excluded.shipping,
  price = excluded.price,
  old_price = excluded.old_price,
  rating = excluded.rating,
  reviews_count = excluded.reviews_count,
  badge = excluded.badge,
  in_stock = excluded.in_stock,
  image = excluded.image,
  gallery = excluded.gallery,
  fallback_image = excluded.fallback_image,
  short_desc = excluded.short_desc,
  specs = excluded.specs,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

-- 4. Hero Slides Showcase (5 Featured Slides)
insert into public.hero_slides (
  id, num, tag, title, subtitle, model, power, capacity, price, image, fit_mode, product_id, category_id, sort_order, is_active
) values (
  'hero-01', '01', 'SOKANY FLAGSHIP SERIES • DIGITAL AIR FRYER', 'قلاية سوكاني الديجيتال الهوائية 360° موديل SK-10085', 'تصميم عصري بشاشة لمس ديجيتال LED بـ 10 برامج طهي، قدرة 2200 وات، وحلة عائلية غير لاصقة سعة 7.5 لتر لطهي صحي بدون زيت.', 'SK-10085', '2200W', '7.5 Liters', '3,850 ج.م', 'assets/products/airfryer.jpg', 'contain', 'sk-10085', 'airfryer', 1, true
) on conflict (id) do update set
  num = excluded.num,
  tag = excluded.tag,
  title = excluded.title,
  subtitle = excluded.subtitle,
  model = excluded.model,
  power = excluded.power,
  capacity = excluded.capacity,
  price = excluded.price,
  image = excluded.image,
  fit_mode = excluded.fit_mode,
  product_id = excluded.product_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.hero_slides (
  id, num, tag, title, subtitle, model, power, capacity, price, image, fit_mode, product_id, category_id, sort_order, is_active
) values (
  'hero-02', '02', 'SOKANY 7×1 MULTI-MAKER • GRANITE SERIES', 'ساندوتش ميكر وجريل ووافل سوكاني 7×1 الأصلي SK-B907', 'جهاز متكامل بـ 7 أطقم ألواح تيفال غير لاصقة قابلة للفك والغسيل لتحضير الساندوتش، البانيني، الوافل، الدونات، والمعمول بسهولة.', 'SK-B907', '750W - 1400W', '7 غيارات تيفال', '2,150 ج.م', 'assets/products/sandwich.jpg', 'contain', 'sk-b907', 'sandwich', 2, true
) on conflict (id) do update set
  num = excluded.num,
  tag = excluded.tag,
  title = excluded.title,
  subtitle = excluded.subtitle,
  model = excluded.model,
  power = excluded.power,
  capacity = excluded.capacity,
  price = excluded.price,
  image = excluded.image,
  fit_mode = excluded.fit_mode,
  product_id = excluded.product_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.hero_slides (
  id, num, tag, title, subtitle, model, power, capacity, price, image, fit_mode, product_id, category_id, sort_order, is_active
) values (
  'hero-03', '03', 'SOKANY HEAVY DUTY • TURBO BLENDER PRO', 'خلاط سوكاني العملاق ومحضرة الطعام SK-999N', 'قوة جبارة 6000 وات لجرش الثلج والسموذي وفرم اللحوم بشفرات تيتانيوم سداسية وتروس معدنية فائقة التحمل.', 'SK-999N', '6000W', '2.5L + Chopper', '2,150 ج.م', 'assets/products/blender.jpg', 'contain', 'sk-999n', 'blender', 3, true
) on conflict (id) do update set
  num = excluded.num,
  tag = excluded.tag,
  title = excluded.title,
  subtitle = excluded.subtitle,
  model = excluded.model,
  power = excluded.power,
  capacity = excluded.capacity,
  price = excluded.price,
  image = excluded.image,
  fit_mode = excluded.fit_mode,
  product_id = excluded.product_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.hero_slides (
  id, num, tag, title, subtitle, model, power, capacity, price, image, fit_mode, product_id, category_id, sort_order, is_active
) values (
  'hero-04', '04', 'SOKANY CONVECTION & ROTISSERIE • DIGITAL OVEN', 'فرن سوكاني الديجيتال بالشواية الدوارة والمروحة SK-10071', 'تسوية احترافية للمشويات والمخبوزات مع شواية دوارة 360°، شاشة تحكم رقمية، مروحة توزيع حراري، وباب زجاجي مزدوج مضيء.', 'SK-10071', '3000W', 'Convection Pro', '3,890 ج.م', 'assets/products/oven.jpg', 'contain', 'sk-10071', 'oven', 4, true
) on conflict (id) do update set
  num = excluded.num,
  tag = excluded.tag,
  title = excluded.title,
  subtitle = excluded.subtitle,
  model = excluded.model,
  power = excluded.power,
  capacity = excluded.capacity,
  price = excluded.price,
  image = excluded.image,
  fit_mode = excluded.fit_mode,
  product_id = excluded.product_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.hero_slides (
  id, num, tag, title, subtitle, model, power, capacity, price, image, fit_mode, product_id, category_id, sort_order, is_active
) values (
  'hero-05', '05', 'SOKANY PLANETARY MIXING • STAND MIXER PRO', 'عجان سوكاني الاحترافي استانلس 8 لتر موديل SK-05022', 'نظام خفق وعجن كوكبي بـ 6 سرعات وموتور نحاسي قوي 2000 وات مع وعاء استانلس 304 و3 مضارب للعجن والخفق.', 'SK-05022', '2000W', '8L Stainless', '4,490 ج.م', 'assets/products/mixer.jpg', 'contain', 'sk-05022', 'blender', 5, true
) on conflict (id) do update set
  num = excluded.num,
  tag = excluded.tag,
  title = excluded.title,
  subtitle = excluded.subtitle,
  model = excluded.model,
  power = excluded.power,
  capacity = excluded.capacity,
  price = excluded.price,
  image = excluded.image,
  fit_mode = excluded.fit_mode,
  product_id = excluded.product_id,
  category_id = excluded.category_id,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active,
  updated_at = now();

-- 5. Default Discount Coupons
insert into public.coupons (code, discount_type, discount_value, min_order_total, is_active)
values ('DAIMOND10', 'percent', 10, 0, true)
on conflict (code) do update set
  discount_type = excluded.discount_type,
  discount_value = excluded.discount_value,
  min_order_total = excluded.min_order_total,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.coupons (code, discount_type, discount_value, min_order_total, is_active)
values ('SOKANY15', 'percent', 15, 2000, true)
on conflict (code) do update set
  discount_type = excluded.discount_type,
  discount_value = excluded.discount_value,
  min_order_total = excluded.min_order_total,
  is_active = excluded.is_active,
  updated_at = now();

insert into public.coupons (code, discount_type, discount_value, min_order_total, is_active)
values ('BRIDE25', 'percent', 25, 5000, true)
on conflict (code) do update set
  discount_type = excluded.discount_type,
  discount_value = excluded.discount_value,
  min_order_total = excluded.min_order_total,
  is_active = excluded.is_active,
  updated_at = now();
