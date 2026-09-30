import type { Metadata } from "next";
import { CtaBanner } from "@/components/cta-banner";
import Link from "@/components/link";
import { PageHero } from "@/components/page-hero";
import { PostCard } from "@/components/post-card";
import { localeTags } from "@/i18n/config";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { getPosts } from "@/lib/content";
import { photos } from "@/lib/site";
import type { PostCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const topics: PostCategory[] = ["guide", "market", "news"];

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return {
    title: dict.insights.metaTitle,
    description: dict.insights.metaDescription,
    alternates: localeAlternates(locale, "/insights"),
  };
}

function parseCategory(value: string | string[] | undefined): PostCategory | undefined {
  return topics.find((topic) => topic === value);
}

export default async function InsightsPage({ searchParams }: PageProps<"/[lang]/insights">) {
  const category = parseCategory((await searchParams).category);
  const [locale, dict, posts] = await Promise.all([getLocale(), getDictionary(), getPosts()]);
  const t = dict.insights;

  // Only offer topics that have articles, and no filter bar at all while there is just one topic.
  const available = topics.filter((topic) => posts.some((post) => post.category === topic));
  const shown = category ? posts.filter((post) => post.category === category) : posts;
  const [lead, ...rest] = shown;
  const cardProps = { minRead: t.minRead, localeTag: localeTags[locale] };

  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={t.title} accent={t.accent} description={t.description} image={photos.hillside} />

      <section className="py-16 md:py-20">
        <div className="container-page">
          {available.length > 1 && (
            <nav data-reveal aria-label={t.filterLabel} className="mb-10 flex flex-wrap gap-2">
              {[undefined, ...available].map((topic) => {
                const active = topic === category;
                return (
                  <Link
                    key={topic ?? "all"}
                    href={topic ? `/insights?category=${topic}` : "/insights"}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-full px-5 py-2 text-sm transition-colors",
                      active ? "bg-forest text-white" : "bg-white text-forest hover:bg-mist",
                    )}
                  >
                    {topic ? t.categories[topic] : t.all}
                  </Link>
                );
              })}
            </nav>
          )}

          {lead ? (
            <>
              <div data-reveal>
                <PostCard post={lead} categoryLabel={t.categories[lead.category]} featured {...cardProps} />
              </div>
              {rest.length > 0 && (
                <ul data-reveal-stagger className="mt-16 grid gap-x-6 gap-y-12 border-t border-mist pt-12 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <li key={post.slug}>
                      <PostCard post={post} categoryLabel={t.categories[post.category]} {...cardProps} />
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : (
            <p className="text-muted">{t.empty}</p>
          )}
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
