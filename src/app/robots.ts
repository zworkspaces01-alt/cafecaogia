import type { MetadataRoute } from "next";
import { getSettings } from "@/lib/content";
import { site } from "@/lib/site";

export const revalidate = 3600;

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { seo } = await getSettings();
  // Indexing switched off in CMS → SEO: keep every crawler out (the pages also carry noindex).
  if (!seo.indexing) return { rules: { userAgent: "*", disallow: "/" } };

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/admin" },
    sitemap: `${site.url}/sitemap.xml`,
  };
}
