import { photos } from "@/lib/site";
import type { CertificationRow, PartnerRow, SiteSettings, TeamMemberRow, TestimonialRow } from "@/lib/types";

// Starter content for the CMS. It seeds Supabase (npm run seed:generate) and is used as-is when
// Supabase isn't configured. Rows with is_sample: true are placeholders — every person and
// company in them is invented — and are listed on the admin dashboard until replaced.

export const sampleTestimonials: TestimonialRow[] = [
  {
    id: "sample-testimonial-1",
    quote:
      "Every container of Robusta S18 has matched the pre-shipment sample. That consistency is exactly what our espresso blends need.",
    name: "Lena Hoffmann",
    role: "Head of Green Coffee",
    company: "Kestrel Roastery",
    country: "Germany",
    flag: "🇩🇪",
    product_slug: "robusta-s18-clean",
    since: 2021,
    rating: 5,
    image: photos.greenBeans,
    logo: null,
    translations: {
      ru: {
        quote:
          "Каждый контейнер робусты S18 полностью соответствовал предотгрузочному образцу. Именно такая стабильность нужна нашим эспрессо-блендам.",
        role: "Руководитель закупок зелёного кофе",
        country: "Германия",
      },
      ar: {
        quote: "طابقت كل حاوية من روبوستا S18 عيّنة ما قبل الشحن. هذا الثبات هو بالضبط ما تحتاجه خلطات الإسبريسو لدينا.",
        role: "رئيسة مشتريات البن الأخضر",
        country: "ألمانيا",
      },
    },
    is_sample: true,
    published: true,
    sort_order: 10,
  },
  {
    id: "sample-testimonial-2",
    quote:
      "Clear specs, quick documents and honest updates when vessels were delayed. Switching our WW320 supply to Cao Gia was easy.",
    name: "Marcus Reid",
    role: "Procurement Manager",
    company: "Mirabel Foods",
    country: "United States",
    flag: "🇺🇸",
    product_slug: "cashew-ww320",
    since: 2022,
    rating: 5,
    image: photos.cashewPile,
    logo: null,
    translations: {
      ru: {
        quote:
          "Понятные спецификации, быстрые документы и честная информация о задержках судов. Перевести закупки WW320 на Cao Gia было просто.",
        role: "Менеджер по закупкам",
        country: "США",
      },
      ar: {
        quote: "مواصفات واضحة ومستندات سريعة وتحديثات صادقة عند تأخر السفن. كان نقل توريد WW320 إلى كاو جيا أمرًا سهلًا.",
        role: "مدير المشتريات",
        country: "الولايات المتحدة",
      },
    },
    is_sample: true,
    published: true,
    sort_order: 20,
  },
  {
    id: "sample-testimonial-3",
    quote:
      "Their Cau Dat Arabica surprised our customers. The team helped us plan a forward contract for the whole season.",
    name: "Aiko Tanaka",
    role: "Founder",
    company: "Sable Street Coffee",
    country: "Japan",
    flag: "🇯🇵",
    product_slug: "arabica-s18-clean",
    since: 2020,
    rating: 5,
    image: photos.cherriesRipe,
    logo: null,
    translations: {
      ru: {
        quote: "Арабика из Каудат удивила наших клиентов. Команда помогла спланировать форвардный контракт на весь сезон.",
        role: "Основатель",
        country: "Япония",
      },
      ar: {
        quote: "فاجأت أرابيكا كاو دات عملاءنا. وساعدنا الفريق في التخطيط لعقد آجل يغطي الموسم كاملًا.",
        role: "المؤسسة",
        country: "اليابان",
      },
    },
    is_sample: true,
    published: true,
    sort_order: 30,
  },
  {
    id: "sample-testimonial-4",
    quote:
      "Private-label roasted coffee delivered on schedule with our branding. The samples process was fast and professional.",
    name: "Omar Haddad",
    role: "Category Buyer",
    company: "Lumen Nut Co.",
    country: "United Arab Emirates",
    flag: "🇦🇪",
    product_slug: null,
    since: 2023,
    rating: 5,
    image: photos.roastedBeans,
    logo: null,
    translations: {
      ru: {
        quote: "Обжаренный кофе под нашей маркой пришёл точно в срок. Работа с образцами — быстрая и профессиональная.",
        role: "Категорийный менеджер",
        country: "ОАЭ",
      },
      ar: {
        quote: "وصلت القهوة المحمّصة بعلامتنا الخاصة في موعدها. وكانت إجراءات العيّنات سريعة واحترافية.",
        role: "مسؤول مشتريات الفئة",
        country: "الإمارات العربية المتحدة",
      },
    },
    is_sample: true,
    published: true,
    sort_order: 40,
  },
];

const partner = (id: number, name: string, country: string, kind: PartnerRow["kind"], logo: string | null = null): PartnerRow => ({
  id: `sample-partner-${id}`,
  name,
  logo,
  country,
  style: "sans",
  kind,
  url: null,
  is_sample: false,
  published: true,
  sort_order: id * 10,
});

// The bank and shipping lines Cao Gia actually works with; logos live in /public/partners.
// Maersk shows as a wordmark until the official container-line logo is added.
export const samplePartners: PartnerRow[] = [
  partner(1, "HSBC", "🇬🇧", "bank", "/partners/hsbc.png"),
  partner(2, "MAERSK", "🇩🇰", "shipping"),
  partner(3, "CMA CGM", "🇫🇷", "shipping", "/partners/cma-cgm.png"),
  partner(4, "COSCO SHIPPING", "🇨🇳", "shipping", "/partners/cosco-shipping.png"),
  partner(5, "EVERGREEN", "🇹🇼", "shipping", "/partners/evergreen.png"),
  partner(6, "ONE", "🇯🇵", "shipping", "/partners/one.png"),
];

const cert = (
  id: number,
  name: string,
  issuer: string,
  scope: string,
  ru: { name?: string; scope: string },
  ar: { name?: string; scope: string },
): CertificationRow => ({
  id: `sample-certification-${id}`,
  name,
  issuer,
  year: null,
  scope,
  logo: null,
  file: null,
  translations: { ru, ar },
  is_sample: false,
  published: true,
  sort_order: id * 10,
});

// Held by Cao Gia's partner processing facility (confirmed by Cao Gia, October 2026). Add the
// certificate number, year and PDF in the admin once to hand.
export const sampleCertifications: CertificationRow[] = [
  cert(1, "HACCP", "Food safety", "Held by our partner processing facility",
    { scope: "Сертификат перерабатывающего предприятия-партнёра" },
    { scope: "شهادة لدى منشأة المعالجة الشريكة لنا" }),
  cert(2, "ISO 22000", "Food safety management", "Held by our partner processing facility",
    { scope: "Сертификат перерабатывающего предприятия-партнёра" },
    { scope: "شهادة لدى منشأة المعالجة الشريكة لنا" }),
  cert(3, "Halal", "Halal certification", "Held by our partner processing facility",
    { name: "Халяль", scope: "Сертификат перерабатывающего предприятия-партнёра" },
    { name: "حلال", scope: "شهادة لدى منشأة المعالجة الشريكة لنا" }),
  cert(4, "FDA Registered", "U.S. Food & Drug Administration", "Our partner processing facility is registered with the U.S. FDA",
    { name: "Регистрация FDA", scope: "Предприятие-партнёр зарегистрировано в FDA США" },
    { name: "مسجّل لدى FDA", scope: "منشأة المعالجة الشريكة مسجّلة لدى إدارة الغذاء والدواء الأمريكية" }),
];

export const sampleTeam: TeamMemberRow[] = [
  {
    id: "sample-ceo",
    name: "Cao Minh Duc",
    role: "Founder & CEO",
    bio: [
      "Leads Cao Gia's export business, from building relationships with partner farms to agreeing specifications and delivery programs with buyers overseas.",
      "Sets the company's standard: specifications written down, samples approved before shipment and every container documented from farm to port.",
    ],
    quote: "Every container carries our name. We would rather say no to an order than ship a lot we wouldn't buy ourselves.",
    photo: null,
    email: "caogiaxk2022@gmail.com",
    whatsapp: "+84 867 282 139",
    is_ceo: true,
    translations: {
      ru: {
        role: "Основатель и генеральный директор",
        bio: [
          "Руководит экспортным направлением Cao Gia — от выстраивания отношений с фермами-партнёрами до согласования спецификаций и программ поставок с зарубежными покупателями.",
          "Задаёт стандарт компании: спецификации фиксируются письменно, образцы одобряются до отгрузки, а каждый контейнер документируется от фермы до порта.",
        ],
        quote: "Каждый контейнер несёт наше имя. Мы скорее откажемся от заказа, чем отгрузим партию, которую не купили бы сами.",
      },
      ar: {
        role: "المؤسس والرئيس التنفيذي",
        bio: [
          "يقود أعمال التصدير في كاو جيا، من بناء العلاقات مع المزارع الشريكة إلى الاتفاق على المواصفات وبرامج التوريد مع المشترين في الخارج.",
          "يضع معيار الشركة: مواصفات مكتوبة، وعيّنات تُعتمد قبل الشحن، وتوثيق كل حاوية من المزرعة إلى الميناء.",
        ],
        quote: "كل حاوية تحمل اسمنا. نفضّل رفض طلب على شحن دفعة لا نشتريها بأنفسنا.",
      },
    },
    is_sample: true,
    published: true,
    sort_order: 10,
  },
  {
    id: "team-david-cao",
    name: "David Cao",
    role: "Director of Marketing",
    bio: [],
    quote: "",
    photo: null,
    email: "davidcaocg@gmail.com",
    whatsapp: "+84 867 282 139",
    is_ceo: false,
    translations: {
      ru: { role: "Директор по маркетингу" },
      ar: { role: "مدير التسويق" },
    },
    is_sample: false,
    published: true,
    sort_order: 20,
  },
];

export const defaultSettings: SiteSettings = {
  company: {
    legalName: "Cao Gia Advisory & Construction Co., Ltd.",
    legalNameVi: "Công ty TNHH Tư vấn & Thi công Cao Gia",
    enterpriseCode: "0108270629",
    foundingYear: 2018,
  },
  contact: {
    email: "caogiaxk2022@gmail.com",
    phone: "+84 867 282 139",
    whatsapp: "+84 867 282 139",
    address: {
      street: "No. 13, Alley 20, Lane 307 Nguyen Xien Street",
      locality: "Khuong Dinh Ward, Hanoi",
      country: "Vietnam",
      countryCode: "VN",
    },
  },
  socials: { linkedin: "", facebook: "", youtube: "" },
  memberships: [],
  stats: [
    { value: "2018", label: { en: "Established", ru: "Год основания", ar: "سنة التأسيس" } },
    { value: "34", label: { en: "Export grades in our catalog", ru: "Экспортных позиций в каталоге", ar: "درجة تصدير في كتالوجنا" } },
    { value: "5", label: { en: "Sourcing provinces", ru: "Провинций закупок", ar: "مقاطعات توريد" } },
    { value: "24h", label: { en: "Reply time on inquiries", ru: "Время ответа на запрос", ar: "زمن الرد على الاستفسارات" } },
  ],
  seo: {
    indexing: true,
    ogImage: "",
    verification: { google: "", bing: "", yandex: "" },
    pages: {},
  },
  analytics: { ga4: "", gtm: "GTM-WMBX4TT9", metaPixel: "", yandexMetrica: "", clarity: "", cloudflare: "" },
  notifications: {
    telegram: {
      enabled: false,
      chatId: "",
      topics: {
        inquiry: { enabled: true, threadId: "" },
        inquiryCoffee: { enabled: false, threadId: "" },
        inquiryCashew: { enabled: false, threadId: "" },
        pipeline: { enabled: true, threadId: "" },
        content: { enabled: false, threadId: "" },
        system: { enabled: true, threadId: "" },
      },
    },
  },
};
