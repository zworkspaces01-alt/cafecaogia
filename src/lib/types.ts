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
};

/** Localized overrides for a product; any field left out falls back to English. */
export type ProductText = Partial<
  Pick<Product, "name" | "grade" | "summary" | "description" | "origin" | "packaging" | "moq" | "specs">
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
};
