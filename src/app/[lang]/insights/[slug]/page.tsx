import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenderBlocks } from "@/components/blocks/render-blocks";
import { breadcrumbList, JsonLd, schemaIds } from "@/components/json-ld";
import { localeTags } from "@/i18n/config";
import { localeAlternates, openGraphBase } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { getPost } from "@/lib/content";
import { imageUrl } from "@/lib/image-url";
import { loadSystemPage } from "@/lib/pages";
import { photos, site } from "@/lib/site";

export const revalidate = 3600;

// Rendered on first visit, then cached (see [lang]/layout.tsx).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/insights/[slug]">): Promise<Metadata> {
  const [post, locale] = await Promise.all([getPost((await params).slug), getLocale()]);
  if (!post) return {};
  return {
    title: post.title,
    description: post.excerpt,
    alternates: localeAlternates(locale, `/insights/${post.slug}`),
    openGraph: {
      type: "article",
      ...openGraphBase(locale, `/insights/${post.slug}`),
      publishedTime: post.published_at,
      images: [{ url: imageUrl(post.cover ?? photos.hillside) }],
    },
  };
}

export default async function InsightPage({ params }: PageProps<"/[lang]/insights/[slug]">) {
  const [post, locale, dict, template] = await Promise.all([getPost((await params).slug), getLocale(), getDictionary(), loadSystemPage("post-template")]);
  if (!post) notFound();

  const cover = post.cover ?? photos.hillside;
  const pageUrl = `${site.url}/${locale}/insights/${post.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        "@id": `${pageUrl}#article`,
        headline: post.title,
        description: post.excerpt,
        image: imageUrl(cover),
        datePublished: post.published_at,
        // Posts have no separate edit date yet.
        dateModified: post.published_at,
        inLanguage: localeTags[locale],
        mainEntityOfPage: pageUrl,
        author: { "@id": schemaIds.organization },
        publisher: { "@id": schemaIds.organization },
      },
      breadcrumbList([
        { name: dict.nav.home, url: `${site.url}/${locale}` },
        { name: dict.nav.insights, url: `${site.url}/${locale}/insights` },
        { name: post.title, url: pageUrl },
      ]),
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      {/* Layout from the page builder's article template (admin → Trang → Mẫu trang bài viết). */}
      <RenderBlocks blocks={template?.blocks ?? []} locale={locale} context={{ post }} />
    </>
  );
}
