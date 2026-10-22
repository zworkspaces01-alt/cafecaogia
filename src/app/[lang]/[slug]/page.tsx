import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenderBlocks } from "@/components/blocks/render-blocks";
import { localeAlternates, openGraphBase } from "@/i18n/metadata";
import { getLocale } from "@/i18n/server";
import { reservedSlugs, slugPattern } from "@/lib/blocks/types";
import { loadCustomPage } from "@/lib/pages";

// Pages created in the page builder (admin → Trang). Existing routes such as /about take precedence.
// Rendered on first visit, then cached (see [lang]/layout.tsx).
export function generateStaticParams() {
  return [];
}

const valid = (slug: string) => slugPattern.test(slug) && !reservedSlugs.has(slug);

export async function generateMetadata({ params }: PageProps<"/[lang]/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  if (!valid(slug)) return {};
  const [locale, loaded] = await Promise.all([getLocale(), loadCustomPage(slug)]);
  if (!loaded?.page) return {};
  const seo = { ...loaded.seo.en, ...loaded.seo[locale] };
  return {
    title: seo.title || loaded.page.title,
    description: seo.description || undefined,
    alternates: localeAlternates(locale, `/${slug}`),
    openGraph: { type: "website", ...openGraphBase(locale, `/${slug}`) },
  };
}

export default async function CustomPage({ params }: PageProps<"/[lang]/[slug]">) {
  const { slug } = await params;
  if (!valid(slug)) notFound();
  const [locale, loaded] = await Promise.all([getLocale(), loadCustomPage(slug)]);
  if (!loaded) notFound();
  return <RenderBlocks blocks={loaded.blocks} locale={locale} />;
}
