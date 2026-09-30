import "server-only";

import { productTranslations } from "@/data/product-translations";
import { sampleProducts } from "@/data/products";
import type { Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import { getSupabase } from "@/lib/supabase";
import type { Category, Product, ProductTranslations } from "@/lib/types";

const columns =
  "slug, name, category, grade, summary, description, image, gallery, origin, specs, packaging, moq, featured, translations";

type ProductRow = Product & { translations?: ProductTranslations | null };

function localize(product: ProductRow, locale: Locale): Product {
  const { translations, ...base } = product;
  if (locale === "en") return base;
  const text = (translations ?? productTranslations[product.slug])?.[locale];
  return text ? { ...base, ...text } : base;
}

/** Products in the current page language (from the `[lang]` segment). */
export async function getProducts(category?: Category): Promise<Product[]> {
  const locale = await getLocale();
  const supabase = getSupabase();
  if (!supabase) {
    const rows = category ? sampleProducts.filter((p) => p.category === category) : sampleProducts;
    return rows.map((p) => localize(p, locale));
  }

  let query = supabase.from("products").select(columns).eq("published", true).order("sort_order");
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) throw new Error(`Failed to load products: ${error.message}`);
  return (data as ProductRow[]).map((p) => localize(p, locale));
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

  const { data, error } = await supabase
    .from("products")
    .select(columns)
    .eq("published", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Failed to load product "${slug}": ${error.message}`);
  return data ? localize(data as ProductRow, locale) : null;
}

/** Slugs only, locale-independent — for generateStaticParams and the sitemap. */
export async function getProductSlugs(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return sampleProducts.map((p) => p.slug);
  const { data, error } = await supabase.from("products").select("slug").eq("published", true);
  if (error) throw new Error(`Failed to load product slugs: ${error.message}`);
  return data.map((row) => row.slug as string);
}
