import "server-only";

import type { CategoryRow, ProductRow } from "@/shared/db/schema";

/**
 * Demo data source — used when Supabase is not configured (`hasSupabase()`
 * returns false). Lets the shop render real-looking products immediately
 * after `npm run dev`, without any backend setup.
 *
 * Every product / category obeys the *exact* row shape Drizzle expects, so
 * swapping in a real DB later is a no-op for the UI layer.
 *
 * Only legal, original products live here — no resells, no leaked content.
 */

const NOW = new Date("2026-04-26T00:00:00.000Z");

function id(seed: string): string {
  // Deterministic UUID-ish — never used for crypto, just stable identity.
  const padded = seed.padEnd(32, "0").slice(0, 32);
  return `${padded.slice(0, 8)}-${padded.slice(8, 12)}-${padded.slice(12, 16)}-${padded.slice(16, 20)}-${padded.slice(20, 32)}`;
}

// ----- categories -------------------------------------------------------------
const CATEGORIES: CategoryRow[] = [
  {
    id: id("cattemplate0000000000000000"),
    slug: "templates",
    name: { en: "Templates", ar: "قوالب" },
    description: {
      en: "Notion, Word, Figma, and design templates.",
      ar: "قوالب نوشن وورد وفيغما وتصميم.",
    },
    icon: "layout-template",
    sortOrder: 1,
    parentId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id("catspreadsheet0000000000000"),
    slug: "spreadsheets",
    name: { en: "Spreadsheets", ar: "شيتات" },
    description: {
      en: "Excel and Google Sheets — finance, planners, calculators.",
      ar: "إكسل وقوقل شيتس — مالية، مخططات، حواسب.",
    },
    icon: "table",
    sortOrder: 2,
    parentId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id("catprompts0000000000000000"),
    slug: "prompts",
    name: { en: "Prompts", ar: "برومبتات" },
    description: {
      en: "Curated prompt packs for ChatGPT, Claude, Gemini.",
      ar: "حزم برومبتات منسقة لـ ChatGPT و Claude و Gemini.",
    },
    icon: "sparkles",
    sortOrder: 3,
    parentId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id("catebooks00000000000000000"),
    slug: "ebooks",
    name: { en: "E-books", ar: "كتب رقمية" },
    description: {
      en: "Original guides and manuals authored by us.",
      ar: "أدلة ومراجع أصلية من تأليفنا.",
    },
    icon: "book-open",
    sortOrder: 4,
    parentId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id("catcode0000000000000000000"),
    slug: "code",
    name: { en: "Code", ar: "أكواد" },
    description: {
      en: "Snippets, components, and starter projects.",
      ar: "سنبتات ومكونات ومشاريع بداية.",
    },
    icon: "code-2",
    sortOrder: 5,
    parentId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
  {
    id: id("catcourses000000000000000"),
    slug: "courses",
    name: { en: "Mini-courses", ar: "كورسات مصغرة" },
    description: {
      en: "Self-paced courses delivered as digital files.",
      ar: "كورسات ذاتية تُسلَّم كملفات رقمية.",
    },
    icon: "graduation-cap",
    sortOrder: 6,
    parentId: null,
    createdAt: NOW,
    updatedAt: NOW,
  },
];

const CATEGORY_BY_SLUG: Record<string, CategoryRow> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
);

// ----- products ---------------------------------------------------------------
type ProductSeed = Omit<
  ProductRow,
  | "createdAt"
  | "updatedAt"
  | "publishedAt"
  | "searchText"
  | "metadata"
  | "ratingAvg"
> & {
  ratingAvg: string;
  daysOld: number;
};

const SEEDS: ProductSeed[] = [
  {
    id: id("prdnotion2026000000000000"),
    slug: "notion-second-brain-2026",
    categoryId: CATEGORY_BY_SLUG.templates.id,
    type: "notion",
    status: "published",
    title: {
      en: "Notion Second Brain 2026",
      ar: "العقل الثاني — قالب نوشن 2026",
    },
    descriptionShort: {
      en: "Capture, organise, and act on every note in one Notion workspace.",
      ar: "اجمع ونظّم ونفّذ كل ملاحظة في مساحة عمل واحدة في نوشن.",
    },
    descriptionLong: {
      en: "A complete PARA-method Notion system: 6 dashboards, 24 templates, weekly review automations, and a daily journal. Zero plugins, zero formulas to debug — just duplicate and start.",
      ar: "نظام نوشن كامل بطريقة PARA: 6 لوحات، 24 قالباً، أتمتة مراجعة أسبوعية، ويوميات يومية. بدون إضافات أو معادلات معقدة — انسخ وابدأ.",
    },
    bullets: [
      { en: "6 connected dashboards", ar: "6 لوحات مترابطة" },
      { en: "24 ready-to-use templates", ar: "24 قالباً جاهزاً" },
      { en: "Weekly review automation", ar: "أتمتة مراجعة أسبوعية" },
    ],
    thumbnailUrl: null,
    galleryUrls: [],
    priceCents: 1900,
    compareAtCents: 3900,
    currency: "USD",
    contentLanguages: ["en", "ar"],
    licenseType: "personal_use",
    downloadLimit: 5,
    isFeatured: true,
    salesCount: 412,
    ratingAvg: "4.80",
    ratingCount: 89,
    ratingAvgRaw: undefined as never,
    daysOld: 7,
  } as ProductSeed,
  {
    id: id("prdfinmodel000000000000000"),
    slug: "saas-financial-model-v3",
    categoryId: CATEGORY_BY_SLUG.spreadsheets.id,
    type: "excel",
    status: "published",
    title: {
      en: "SaaS Financial Model v3",
      ar: "النموذج المالي لشركات SaaS — الإصدار الثالث",
    },
    descriptionShort: {
      en: "5-year forecast with cohort retention, ARR, burn, and runway.",
      ar: "توقعات 5 سنوات مع احتفاظ كوهورت، ARR، حرق نقدي، ومدى زمني.",
    },
    descriptionLong: {
      en: "Investor-ready model used to raise 12 seed rounds. Inputs sheet, monthly engine, cohort tab, and a one-page summary. Reviewed annually by a CFO.",
      ar: "نموذج جاهز للمستثمرين استُخدم في 12 جولة استثمار. ورقة مدخلات ومحرك شهري ولسان كوهورت وملخص في صفحة. يُراجَع سنوياً من قبل مدير مالي.",
    },
    bullets: [
      { en: "5-year monthly engine", ar: "محرك شهري لـ 5 سنوات" },
      { en: "Cohort retention sheet", ar: "ورقة احتفاظ كوهورت" },
      { en: "Annual CFO review", ar: "مراجعة سنوية من مدير مالي" },
    ],
    thumbnailUrl: null,
    galleryUrls: [],
    priceCents: 4900,
    compareAtCents: 7900,
    currency: "USD",
    contentLanguages: ["en"],
    licenseType: "business_use",
    downloadLimit: 10,
    isFeatured: true,
    salesCount: 218,
    ratingAvg: "4.90",
    ratingCount: 47,
    daysOld: 21,
  } as ProductSeed,
  {
    id: id("prdpromptsmkt0000000000000"),
    slug: "marketing-prompt-pack-300",
    categoryId: CATEGORY_BY_SLUG.prompts.id,
    type: "prompt_pack",
    status: "published",
    title: {
      en: "300 Marketing Prompts — ChatGPT & Claude",
      ar: "300 برومبت تسويقي — ChatGPT و Claude",
    },
    descriptionShort: {
      en: "Original prompts for SEO, ads, emails, and content calendars.",
      ar: "برومبتات أصلية لـ SEO، الإعلانات، الإيميلات، وجداول المحتوى.",
    },
    descriptionLong: {
      en: "300 prompts across 12 marketing surfaces, organised by funnel stage. Each prompt includes the role, context, format, and example output. Updated quarterly.",
      ar: "300 برومبت عبر 12 سطحاً تسويقياً، مرتبة بمراحل القمع. كل برومبت يضم الدور والسياق والشكل ومثال إخراج. تحديث ربع سنوي.",
    },
    bullets: [
      { en: "12 funnel stages", ar: "12 مرحلة في قمع التسويق" },
      { en: "Role + context + format", ar: "دور + سياق + شكل" },
      { en: "Quarterly updates", ar: "تحديث ربع سنوي" },
    ],
    thumbnailUrl: null,
    galleryUrls: [],
    priceCents: 1500,
    compareAtCents: null,
    currency: "USD",
    contentLanguages: ["en", "ar"],
    licenseType: "commercial_use",
    downloadLimit: 5,
    isFeatured: true,
    salesCount: 631,
    ratingAvg: "4.70",
    ratingCount: 142,
    daysOld: 3,
  } as ProductSeed,
  {
    id: id("prdebookwriter00000000000"),
    slug: "freelance-writers-handbook",
    categoryId: CATEGORY_BY_SLUG.ebooks.id,
    type: "pdf",
    status: "published",
    title: {
      en: "The Freelance Writer's Handbook",
      ar: "دليل الكاتب المستقل",
    },
    descriptionShort: {
      en: "From first $100 to first $10k/month. Original guide.",
      ar: "من أول 100 دولار إلى أول 10 آلاف شهرياً. دليل أصلي.",
    },
    descriptionLong: {
      en: "184 pages, 14 chapters, 3 case studies. Pricing, pitching, contracts, and the systems that took my freelance income from zero to consistent $10k months.",
      ar: "184 صفحة، 14 فصلاً، 3 دراسات حالة. التسعير، العرض، العقود، والأنظمة التي أوصلت دخلي المستقل من الصفر إلى 10 آلاف شهرياً ثابتة.",
    },
    bullets: [
      { en: "184 pages, 14 chapters", ar: "184 صفحة، 14 فصلاً" },
      { en: "3 detailed case studies", ar: "3 دراسات حالة مفصلة" },
      { en: "Original — written by us", ar: "أصلي — من تأليفنا" },
    ],
    thumbnailUrl: null,
    galleryUrls: [],
    priceCents: 2400,
    compareAtCents: 3900,
    currency: "USD",
    contentLanguages: ["en"],
    licenseType: "personal_use",
    downloadLimit: 3,
    isFeatured: false,
    salesCount: 156,
    ratingAvg: "4.60",
    ratingCount: 31,
    daysOld: 45,
  } as ProductSeed,
  {
    id: id("prdfigmacomp0000000000000"),
    slug: "figma-saas-ui-kit",
    categoryId: CATEGORY_BY_SLUG.templates.id,
    type: "template",
    status: "published",
    title: {
      en: "Figma SaaS UI Kit",
      ar: "Figma SaaS UI Kit",
    },
    descriptionShort: {
      en: "120 components, 24 sections, 6 ready dashboards.",
      ar: "120 مكوّناً، 24 قسماً، 6 لوحات جاهزة.",
    },
    descriptionLong: {
      en: "Auto-layouted, variant-driven, light + dark. Every component is documented and uses Figma variables, so re-skinning the whole kit is a five-minute job.",
      ar: "Auto-layout، Variants، فاتح وداكن. كل مكوّن موثّق ويستخدم Figma Variables، فإعادة التصميم الكامل عملية 5 دقائق.",
    },
    bullets: [
      { en: "120 components", ar: "120 مكوّناً" },
      { en: "Light + dark variants", ar: "فاتح وداكن" },
      { en: "Figma variables", ar: "Figma Variables" },
    ],
    thumbnailUrl: null,
    galleryUrls: [],
    priceCents: 3900,
    compareAtCents: null,
    currency: "USD",
    contentLanguages: ["en"],
    licenseType: "commercial_use",
    downloadLimit: 5,
    isFeatured: false,
    salesCount: 98,
    ratingAvg: "4.75",
    ratingCount: 22,
    daysOld: 14,
  } as ProductSeed,
  {
    id: id("prdpersonalfin000000000000"),
    slug: "personal-finance-tracker-2026",
    categoryId: CATEGORY_BY_SLUG.spreadsheets.id,
    type: "excel",
    status: "published",
    title: {
      en: "Personal Finance Tracker 2026",
      ar: "متتبع الميزانية الشخصية 2026",
    },
    descriptionShort: {
      en: "Budget, savings, and net-worth tracker. Excel + Sheets.",
      ar: "ميزانية ومدخرات وصافي ثروة. إكسل + شيتس.",
    },
    descriptionLong: {
      en: "Single-file tracker with auto-categorised transactions, monthly P&L, and a goal/timeline view. Comes in Excel and Google Sheets, both fully formula-driven.",
      ar: "ملف واحد لتتبع المعاملات بتصنيف تلقائي، مع P&L شهري وعرض أهداف وجدول زمني. متوفر في إكسل وقوقل شيتس بمعادلات كاملة.",
    },
    bullets: [
      { en: "Auto-categorised transactions", ar: "تصنيف تلقائي للمعاملات" },
      { en: "Monthly P&L view", ar: "عرض P&L شهري" },
      { en: "Excel + Google Sheets", ar: "إكسل + قوقل شيتس" },
    ],
    thumbnailUrl: null,
    galleryUrls: [],
    priceCents: 0,
    compareAtCents: null,
    currency: "USD",
    contentLanguages: ["en", "ar"],
    licenseType: "personal_use",
    downloadLimit: 5,
    isFeatured: false,
    salesCount: 1024,
    ratingAvg: "4.55",
    ratingCount: 203,
    daysOld: 2,
  } as ProductSeed,
  {
    id: id("prdnextstarter0000000000000"),
    slug: "nextjs-saas-starter",
    categoryId: CATEGORY_BY_SLUG.code.id,
    type: "code",
    status: "published",
    title: {
      en: "Next.js SaaS Starter",
      ar: "بداية SaaS بـ Next.js",
    },
    descriptionShort: {
      en: "Auth, billing, teams, RLS — production-ready.",
      ar: "تصديق، فوترة، فِرَق، RLS — جاهز للإنتاج.",
    },
    descriptionLong: {
      en: "Next.js 14, TypeScript strict, Supabase auth + RLS, Stripe billing with team plans, and email via Resend. MIT-licensed for our customers.",
      ar: "Next.js 14، TypeScript صارم، Supabase تصديق + RLS، Stripe فوترة بخطط فِرَق، وإيميل عبر Resend. ترخيص MIT لعملائنا.",
    },
    bullets: [
      { en: "Next.js 14 + TS strict", ar: "Next.js 14 + TS صارم" },
      { en: "Supabase auth + RLS", ar: "Supabase تصديق + RLS" },
      { en: "Stripe team billing", ar: "Stripe فوترة فِرَق" },
    ],
    thumbnailUrl: null,
    galleryUrls: [],
    priceCents: 7900,
    compareAtCents: 12900,
    currency: "USD",
    contentLanguages: ["en"],
    licenseType: "commercial_use",
    downloadLimit: 5,
    isFeatured: true,
    salesCount: 73,
    ratingAvg: "4.95",
    ratingCount: 17,
    daysOld: 5,
  } as ProductSeed,
  {
    id: id("prdsoldigital000000000000"),
    slug: "selling-digital-products-mini-course",
    categoryId: CATEGORY_BY_SLUG.courses.id,
    type: "course",
    status: "published",
    title: {
      en: "Selling Digital Products — Mini-course",
      ar: "بيع المنتجات الرقمية — كورس مصغر",
    },
    descriptionShort: {
      en: "Pick a niche, ship a product, get your first 100 sales.",
      ar: "اختر نيتش، اطرح منتجاً، احصل على أول 100 عملية بيع.",
    },
    descriptionLong: {
      en: "5 hours of video + workbooks + email scripts. We walk you through niche selection, MVP product creation, pricing, launch, and the first 90 days of marketing.",
      ar: "5 ساعات فيديو + ملفات عمل + سكربتات إيميل. نشرح اختيار النيتش، تجهيز MVP، التسعير، الإطلاق، أول 90 يوماً من التسويق.",
    },
    bullets: [
      { en: "5 hours of video", ar: "5 ساعات فيديو" },
      { en: "Workbooks + scripts", ar: "ملفات عمل + سكربتات" },
      { en: "First-90-days plan", ar: "خطة أول 90 يوماً" },
    ],
    thumbnailUrl: null,
    galleryUrls: [],
    priceCents: 4900,
    compareAtCents: null,
    currency: "USD",
    contentLanguages: ["en", "ar"],
    licenseType: "personal_use",
    downloadLimit: 3,
    isFeatured: false,
    salesCount: 67,
    ratingAvg: "4.65",
    ratingCount: 14,
    daysOld: 30,
  } as ProductSeed,
  {
    id: id("prdarabicwriter000000000000"),
    slug: "arabic-content-prompt-pack",
    categoryId: CATEGORY_BY_SLUG.prompts.id,
    type: "prompt_pack",
    status: "published",
    title: {
      en: "Arabic Content Prompt Pack",
      ar: "حزمة برومبتات للمحتوى العربي",
    },
    descriptionShort: {
      en: "120 prompts that produce native-sounding Arabic copy.",
      ar: "120 برومبت تخرج نصاً عربياً يبدو من كاتب عربي أصلي.",
    },
    descriptionLong: {
      en: "Built and tested by native Arabic copywriters. Covers ads, threads, blog posts, product descriptions, and email campaigns. Includes dialect-aware variants.",
      ar: "صنعها واختبرها كتّاب عرب أصليون. تغطي إعلانات، ثريدز، تدوينات، أوصاف منتجات، حملات إيميل. تشمل خيارات بحسب اللهجة.",
    },
    bullets: [
      { en: "Dialect-aware", ar: "متوافقة مع اللهجات" },
      { en: "Tested by native writers", ar: "مختبرة من كتّاب عرب" },
      { en: "5 marketing surfaces", ar: "5 أسطح تسويقية" },
    ],
    thumbnailUrl: null,
    galleryUrls: [],
    priceCents: 1900,
    compareAtCents: 2900,
    currency: "USD",
    contentLanguages: ["ar"],
    licenseType: "commercial_use",
    downloadLimit: 5,
    isFeatured: true,
    salesCount: 184,
    ratingAvg: "4.80",
    ratingCount: 34,
    daysOld: 10,
  } as ProductSeed,
  {
    id: id("prdfreelancecontract00000000"),
    slug: "freelance-contracts-pack",
    categoryId: CATEGORY_BY_SLUG.templates.id,
    type: "word",
    status: "published",
    title: {
      en: "Freelance Contracts Pack",
      ar: "حزمة عقود الفريلانس",
    },
    descriptionShort: {
      en: "8 lawyer-reviewed Word contracts for solo operators.",
      ar: "8 عقود وورد مراجعة من محامي للمستقلين.",
    },
    descriptionLong: {
      en: "MSA, SOW, NDA, IP assignment, retainer, late-payment addendum, kill fee, and termination — drafted in plain English and reviewed by a US contract lawyer.",
      ar: "MSA، SOW، NDA، تنازل ملكية فكرية، شهري ثابت، ملحق تأخر دفع، رسم إنهاء، فسخ — بصياغة بسيطة ومراجعة من محامي عقود أمريكي.",
    },
    bullets: [
      { en: "8 lawyer-reviewed contracts", ar: "8 عقود مراجعة قانونياً" },
      { en: "Editable Word files", ar: "ملفات وورد قابلة للتعديل" },
      { en: "Plain-English wording", ar: "صياغة واضحة" },
    ],
    thumbnailUrl: null,
    galleryUrls: [],
    priceCents: 2900,
    compareAtCents: null,
    currency: "USD",
    contentLanguages: ["en"],
    licenseType: "business_use",
    downloadLimit: 5,
    isFeatured: false,
    salesCount: 89,
    ratingAvg: "4.70",
    ratingCount: 19,
    daysOld: 60,
  } as ProductSeed,
  {
    id: id("prdsocialcal000000000000"),
    slug: "social-media-content-calendar",
    categoryId: CATEGORY_BY_SLUG.spreadsheets.id,
    type: "excel",
    status: "published",
    title: {
      en: "Social Media Content Calendar",
      ar: "تقويم محتوى السوشل ميديا",
    },
    descriptionShort: {
      en: "12-month editorial calendar with post-type rotation.",
      ar: "تقويم تحريري لـ 12 شهراً بدورة أنواع منشورات.",
    },
    descriptionLong: {
      en: "Pre-filled with hooks, formats, and a balanced posting cadence across LinkedIn, X, Instagram, and TikTok. Edit one cell to retarget the whole calendar.",
      ar: "محشو سلفاً بـ hooks وأشكال وتوازن نشر عبر LinkedIn و X و Instagram و TikTok. عدّل خلية واحدة لإعادة توجيه التقويم بالكامل.",
    },
    bullets: [
      { en: "12 months pre-planned", ar: "12 شهراً مخطّطاً" },
      { en: "4 platforms covered", ar: "4 منصات" },
      { en: "1-cell retarget", ar: "إعادة توجيه بخلية واحدة" },
    ],
    thumbnailUrl: null,
    galleryUrls: [],
    priceCents: 1200,
    compareAtCents: 1900,
    currency: "USD",
    contentLanguages: ["en", "ar"],
    licenseType: "personal_use",
    downloadLimit: 5,
    isFeatured: false,
    salesCount: 144,
    ratingAvg: "4.50",
    ratingCount: 28,
    daysOld: 18,
  } as ProductSeed,
  {
    id: id("prdaiprompt7day0000000000"),
    slug: "ai-productivity-7-day-bundle",
    categoryId: CATEGORY_BY_SLUG.prompts.id,
    type: "bundle",
    status: "published",
    title: {
      en: "AI Productivity — 7-day Bundle",
      ar: "إنتاجية بالذكاء — حزمة 7 أيام",
    },
    descriptionShort: {
      en: "7 prompt packs + 1 Notion dashboard. Daily delivery.",
      ar: "7 حزم برومبتات + لوحة نوشن. تسليم يومي.",
    },
    descriptionLong: {
      en: "A bundle that emails you one new prompt pack a day for a week, plus a Notion dashboard to track wins. Best when paired with the Second Brain template.",
      ar: "حزمة تصلك بحزمة برومبتات جديدة كل يوم لمدة أسبوع، مع لوحة نوشن لتتبع المكاسب. الأفضل مع قالب العقل الثاني.",
    },
    bullets: [
      { en: "7 prompt packs", ar: "7 حزم برومبتات" },
      { en: "Notion dashboard", ar: "لوحة نوشن" },
      { en: "Daily email delivery", ar: "تسليم يومي بالإيميل" },
    ],
    thumbnailUrl: null,
    galleryUrls: [],
    priceCents: 3900,
    compareAtCents: 6900,
    currency: "USD",
    contentLanguages: ["en"],
    licenseType: "personal_use",
    downloadLimit: 5,
    isFeatured: true,
    salesCount: 51,
    ratingAvg: "4.85",
    ratingCount: 11,
    daysOld: 1,
  } as ProductSeed,
];

function toRow(seed: ProductSeed): ProductRow {
  const created = new Date(NOW.getTime() - seed.daysOld * 86_400_000);
  const { daysOld: _d, ...rest } = seed;
  void _d;
  return {
    ...rest,
    searchText: null,
    metadata: {},
    createdAt: created,
    updatedAt: created,
    publishedAt: created,
  } as ProductRow;
}

const PRODUCTS: ProductRow[] = SEEDS.map(toRow);
const PRODUCT_BY_SLUG: Record<string, ProductRow> = Object.fromEntries(
  PRODUCTS.map((p) => [p.slug, p]),
);

// ----- public read API --------------------------------------------------------
export interface DemoListQuery {
  q?: string;
  categorySlug?: string;
  type?: ProductRow["type"];
  minPriceCents?: number;
  maxPriceCents?: number;
  minRating?: number;
  contentLanguage?: string;
  isFeatured?: boolean;
  sort: "best_selling" | "newest" | "price_asc" | "price_desc" | "rating";
  page: number;
  perPage: number;
}

export const demoSource = {
  categories(): CategoryRow[] {
    return [...CATEGORIES].sort((a, b) => a.sortOrder - b.sortOrder);
  },
  categoryBySlug(slug: string): CategoryRow | null {
    return CATEGORY_BY_SLUG[slug] ?? null;
  },

  productsList(q: DemoListQuery): { items: ProductRow[]; total: number } {
    let items = PRODUCTS.filter((p) => p.status === "published");

    if (q.categorySlug) {
      const cat = CATEGORY_BY_SLUG[q.categorySlug];
      if (cat) items = items.filter((p) => p.categoryId === cat.id);
      else items = [];
    }
    if (q.type) items = items.filter((p) => p.type === q.type);
    if (q.isFeatured) items = items.filter((p) => p.isFeatured);
    if (typeof q.minPriceCents === "number")
      items = items.filter((p) => p.priceCents >= q.minPriceCents!);
    if (typeof q.maxPriceCents === "number")
      items = items.filter((p) => p.priceCents <= q.maxPriceCents!);
    if (typeof q.minRating === "number")
      items = items.filter((p) => Number(p.ratingAvg ?? 0) >= q.minRating!);
    if (q.contentLanguage)
      items = items.filter((p) =>
        (p.contentLanguages as string[] | null)?.includes(q.contentLanguage!),
      );

    if (q.q) {
      const needle = q.q.toLowerCase();
      items = items.filter((p) => {
        const title = Object.values(p.title as Record<string, string>).join(" ");
        const desc = Object.values(
          (p.descriptionShort ?? {}) as Record<string, string>,
        ).join(" ");
        return (
          title.toLowerCase().includes(needle) ||
          desc.toLowerCase().includes(needle) ||
          p.slug.includes(needle)
        );
      });
    }

    items = sortProducts(items, q.sort);
    const total = items.length;
    const from = (q.page - 1) * q.perPage;
    const to = from + q.perPage;
    return { items: items.slice(from, to), total };
  },

  productBySlug(slug: string): ProductRow | null {
    return PRODUCT_BY_SLUG[slug] ?? null;
  },

  productsFeatured(limit = 6): ProductRow[] {
    return sortProducts(
      PRODUCTS.filter((p) => p.status === "published" && p.isFeatured),
      "best_selling",
    ).slice(0, limit);
  },

  productsRelated(slug: string, limit = 6): ProductRow[] {
    const target = PRODUCT_BY_SLUG[slug];
    if (!target) return [];
    return sortProducts(
      PRODUCTS.filter(
        (p) =>
          p.status === "published" &&
          p.slug !== slug &&
          (p.categoryId === target.categoryId || p.type === target.type),
      ),
      "best_selling",
    ).slice(0, limit);
  },

  publishedSlugs(): string[] {
    return PRODUCTS.filter((p) => p.status === "published").map((p) => p.slug);
  },

  categorySlugs(): string[] {
    return CATEGORIES.map((c) => c.slug);
  },

  productsByIds(ids: string[]): ProductRow[] {
    const set = new Set(ids);
    return PRODUCTS.filter((p) => set.has(p.id));
  },
};

function sortProducts(
  items: ProductRow[],
  sort: DemoListQuery["sort"],
): ProductRow[] {
  const list = [...items];
  switch (sort) {
    case "newest":
      return list.sort(
        (a, b) =>
          (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0),
      );
    case "price_asc":
      return list.sort((a, b) => a.priceCents - b.priceCents);
    case "price_desc":
      return list.sort((a, b) => b.priceCents - a.priceCents);
    case "rating":
      return list.sort(
        (a, b) => Number(b.ratingAvg ?? 0) - Number(a.ratingAvg ?? 0),
      );
    case "best_selling":
    default:
      return list.sort((a, b) => b.salesCount - a.salesCount);
  }
}
