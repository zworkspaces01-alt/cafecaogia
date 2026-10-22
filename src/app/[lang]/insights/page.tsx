import type { Metadata } from "next";
import { RenderBlocks } from "@/components/blocks/render-blocks";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { loadSystemPage, systemPageSeo } from "@/lib/pages";
import type { PostCategory } from "@/lib/types";

const topics: PostCategory[] = ["guide", "market", "news"];

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const custom = await systemPageSeo("insights", locale);
  return {
    title: custom.title ?? dict.insights.metaTitle,
    description: custom.description ?? dict.insights.metaDescription,
    alternates: localeAlternates(locale, "/insights"),
  };
}

function parseCategory(value: string | string[] | undefined): PostCategory | undefined {
  return topics.find((topic) => topic === value);
}

// Filters come from the query string, so this page renders per request rather than from the ISR cache.
export const dynamic = "force-dynamic";

export default async function InsightsPage({ searchParams }: PageProps<"/[lang]/insights">) {
  const category = parseCategory((await searchParams).category);
  const [locale, page] = await Promise.all([getLocale(), loadSystemPage("insights")]);
  // Sections come from the page builder (admin → Trang).
  return <RenderBlocks blocks={page?.blocks ?? []} locale={locale} context={{ postCategory: category }} />;
}
