import type { Metadata } from "next";
import { RenderBlocks } from "@/components/blocks/render-blocks";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { loadSystemPage, systemPageSeo } from "@/lib/pages";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const custom = await systemPageSeo("process", locale);
  return {
    ...(await pageMeta("process", { title: dict.processPage.metaTitle, description: dict.processPage.metaDescription })),
    ...(custom.title && { title: custom.title }),
    ...(custom.description && { description: custom.description }),
    alternates: localeAlternates(locale, "/process"),
  };
}

export default async function ProcessPage() {
  const [locale, page] = await Promise.all([getLocale(), loadSystemPage("process")]);
  // Sections come from the page builder (admin → Trang).
  return <RenderBlocks blocks={page?.blocks ?? []} locale={locale} />;
}
