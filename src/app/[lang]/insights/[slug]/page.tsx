import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowUpRight, ChevronRight } from "lucide-react";
import { ArticleBody, readingMinutes } from "@/components/article-body";
import Link from "@/components/link";
import { PostCard } from "@/components/post-card";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { localeTags } from "@/i18n/config";
import { format, formatDate } from "@/i18n/format";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { getPost, getPosts, getPostSlugs } from "@/lib/content";
import { imageUrl } from "@/lib/image-url";
import { getProducts } from "@/lib/products";
import { photos, site } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getPostSlugs()).map(({ slug }) => ({ slug }));
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
      publishedTime: post.published_at,
      images: [{ url: imageUrl(post.cover ?? photos.hillside) }],
    },
  };
}

export default async function InsightPage({ params }: PageProps<"/[lang]/insights/[slug]">) {
  const [post, locale, dict] = await Promise.all([getPost((await params).slug), getLocale(), getDictionary()]);
  if (!post) notFound();
  const t = dict.insights;
  const localeTag = localeTags[locale];

  const [products, posts] = await Promise.all([post.product_slugs.length ? getProducts() : [], getPosts()]);
  // Keep the order chosen in the CMS; slugs of removed products are skipped.
  const related = post.product_slugs.flatMap((slug) => products.filter((p) => p.slug === slug));
  const more = [
    ...posts.filter((p) => p.slug !== post.slug && p.category === post.category),
    ...posts.filter((p) => p.slug !== post.slug && p.category !== post.category),
  ].slice(0, 3);

  const cover = post.cover ?? photos.hillside;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    image: imageUrl(cover),
    datePublished: post.published_at,
    inLanguage: localeTag,
    mainEntityOfPage: `${site.url}/${locale}/insights/${post.slug}`,
    author: { "@type": "Organization", name: site.name, url: site.url },
    publisher: { "@type": "Organization", name: site.name, url: site.url },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="bg-forest pt-28" />

      <article className="py-10 md:py-14">
        <div className="container-page">
          <nav aria-label={dict.common.breadcrumb} className="flex items-center gap-1.5 text-sm text-muted">
            <Link href="/insights" className="hover:text-forest">
              {t.eyebrow}
            </Link>
            <ChevronRight className="size-3.5 rtl:-scale-x-100" />
            <Link href={`/insights?category=${post.category}`} className="hover:text-forest">
              {t.categories[post.category]}
            </Link>
          </nav>

          <header data-reveal-stagger className="mt-8 max-w-3xl">
            <p className="text-sm text-muted">
              <span className="rounded-full bg-lime px-3 py-1 text-xs font-medium text-forest">{t.categories[post.category]}</span>
              <span className="ms-3">
                <time dateTime={post.published_at}>{formatDate(post.published_at, localeTag)}</time>
                <span aria-hidden> · </span>
                {format(t.minRead, { n: readingMinutes(post.body) })}
              </span>
            </p>
            <h1 className="mt-5 text-4xl leading-[1.1] font-medium tracking-tight text-balance text-forest md:text-5xl">
              {post.title}
            </h1>
            {post.excerpt && <p className="mt-5 text-lg leading-relaxed text-forest/75 md:text-xl">{post.excerpt}</p>}
          </header>

          <div data-reveal-image className="relative mt-10 aspect-[16/9] overflow-hidden rounded-3xl bg-mist md:aspect-[21/9]">
            <Image src={cover} alt="" fill priority sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
          </div>

          <div className="mt-12 grid gap-12 lg:grid-cols-[minmax(0,42rem)_1fr] lg:gap-16">
            <ArticleBody source={post.body} />

            <aside className="space-y-4 self-start lg:sticky lg:top-28">
              {related.length > 0 && (
                <div className="rounded-3xl bg-white p-5">
                  <h2 className="px-1 text-sm font-medium text-forest">{t.productsTitle}</h2>
                  <ul className="mt-3 space-y-1">
                    {related.map((product) => (
                      <li key={product.slug}>
                        <Link
                          href={`/products/${product.slug}`}
                          className="group flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-sand"
                        >
                          <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-mist">
                            <Image src={product.image} alt="" fill sizes="48px" className="object-cover" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm leading-snug font-medium text-forest">{product.name}</span>
                            <span className="block truncate text-xs text-muted">{product.grade}</span>
                          </span>
                          <ArrowUpRight className="size-4 shrink-0 text-muted transition-colors group-hover:text-forest rtl:-scale-x-100" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="rounded-3xl bg-forest p-6 text-white">
                <p className="text-lg font-medium">{dict.megaMenu.samplesTitle}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-white/70">{dict.megaMenu.samplesBody}</p>
                <ButtonLink href="/contact" variant="lime" arrow className="mt-5">
                  {dict.common.requestQuote}
                </ButtonLink>
              </div>
            </aside>
          </div>
        </div>
      </article>

      {more.length > 0 && (
        <section className="bg-white py-20">
          <div className="container-page">
            <div className="flex flex-wrap items-end justify-between gap-6">
              <SectionHeading title={t.moreTitle} accent={t.moreAccent} />
              <ButtonLink href="/insights" variant="outline-dark" arrow>
                {t.allArticles}
              </ButtonLink>
            </div>
            <ul data-reveal-stagger className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {more.map((p) => (
                <li key={p.slug}>
                  <PostCard post={p} categoryLabel={t.categories[p.category]} minRead={t.minRead} localeTag={localeTag} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
