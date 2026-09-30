export type Category = "coffee" | "cashew";

export type ProductSpec = { label: string; value: string };

export type Product = {
  slug: string;
  name: string;
  category: Category;
  grade: string;
  summary: string;
  description: string;
  /** Cloudinary public ID or absolute URL */
  image: string;
  gallery: string[];
  origin: string;
  specs: ProductSpec[];
  packaging: string;
  moq: string;
  featured: boolean;
  /** Search result title/description; blank falls back to the name and summary. */
  seo_title?: string;
  seo_description?: string;
};

/** Localized overrides for a product; any field left out falls back to English. */
export type ProductText = Partial<
  Pick<
    Product,
    "name" | "grade" | "summary" | "description" | "origin" | "packaging" | "moq" | "specs" | "seo_title" | "seo_description"
  >
>;
export type ProductTranslations = Partial<Record<"ru" | "ar", ProductText>>;


// ── CMS content ────────────────────────────────────────────────────────────
export type Translations<T> = Partial<Record<"ru" | "ar", Partial<T>>>;

type Row = { id: string; is_sample: boolean; published: boolean; sort_order: number };

export type TestimonialRow = Row & {
  quote: string;
  name: string;
  role: string;
  company: string;
  country: string;
  flag: string;
  product_slug: string | null;
  since: number | null;
  rating: number;
  image: string | null;
  logo: string | null;
  translations: Translations<{ quote: string; role: string; country: string }>;
};

export type PartnerRow = Row & {
  name: string;
  logo: string | null;
  country: string;
  style: "serif" | "sans" | "mono" | "script";
  url: string | null;
};

export type CertificationRow = Row & {
  name: string;
  issuer: string;
  year: number | null;
  scope: string;
  logo: string | null;
  file: string | null;
  translations: Translations<{ name: string; scope: string }>;
};

export type TeamMemberRow = Row & {
  name: string;
  role: string;
  bio: string[];
  quote: string;
  photo: string | null;
  email: string;
  whatsapp: string;
  is_ceo: boolean;
  translations: Translations<{ role: string; bio: string[]; quote: string }>;
};

export type PostCategory = "guide" | "market" | "news";

export type PostRow = Row & {
  slug: string;
  title: string;
  excerpt: string;
  /** Light Markdown, rendered by components/article-body.tsx */
  body: string;
  cover: string | null;
  category: PostCategory;
  /** ISO date, e.g. "2026-09-30" */
  published_at: string;
  product_slugs: string[];
  translations: Translations<{ title: string; excerpt: string; body: string }>;
};

export type SiteSettings = {
  company: { legalName: string; legalNameVi: string; enterpriseCode: string; foundingYear: number };
  contact: {
    email: string;
    phone: string;
    whatsapp: string;
    address: { street: string; locality: string; country: string; countryCode: string };
  };
  socials: { linkedin: string; facebook: string; youtube: string };
  memberships: { name: string; url?: string }[];
  stats: { value: string; label: Record<"en" | "ru" | "ar", string> }[];
  seo: SeoSettings;
  analytics: AnalyticsSettings;
  notifications: NotificationSettings;
};

/**
 * Where each kind of notification goes in a Telegram forum group. The bot token is a secret and
 * lives only in the TELEGRAM_BOT_TOKEN env var — site_settings is publicly readable.
 */
export type NotifyTopic = "inquiry" | "inquiryCoffee" | "inquiryCashew" | "pipeline" | "content" | "system";

export type NotificationSettings = {
  telegram: {
    enabled: boolean;
    /** Group chat ID, e.g. "-1001234567890". */
    chatId: string;
    /**
     * `threadId` is the topic's message_thread_id; blank = the group's General topic.
     * inquiryCoffee / inquiryCashew are optional splits of "inquiry": when disabled, those go to "inquiry".
     */
    topics: Record<NotifyTopic, { enabled: boolean; threadId: string }>;
  };
};

/** Pages whose search title/description can be overridden in the CMS ("home" is also the site default). */
export type SeoPageKey = "home" | "products" | "about" | "process" | "contact" | "company-profile" | "about-ceo";

export type MetaText = { title: string; description: string };

export type SeoSettings = {
  /** Off → every page is noindex and robots.txt blocks crawlers (for staging or before launch). */
  indexing: boolean;
  /** Social share image for pages without their own: Cloudinary public ID or URL. Blank = hero photo. */
  ogImage: string;
  /** Site verification codes (content of the meta tag only). */
  verification: { google: string; bing: string; yandex: string };
  /** Blank fields fall back to the built-in copy in src/i18n/dictionaries. */
  pages: Partial<Record<SeoPageKey, Partial<Record<"en" | "ru" | "ar", Partial<MetaText>>>>>;
};

/** Tracking IDs; blank = that tool is not loaded. Validated in lib/analytics-ids.ts. */
export type AnalyticsSettings = {
  ga4: string;
  gtm: string;
  metaPixel: string;
  yandexMetrica: string;
  clarity: string;
  cloudflare: string;
};

/** Where a lead came from, captured in the browser and stored with the inquiry. */
export type Attribution = {
  source?: string;
  medium?: string;
  campaign?: string;
  term?: string;
  content?: string;
  /** "gclid", "fbclid", "yclid" or "msclkid" when the visit came from a paid click. */
  click?: string;
  referrer?: string;
  landing?: string;
  /** ISO timestamp of the visit that set this attribution. */
  at?: string;
};
