// Static site configuration. Company details, contacts and stats are edited in the CMS
// (site_settings); translatable UI text lives in src/i18n/dictionaries.

export const site = {
  name: "Cao Gia",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
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
  { href: "/contact", key: "contact" },
] as const;

export const markets = ["us", "eu", "jp", "kr", "me", "au"] as const;

// Placeholder photography (Unsplash). Swap for Cloudinary public IDs of Cao Gia's own photos.
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
  port: u("1678182451047-196f22a4143e"),
  portSunset: u("1759272840538-ae4b07214c71"),
  portShip: u("1578575437130-527eed3abbec"),
};
