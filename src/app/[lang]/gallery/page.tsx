import type { Metadata } from "next";
import { RenderBlocks } from "@/components/blocks/render-blocks";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { loadSystemPage, systemPageSeo } from "@/lib/pages";
import { pageMeta } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const custom = await systemPageSeo("gallery", locale);
  return {
    ...(await pageMeta("gallery", { title: dict.gallery.metaTitle, description: dict.gallery.metaDescription })),
    ...(custom.title && { title: custom.title }),
    ...(custom.description && { description: custom.description }),
    alternates: localeAlternates(locale, "/gallery"),
  };
}

export default async function GalleryPage() {
  const [locale, page] = await Promise.all([getLocale(), loadSystemPage("gallery")]);
  // Sections come from the page builder (admin → Trang).
  return <RenderBlocks blocks={page?.blocks ?? []} locale={locale} />;
}
