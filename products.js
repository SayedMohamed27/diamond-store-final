// ============================================================================
// DIAMOND STORE - SOKANY OFFICIAL CATALOG, CMS SETTINGS & SMART ARABIC SEARCH
// ============================================================================

const DEFAULT_STORE_SETTINGS = {
  storeName: 'Diamond Store',
  tagline: 'أجهزة SOKANY المنزلية الحديثة',
  whatsappNumber: '201000000000',
  warrantyText: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
  shippingText: 'شحن مجاني لجميع المحافظات',
  topBarText1: 'شحن مجاني تماماً لجميع محافظات مصر خلال 24 - 48 ساعة',
  topBarText2: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة على جميع الأجهزة',
  topBarText3: 'خصم إضافي 10% باستخدام كود: DIAMOND10 — الدفع عند الاستلام',
  bundleEnabled: true,
  bundleKicker: 'باكدج العروسة والتوفير الذكي',
  bundleTitle: 'جهّزي مطبخك بأقوى باكدج عروسة بخصم يصل إلى 25% فوري',
  bundleSubtitle: 'اختاري الأجهزة التي ترغبين بها من القائمة ليتم احتساب خصم باكدج العروسة تلقائياً مع شحن مجاني وضمان معتمد رسمي من شركة المغربي لمدة سنة',
  bundleTier2: 10,
  bundleTier3: 18,
  bundleTier4: 25,
  bundleCustomFixedPrice: 0,
  bundleProductIds: ['sk-10085', 'sk-b907', 'sk-999n', 'sk-10071', 'sk-7027n', 'sk-4007', 'sk-09122'],
  bundleDefaultSelectedIds: ['sk-10085', 'sk-b907', 'sk-999n', 'sk-09122'],
  instapayLink: 'https://ipn.eg/S/diamondstore/instapay/0000',
  instapayNumber: '01000000000',
  instapayHandle: 'diamondstore@instapay',
  instapayAccountName: 'Diamond Store',
  instapayQrImage: '',
  vodafoneCashNumber: '01000000000',
  paymentInstructions: 'بعد إتمام التحويل عبر إنستا باي أو المحفظة، يرجى أخذ لقطة شاشة (اسكرين شوت Screenshot) لإيصال التحويل وإرفاقها مع الطلب أو إرسالها مباشرة مع رسالة تأكيد الأوردر على واتساب ليتم شحن طلبك فوراً.',
  rateLimitEnabled: true,
  rateLimitMaxOrders: 3,
  rateLimitWindowMinutes: 10
};

const DEFAULT_CATEGORIES = [
  {
    id: 'kitchen',
    name: 'أجهزة المطبخ',
    navTitle: 'أجهزة المطبخ',
    enName: 'Kitchen Appliances',
    subtitle: 'خلاطات، كبات، عجانات، قلايات هوائية، ساندوتش ميكر، أفران وماكينات قهوة',
    icon: 'fa-blender',
    image: 'assets/products/blender.jpg',
    subItems: [
      { label: 'خلاطات كهربائية احترافية', cat: 'kitchen', query: 'خلاط', icon: 'fa-blender' },
      { label: 'كبات ومفارم لحوم', cat: 'kitchen', query: 'كبة', icon: 'fa-utensils' },
      { label: 'عجانات استانلس ثقيلة', cat: 'kitchen', query: 'عجان', icon: 'fa-bowl-food' },
      { label: 'قلايات هوائية ديجيتال', cat: 'kitchen', query: 'قلاية', icon: 'fa-fire-burner' },
      { label: 'ساندوتش ميكر وجريل ووافل', cat: 'kitchen', query: 'ساندوتش', icon: 'fa-bread-slice' },
      { label: 'أفران كهربائية ومايكروويف', cat: 'kitchen', query: 'فرن', icon: 'fa-temperature-high' },
      { label: 'ماكينات القهوة والغلايات', cat: 'kitchen', query: 'قهوة', icon: 'fa-mug-hot' },
      { label: 'عرض كل أجهزة المطبخ', cat: 'kitchen', query: '', icon: 'fa-border-all' }
    ]
  },
  {
    id: 'home',
    name: 'الأجهزة المنزلية',
    navTitle: 'الأجهزة المنزلية',
    enName: 'Home Appliances',
    subtitle: 'مكاوي بخار سيراميك وعمودية ومكانس كهربائية وأجهزة المنزل',
    icon: 'fa-shirt',
    image: 'assets/products/home.jpg',
    subItems: [
      { label: 'مكاوي بخار سيراميك وعمودية', cat: 'home', query: 'مكواة', icon: 'fa-shirt' },
      { label: 'مكانس كهربائية برميلية وعصا', cat: 'home', query: 'مكنسة', icon: 'fa-broom' },
      { label: 'عرض كل الأجهزة المنزلية', cat: 'home', query: '', icon: 'fa-border-all' }
    ]
  },
  {
    id: 'care',
    name: 'العناية الشخصية',
    navTitle: 'العناية الشخصية',
    enName: 'Personal Care',
    subtitle: 'مكاوي شعر سيراميك، مجففات شعر، استايلر وأجهزة العناية الشخصية',
    icon: 'fa-wand-magic-sparkles',
    image: 'assets/products/care.jpg',
    subItems: [
      { label: 'مكواة شعر سيراميك وبيبي ليس', cat: 'care', query: 'مكواة', icon: 'fa-wand-magic-sparkles' },
      { label: 'سشوار ومجففات شعر احترافية', cat: 'care', query: 'مجفف', icon: 'fa-wind' },
      { label: 'فرشاة شعر حرارية ومصففات', cat: 'care', query: 'فرشاة', icon: 'fa-spa' },
      { label: 'عرض كل أجهزة العناية الشخصية', cat: 'care', query: '', icon: 'fa-border-all' }
    ]
  },
  {
    id: 'contact',
    name: 'قسم اتصل بنا',
    navTitle: 'قسم اتصل بنا',
    enName: 'Contact Us',
    subtitle: 'تواصل مباشر مع خدمة عملاء Diamond Store عبر واتساب ومراكز الصيانة',
    icon: 'fa-headset',
    image: 'assets/logo.jpg',
    subItems: [
      { label: 'تواصل مباشر عبر واتساب', cat: 'contact', query: 'whatsapp', icon: 'fa-comment-dots' },
      { label: 'طلب استبدال أو استرجاع (14 يوم)', cat: 'contact', query: 'refund', icon: 'fa-rotate-left' },
      { label: 'عناوين مراكز صيانة سوكاني المعتمدة', cat: 'contact', query: 'service', icon: 'fa-screwdriver-wrench' },
      { label: 'أرقام ومواعيد خدمة العملاء', cat: 'contact', query: 'info', icon: 'fa-phone-volume' }
    ]
  }
];

const KITCHEN_SUB_CATEGORY_IDS = ['kitchen', 'sandwich', 'airfryer', 'oven', 'blender', 'coffee'];

function doesProductMatchCategory(prod, catId) {
  if (!prod) return false;
  if (!catId || catId === 'all') return true;
  if (catId === 'contact') return false;
  const pCat = String(prod.category || '').toLowerCase();
  const target = String(catId || '').toLowerCase();
  if (target === 'kitchen') {
    return KITCHEN_SUB_CATEGORY_IDS.includes(pCat);
  }
  if (KITCHEN_SUB_CATEGORY_IDS.includes(target) && pCat === 'kitchen') {
    const keywordMap = {
      sandwich: 'ساندوتش جريل وافل بانيني',
      airfryer: 'قلايه هوائيه ايرفراير',
      oven: 'فرن مايكروويف شوايه',
      blender: 'خلاط كبه عجان هاند بليندر مضرب مفرمه',
      coffee: 'قهوه اسبريسو غلايه كاتل كنكه'
    };
    const kw = keywordMap[target] || '';
    const text = normalizeArabicText(`${prod.name || ''} ${prod.categoryLabel || ''} ${prod.subCategory || ''}`);
    return kw.split(' ').some(w => w && text.includes(w));
  }
  return pCat === target;
}

const DEFAULT_PRODUCTS = [
  // ==================== 1. SANDWICH MAKERS & GRILLS ====================
  {
    id: 'sk-b907',
    model: 'SK-B907',
    name: 'ساندوتش ميكر سوكاني 7×1 متعدد الاستخدامات 750 وات',
    category: 'sandwich',
    categoryLabel: 'ساندوتش ميكر وجريل',
    wattage: '750W',
    capacity: '7 غيارات تيفال قابلة للفك',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 2150,
    oldPrice: 2550,
    rating: 4.9,
    reviewsCount: 342,
    badge: 'الأكثر مبيعاً',
    inStock: true,
    image: 'assets/products/sandwich.jpg',
    gallery: ['assets/products/sandwich.jpg', 'assets/products/grill.jpg', 'assets/products/hero-showcase.jpg'],
    fallbackImage: 'assets/products/grill.jpg',
    shortDesc: 'جهاز متكامل بـ 7 أزواج من الألواح القابلة للتبديل لعمل الساندوتشات، الوافل، الجريل، الدونات، المعمول، الجوزية، والبسكويت.',
    specs: {
      'الموديل': 'SK-B907',
      'القدرة الكهربائية': '750 وات',
      'عدد الغيارات': '7 أطقم ألواح قابلة للفك والغسيل',
      'خامة الألواح': 'طبقة تيفال غير لاصقة عالية الجودة',
      'مؤشرات التشغيل': 'لمبة بيان للتشغيل والجاهزية',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      '7 وظائف مختلفة في جهاز واحد مدمج يوفر مساحة المطبخ',
      'فك وتركيب الألواح بضغطة زر لسهولة الغسيل والتنظيف',
      'مقبض عازل للحرارة مع قفل أمان محكم',
      'توزيع حراري مزدوج من الأعلى والأسفل لتحميص متساوٍ'
    ]
  },
  {
    id: 'sk-08064n',
    model: 'SK-08064N',
    name: 'ساندوتش ميكر وجريل ووافل سوكاني 3×1 بقوة 1400 وات',
    category: 'sandwich',
    categoryLabel: 'ساندوتش ميكر وجريل',
    wattage: '1400W',
    capacity: '3 ألواح جامبو + فتح 180°',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 1890,
    oldPrice: 2250,
    rating: 4.9,
    reviewsCount: 218,
    badge: 'قوة 1400 وات',
    inStock: true,
    image: 'assets/products/grill.jpg',
    gallery: ['assets/products/grill.jpg', 'assets/products/sandwich.jpg'],
    fallbackImage: 'assets/products/sandwich.jpg',
    shortDesc: 'قدرة عالية 1400 وات لتسخين فائق السرعة مع 3 ألواح قابلة للفك وإمكانية فتح الجهاز 180 درجة كشواية مسطحة.',
    specs: {
      'الموديل': 'SK-08064N',
      'القدرة الكهربائية': '1400 وات',
      'عدد الألواح': '3 أطقم (ساندوتش، جريل، وافل)',
      'زاوية الفتح': 'يفتح حتى 180 درجة للشوي المفتوح',
      'الخامة الخارجية': 'ستانلس ستيل مع باكيليت حراري',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'قوة 1400 وات تمنح تحميصاً وقرمشة سريعة',
      'ألواح تيفال عميقة قابلة للإزالة والغسل',
      'ثرموستات أوتوماتيكي للتحكم في الحرارة'
    ]
  },
  {
    id: 'sk-07084',
    model: 'SK-07084',
    name: 'جريل وصانع ساندوتشات بانيني سوكاني ستانلس 2000 وات',
    category: 'sandwich',
    categoryLabel: 'ساندوتش ميكر وجريل',
    wattage: '2000W',
    capacity: 'مقاس عائلي - فتح 180°',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 2290,
    oldPrice: 2650,
    rating: 4.8,
    reviewsCount: 164,
    badge: 'شواية وبانيني',
    inStock: true,
    image: 'assets/products/grill.jpg',
    gallery: ['assets/products/grill.jpg', 'assets/products/sandwich.jpg'],
    fallbackImage: 'assets/products/sandwich.jpg',
    shortDesc: 'شواية وجريل بانيني بسطح غير لاصق ومفصلة متحركة تتكيف مع سُمك الساندوتشات والبرجر والستيك.',
    specs: {
      'الموديل': 'SK-07084',
      'القدرة الكهربائية': '2000 وات',
      'السطح': 'جرانيت مضلع غير لاصق',
      'التحكم': 'بكرة ضبط درجات الحرارة',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'مثالي للكريب، الساندوتشات السوري، واللحوم المشوية',
      'درج مدمج لتجميع الدهون الزائدة',
      'جسم خارجي من الاستانلس ستيل المصقول'
    ]
  },
  {
    id: 'sk-08085',
    model: 'SK-08085',
    name: 'ماكينة الوافل البلجيكي سوكاني مزدوجة القالب 1200 وات',
    category: 'sandwich',
    categoryLabel: 'ساندوتش ميكر وجريل',
    wattage: '1200W',
    capacity: 'قالب وافل عميق غير لاصق',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 1290,
    oldPrice: 1550,
    rating: 4.8,
    reviewsCount: 119,
    badge: 'وافل كافيهات',
    inStock: true,
    image: 'assets/products/sandwich.jpg',
    gallery: ['assets/products/sandwich.jpg', 'assets/products/grill.jpg'],
    fallbackImage: 'assets/products/grill.jpg',
    shortDesc: 'ماكينة تحضير الوافل المقرمش بتصميم عصري وألواح تيفال مانعة للالتصاق وتوزيع حراري متوازن.',
    specs: {
      'الموديل': 'SK-08085',
      'القدرة الكهربائية': '1200 وات',
      'السطح': 'تيفال مزدوج عميق',
      'الأمان': 'مقبض بارد الملمس + قواعد تثبيت',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'تحضير الوافل الذهبي في دقائق معدودة',
      'سهلة التنظيف والتخزين الرأسي'
    ]
  },

  // ==================== 2. AIR FRYERS (قلايات هوائية) ====================
  {
    id: 'sk-10085',
    model: 'SK-10085',
    name: 'قلاية هوائية سوكاني ديجيتال 7.5 لتر 2200 وات (2 سخان)',
    category: 'airfryer',
    categoryLabel: 'قلايات هوائية',
    wattage: '2200W',
    capacity: '7.5 لتر - سخان مزدوج',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 3850,
    oldPrice: 4450,
    rating: 5.0,
    reviewsCount: 485,
    badge: 'الأعلى طلباً',
    inStock: true,
    image: 'assets/products/airfryer.jpg',
    gallery: ['assets/products/airfryer.jpg', 'assets/products/hero-showcase.jpg'],
    fallbackImage: 'assets/products/hero-showcase.jpg',
    shortDesc: 'قلاية سوكاني الديجيتال المزودة بـ 2 سخان (علوي وسفلي) لتسوية مثالية بدون تقليب، سعة 7.5 لتر وشاشة تاتش بـ 10 برامج.',
    specs: {
      'الموديل': 'SK-10085',
      'القدرة الكهربائية': '2200 وات (سخان علوي وسفلي)',
      'السعة اللترية': '7.5 لتر حجم عائلي',
      'لوحة التحكم': 'شاشة لمس ديجيتال LED بـ 10 برامج + فك تجميد',
      'درجة الحرارة': '80°C إلى 200°C مع مؤقت 60 دقيقة',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'سخان مزدوج يضمن قرمشة متساوية من جميع الجوانب',
      'طهي صحي بأقل نسبة دهون حتى 90%',
      'حلة داخلية مطلية بالتيفال غير القابل للالتصاق وسهلة الفك',
      'فصل تلقائي عند سحب الدرج مع ذاكرة استكمال التشغيل'
    ]
  },
  {
    id: 'sk-10117',
    model: 'SK-10117',
    name: 'قلاية هوائية سوكاني ديجيتال بنافذة رؤية 11 لتر 2000 وات',
    category: 'airfryer',
    categoryLabel: 'قلايات هوائية',
    wattage: '2000W',
    capacity: '11 لتر + نافذة رؤية مضيئة',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 4490,
    oldPrice: 5150,
    rating: 4.9,
    reviewsCount: 274,
    badge: 'سعة عملاقة 11L',
    inStock: true,
    image: 'assets/products/airfryer.jpg',
    gallery: ['assets/products/airfryer.jpg', 'assets/products/oven.jpg'],
    fallbackImage: 'assets/products/oven.jpg',
    shortDesc: 'سعة ضخمة 11 لتر للعائلات والعزومات مع نافذة زجاجية حرارية وإضاءة داخلية لمتابعة الطعام أثناء التحمير دون فتح الدرج.',
    specs: {
      'الموديل': 'SK-10117',
      'القدرة الكهربائية': '2000 وات',
      'السعة اللترية': '11 لتر جامبو',
      'شباك الرؤية': 'زجاج حراري مزدوج مع إضاءة داخلية',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'متابعة نضج الطعام مباشرة من خلال النافذة المضيئة',
      'تكفي دجاجة كاملة كبيرة أو كميات وفيرة من البطاطس والمشويات',
      'شاشة لمس ذكية متعددة البرامج'
    ]
  },
  {
    id: 'sk-8042',
    model: 'SK-8042',
    name: 'قلاية هوائية سوكاني ديجيتال 8 لتر 1700 وات متعددة البرامج',
    category: 'airfryer',
    categoryLabel: 'قلايات هوائية',
    wattage: '1700W',
    capacity: '8 لتر ديجيتال',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 3450,
    oldPrice: 3990,
    rating: 4.8,
    reviewsCount: 195,
    badge: 'موفر للطاقة',
    inStock: true,
    image: 'assets/products/airfryer.jpg',
    gallery: ['assets/products/airfryer.jpg'],
    fallbackImage: 'assets/products/hero-showcase.jpg',
    shortDesc: 'تصميم انسيابي أنيق بسعة 8 لتر وقدرة 1700 وات موفرة للكهرباء مع توزيع هواء ساخن 360 درجة.',
    specs: {
      'الموديل': 'SK-8042',
      'القدرة الكهربائية': '1700 وات',
      'السعة اللترية': '8 لتر',
      'التحكم': 'شاشة ديجيتال تاتش',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'حلة كبيرة غير لاصقة سهلة التنظيف',
      'برامج جاهزة للبطاطس، الدجاج، اللحم، الأسماك، والفرن'
    ]
  },

  // ==================== 3. OVENS & MICROWAVES (أفران ومايكروويف) ====================
  {
    id: 'sk-10071',
    model: 'SK-10071',
    name: 'فرن كهربائي سوكاني 3×1 بالشواية والمروحة 3000 وات',
    category: 'oven',
    categoryLabel: 'أفران ومايكروويف',
    wattage: '3000W',
    capacity: 'شواية دوارة + مروحة توزيع',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 3890,
    oldPrice: 4450,
    rating: 4.9,
    reviewsCount: 178,
    badge: 'شواية + 3000W',
    inStock: true,
    image: 'assets/products/oven.jpg',
    gallery: ['assets/products/oven.jpg', 'assets/products/hero-showcase.jpg'],
    fallbackImage: 'assets/products/hero-showcase.jpg',
    shortDesc: 'فرن كهربائي قوي 3000 وات مزود بسيخ شواية، مروحة توزيع حراري Convection، صينية خبيز، وشبكة شوي ستانلس.',
    specs: {
      'الموديل': 'SK-10071',
      'القدرة الكهربائية': '3000 وات تسخين سريع',
      'التحكم': 'شاشة رقمية + مفاتيح تحكم دقيقة',
      'الملحقات': 'سيخ شواية + صينية + شبكة ستانلس + مقبض',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'عناصر تسخين من الاستانلس ستيل المقاوم للصدأ',
      'باب زجاجي حراري مزدوج بإضاءة داخلية لمتابعة التسوية',
      'تحكم كامل في درجات الحرارة ومستويات التسخين العلوي والسفلي'
    ]
  },
  {
    id: 'sk-10020',
    model: 'SK-10020',
    name: 'مايكروويف وفرن سوكاني ديجيتال 42 لتر 1560 وات',
    category: 'oven',
    categoryLabel: 'أفران ومايكروويف',
    wattage: '1560W',
    capacity: '42 لتر حجم عائلي',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 6250,
    oldPrice: 7100,
    rating: 4.9,
    reviewsCount: 142,
    badge: 'سعة 42 لتر',
    inStock: true,
    image: 'assets/products/oven.jpg',
    gallery: ['assets/products/oven.jpg'],
    fallbackImage: 'assets/products/hero-showcase.jpg',
    shortDesc: 'مايكروويف وفرن عائلي ضخم بسعة 42 لتر ولوحة تحكم ديجيتال وبرامج متعددة للتسخين السريع وفك التجميد والشوي.',
    specs: {
      'الموديل': 'SK-10020',
      'القدرة الكهربائية': '1560 وات',
      'السعة اللترية': '42 لتر',
      'التحكم': 'لوحة ديجيتال ذكية + مقبض دوار',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'سعة داخلية كبيرة تستوعب الأطباق والصواني العائلية',
      'خاصية فك التجميد السريع حسب الوزن أو الوقت',
      'قفل أمان للأطفال وإضاءة داخلية'
    ]
  },
  {
    id: 'sk-10096',
    model: 'SK-10096',
    name: 'مايكروويف سوكاني ديجيتال 20 لتر 1100 وات بتصميم ستانلس',
    category: 'oven',
    categoryLabel: 'أفران ومايكروويف',
    wattage: '1100W',
    capacity: '20 لتر',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 4190,
    oldPrice: 4750,
    rating: 4.8,
    reviewsCount: 156,
    badge: 'تسخين فوري',
    inStock: true,
    image: 'assets/products/oven.jpg',
    gallery: ['assets/products/oven.jpg'],
    fallbackImage: 'assets/products/hero-showcase.jpg',
    shortDesc: 'مايكروويف عملي بسعة 20 لتر وقدرة 1100 وات مثالي للتسخين اليومي السريع وإذابة المجمدات بـ 5 مستويات طاقة.',
    specs: {
      'الموديل': 'SK-10096',
      'القدرة الكهربائية': '1100 وات',
      'السعة اللترية': '20 لتر',
      'الصينية': 'طبق زجاجي دوار لتوزيع الحرارة',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'تشغيل سهل وسريع مع مؤقت رقمي',
      'تجويف داخلي مطلي يسهل مسحه وتنظيفه'
    ]
  },

  // ==================== 4. BLENDERS, CHOPPERS & MIXERS ====================
  {
    id: 'sk-999n',
    model: 'SK-999N',
    name: 'خلاط سوكاني العملاق كاسر الثلج والمحضر 6000 وات 2.5 لتر',
    category: 'blender',
    categoryLabel: 'خلاطات وعجانات وكبات',
    wattage: '6000W',
    capacity: '2.5 لتر + كبة/مطحنة',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 2150,
    oldPrice: 2590,
    rating: 4.9,
    reviewsCount: 512,
    badge: 'وحش الـ 6000W',
    inStock: true,
    image: 'assets/products/blender.jpg',
    gallery: ['assets/products/blender.jpg', 'assets/products/mixer.jpg'],
    fallbackImage: 'assets/products/mixer.jpg',
    shortDesc: 'خلاط الخدمة الشاقة للبيت والكافيهات بقوة 6000 وات، يجرش الثلج ويطحن البن والمكسرات بشفرات فولاذية سداسية.',
    specs: {
      'الموديل': 'SK-999N',
      'القدرة الكهربائية': '6000 وات',
      'السعة': '2.5 لتر شفشق ضد الكسر + ملحق فرم',
      'السرعات': 'تحكم رقمي متدرج في السرعات + خاصية النبضات Pulse',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'شفرات من الفولاذ المقاوم للصدأ تفرم الثلج والفواكه المجمدة',
      'تروس معدنية متينة لعمر افتراضي طويل',
      'ملحق إضافي للفرم والطحن السريع'
    ]
  },
  {
    id: 'sk-05022',
    model: 'SK-05022',
    name: 'عجان سوكاني الاحترافي ستانلس ستيل 8 لتر 2000 وات',
    category: 'blender',
    categoryLabel: 'خلاطات وعجانات وكبات',
    wattage: '2000W',
    capacity: 'حلة ستانلس 8 لتر',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 4490,
    oldPrice: 5200,
    rating: 4.9,
    reviewsCount: 168,
    badge: 'عجان احترافي',
    inStock: true,
    image: 'assets/products/mixer.jpg',
    gallery: ['assets/products/mixer.jpg', 'assets/products/blender.jpg'],
    fallbackImage: 'assets/products/blender.jpg',
    shortDesc: 'عجان المخبوزات والبيتزا والحلويات بحلة ستانلس ستيل مصقولة، 6 سرعات مع حركة كوكبية دائرية لعجن متجانس.',
    specs: {
      'الموديل': 'SK-05022',
      'القدرة الكهربائية': '2000 وات',
      'الحلة': 'ستانلس ستيل 304 مقاوم للصدأ بمقبض مريح',
      'السرعات': '6 سرعات + نبضات',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'خطاف عجن ثقيل + مضرب كف + مضرب خفق من المعدن',
      'قواعد تثبيت قوية مانعة للاهتزاز أثناء التشغيل'
    ]
  },
  {
    id: 'sk-7027n',
    model: 'SK-7027N',
    name: 'كبة ومحضرة طعام سوكاني بـ 6 شفرات فولاذية 1500 وات',
    category: 'blender',
    categoryLabel: 'خلاطات وعجانات وكبات',
    wattage: '1500W',
    capacity: 'فرم لحوم وخضروات',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 1290,
    oldPrice: 1590,
    rating: 4.8,
    reviewsCount: 390,
    badge: 'سلاح سداسي',
    inStock: true,
    image: 'assets/products/blender.jpg',
    gallery: ['assets/products/blender.jpg', 'assets/products/mixer.jpg'],
    fallbackImage: 'assets/products/mixer.jpg',
    shortDesc: 'كبة فرم اللحوم والخضروات والبصل بـ 6 شفرات فولاذية مزدوجة وسرعات متعددة لفرم ناعم أو خشن في ثوانٍ.',
    specs: {
      'الموديل': 'SK-7027N',
      'القدرة الكهربائية': '1500 وات',
      'الشفرات': '6 شفرات ستانلس ستيل مقاومة للصدأ',
      'التروس': 'تروس معدنية بالكامل',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'مثالية لفرم الكفتة، البصل، الثوم، الملوخية، والمكسرات',
      'سهلة الفك والغسيل مع قاعدة مانعة للانزلاق'
    ]
  },
  {
    id: 'sk-06031',
    model: 'SK-06031',
    name: 'مفرمة لحوم سوكاني الكهربائية الاحترافية ستانلس ستيل 2500 وات',
    category: 'blender',
    categoryLabel: 'خلاطات وعجانات وكبات',
    wattage: '2500W',
    capacity: 'فرم لحوم + سبت كبيبة وسجق',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 2790,
    oldPrice: 3250,
    rating: 4.9,
    reviewsCount: 132,
    badge: 'مفرمة ستانلس',
    inStock: true,
    image: 'assets/products/mixer.jpg',
    gallery: ['assets/products/mixer.jpg', 'assets/products/blender.jpg'],
    fallbackImage: 'assets/products/blender.jpg',
    shortDesc: 'مفرمة لحوم قوية بتروس معدنية و3 أوشاش فرم مختلفة مع ملحقات عمل السجق والكبيبة وخاصية الدوران العكسي.',
    specs: {
      'الموديل': 'SK-06031',
      'القدرة القصوى': '2500 وات',
      'الخامة': 'جسم ورأس فرم من الاستانلس ستيل المصقول',
      'الملحقات': '3 مصافي فرم + قمع سجق + أداة كبيبة',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'زر Reverse لفك أي عوائق أثناء الفرم فوراً',
      'سلاح قطع فولاذي حاد يدوم طويلاً'
    ]
  },
  {
    id: 'sk-7044a',
    model: 'SK-7044A',
    name: 'كبة سوكاني ستانلس ستيل 3.5 لتر 900 وات 3 سرعات مع قطعة سلاح إضافي موديل SK-7044A',
    category: 'blender',
    categoryLabel: 'خلاطات وعجانات وكبات',
    wattage: '900W',
    capacity: '3.5 لتر ستانلس ستيل',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 1300,
    oldPrice: 1590,
    rating: 4.9,
    reviewsCount: 318,
    badge: 'الأكثر مبيعاً',
    inStock: true,
    image: 'assets/products/blender.jpg',
    gallery: ['assets/products/blender.jpg', 'assets/products/mixer.jpg'],
    fallbackImage: 'assets/products/mixer.jpg',
    shortDesc: 'كبة سوكاني الأصلية بحلة ستانلس ستيل 3.5 لتر وقدرة 900 وات، 3 سرعات مع قطعة سلاح إضافي لفرم اللحوم والخضروات بكفاءة عالية.',
    specs: {
      'الموديل': 'SK-7044A',
      'القدرة الكهربائية': '900 وات',
      'السعة': '3.5 لتر ستانلس ستيل',
      'السرعات': '3 سرعات + سلاح إضافي',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'وعاء ستانلس ستيل 3.5 لتر صحي ومقاوم للصدأ',
      '3 سرعات فرم مختلفة مع سلاح فولاذي إضافي',
      'تروس معدنية قوية تتحمل فرم اللحوم والخضروات'
    ]
  },
  {
    id: 'sk-7077n',
    model: 'SK-7077N',
    name: 'كبة سوكاني ستانلس ستيل 5.5 لتر 1000 وات 3 سرعات مع قطعة سلاح إضافي موديل SK-7077N',
    category: 'blender',
    categoryLabel: 'خلاطات وعجانات وكبات',
    wattage: '1000W',
    capacity: '5.5 لتر ستانلس ستيل',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 1550,
    oldPrice: 1890,
    rating: 4.9,
    reviewsCount: 284,
    badge: 'سعة كبيرة 5.5L',
    inStock: true,
    image: 'assets/products/blender.jpg',
    gallery: ['assets/products/blender.jpg', 'assets/products/mixer.jpg'],
    fallbackImage: 'assets/products/mixer.jpg',
    shortDesc: 'كبة سوكاني العائلية سعة 5.5 لتر ستانلس ستيل بقدرة 1000 وات و3 سرعات مع قطعة سلاح إضافي لتحضير الكفتة والمفروم في ثوانٍ.',
    specs: {
      'الموديل': 'SK-7077N',
      'القدرة الكهربائية': '1000 وات',
      'السعة': '5.5 لتر ستانلس ستيل',
      'السرعات': '3 سرعات + سلاح إضافي',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'حلة ستانلس ستيل ضخمة 5.5 لتر للعزومات والكميات الكبيرة',
      'موتور نحاسي 1000 وات بـ 3 سرعات وسلاح إضافي'
    ]
  },
  {
    id: 'sk-06028',
    model: 'SK-06028',
    name: 'كبة سوكاني 400 وات 2 دورق (2 لتر ستانلس ستيل مع 7 لتر إكليريك) سرعتين موديل SK-06028',
    category: 'blender',
    categoryLabel: 'خلاطات وعجانات وكبات',
    wattage: '400W',
    capacity: '2 دورق (2L ستانلس + 7L إكليريك)',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 970,
    oldPrice: 1250,
    rating: 4.8,
    reviewsCount: 219,
    badge: '2 دورق اقتصادي',
    inStock: true,
    image: 'assets/products/blender.jpg',
    gallery: ['assets/products/blender.jpg'],
    fallbackImage: 'assets/products/mixer.jpg',
    shortDesc: 'كبة سوكاني العملية بـ 2 دورق (دورق 2 لتر ستانلس ستيل + دورق 7 لتر إكليريك مقوى) وسرعتين لتلبية كافة احتياجات المطبخ.',
    specs: {
      'الموديل': 'SK-06028',
      'القدرة الكهربائية': '400 وات',
      'السعة': '2 دورق (2 لتر ستانلس + 7 لتر إكليريك)',
      'السرعات': 'سرعتين',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'مزودة بـ 2 دورق بأحجام مختلفة للحوم والخضروات',
      'سعر اقتصادي ممتاز مع ضمان شركة المغربي الرسمي'
    ]
  },
  {
    id: 'sk-7033a',
    model: 'SK-7033A',
    name: 'كبة سوكاني ستانلس ستيل 6.5 لتر 1500 وات 3 سرعات مع قطعة سلاح إضافي موديل SK-7033A',
    category: 'blender',
    categoryLabel: 'خلاطات وعجانات وكبات',
    wattage: '1500W',
    capacity: '6.5 لتر ستانلس ستيل',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 2200,
    oldPrice: 2650,
    rating: 4.9,
    reviewsCount: 342,
    badge: 'خدمة شاقة 6.5L',
    inStock: true,
    image: 'assets/products/blender.jpg',
    gallery: ['assets/products/blender.jpg', 'assets/products/mixer.jpg'],
    fallbackImage: 'assets/products/mixer.jpg',
    shortDesc: 'كبة سوكاني الجبارة 6.5 لتر ستانلس ستيل بقوة 1500 وات و3 سرعات مع قطعة سلاح إضافي للفرم الثقيل والخدمة الشاقة.',
    specs: {
      'الموديل': 'SK-7033A',
      'القدرة الكهربائية': '1500 وات',
      'السعة': '6.5 لتر ستانلس ستيل',
      'السرعات': '3 سرعات + سلاح إضافي',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'سعة 6.5 لتر ستانلس ستيل مقاوم للصدأ',
      'موتور 1500 وات جبار مع سلاح فولاذي إضافي'
    ]
  },
  {
    id: 'sk-06020n',
    model: 'SK-06020N',
    name: 'كبة سوكاني ستانلس ستيل 6×1 سعة 5 لتر 1000 وات 3 سرعات موديل SK-06020N',
    category: 'blender',
    categoryLabel: 'خلاطات وعجانات وكبات',
    wattage: '1000W',
    capacity: '5 لتر ستانلس 6×1',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 1700,
    oldPrice: 2050,
    rating: 4.9,
    reviewsCount: 246,
    badge: 'متعددة 6×1',
    inStock: true,
    image: 'assets/products/blender.jpg',
    gallery: ['assets/products/blender.jpg'],
    fallbackImage: 'assets/products/mixer.jpg',
    shortDesc: 'كبة ومحضرة سوكاني 6×1 بحلة ستانلس ستيل 5 لتر وقدرة 1000 وات و3 سرعات للفرم والخلط والتقطيع وتقشير الثوم.',
    specs: {
      'الموديل': 'SK-06020N',
      'القدرة الكهربائية': '1000 وات',
      'السعة': '5 لتر ستانلس ستيل (6×1)',
      'السرعات': '3 سرعات',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'منظومة 6×1 متكاملة للفرم والخفق والتقطيع',
      'وعاء ستانلس ستيل 5 لتر متين وسهل التنظيف'
    ]
  },
  {
    id: 'sk-7099a',
    model: 'SK-7099A',
    name: 'كبة سوكاني ستانلس ستيل سعة 8 لتر بقدرة 1800 وات 3 سرعات + سلاح إضافي موديل SK-7099A',
    category: 'blender',
    categoryLabel: 'خلاطات وعجانات وكبات',
    wattage: '1800W',
    capacity: '8 لتر ستانلس ستيل جامبو',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 2450,
    oldPrice: 2950,
    rating: 5.0,
    reviewsCount: 295,
    badge: 'حجم جامبو 8L',
    inStock: true,
    image: 'assets/products/blender.jpg',
    gallery: ['assets/products/blender.jpg', 'assets/products/mixer.jpg'],
    fallbackImage: 'assets/products/mixer.jpg',
    shortDesc: 'كبة سوكاني الجامبو سعة 8 لتر ستانلس ستيل بقدرة 1800 وات و3 سرعات مع سلاح إضافي لأقوى أداء فرم منزلي واحترافي.',
    specs: {
      'الموديل': 'SK-7099A',
      'القدرة الكهربائية': '1800 وات',
      'السعة': '8 لتر ستانلس ستيل',
      'السرعات': '3 سرعات + سلاح إضافي',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'أكبر سعة 8 لتر من الاستانلس ستيل الأصلي',
      'قدرة 1800 وات بـ 3 سرعات وتروس معدنية فولاذية'
    ]
  },
  {
    id: 'sk-7000n',
    model: 'SK-7000N',
    name: 'كبة سوكاني ستانلس ستيل 7 لتر 1700 وات 3 سرعات موديل SK-7000N',
    category: 'blender',
    categoryLabel: 'خلاطات وعجانات وكبات',
    wattage: '1700W',
    capacity: '7 لتر ستانلس ستيل',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 3150,
    oldPrice: 3650,
    rating: 4.9,
    reviewsCount: 198,
    badge: 'إصدار احترافي 7L',
    inStock: true,
    image: 'assets/products/blender.jpg',
    gallery: ['assets/products/blender.jpg', 'assets/products/mixer.jpg'],
    fallbackImage: 'assets/products/mixer.jpg',
    shortDesc: 'كبة سوكاني الاحترافية سعة 7 لتر ستانلس ستيل بقدرة 1700 وات و3 سرعات لفرم اللحوم والمكونات الصلبة بسرعة فائقة.',
    specs: {
      'الموديل': 'SK-7000N',
      'القدرة الكهربائية': '1700 وات',
      'السعة': '7 لتر ستانلس ستيل',
      'السرعات': '3 سرعات',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'حلة ستانلس 7 لتر فائقة السماكة مع مقبض مريح',
      'قدرة 1700 وات لفرم ناعم ومتجانس في ثوانٍ'
    ]
  },

  // ==================== 5. COFFEE & KETTLES (القهوة والغلايات) ====================
  {
    id: 'sk-04042',
    model: 'SK-04042',
    name: 'ماكينة قهوة إسبريسو وكابتشينو سوكاني ستانلس 20 بار',
    category: 'coffee',
    categoryLabel: 'القهوة والغلايات',
    wattage: '1350W',
    capacity: 'ضغط 20 بار + ذراع تبخير',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 4590,
    oldPrice: 5250,
    rating: 4.9,
    reviewsCount: 154,
    badge: 'باريستا منزلي',
    inStock: true,
    image: 'assets/products/coffee.jpg',
    gallery: ['assets/products/coffee.jpg', 'assets/products/hero-showcase.jpg'],
    fallbackImage: 'assets/products/hero-showcase.jpg',
    shortDesc: 'ماكينة تحضير الإسبريسو، الكابتشينو، واللاتيه بضغط 20 بار وعداد حرارة كلاسيكي لاستخلاص كريما غنية مع فوهة خفق الحليب.',
    specs: {
      'الموديل': 'SK-04042',
      'القدرة الكهربائية': '1350 وات — ضغط 20 بار',
      'خزان المياه': 'شفاف قابل للفك والتنظيف',
      'المميزات': 'ذراع تبخير الفوم + صينية تقطير ستانلس',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'تحضير كوب أو كوبين إسبريسو في نفس الوقت',
      'جسم كامل من الاستانلس ستيل المصقول مع سطح تدفئة الأكواب'
    ]
  },
  {
    id: 'sk-09122',
    model: 'SK-09122',
    name: 'غلاية مياه كهربائية (كاتل) سوكاني بايركس مضيئة LED سعة 2 لتر',
    category: 'coffee',
    categoryLabel: 'القهوة والغلايات',
    wattage: '2200W',
    capacity: '2.0 لتر زجاج بايركس حراري',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 790,
    oldPrice: 990,
    rating: 4.8,
    reviewsCount: 310,
    badge: 'إضاءة LED',
    inStock: true,
    image: 'assets/products/coffee.jpg',
    gallery: ['assets/products/coffee.jpg'],
    fallbackImage: 'assets/products/hero-showcase.jpg',
    shortDesc: 'كاتل زجاج بايركس نقي بسعة 2 لتر وقدرة 2200 وات لغلي المياه في ثوانٍ مع إضاءة LED زرقاء وقاعدة دوارة 360 درجة.',
    specs: {
      'الموديل': 'SK-09122',
      'القدرة الكهربائية': '2200 وات',
      'السعة اللترية': '2.0 لتر بايركس',
      'الأمان': 'فصل تلقائي عند الغليان وحماية من الجفاف',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'قاعدة داخلية صحية من الاستانلس ستيل 304',
      'إضاءة LED ساحرة حول القاعدة أثناء التشغيل'
    ]
  },

  // ==================== 6. HOME & GARMENT CARE (مكاوي ومكانس) ====================
  {
    id: 'sk-4007',
    model: 'SK-4007',
    name: 'مكواة بخار عمودية بالستاند سوكاني 2200 وات خزان 2.2 لتر',
    category: 'home',
    categoryLabel: 'مكاوي بخار ومكانس',
    wattage: '2200W',
    capacity: 'خزان 2.2 لتر + ستاند تلسكوبي',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 2590,
    oldPrice: 3100,
    rating: 4.9,
    reviewsCount: 221,
    badge: 'بخار احترافي',
    inStock: true,
    image: 'assets/products/home.jpg',
    gallery: ['assets/products/home.jpg'],
    fallbackImage: 'assets/products/hero-showcase.jpg',
    shortDesc: 'مكواة بخار عمودية لفرد الملابس، العبايات، البدل، والستائر وهي معلقة بسرعة فائقة مع تحكم في درجات البخار.',
    specs: {
      'الموديل': 'SK-4007',
      'القدرة الكهربائية': '2200 وات',
      'سعة الخزان': '2.2 لتر شفاف',
      'الملحقات': 'عمود تلسكوبي قابل للتعلية + فرشاة بخار',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'جاهزة لإطلاق البخار خلال 35 ثانية فقط',
      'آمنة تماماً على الحرير، الشيفون، والأقمشة الرقيقة'
    ]
  },
  {
    id: 'sk-3386',
    model: 'SK-3386',
    name: 'مكنسة سوكاني العمودية اللاسلكية / الكهربائية بشاشة ديجيتال',
    category: 'home',
    categoryLabel: 'مكاوي بخار ومكانس',
    wattage: '2600W',
    capacity: 'شفط تيربو + فلتر HEPA',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 3650,
    oldPrice: 4200,
    rating: 4.9,
    reviewsCount: 147,
    badge: 'شفط فائق',
    inStock: true,
    image: 'assets/products/home.jpg',
    gallery: ['assets/products/home.jpg'],
    fallbackImage: 'assets/products/hero-showcase.jpg',
    shortDesc: 'مكنسة سوكاني الحديثة بقوة شفط عالية وشاشة رقمية وفرشاة مضيئة بـ LED للوصول إلى أدق الأتربة تحت الأثاث.',
    specs: {
      'الموديل': 'SK-3386',
      'القدرة': '2600 وات / شفط تيربو',
      'الفلتر': 'نظام فلترة HEPA متعدد المراحل',
      'الفرشاة': 'فرشاة دوارة بإضاءة LED أمامية',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'خفيفة الوزن وسهلة المناورة لتنظيف الأرضيات والسجاد والستائر',
      'تفريغ سلة الأتربة بضغطة زر واحدة'
    ]
  },

  // ==================== 7. HAIR & PERSONAL CARE ====================
  {
    id: 'sk-15016',
    model: 'SK-15016',
    name: 'مكواة فرد الشعر سوكاني سيراميك ديجيتال احترافية روز جولد',
    category: 'care',
    categoryLabel: 'العناية الشخصية والشعر',
    wattage: 'Pro 210°C+',
    capacity: 'ألواح سيراميك + شاشة LED',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 980,
    oldPrice: 1250,
    rating: 4.9,
    reviewsCount: 276,
    badge: 'شاشة ديجيتال',
    inStock: true,
    image: 'assets/products/care.jpg',
    gallery: ['assets/products/care.jpg'],
    fallbackImage: 'assets/products/hero-showcase.jpg',
    shortDesc: 'مكواة فرد الشعر بألواح سيراميك روز جولد ناعمة وشاشة رقمية تمنح الشعر انسيابية ولمعاناً طبيعياً من أول تمريرة.',
    specs: {
      'الموديل': 'SK-15016',
      'الألواح': 'سيراميك تيتانيوم متكيف',
      'التسخين': 'تسخين فوري خلال 30 ثانية مع شاشة حرارة',
      'السلك': 'دوار 360 درجة',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'تحافظ على رطوبة الشعر وتمنع الهيشان',
      'مناسبة للاستخدام الشخصي والصالونات'
    ]
  },
  {
    id: 'sk-2227',
    model: 'SK-2227',
    name: 'مجفف شعر (استشوار) سوكاني الاحترافي 2400 وات بموتور صالونات',
    category: 'care',
    categoryLabel: 'العناية الشخصية والشعر',
    wattage: '2400W',
    capacity: 'بارد وساخن + فوهة تركيز',
    warranty: 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
    shipping: 'شحن مجاني لجميع المحافظات',
    price: 890,
    oldPrice: 1150,
    rating: 4.8,
    reviewsCount: 198,
    badge: 'قوة 2400W',
    inStock: true,
    image: 'assets/products/care.jpg',
    gallery: ['assets/products/care.jpg'],
    fallbackImage: 'assets/products/hero-showcase.jpg',
    shortDesc: 'مجفف شعر احترافي بتصميم أسود وروز جولد أنيق، بقوة دفع هواء عالية ومستويات حرارة وسرعة متعددة.',
    specs: {
      'الموديل': 'SK-2227',
      'القدرة الكهربائية': '2400 وات',
      'المستويات': 'سرعتان + 3 درجات حرارة + زر الهواء البارد',
      'الضمان': 'ضمان معتمد رسمي من شركة المغربي لمدة سنة',
      'الشحن': 'شحن مجاني لجميع المحافظات'
    },
    features: [
      'مزود بفوهة تركيز الهواء لتصفيف دقيق وسريع',
      'فلتر خلفي قابل للفك للتنظيف'
    ]
  }
];

const DEFAULT_HERO_SLIDES = [
  {
    num: '01',
    tag: 'SOKANY FLAGSHIP SERIES • DIGITAL AIR FRYER',
    title: 'قلاية سوكاني الديجيتال الهوائية 360° موديل SK-10085',
    subtitle: 'تصميم عصري بشاشة لمس ديجيتال LED بـ 10 برامج طهي، قدرة 2200 وات، وحلة عائلية غير لاصقة سعة 7.5 لتر لطهي صحي بدون زيت.',
    model: 'SK-10085',
    power: '2200W',
    capacity: '7.5 Liters',
    price: '3,850 ج.م',
    image: 'assets/products/airfryer.jpg',
    fitMode: 'contain',
    productId: 'sk-10085',
    categoryId: 'airfryer'
  },
  {
    num: '02',
    tag: 'SOKANY 7×1 MULTI-MAKER • GRANITE SERIES',
    title: 'ساندوتش ميكر وجريل ووافل سوكاني 7×1 الأصلي SK-B907',
    subtitle: 'جهاز متكامل بـ 7 أطقم ألواح تيفال غير لاصقة قابلة للفك والغسيل لتحضير الساندوتش، البانيني، الوافل، الدونات، والمعمول بسهولة.',
    model: 'SK-B907',
    power: '750W - 1400W',
    capacity: '7 غيارات تيفال',
    price: '2,150 ج.م',
    image: 'assets/products/sandwich.jpg',
    fitMode: 'contain',
    productId: 'sk-b907',
    categoryId: 'sandwich'
  },
  {
    num: '03',
    tag: 'SOKANY HEAVY DUTY • TURBO BLENDER PRO',
    title: 'خلاط سوكاني العملاق ومحضرة الطعام SK-999N',
    subtitle: 'قوة جبارة 6000 وات لجرش الثلج والسموذي وفرم اللحوم بشفرات تيتانيوم سداسية وتروس معدنية فائقة التحمل.',
    model: 'SK-999N',
    power: '6000W',
    capacity: '2.5L + Chopper',
    price: '2,150 ج.م',
    image: 'assets/products/blender.jpg',
    fitMode: 'contain',
    productId: 'sk-999n',
    categoryId: 'blender'
  },
  {
    num: '04',
    tag: 'SOKANY CONVECTION & ROTISSERIE • DIGITAL OVEN',
    title: 'فرن سوكاني الديجيتال بالشواية الدوارة والمروحة SK-10071',
    subtitle: 'تسوية احترافية للمشويات والمخبوزات مع شواية دوارة 360°، شاشة تحكم رقمية، مروحة توزيع حراري، وباب زجاجي مزدوج مضيء.',
    model: 'SK-10071',
    power: '3000W',
    capacity: 'Convection Pro',
    price: '3,890 ج.م',
    image: 'assets/products/oven.jpg',
    fitMode: 'contain',
    productId: 'sk-10071',
    categoryId: 'oven'
  },
  {
    num: '05',
    tag: 'SOKANY PLANETARY MIXING • STAND MIXER PRO',
    title: 'عجان سوكاني الاحترافي استانلس 8 لتر موديل SK-05022',
    subtitle: 'نظام خفق وعجن كوكبي بـ 6 سرعات وموتور نحاسي قوي 2000 وات مع وعاء استانلس 304 و3 مضارب للعجن والخفق.',
    model: 'SK-05022',
    power: '2000W',
    capacity: '8L Stainless',
    price: '4,490 ج.م',
    image: 'assets/products/mixer.jpg',
    fitMode: 'contain',
    productId: 'sk-05022',
    categoryId: 'blender'
  }
];

// ============================================================================
// SMART ARABIC & ENGLISH NORMALIZATION + SUBSTRING SEARCH ENGINE
// Handles ة/ه, أ/إ/آ/ا, ى/ي, ؤ/و, ئ/ي, diacritics, and any-position word tokens
// ============================================================================
function normalizeArabicText(text) {
  if (!text) return '';
  return String(text)
    .toLowerCase()
    // Remove Arabic diacritics (Tashkeel) and Tatweel
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // Normalize Alef variants (أ, إ, آ, ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Teh Marbuta to Heh (ة -> ه) so قلاية == قلايه
    .replace(/ة/g, 'ه')
    // Normalize Alef Maksura to Yeh (ى -> ي)
    .replace(/ى/g, 'ي')
    // Normalize Hamza on Waw/Yeh
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    // Normalize "7x1" / "7×1" dimension separators (only between digits, so English words with "x" still work)
    .replace(/(\d)\s*[x×]\s*(\d)/g, '$1 $2')
    // Normalize punctuation/hyphens into spaces
    .replace(/[-_×/\\.,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stemArabicApplianceToken(token) {
  if (!token) return token;
  const map = {
    'خلاطات': 'خلاط',
    'الخلاطات': 'خلاط',
    'عجانات': 'عجان',
    'العجانات': 'عجان',
    'كبات': 'كبه',
    'الكبات': 'كبه',
    'مفارم': 'فرم',
    'المفارم': 'فرم',
    'قلايات': 'قلايه',
    'القلايات': 'قلايه',
    'افران': 'فرن',
    'الافران': 'فرن',
    'شوايات': 'شوايه',
    'الشوايات': 'شوايه',
    'غلايات': 'غلايه',
    'الغلايات': 'غلايه',
    'ماكينات': 'ماكينه',
    'الماكينات': 'ماكينه',
    'مكاوي': 'مكواه',
    'المكاوي': 'مكواه',
    'مكانس': 'مكنسه',
    'المكانس': 'مكنسه',
    'مجففات': 'مجفف',
    'المجففات': 'مجفف',
    'سشوارات': 'سشوار',
    'مصففات': 'مصفف',
    'ساندوتشات': 'ساندوتش',
    'دفايات': 'دفايه'
  };
  return map[token] || token;
}

function smartProductSearchMatch(product, rawQuery) {
  if (!rawQuery || !rawQuery.trim()) return true;
  const normalizedQuery = normalizeArabicText(rawQuery);
  if (!normalizedQuery) return true;

  // Build comprehensive searchable corpus for the product
  const specsStr = product.specs ? Object.entries(product.specs).map(([k, v]) => `${k} ${v}`).join(' ') : '';
  const featuresStr = Array.isArray(product.features) ? product.features.join(' ') : '';
  const corpus = normalizeArabicText([
    product.name,
    product.model,
    product.model ? product.model.replace(/[^a-zA-Z0-9]/g, '') : '',
    product.categoryLabel,
    product.subCategory,
    product.category,
    product.wattage,
    product.capacity,
    product.badge,
    product.shortDesc,
    specsStr,
    featuresStr
  ].join(' '));

  // Split query into words so writing "ميكر" or "قلايه ديجيتال" or plural "خلاطات / كبات" matches anywhere in the text
  const tokens = normalizedQuery.split(' ').filter(Boolean);
  return tokens.every(token => {
    const stemmed = stemArabicApplianceToken(token);
    return corpus.includes(token) || corpus.includes(stemmed);
  });
}

// ============================================================================
// SECURITY HELPER — escape any user/admin text before injecting it into HTML
// ============================================================================
function escapeHTML(value) {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Convert Arabic-Indic digits (٠١٢٣...) to Latin digits (0123...)
function normalizeDigits(value) {
  return String(value || '')
    .replace(/[٠-٩]/g, d => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, d => String(d.charCodeAt(0) - 0x06F0));
}

// Safe localStorage write (handles QuotaExceededError when storage is full, e.g. big uploaded images)
function safeSetItem(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (e) {
    console.error('localStorage write failed for', key, e);
    alert('تعذر الحفظ: مساحة التخزين في المتصفح ممتلئة. استخدم روابط صور (assets/...) بدلاً من رفع صور كبيرة، أو احذف بعض الصور المرفوعة.');
    return false;
  }
}

// ============================================================================
// STORAGE HELPERS (SYNCHRONIZED BETWEEN STOREFRONT, PRODUCT PAGE & ADMIN)
// ============================================================================
const OFFICIAL_WARRANTY_TEXT = 'ضمان معتمد رسمي من شركة المغربي لمدة سنة';
const LEGACY_WARRANTY_VALUES = new Set(['ضمان سنة', 'ضمان سنة كاملة', 'ضمان لمدة سنة كاملة', 'ضمان شامل لمدة سنة كاملة']);

function upgradeProductWarranty(p) {
  if (!p || typeof p !== 'object') return p;
  if (!p.warranty || LEGACY_WARRANTY_VALUES.has(String(p.warranty).trim())) {
    p.warranty = OFFICIAL_WARRANTY_TEXT;
  }
  if (p.specs && typeof p.specs === 'object' && LEGACY_WARRANTY_VALUES.has(String(p.specs['الضمان'] || '').trim())) {
    p.specs['الضمان'] = OFFICIAL_WARRANTY_TEXT;
  }
  return p;
}

function getStoreProducts() {
  // Supabase data is the source of truth: when its products arrived this page
  // load (window.DIAMOND_DB_PRODUCTS), they win over any stale localStorage copy
  // so admin edits (video, specs, features, prices...) show up immediately.
  const dbList = window.DIAMOND_DB_PRODUCTS;
  if (Array.isArray(dbList) && dbList.length > 0) {
    try { localStorage.setItem('diamond_catalog_v4', JSON.stringify(dbList)); } catch (e) {}
    return dbList.map(upgradeProductWarranty);
  }
  const saved = localStorage.getItem('diamond_catalog_v4');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const upgraded = parsed.map(upgradeProductWarranty);
        const existingIds = new Set(upgraded.map(p => p.id));
        DEFAULT_PRODUCTS.forEach(defProd => {
          if (!existingIds.has(defProd.id)) {
            upgraded.push(upgradeProductWarranty({ ...defProd }));
          }
        });
        return upgraded;
      }
    } catch (e) {}
  }
  return DEFAULT_PRODUCTS.map(p => upgradeProductWarranty({ ...p }));
}

function saveStoreProducts(list) {
  return safeSetItem('diamond_catalog_v4', JSON.stringify(list));
}

function getStoreCategories() {
  const saved = localStorage.getItem('diamond_categories_v5');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(c => {
          const def = DEFAULT_CATEGORIES.find(d => d.id === c.id);
          return def ? {
            ...def,
            ...c,
            navTitle: c.navTitle || def.navTitle,
            subItems: Array.isArray(c.subItems) ? c.subItems : def.subItems
          } : c;
        });
      }
    } catch (e) {}
  }
  return DEFAULT_CATEGORIES.map(c => ({
    ...c,
    subItems: Array.isArray(c.subItems) ? c.subItems.map(s => ({ ...s })) : []
  }));
}

function saveStoreCategories(list) {
  return safeSetItem('diamond_categories_v5', JSON.stringify(list));
}

function getHeroSlides() {
  const saved = localStorage.getItem('diamond_hero_v6');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Auto-heal legacy slide 5 if it linked the Stand Mixer image to the Kettle ID (sk-09122)
        parsed.forEach(slide => {
          if (slide && slide.productId === 'sk-09122' && String(slide.image || '').includes('mixer')) {
            slide.productId = 'sk-05022';
            slide.model = 'SK-05022';
            slide.power = '2000W';
            slide.capacity = '8L Stainless';
            slide.price = '4,490 ج.م';
            slide.title = 'عجان سوكاني الاحترافي استانلس 8 لتر موديل SK-05022';
          }
          if (slide && slide.price) {
            slide.price = normalizeDigits(slide.price);
          }
        });
        return parsed;
      }
    } catch (e) {}
  }
  return DEFAULT_HERO_SLIDES;
}

function saveHeroSlides(list) {
  return safeSetItem('diamond_hero_v6', JSON.stringify(list));
}

function getStoreSettings() {
  const saved = localStorage.getItem('diamond_settings_v4');
  if (saved) {
    try {
      const merged = { ...DEFAULT_STORE_SETTINGS, ...JSON.parse(saved) };
      if (!merged.storeName || merged.storeName.trim() === 'diamond store') {
        merged.storeName = 'Diamond Store';
      }
      if (!merged.instapayAccountName || merged.instapayAccountName.trim() === 'diamond store') {
        merged.instapayAccountName = 'Diamond Store';
      }
      if (!merged.warrantyText || LEGACY_WARRANTY_VALUES.has(merged.warrantyText.trim())) {
        merged.warrantyText = OFFICIAL_WARRANTY_TEXT;
      }
      if (!merged.topBarText2 || merged.topBarText2.includes('ضمان لمدة سنة كاملة')) {
        merged.topBarText2 = DEFAULT_STORE_SETTINGS.topBarText2;
      }
      return merged;
    } catch (e) {}
  }
  return { ...DEFAULT_STORE_SETTINGS };
}

function saveStoreSettings(settingsObj) {
  return safeSetItem('diamond_settings_v4', JSON.stringify(settingsObj));
}

// ============================================================================
// INDEXEDDB VIDEO STORAGE (ALLOWS ADMIN TO UPLOAD FULL MP4 VIDEOS OF ANY SIZE)
// ============================================================================
const VIDEO_DB_NAME = 'diamond_videos_db_v1';
const VIDEO_STORE_NAME = 'product_videos';

function openVideoDatabase() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(VIDEO_DB_NAME, 1);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(VIDEO_STORE_NAME)) {
        db.createObjectStore(VIDEO_STORE_NAME);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function saveAdminVideoBlob(videoKey, fileOrBlob) {
  return openVideoDatabase().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VIDEO_STORE_NAME, 'readwrite');
      tx.objectStore(VIDEO_STORE_NAME).put(fileOrBlob, videoKey);
      tx.oncomplete = () => resolve(videoKey);
      tx.onerror = () => reject(tx.error);
    });
  });
}

function getAdminVideoBlob(videoKey) {
  return openVideoDatabase().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VIDEO_STORE_NAME, 'readonly');
      const req = tx.objectStore(VIDEO_STORE_NAME).get(videoKey);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  }).catch(() => null);
}

function deleteAdminVideoBlob(videoKey) {
  return openVideoDatabase().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction(VIDEO_STORE_NAME, 'readwrite');
      tx.objectStore(VIDEO_STORE_NAME).delete(videoKey);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => reject(tx.error);
    });
  }).catch(() => false);
}

// Legacy alias
const DIAMOND_CATEGORIES = DEFAULT_CATEGORIES;
const HERO_SHOWCASE_SLIDES = DEFAULT_HERO_SLIDES;
