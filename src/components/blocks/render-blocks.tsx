import type { ReactNode } from "react";
import {
  BuyerVisitsBlock,
  CardsBlock,
  CompanyDetailsBlock,
  DataTableBlock,
  FactsBlock,
  ImageCardsBlock,
  ProcessStepsBlock,
  ProductTableBlock,
  RichTextBlock,
  SourcesBlock,
  StoryBlock,
  ValueCardsBlock,
} from "@/components/blocks/page-blocks";
import { isExportGrade } from "@/components/commodity-hub";
import { CtaBanner } from "@/components/cta-banner";
import { AboutIntro } from "@/components/home/about-intro";
import { Compliance } from "@/components/home/compliance";
import { Faq } from "@/components/home/faq";
import { FeaturedProducts } from "@/components/home/featured-products";
import { HarvestCalendar } from "@/components/home/harvest-calendar";
import { Hero } from "@/components/home/hero";
import { IndustryPartners } from "@/components/home/industry-partners";
import { Partners } from "@/components/home/partners";
import { PhotoStories, type StoryPhoto } from "@/components/home/photo-stories";
import { Process } from "@/components/home/process";
import { Testimonials } from "@/components/home/testimonials";
import { TradeTerms } from "@/components/home/trade-terms";
import { PageHero } from "@/components/page-hero";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { getDictionary } from "@/i18n/server";
import { resolveContent } from "@/lib/blocks/resolve";
import type { Block } from "@/lib/blocks/types";
import { getSettings, getTestimonials } from "@/lib/content";
import { getProducts } from "@/lib/products";
import { buyerVisitPhotos, factoryPhotos, galleryGroups, type FactoryPhoto } from "@/lib/site";

/* eslint-disable @typescript-eslint/no-explicit-any -- block content is validated by its schema in the editor */
type Any = any;

/**
 * Renders a page's visible blocks in order. In the page builder's preview each block is wrapped in a
 * `data-cms-block` element, so clicking it selects the block in the editor (see PreviewBridge).
 */
export async function RenderBlocks({ blocks, locale, preview = false }: { blocks: Block[]; locale: Locale; preview?: boolean }) {
  const visible = blocks.filter((block) => !block.hidden);
  const types = new Set(visible.map((block) => block.type));
  const needsProducts = ["featuredProducts", "aboutIntro", "productTable", "testimonials"].some((type) => types.has(type));

  const [dict, settings, products, testimonials] = await Promise.all([
    getDictionary(),
    getSettings(),
    needsProducts ? getProducts() : Promise.resolve([]),
    types.has("testimonials") ? getTestimonials() : Promise.resolve([]),
  ]);
  const ctx: Ctx = { locale, dict, settings, products, testimonials };

  const rendered: ReactNode[] = [];
  visible.forEach((block, i) => {
    const previous = visible[i - 1];
    const view = <BlockView key={block.id} block={block} ctx={ctx} previousType={previous?.type} />;
    rendered.push(
      preview ? (
        <div key={block.id} data-cms-block={block.id}>
          {view}
        </div>
      ) : (
        view
      ),
    );
  });
  return <>{rendered}</>;
}

type Ctx = {
  locale: Locale;
  dict: Dictionary;
  settings: Awaited<ReturnType<typeof getSettings>>;
  products: Awaited<ReturnType<typeof getProducts>>;
  testimonials: Awaited<ReturnType<typeof getTestimonials>>;
};

function BlockView({ block, ctx, previousType }: { block: Block; ctx: Ctx; previousType?: string }) {
  const { locale, dict, settings, products } = ctx;
  const c = resolveContent<Any>(block, locale);

  switch (block.type) {
    // Homepage sections
    case "hero":
      return <Hero t={{ ...dict.hero, ...c }} scrollLabel={dict.common.scroll} foundingYear={settings.company.foundingYear} />;
    case "featuredProducts":
      return <FeaturedProducts products={products} t={{ ...dict.featured, ...c }} />;
    case "tradeTerms":
      return <TradeTerms t={{ ...dict.tradeTerms, ...c }} />;
    case "aboutIntro":
      return <AboutIntro foundingYear={settings.company.foundingYear} gradeCount={products.length} t={{ ...dict.homeAbout, ...c }} />;
    case "process":
      return (
        <Process
          t={{ ...dict.process, ...c }}
          stats={settings.stats.map((s) => ({ value: s.value, label: (s.label as Record<string, string>)[locale] || s.label.en }))}
        />
      );
    case "compliance":
      return <Compliance t={{ ...dict.compliance, ...c }} />;
    case "photoStories":
      return <PhotoStoriesBlock labels={{ ...dict.photoStories, ...c }} dict={dict} />;
    case "partnerSegments":
      return <Partners t={{ ...dict.partners, ...c }} />;
    case "testimonials":
      return <TestimonialsBlock labels={{ ...dict.testimonials, ...c }} ctx={ctx} />;
    case "faq":
      // A chosen background wins; otherwise keep backgrounds alternating when the testimonials above
      // it are hidden for lack of entries.
      return (
        <Faq
          t={{ ...dict.faq, ...c }}
          surface={
            c.surface === "sand" || c.surface === "white"
              ? c.surface
              : previousType === "testimonials" && ctx.testimonials.length === 0
                ? "sand"
                : "white"
          }
        />
      );
    case "cta":
      return <CtaBanner t={{ ...dict.cta, ...c }} />;
    case "industryPartners":
      return <IndustryPartners t={{ ...dict.industryPartners, ...c, kinds: { ...dict.industryPartners.kinds, ...c.kinds } }} />;
    case "harvestCalendar":
      return <HarvestCalendar t={{ ...dict.harvest, ...c }} />;

    // Inner-page sections
    case "pageHero":
      return <PageHero eyebrow={c.eyebrow} title={c.title} accent={c.accent || undefined} description={c.description || undefined} image={c.image || factoryPhotos.pallets} />;
    case "story":
      return <StoryBlock c={c} />;
    case "valueCards":
      return <ValueCardsBlock c={c} locale={locale} />;
    case "imageCards":
      return <ImageCardsBlock c={c} />;
    case "companyDetails":
      return <CompanyDetailsBlock c={c} dict={dict} />;
    case "buyerVisits":
      return <BuyerVisitsBlock c={c} dict={dict} />;
    case "processSteps":
      return <ProcessStepsBlock c={c} />;
    case "productTable":
      return <ProductTableBlock c={c} dict={dict} products={products.filter((p) => p.category === c.category && isExportGrade(p))} />;

    // Content blocks
    case "richText":
      return <RichTextBlock c={c} />;
    case "facts":
      return <FactsBlock c={c} />;
    case "cards":
      return <CardsBlock c={c} />;
    case "dataTable":
      return <DataTableBlock c={c} />;
    case "sources":
      return <SourcesBlock c={c} />;
    default:
      return null;
  }
}

function PhotoStoriesBlock({ labels, dict }: { labels: Dictionary["photoStories"]; dict: Dictionary }) {
  // Every own photo tagged with its stage; "All" shows one mosaic block of six.
  const g = dict.gallery;
  const photos: StoryPhoto[] = [
    ...galleryGroups.flatMap((group) => group.photos.map(({ key }) => ({ src: factoryPhotos[key], alt: g.photos[key], group: group.key }))),
    ...buyerVisitPhotos.map((src, i) => ({ src, alt: dict.about.visitPhotos[i], group: "visits" })),
  ];
  // Numbers index buyerVisitPhotos; greenBeansGloves is left out because it already opens the hero.
  const mix: (FactoryPhoto | number)[] = ["containerLoading", "gradeRobustaS18", "dryingBeds", "sacksSilos", "roastingLine", 2];
  const featured = mix.flatMap((item) => {
    const src = typeof item === "number" ? buyerVisitPhotos[item] : factoryPhotos[item];
    return photos.filter((p) => p.src === src);
  });
  const groups = [...galleryGroups.map((group) => group.key), "visits" as const].map((key) => ({ key, title: g.groups[key].title }));
  return (
    <PhotoStories
      photos={photos}
      featured={featured}
      groups={groups}
      labels={{ ...labels, close: g.close, previous: g.previous, next: g.next, counter: g.counter }}
    />
  );
}

function TestimonialsBlock({ labels, ctx }: { labels: Dictionary["testimonials"]; ctx: Ctx }) {
  if (ctx.testimonials.length === 0) return null;
  const names: Record<string, string> = Object.fromEntries(ctx.products.map((p) => [p.slug, p.name]));
  const items = ctx.testimonials.map((t) => ({ ...t, product: t.product_slug ? (names[t.product_slug] ?? null) : null }));
  return <Testimonials labels={labels} items={items} />;
}
