import "server-only";

// Default blocks for the system pages, built from the dictionaries and the photos in code, so a page
// with no saved layout renders exactly as the site did before the page builder. Also the starting
// content of a block added from the editor's palette.

import { locales, type Locale } from "@/i18n/config";
import { loadDictionary, type Dictionary } from "@/i18n/dictionaries";
import type { Block, BlockContent, SystemPageKey } from "@/lib/blocks/types";
import { factoryPhotos, photos } from "@/lib/site";

type Dicts = Record<Locale, Dictionary>;

const loadAll = async (): Promise<Dicts> => {
  const entries = await Promise.all(locales.map(async (l) => [l, await loadDictionary(l)] as const));
  return Object.fromEntries(entries) as Dicts;
};

/** A block whose content in each language comes from `pick(dictionary)`; `shared` adds English-only settings. */
function fromDict(dicts: Dicts, id: string, type: string, pick: (d: Dictionary) => object, shared?: (en: BlockContent) => BlockContent): Block {
  const en = structuredClone(pick(dicts.en)) as BlockContent;
  return {
    id,
    type,
    content: {
      en: shared ? shared(en) : en,
      ru: structuredClone(pick(dicts.ru)) as BlockContent,
      ar: structuredClone(pick(dicts.ar)) as BlockContent,
    },
  };
}

/** Adds shared fields to each item of a list (by index). */
const withItems = (list: unknown, extra: Record<string, unknown>[]) =>
  (list as Record<string, unknown>[]).map((item, i) => ({ ...item, ...(extra[i % extra.length] ?? {}) }));

const heroSlides = [
  { image: factoryPhotos.greenBeansGloves, primaryHref: "/contact", secondaryHref: "/products" },
  { image: factoryPhotos.dryingBeds, primaryHref: "/products?category=coffee", secondaryHref: "/contact" },
  { image: factoryPhotos.cashewKernelsPile, primaryHref: "/products?category=cashew", secondaryHref: "/contact" },
  { image: factoryPhotos.containerLoading, primaryHref: "/contact", secondaryHref: "/process" },
];

const segmentImages = [factoryPhotos.roastedBags, factoryPhotos.palletStack, factoryPhotos.cashewKernelsHeap, factoryPhotos.cashewCartonsOpen];

const processVisuals = [
  { icon: "trees", image: photos.hillside },
  { icon: "sprout", image: factoryPhotos.cherrySorting },
  { icon: "factory", image: factoryPhotos.greenhouseDrying },
  { icon: "clipboard", image: factoryPhotos.greenBeansHand },
  { icon: "package", image: factoryPhotos.stacking },
  { icon: "ship", image: factoryPhotos.containerLoading },
];

const valueIcons = ["shield", "handshake", "leaf", "timer"];
const regionImages = [photos.cherriesBranch, photos.hillside, photos.cashewApple];

function homeBlocks(d: Dicts): Block[] {
  return [
    fromDict(d, "home-hero", "hero", (x) => x.hero, (en) => ({ ...en, slides: withItems(en.slides, heroSlides) })),
    fromDict(d, "home-featured", "featuredProducts", (x) => x.featured),
    fromDict(d, "home-terms", "tradeTerms", (x) => x.tradeTerms),
    fromDict(d, "home-about", "aboutIntro", (x) => x.homeAbout),
    fromDict(d, "home-process", "process", (x) => x.process),
    fromDict(d, "home-compliance", "compliance", (x) => x.compliance),
    fromDict(d, "home-photos", "photoStories", (x) => x.photoStories),
    fromDict(d, "home-segments", "partnerSegments", (x) => x.partners, (en) => ({ ...en, segments: withItems(en.segments, segmentImages.map((image) => ({ image }))) })),
    fromDict(d, "home-testimonials", "testimonials", (x) => x.testimonials),
    fromDict(d, "home-faq", "faq", (x) => x.faq),
    fromDict(d, "home-cta", "cta", (x) => x.cta),
    fromDict(d, "home-partners", "industryPartners", (x) => x.industryPartners),
  ];
}

function aboutBlocks(d: Dicts): Block[] {
  return [
    fromDict(d, "about-hero", "pageHero", (x) => ({ eyebrow: x.about.eyebrow, title: x.about.title, accent: x.about.accent, description: x.about.description }), (en) => ({ ...en, image: factoryPhotos.pallets })),
    fromDict(
      d,
      "about-story",
      "story",
      (x) => ({ eyebrow: x.about.storyEyebrow, title: x.about.storyTitle, accent: x.about.storyAccent, paragraphs: x.about.story, image1Alt: x.about.harvesterAlt, image2Alt: x.about.kernelsAlt }),
      (en) => ({ ...en, image1: factoryPhotos.cherrySorting, image2: factoryPhotos.cashewKernelsCloseup }),
    ),
    fromDict(
      d,
      "about-values",
      "valueCards",
      (x) => ({ eyebrow: x.about.valuesEyebrow, title: x.about.valuesTitle, accent: x.about.valuesAccent, description: x.about.valuesDescription, items: x.about.values }),
      (en) => ({ ...en, showStats: "yes", items: withItems(en.items, valueIcons.map((icon) => ({ icon }))) }),
    ),
    fromDict(
      d,
      "about-regions",
      "imageCards",
      (x) => ({ eyebrow: x.about.regionsEyebrow, title: x.about.regionsTitle, accent: x.about.regionsAccent, description: x.about.regionsDescription, items: x.about.regions }),
      (en) => ({ ...en, items: withItems(en.items, regionImages.map((image) => ({ image }))) }),
    ),
    fromDict(d, "about-company", "companyDetails", (x) => ({
      legalTitle: x.about.legalTitle,
      brandNote: x.about.brandNote,
      businessLinesLabel: x.about.businessLinesLabel,
      businessLines: x.about.businessLines,
      membershipsTitle: x.about.membershipsTitle,
      verifyTitle: x.about.verifyTitle,
      verifyBody: x.about.verifyBody,
      verifyCta: x.about.verifyCta,
    })),
    fromDict(d, "about-visits", "buyerVisits", (x) => ({
      eyebrow: x.about.visitsEyebrow,
      title: x.about.visitsTitle,
      accent: x.about.visitsAccent,
      description: x.about.visitsDescription,
      galleryCta: x.about.galleryCta,
    })),
    fromDict(d, "about-cta", "cta", (x) => x.cta),
  ];
}

function processBlocks(d: Dicts): Block[] {
  return [
    fromDict(d, "process-hero", "pageHero", (x) => ({ eyebrow: x.processPage.eyebrow, title: x.processPage.title, accent: x.processPage.accent, description: x.processPage.description }), (en) => ({ ...en, image: factoryPhotos.gradingLine })),
    fromDict(d, "process-steps", "processSteps", (x) => ({ step: x.processPage.step, steps: x.processPage.steps }), (en) => ({ ...en, steps: withItems(en.steps, processVisuals) })),
    fromDict(d, "process-harvest", "harvestCalendar", (x) => x.harvest),
    fromDict(d, "process-cta", "cta", (x) => x.cta),
  ];
}

function hubBlocks(d: Dicts, hub: "coffee" | "cashew"): Block[] {
  const image = hub === "coffee" ? factoryPhotos.dryingBeds : factoryPhotos.cashewKernelsPile;
  const h = (x: Dictionary) => x.hubs[hub];
  return [
    fromDict(d, `${hub}-hero`, "pageHero", (x) => ({ eyebrow: h(x).eyebrow, title: h(x).title, accent: h(x).accent, description: h(x).description }), (en) => ({ ...en, image })),
    fromDict(
      d,
      `${hub}-grades`,
      "productTable",
      (x) => ({ title: h(x).gradesTitle, accent: h(x).gradesAccent, description: h(x).gradesDescription, termsTitle: x.hubs.labels.termsTitle, labels: x.hubs.labels }),
      (en) => ({ ...en, category: hub }),
    ),
    fromDict(d, `${hub}-facts`, "facts", (x) => ({ title: h(x).factsTitle, accent: h(x).factsAccent, items: h(x).facts })),
    fromDict(d, `${hub}-origins`, "cards", (x) => ({ title: h(x).originTitle, accent: h(x).originAccent, description: "", items: h(x).origins }), (en) => ({ ...en, tone: "white" })),
    fromDict(d, `${hub}-guide`, "dataTable", (x) => ({
      title: h(x).guideTitle,
      accent: h(x).guideAccent,
      description: h(x).guideIntro,
      columns: h(x).guideColumns,
      rows: h(x).guideRows.map(([c1, c2, c3]) => ({ c1, c2, c3 })),
      note: h(x).guideNote,
    })),
    fromDict(d, `${hub}-notes`, "cards", (x) => ({ title: "", accent: "", description: "", items: h(x).notes }), (en) => ({ ...en, tone: "sand" })),
    fromDict(d, `${hub}-faq`, "faq", (x) => ({ ...x.faq, eyebrow: "", title: x.hubs.labels.faqTitle, accent: "", cta: x.hubs.labels.quote, items: h(x).faq }), (en) => ({ ...en, surface: "sand" })),
    fromDict(d, `${hub}-sources`, "sources", (x) => ({ title: x.hubs.labels.sourcesTitle, note: x.hubs.labels.sourcesNote, items: h(x).sources })),
    fromDict(d, `${hub}-cta`, "cta", (x) => x.cta),
  ];
}


const hero = (x: { eyebrow: string; title: string; accent: string; description: string }) => ({
  eyebrow: x.eyebrow,
  title: x.title,
  accent: x.accent,
  description: x.description,
});

function productsBlocks(d: Dicts): Block[] {
  return [
    fromDict(d, "products-hero", "pageHero", (x) => hero(x.productsPage), (en) => ({ ...en, image: factoryPhotos.forklift })),
    fromDict(d, "products-grid", "productGrid", (x) => ({ filterLabel: x.productsPage.filterLabel, all: x.productsPage.all, empty: x.productsPage.empty })),
    fromDict(d, "products-cta", "cta", (x) => x.cta),
  ];
}

function insightsBlocks(d: Dicts): Block[] {
  return [
    fromDict(d, "insights-hero", "pageHero", (x) => hero(x.insights), (en) => ({ ...en, image: photos.hillside })),
    fromDict(d, "insights-list", "postList", (x) => ({ filterLabel: x.insights.filterLabel, all: x.insights.all, empty: x.insights.empty })),
    fromDict(d, "insights-cta", "cta", (x) => x.cta),
  ];
}

function galleryBlocks(d: Dicts): Block[] {
  return [
    fromDict(d, "gallery-hero", "pageHero", (x) => hero(x.gallery), (en) => ({ ...en, image: factoryPhotos.sacksSilos })),
    fromDict(d, "gallery-photos", "photoGallery", (x) => ({ photoCount: x.gallery.photoCount })),
    fromDict(d, "gallery-cta", "cta", (x) => x.cta),
  ];
}

function contactBlocks(d: Dicts): Block[] {
  return [
    fromDict(d, "contact-hero", "pageHero", (x) => hero(x.contact), (en) => ({ ...en, image: factoryPhotos.sacksLiners })),
    fromDict(d, "contact-form", "contactForm", (x) => {
      const { asideTitle, asideBody, email, whatsapp, phone, office, hours, hoursValue, tradeTerms, incoterms, payment, sampleMessage } = x.contact;
      return { asideTitle, asideBody, email, whatsapp, phone, office, hours, hoursValue, tradeTerms, incoterms, payment, sampleMessage };
    }),
  ];
}

const focusIcons = ["plane", "shield", "globe", "ruler"];

function ceoBlocks(d: Dicts): Block[] {
  return [
    fromDict(d, "ceo-hero", "pageHero", (x) => hero(x.ceo), (en) => ({ ...en, image: factoryPhotos.processingFloor })),
    fromDict(d, "ceo-profile", "ceoProfile", (x) => ({ contactTitle: x.ceo.contactTitle })),
    fromDict(
      d,
      "ceo-focus",
      "valueCards",
      (x) => ({ eyebrow: x.ceo.focusEyebrow, title: x.ceo.focusTitle, accent: x.ceo.focusAccent, description: "", items: x.ceo.focus }),
      (en) => ({ ...en, showStats: "no", items: withItems(en.items, focusIcons.map((icon) => ({ icon }))) }),
    ),
    fromDict(d, "ceo-principles", "numberedCards", (x) => ({ eyebrow: x.ceo.principlesEyebrow, title: x.ceo.principlesTitle, accent: x.ceo.principlesAccent, items: x.ceo.principles })),
    fromDict(
      d,
      "ceo-buyers",
      "checklist",
      (x) => ({ eyebrow: "", title: x.ceo.buyersTitle, accent: x.ceo.buyersAccent, items: x.ceo.buyers, cta: x.common.requestQuote }),
      (en) => ({ ...en, ctaHref: "/contact" }),
    ),
    fromDict(d, "ceo-cta", "cta", (x) => x.cta),
  ];
}

function notFoundBlocks(d: Dicts): Block[] {
  return [fromDict(d, "not-found", "notFound", (x) => x.notFound)];
}

function productTemplateBlocks(d: Dicts): Block[] {
  return [
    fromDict(d, "product-main", "productMain", (x) => {
      const { origin, moq, packing, specification, terms, requestQuote, askSample, products } = x.product;
      return { origin, moq, packing, specification, terms, requestQuote, askSample, products };
    }),
    fromDict(d, "product-insights", "productInsights", (x) => ({ title: x.product.insightsTitle, accent: x.product.insightsAccent })),
    fromDict(d, "product-related", "relatedProducts", (x) => ({ title: x.product.relatedTitle, accent: x.product.relatedAccent })),
  ];
}

function postTemplateBlocks(d: Dicts): Block[] {
  return [
    fromDict(d, "post-main", "postMain", (x) => ({
      productsTitle: x.insights.productsTitle,
      boxTitle: x.megaMenu.samplesTitle,
      boxBody: x.megaMenu.samplesBody,
      boxCta: x.common.requestQuote,
    })),
    fromDict(d, "post-more", "postMore", (x) => ({ title: x.insights.moreTitle, accent: x.insights.moreAccent, allArticles: x.insights.allArticles })),
  ];
}

/** Footer link columns as they were in code: [label, path] pairs. */
const footerColumns = (x: Dictionary) => {
  const l = x.footer.links;
  return [
    {
      title: x.footer.coffee,
      links: [
        [l.robustaS18, "/products/robusta-s18-clean"],
        [l.roastedBlend, "/products/roasted-ground-blend-70-30"],
        [l.arabicaS18, "/products/arabica-s18-clean"],
        [l.allCoffee, "/green-coffee"],
      ],
    },
    {
      title: x.footer.cashew,
      links: [
        [l.w240, "/products/cashew-ww240"],
        [l.w320, "/products/cashew-ww320"],
        [l.splits, "/products/cashew-ws"],
        [l.roasted, "/products/roasted-salted-cashews"],
        [l.allCashew, "/cashew-kernels"],
      ],
    },
    {
      title: x.footer.company,
      links: [
        [x.nav.about, "/about"],
        [l.leadership, "/about-ceo"],
        [x.nav.process, "/process"],
        [x.nav.gallery, "/gallery"],
        [x.nav.insights, "/insights"],
        [l.allProducts, "/products"],
        [l.profile, "/company-profile"],
        [x.common.requestQuote, "/contact"],
      ],
    },
  ];
};

function layoutBlocks(d: Dicts): Block[] {
  return [
    fromDict(d, "site-header", "siteHeader", (x) => ({ nav: x.nav, requestQuote: x.common.requestQuote })),
    fromDict(d, "site-footer", "siteFooter", (x) => ({
      tagline: x.footer.tagline,
      description: x.footer.description,
      columns: footerColumns(x),
      rights: x.footer.rights,
      proudly: x.footer.proudly,
    })),
    fromDict(d, "contact-dock", "contactDock", (x) => ({
      chat: x.common.chatWhatsApp,
      requestQuote: x.common.requestQuote,
      nudge: x.common.whatsappNudge,
      greeting: x.common.whatsappGreeting,
      online: x.common.online,
    })),
  ];
}

/** The layout a system page has when nothing has been saved for it. */
export async function defaultPageBlocks(key: SystemPageKey): Promise<Block[]> {
  const dicts = await loadAll();
  switch (key) {
    case "home":
      return homeBlocks(dicts);
    case "about":
      return aboutBlocks(dicts);
    case "process":
      return processBlocks(dicts);
    case "green-coffee":
      return hubBlocks(dicts, "coffee");
    case "cashew-kernels":
      return hubBlocks(dicts, "cashew");
    case "products":
      return productsBlocks(dicts);
    case "insights":
      return insightsBlocks(dicts);
    case "gallery":
      return galleryBlocks(dicts);
    case "contact":
      return contactBlocks(dicts);
    case "about-ceo":
      return ceoBlocks(dicts);
    case "not-found":
      return notFoundBlocks(dicts);
    case "product-template":
      return productTemplateBlocks(dicts);
    case "post-template":
      return postTemplateBlocks(dicts);
    case "layout":
      return layoutBlocks(dicts);
  }
}

/** Starting content for a block added from the palette: the matching system block, or a placeholder. */
export async function blockTemplates(): Promise<Record<string, Block["content"]>> {
  const dicts = await loadAll();
  const templates: Record<string, Block["content"]> = {};
  const all = [
    ...homeBlocks(dicts),
    ...aboutBlocks(dicts),
    ...processBlocks(dicts),
    ...hubBlocks(dicts, "coffee"),
    ...productsBlocks(dicts),
    ...insightsBlocks(dicts),
    ...galleryBlocks(dicts),
    ...contactBlocks(dicts),
    ...ceoBlocks(dicts),
    ...notFoundBlocks(dicts),
    ...productTemplateBlocks(dicts),
    ...postTemplateBlocks(dicts),
    ...layoutBlocks(dicts),
  ];
  for (const block of all) {
    templates[block.type] ??= block.content;
  }
  templates.richText = {
    en: { eyebrow: "", title: "New section", accent: "", paragraphs: ["Write your text here."] },
  };
  return templates;
}
