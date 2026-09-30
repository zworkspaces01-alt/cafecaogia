import "server-only";

import type { PostgrestError } from "@supabase/supabase-js";
import { productTranslations } from "@/data/product-translations";
import { sampleProducts } from "@/data/products";
import type { Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import { getSupabase } from "@/lib/supabase";
import type { Category, Product, ProductTranslations } from "@/lib/types";

const baseColumns =
  "slug, name, category, grade, summary, description, image, gallery, origin, specs, packaging, moq, featured, translations";
const columns = `${baseColumns}, seo_title, seo_description`;

/** Runs a products query, retrying without the SEO columns until migration 0006 has been run. */
async function withColumns<T>(run: (columns: string) => PromiseLike<{ data: T; error: PostgrestError | null }>) {
  const result = await run(columns);
  if (result.error?.code !== "42703") return result;
  console.warn("[products] SEO columns missing — run supabase/migrations/0006_seo_analytics.sql");
  return run(baseColumns);
}

type ProductRow = Product & { translations?: ProductTranslations | null };

function localize(product: ProductRow, locale: Locale): Product {
  const { translations, ...base } = product;
  if (locale === "en") return base;
  const text = (translations ?? productTranslations[product.slug])?.[locale];
  // SEO copy is per language: without a translation, fall back to the localized name, not the English title.
  return { ...base, seo_title: "", seo_description: "", ...text };
}

/** Products in the current page language (from the `[lang]` segment). */
export async function getProducts(category?: Category): Promise<Product[]> {
  const locale = await getLocale();
  const supabase = getSupabase();
  if (!supabase) {
    const rows = category ? sampleProducts.filter((p) => p.category === category) : sampleProducts;
    return rows.map((p) => localize(p, locale));
  }

  const { data, error } = await withColumns((columns) => {
    const query = supabase.from("products").select(columns).eq("published", true).order("sort_order");
    return category ? query.eq("category", category) : query;
  });
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data as unknown as ProductRow[]).map((p) => localize(p, locale));
}

/** Featured products first, topped up with the rest so the home grid always fills two rows of three. */
export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const products = await getProducts();
  return [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, limit);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const locale = await getLocale();
  const supabase = getSupabase();
  if (!supabase) {
    const product = sampleProducts.find((p) => p.slug === slug);
    return product ? localize(product, locale) : null;
  }

  const { data, error } = await withColumns((columns) =>
    supabase.from("products").select(columns).eq("published", true).eq("slug", slug).maybeSingle(),
  );
  if (error) throw new Error(`Failed to load product "${slug}": ${error.message}`);
  return data ? localize(data as unknown as ProductRow, locale) : null;
}

/** Slugs only, locale-independent — for generateStaticParams and the sitemap. */
export async function getProductSlugs(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return sampleProducts.map((p) => p.slug);
  const { data, error } = await supabase.from("products").select("slug").eq("published", true);
  if (error) throw new Error(`Failed to load product slugs: ${error.message}`);
  return data.map((row) => row.slug as string);
}

/** English name and category of a product, without a locale (server actions, notifications). */
export async function getProductSummary(slug: string): Promise<Pick<Product, "name" | "category"> | null> {
  const supabase = getSupabase();
  if (!supabase) {
    const product = sampleProducts.find((p) => p.slug === slug);
    return product ? { name: product.name, category: product.category } : null;
  }
  const { data } = await supabase.from("products").select("name, category").eq("slug", slug).maybeSingle();
  return (data as Pick<Product, "name" | "category"> | null) ?? null;
}
