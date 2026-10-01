import { CtaBanner } from "@/components/cta-banner";
import { AboutIntro } from "@/components/home/about-intro";
import { Compliance } from "@/components/home/compliance";
import { Faq } from "@/components/home/faq";
import { FeaturedProducts } from "@/components/home/featured-products";
import { HarvestCalendar } from "@/components/home/harvest-calendar";
import { Hero } from "@/components/home/hero";
import { Markets, Statement } from "@/components/home/intro";
import { Partners } from "@/components/home/partners";
import { PhotoStories, type StoryPhoto } from "@/components/home/photo-stories";
import { Process } from "@/components/home/process";
import { Strengths } from "@/components/home/strengths";
import { Testimonials } from "@/components/home/testimonials";
import { TradeTerms } from "@/components/home/trade-terms";
import { JsonLd, schemaIds } from "@/components/json-ld";
import { getDictionary, getLocale } from "@/i18n/server";
import { getSettings, getTestimonials } from "@/lib/content";
import { getProducts } from "@/lib/products";
import { buyerVisitPhotos, factoryPhotos, galleryGroups, site, type FactoryPhoto } from "@/lib/site";

export const revalidate = 3600;

export default async function HomePage() {
  const [locale, dict, products, settings, testimonials] = await Promise.all([
    getLocale(),
    getDictionary(),
    getProducts(),
    getSettings(),
    getTestimonials(),
  ]);
  const productNames: Record<string, string> = Object.fromEntries(products.map((p) => [p.slug, p.name]));
  const { company, contact } = settings;
  const stats = settings.stats.map((s) => ({ value: s.value, label: s.label[locale] || s.label.en }));
  const testimonialCards = testimonials.map((t) => ({
    ...t,
    product: t.product_slug ? (productNames[t.product_slug] ?? null) : null,
  }));
  // Photo mosaic: every own photo tagged with its stage; "All" shows a mix (a multiple of 6 tiles).
  const g = dict.gallery;
  const storyPhotos: StoryPhoto[] = [
    ...galleryGroups.flatMap((group) => group.photos.map(({ key }) => ({ src: factoryPhotos[key], alt: g.photos[key], group: group.key }))),
    ...buyerVisitPhotos.map((src, i) => ({ src, alt: dict.about.visitPhotos[i], group: "visits" })),
  ];
  // Numbers are indexes into buyerVisitPhotos.
  const storyMix: (FactoryPhoto | number)[] = [
    "containerLoading", "gradeRobustaS18", "dryingBeds", "sacksSilos", "greenBeansGloves", 2,
    "greenhouseDrying", "roastingLine", "gradingLine", "gradeArabicaS16", "containerSeal", "stacking",
  ];
  const storyFeatured = storyMix.flatMap((item) => {
    const src = typeof item === "number" ? buyerVisitPhotos[item] : factoryPhotos[item];
    return storyPhotos.filter((p) => p.src === src);
  });
  const storyGroups = [...galleryGroups.map((group) => group.key), "visits" as const].map((key) => ({ key, title: g.groups[key].title }));
  const featured = [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, 6);

  const sameAs = Object.values(settings.socials).filter(Boolean);
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": schemaIds.organization,
        // The brand buyers search for; the registered company name goes in legalName.
        name: site.name,
        legalName: company.legalName,
        alternateName: company.legalNameVi,
        url: site.url,
        logo: { "@type": "ImageObject", url: `${site.url}/apple-icon.png`, width: 180, height: 180 },
        description: dict.meta.description,
        email: contact.email,
        telephone: contact.phone,
        foundingDate: String(company.foundingYear),
        taxID: company.enterpriseCode,
        ...(sameAs.length > 0 && { sameAs }),
        address: {
          "@type": "PostalAddress",
          streetAddress: contact.address.street,
          addressLocality: contact.address.locality,
          addressCountry: contact.address.countryCode,
        },
        contactPoint: {
          "@type": "ContactPoint",
          contactType: "sales",
          email: contact.email,
          telephone: contact.phone,
          availableLanguage: ["English", "Russian", "Arabic", "Vietnamese"],
        },
      },
      {
        "@type": "WebSite",
        "@id": schemaIds.website,
        url: site.url,
        name: site.name,
        inLanguage: locale,
        publisher: { "@id": schemaIds.organization },
      },
    ],
  };

  return (
    <>
      <JsonLd data={organizationJsonLd} />
      <Hero t={dict.hero} scrollLabel={dict.common.scroll} />
      <Markets />
      <Statement />
      <AboutIntro foundingYear={company.foundingYear} gradeCount={products.length} />
      <FeaturedProducts products={featured} />
      <TradeTerms />
      <Strengths t={dict.strengths} />
      <Process t={dict.process} stats={stats} />
      <PhotoStories
        photos={storyPhotos}
        featured={storyFeatured}
        groups={storyGroups}
        labels={{ ...dict.photoStories, close: g.close, previous: g.previous, next: g.next, counter: g.counter }}
      />
      <HarvestCalendar />
      <Compliance />
      <Partners />
      {testimonialCards.length > 0 && <Testimonials labels={dict.testimonials} items={testimonialCards} />}
      <Faq surface={testimonialCards.length > 0 ? "white" : "sand"} />
      <CtaBanner />
    </>
  );
}
