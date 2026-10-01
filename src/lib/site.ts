// Static site configuration. Company details, contacts and stats are edited in the CMS
// (site_settings); translatable UI text lives in src/i18n/dictionaries.

/** The official domain. */
const PRODUCTION_URL = "https://cafecaogia.com";

/**
 * Canonical origin for metadata, sitemap and hreflang. Tolerates a missing scheme, spaces or a
 * trailing slash in NEXT_PUBLIC_SITE_URL, and falls back to the official domain in production.
 */
function resolveSiteUrl() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const production = process.env.NODE_ENV === "production";
  // A localhost value in a production build (e.g. `npm run deploy` picking up .env.local) would
  // poison canonical URLs, the sitemap and share links.
  const usable = configured && !(production && /localhost|127\.0\.0\.1/.test(configured)) ? configured : "";
  // On Vercel, the project's production domain: its vercel.app address until cafecaogia.com is
  // added there, then cafecaogia.com — so canonicals never point at a domain that doesn't resolve yet.
  const vercel = process.env.VERCEL ? process.env.VERCEL_PROJECT_PRODUCTION_URL : "";
  const raw = usable || vercel || (production ? PRODUCTION_URL : "localhost:3000");
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `${raw.startsWith("localhost") ? "http" : "https"}://${raw}`;
  try {
    return new URL(withScheme).origin;
  } catch {
    return "http://localhost:3000";
  }
}

export const site = {
  name: "Cao Gia",
  url: resolveSiteUrl(),
  /** Official lookup for the enterprise code shown on the About page. */
  registryUrl: "https://dangkykinhdoanh.gov.vn",
  incoterms: ["FOB", "CFR", "CIF", "EXW"],
  paymentTerms: ["T/T", "L/C at sight", "CAD"],
};

export const nav = [
  { href: "/", key: "home" },
  { href: "/products", key: "products" },
  { href: "/about", key: "about" },
  { href: "/process", key: "process" },
  { href: "/gallery", key: "gallery" },
  { href: "/insights", key: "insights" },
  { href: "/contact", key: "contact" },
] as const;

export const markets = ["us", "eu", "jp", "kr", "me", "au"] as const;

/**
 * Cao Gia's own photos (warehouse, drying yard, container loading), served from /public/photos.
 * Each has name.jpg (1200px, for share images) plus name-480/960/1600.webp picked by the image loader.
 * Re-export from originals with EXIF (GPS) stripped; never commit raw phone photos to /public.
 */
const own = (name: string) => `/photos/${name}.jpg`;

export const factoryPhotos = {
  sacksSilos: own("factory-sacks-silos"),
  silos: own("factory-silos"),
  processingFloor: own("processing-floor"),
  stacking: own("warehouse-stacking"),
  forklift: own("warehouse-forklift"),
  gradingLine: own("warehouse-grading-line"),
  pallets: own("warehouse-pallets"),
  palletStack: own("pallet-stack"),
  sacksLiners: own("export-sacks-liners"),
  dryingBeds: own("drying-beds"),
  greenhouseDrying: own("greenhouse-drying"),
  cherrySorting: own("cherry-sorting"),
  greenBeansHand: own("green-beans-hand"),
  containerLoading: own("container-loading"),
  containerVacuumBags: own("container-vacuum-bags"),
  containerSeal: own("container-seal"),
  roastedBags: own("roasted-beans-bags"),
  roastingLine: own("roasting-packing-line"),
  // Sample trays photographed with their spec cards — the main image of each grade's page.
  gradeRobustaS18: own("grade-robusta-s18"),
  gradeRobustaS16: own("grade-robusta-s16"),
  gradeRobustaS13: own("grade-robusta-s13"),
  gradeArabicaS18: own("grade-arabica-s18"),
  gradeArabicaS16: own("grade-arabica-s16"),
  gradeArabicaS13: own("grade-arabica-s13"),
  arabicaS16Washed: own("arabica-s16-washed"),
  greenBeansBasket: own("green-beans-basket"),
  greenBeansGloves: own("green-beans-gloves"),
  greenBeansPalm: own("green-beans-palm"),
};

/** Buyers visiting Cao Gia (published with their agreement). Same order as `about.visitPhotos` (alt text). */
export const buyerVisitPhotos = [
  own("visit-hoan-kiem-lake"),
  own("visit-hai-ly-church"),
  own("visit-dinner-toast"),
  own("visit-hanoi-old-quarter"),
  own("visit-dinner-selfie"),
  own("visit-coffee-meeting"),
];

export type FactoryPhoto = keyof typeof factoryPhotos;

/**
 * The /gallery page: every own photo, grouped by stage. Alt text lives in `gallery.photos` in the
 * dictionaries; `tall` marks portrait shots, which take two grid rows. Buyer visits come last,
 * from `buyerVisitPhotos`.
 */
export const galleryGroups: { key: "drying" | "warehouse" | "grades" | "roasting" | "export"; photos: { key: FactoryPhoto; tall?: boolean }[] }[] = [
  { key: "drying", photos: [{ key: "cherrySorting" }, { key: "dryingBeds" }, { key: "greenhouseDrying" }] },
  {
    key: "warehouse",
    photos: [
      { key: "sacksSilos" },
      { key: "palletStack", tall: true },
      { key: "processingFloor" },
      { key: "gradingLine" },
      { key: "silos" },
      { key: "stacking" },
      { key: "forklift" },
      { key: "pallets" },
      { key: "sacksLiners" },
    ],
  },
  {
    key: "grades",
    photos: [
      { key: "gradeRobustaS18" },
      { key: "gradeRobustaS16" },
      { key: "gradeRobustaS13" },
      { key: "gradeArabicaS18" },
      { key: "gradeArabicaS16" },
      { key: "gradeArabicaS13" },
      { key: "greenBeansHand", tall: true },
      { key: "arabicaS16Washed" },
      { key: "greenBeansBasket" },
      { key: "greenBeansGloves" },
      { key: "greenBeansPalm" },
    ],
  },
  { key: "roasting", photos: [{ key: "roastingLine" }, { key: "roastedBags" }] },
  { key: "export", photos: [{ key: "containerLoading" }, { key: "containerSeal", tall: true }, { key: "containerVacuumBags" }] },
];

/** Portrait buyer-visit photos, by index in `buyerVisitPhotos`. */
export const tallVisitPhotos = new Set([0, 1, 4, 5]);

// Stock photography (Unsplash) still used where there is no own photo yet — mainly cashew.
const u = (id: string) => `https://images.unsplash.com/photo-${id}`;

export const photos = {
  hero: u("1672851612794-6687bf0bf1a3"),
  hillside: u("1652015496419-58606c1b5d1c"),
  riceTerrace: u("1682691503311-839fdb6ac50c"),
  cherriesHand: u("1670758611084-e216510c5433"),
  cherriesBranch: u("1677123617592-5c30e34f40e9"),
  cherriesRipe: u("1750967613671-297f1b63038d"),
  harvesters: u("1616672239881-aec9f3f43521"),
  harvester: u("1616672500662-86c0867923bb"),
  greenBeans: u("1561986845-fbeb7f7913d8"),
  greenBeansScoop: u("1561766858-62033ae40ec3"),
  roastedBeans: u("1447933601403-0c6688de566e"),
  roastedCloseup: u("1442550528053-c431ecb55509"),
  coffeeSack: u("1524350876685-274059332603"),
  roaster: u("1511537190424-bbbab87ac5eb"),
  cashewRaw: u("1573555657105-47a0bb37c3ea"),
  cashewPile: u("1723466998040-78d7e2ef6d72"),
  cashewWood: u("1723466998060-533cd1af4e11"),
  cashewWhite: u("1686721635283-70e6344183e1"),
  cashewBowl: u("1509912760195-4f6cfd8cce2c"),
  cashewSack: u("1729514256038-c489695f4d79"),
  cashewApple: u("1754449503068-43215deac414"),
  cashewDish: u("1615485925873-7ecbbe90a866"),
  cashewBowlWhite: u("1641718087616-859c6754efb9"),
  cashewHeap: u("1686721635333-d71af2f1084b"),
  cashewRoastedRed: u("1729796350013-ebb27f079c76"),
  port: u("1678182451047-196f22a4143e"),
  portSunset: u("1759272840538-ae4b07214c71"),
  portShip: u("1578575437130-527eed3abbec"),
};
