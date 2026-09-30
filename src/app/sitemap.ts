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
    "/about",
    "/process",
    ...(ceo ? ["/about-ceo"] : []),
    "/contact",
    "/company-profile",
    ...slugs.map((slug) => `/products/${slug}`),
    ...(posts.length ? ["/insights"] : []),
    ...posts.map((post) => `/insights/${post.slug}`),
  ];
  // Only real edit dates: products (updated_at) and articles (published_at). Static pages get none.
  const lastModified = new Map<string, string>([
    ...Object.entries(productUpdates).map(([slug, date]) => [`/products/${slug}`, date] as [string, string]),
    ...posts.map((post) => [`/insights/${post.slug}`, post.published_at] as [string, string]),
  ]);

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      ...(lastModified.has(path) && { lastModified: lastModified.get(path) }),
      changeFrequency: path === "/insights" ? ("weekly" as const) : ("monthly" as const),
      priority: path === "" ? 1 : path.startsWith("/products/") || path.startsWith("/insights/") ? 0.7 : 0.8,
      alternates: {
        languages: {
          ...Object.fromEntries(locales.map((l) => [localeTags[l], `${site.url}/${l}${path}`])),
          "x-default": `${site.url}/en${path}`,
        },
      },
    })),
  );
}
