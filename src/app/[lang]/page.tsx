import { RenderBlocks } from "@/components/blocks/render-blocks";
import { JsonLd, schemaIds } from "@/components/json-ld";
import { brandAssets } from "@/components/logo";
import { getDictionary, getLocale } from "@/i18n/server";
import { getSettings } from "@/lib/content";
import { loadSystemPage } from "@/lib/pages";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function HomePage() {
  const [locale, dict, settings, page] = await Promise.all([getLocale(), getDictionary(), getSettings(), loadSystemPage("home")]);
  const { company, contact } = settings;

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
        knowsAbout: ["Green coffee export", "Robusta coffee", "Arabica coffee", "Cashew kernels"],
        areaServed: dict.cta.markets,
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
      {/* Sections come from the page builder (admin → Trang); the default layout lives in lib/blocks/defaults.ts. */}
      <RenderBlocks blocks={page?.blocks ?? []} locale={locale} />
    </>
  );
}
