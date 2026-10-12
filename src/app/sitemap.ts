import type { MetadataRoute } from "next";
import { locales, localeTags } from "@/i18n/config";
import { getPostSlugs, hasPublishedCeo } from "@/lib/content";
import { getProductSlugs, getProductUpdates } from "@/lib/products";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, ceo, posts, productUpdates] = await Promise.all([
    getProductSlugs(),
    hasPublishedCeo(),
    getPostSlugs(),
    getProductUpdates(),
  ]);
  const paths = [
    "",
    "/products",
    "/green-coffee",
    "/cashew-kernels",
    "/about",
    "/process",
    "/gallery",
    ...(ceo ? ["/about-ceo"] : []),
    "/contact",
    "/company-profile",
    ...slugs.map((slug) => `/products/${slug}`),
    ...(posts.length ? ["/insights"] : []),
    ...posts.map((post) => `/insights/${post.slug}`),
  ];
  // Only real edit dates: products (updated_at), articles (published_at) and the insights index (its
  // newest article). Other static pages get none. All normalised to ISO 8601.
  const iso = (date: string) => new Date(date).toISOString();
  const newestPost = posts.map((post) => post.published_at).sort().at(-1);
  const lastModified = new Map<string, string>([
    ...Object.entries(productUpdates).map(([slug, date]) => [`/products/${slug}`, iso(date)] as [string, string]),
    ...posts.map((post) => [`/insights/${post.slug}`, iso(post.published_at)] as [string, string]),
    ...(newestPost ? [["/insights", iso(newestPost)] as [string, string]] : []),
  ]);

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      ...(lastModified.has(path) && { lastModified: lastModified.get(path) }),
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((l) => [localeTags[l], `${site.url}/${l}${path}`])),
          "x-default": `${site.url}/en${path}`,
        },
      },
    })),
  );
}
