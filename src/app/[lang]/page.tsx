import { CtaBanner } from "@/components/cta-banner";
import { Compliance } from "@/components/home/compliance";
import { Faq } from "@/components/home/faq";
import { FeaturedProducts } from "@/components/home/featured-products";
import { HarvestCalendar } from "@/components/home/harvest-calendar";
import { Hero } from "@/components/home/hero";
import { Markets, Statement } from "@/components/home/intro";
import { Partners } from "@/components/home/partners";
import { Process } from "@/components/home/process";
import { Strengths } from "@/components/home/strengths";
import { Testimonials } from "@/components/home/testimonials";
import { TradeTerms } from "@/components/home/trade-terms";
import { JsonLd, schemaIds } from "@/components/json-ld";
import { getDictionary, getLocale } from "@/i18n/server";
import { getSettings, getTestimonials } from "@/lib/content";
import { getProducts } from "@/lib/products";
import { site } from "@/lib/site";

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
      <FeaturedProducts products={featured} />
      <TradeTerms />
      <Strengths t={dict.strengths} />
      <Process t={dict.process} stats={stats} />
      <HarvestCalendar />
      <Compliance />
      <Partners />
      {testimonialCards.length > 0 && <Testimonials labels={dict.testimonials} items={testimonialCards} />}
      <Faq surface={testimonialCards.length > 0 ? "white" : "sand"} />
      <CtaBanner />
    </>
  );
}
