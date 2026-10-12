import { CtaBanner } from "@/components/cta-banner";
import { AboutIntro } from "@/components/home/about-intro";
import { Compliance } from "@/components/home/compliance";
import { Faq } from "@/components/home/faq";
import { FeaturedProducts } from "@/components/home/featured-products";
import { Hero } from "@/components/home/hero";
import { IndustryPartners } from "@/components/home/industry-partners";
import { Partners } from "@/components/home/partners";
import { PhotoStories, type StoryPhoto } from "@/components/home/photo-stories";
import { Process } from "@/components/home/process";
import { Testimonials } from "@/components/home/testimonials";
import { TradeTerms } from "@/components/home/trade-terms";
import { JsonLd, schemaIds } from "@/components/json-ld";
import { brandAssets } from "@/components/logo";
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
  // One mosaic block of six; the tabs and /gallery hold the rest. Numbers index buyerVisitPhotos.
  // greenBeansGloves is left out because it already opens the hero.
  const storyMix: (FactoryPhoto | number)[] = ["containerLoading", "gradeRobustaS18", "dryingBeds", "sacksSilos", "roastingLine", 2];
  const storyFeatured = storyMix.flatMap((item) => {
    const src = typeof item === "number" ? buyerVisitPhotos[item] : factoryPhotos[item];
    return storyPhotos.filter((p) => p.src === src);
  });
  const storyGroups = [...galleryGroups.map((group) => group.key), "visits" as const].map((key) => ({ key, title: g.groups[key].title }));

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
        logo: { "@type": "ImageObject", url: `${site.url}${brandAssets.logo.src}`, width: brandAssets.logo.width, height: brandAssets.logo.height },
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
      <Hero t={dict.hero} scrollLabel={dict.common.scroll} foundingYear={company.foundingYear} />
      {/* Products first, then why to trust them; surfaces alternate white / sand / dark down the page. */}
      <FeaturedProducts products={products} />
      <TradeTerms />
      <AboutIntro foundingYear={company.foundingYear} gradeCount={products.length} />
      <Process t={dict.process} stats={stats} />
      <Compliance />
      <PhotoStories
        photos={storyPhotos}
        featured={storyFeatured}
        groups={storyGroups}
        labels={{ ...dict.photoStories, close: g.close, previous: g.previous, next: g.next, counter: g.counter }}
      />
      <Partners />
      {testimonialCards.length > 0 && <Testimonials labels={dict.testimonials} items={testimonialCards} />}
      <Faq surface={testimonialCards.length > 0 ? "white" : "sand"} />
      <CtaBanner />
      <IndustryPartners />
    </>
  );
}
