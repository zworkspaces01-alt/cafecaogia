import type { Metadata } from "next";
import { RenderBlocks } from "@/components/blocks/render-blocks";
import { breadcrumbList, JsonLd, webPage } from "@/components/json-ld";
import { localeTags } from "@/i18n/config";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { loadSystemPage, systemPageSeo } from "@/lib/pages";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const custom = await systemPageSeo("contact", locale);
  return {
    ...(await pageMeta("contact", { title: dict.contact.metaTitle, description: dict.contact.metaDescription })),
    ...(custom.title && { title: custom.title }),
    ...(custom.description && { description: custom.description }),
    alternates: localeAlternates(locale, "/contact"),
  };
}

// The product and sample request come from the query string, so this page renders per request.
export const dynamic = "force-dynamic";

export default async function ContactPage({ searchParams }: PageProps<"/[lang]/contact">) {
  const { product, sample } = await searchParams;
  const [locale, dict, page] = await Promise.all([getLocale(), getDictionary(), loadSystemPage("contact")]);

  const pageUrl = `${site.url}/${locale}/contact`;
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      webPage("ContactPage", pageUrl, dict.contact.metaTitle, localeTags[locale]),
      breadcrumbList([
        { name: dict.nav.home, url: `${site.url}/${locale}` },
        { name: dict.nav.contact, url: pageUrl },
      ]),
    ],
  };

  return (
    <>
      <JsonLd data={pageJsonLd} />
      {/* Sections come from the page builder (admin → Trang). */}
      <RenderBlocks
        blocks={page?.blocks ?? []}
        locale={locale}
        context={{ quoteProduct: typeof product === "string" ? product : undefined, quoteSample: Boolean(sample) }}
      />
    </>
  );
}
