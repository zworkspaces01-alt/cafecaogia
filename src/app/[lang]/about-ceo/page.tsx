import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenderBlocks } from "@/components/blocks/render-blocks";
import { JsonLd, schemaIds } from "@/components/json-ld";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { getCeo } from "@/lib/content";
import { imageUrl } from "@/lib/image-url";
import { loadSystemPage, systemPageSeo } from "@/lib/pages";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict, ceo] = await Promise.all([getLocale(), getDictionary(), getCeo()]);
  if (!ceo) return {};
  const custom = await systemPageSeo("about-ceo", locale);
  return {
    ...(await pageMeta("about-ceo", { title: dict.ceo.metaTitle, description: dict.ceo.metaDescription })),
    ...(custom.title && { title: custom.title }),
    ...(custom.description && { description: custom.description }),
    alternates: localeAlternates(locale, "/about-ceo"),
  };
}

export default async function AboutCeoPage() {
  const [leader, locale, page] = await Promise.all([getCeo(), getLocale(), loadSystemPage("about-ceo")]);
  // The page exists only while a CEO profile is published (Đội ngũ & CEO).
  if (!leader) notFound();

  const pageUrl = `${site.url}/${locale}/about-ceo`;
  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: pageUrl,
    inLanguage: locale,
    mainEntity: {
      "@type": "Person",
      "@id": `${pageUrl}#person`,
      name: leader.name,
      jobTitle: leader.role,
      ...(leader.photo && { image: imageUrl(leader.photo) }),
      ...(leader.bio[0] && { description: leader.bio[0] }),
      worksFor: { "@type": "Organization", "@id": schemaIds.organization, name: site.name },
    },
  };

  return (
    <>
      <JsonLd data={profileJsonLd} />
      {/* Sections come from the page builder (admin → Trang). */}
      <RenderBlocks blocks={page?.blocks ?? []} locale={locale} />
    </>
  );
}
