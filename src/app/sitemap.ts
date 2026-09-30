import type { MetadataRoute } from "next";
import { locales, localeTags } from "@/i18n/config";
import { hasPublishedCeo } from "@/lib/content";
import { getProductSlugs } from "@/lib/products";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, ceo] = await Promise.all([getProductSlugs(), hasPublishedCeo()]);
  const paths = [
    "",
    "/products",
    "/about",
    "/process",
    ...(ceo ? ["/about-ceo"] : []),
    "/contact",
    "/company-profile",
    ...slugs.map((slug) => `/products/${slug}`),
  ];

  return paths.flatMap((path) =>
    locales.map((locale) => ({
      url: `${site.url}/${locale}${path}`,
      changeFrequency: "monthly" as const,
      priority: path === "" ? 1 : path.startsWith("/products/") ? 0.7 : 0.8,
      alternates: {
        languages: Object.fromEntries(locales.map((l) => [localeTags[l], `${site.url}/${l}${path}`])),
      },
    })),
  );
}
