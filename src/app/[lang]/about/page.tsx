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
  const custom = await systemPageSeo("about", locale);
  return {
    ...(await pageMeta("about", { title: dict.about.metaTitle, description: dict.about.metaDescription })),
    ...(custom.title && { title: custom.title }),
    ...(custom.description && { description: custom.description }),
    alternates: localeAlternates(locale, "/about"),
  };
}

export default async function AboutPage() {
  const [locale, dict, page] = await Promise.all([getLocale(), getDictionary(), loadSystemPage("about")]);
  const pageUrl = `${site.url}/${locale}/about`;
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      webPage("AboutPage", pageUrl, dict.about.metaTitle, localeTags[locale]),
      breadcrumbList([
        { name: dict.nav.home, url: `${site.url}/${locale}` },
        { name: dict.nav.about, url: pageUrl },
      ]),
    ],
  };

  return (
    <>
      <JsonLd data={pageJsonLd} />
      {/* Sections come from the page builder (admin → Trang). */}
      <RenderBlocks blocks={page?.blocks ?? []} locale={locale} />
    </>
  );
}
