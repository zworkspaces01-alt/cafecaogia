import type { SiteSettings } from "@/lib/types";

// Fallback for every settings group the CMS hasn't saved yet (merged in src/lib/settings.ts).
// The content itself lives in D1; its starting state is migrations/0002_seed.sql.

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
