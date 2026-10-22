import "server-only";

import type { Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import { all, first } from "@/lib/db";
import { draftRows, showingDrafts } from "@/lib/preview";
import type { Category, Product, ProductTranslations } from "@/lib/types";

const columns =
  "slug, name, category, grade, summary, description, image, gallery, origin, specs, packaging, moq, featured, translations, seo_title, seo_description";

type ProductRow = Product & { translations?: ProductTranslations | null };

function localize(product: ProductRow, locale: Locale): Product {
  const { translations, ...base } = product;
  if (locale === "en") return base;
  const text = translations?.[locale];
  // SEO copy is per language: without a translation, fall back to the localized name, not the English title.
  return { ...base, seo_title: "", seo_description: "", ...text };
}

/** Published rows; in the Studio preview, with the drafts applied (lib/preview.ts). */
async function readProducts(category?: Category): Promise<ProductRow[]> {
  if (showingDrafts()) return (await draftRows<ProductRow>("products")).filter((p) => !category || p.category === category);
  return category
    ? all<ProductRow>(`select ${columns} from products where published = 1 and category = ? order by sort_order`, category)
    : all<ProductRow>(`select ${columns} from products where published = 1 order by sort_order`);
}

/** Products in the current page language (from the `[lang]` segment). */
export async function getProducts(category?: Category): Promise<Product[]> {
  const [locale, rows] = await Promise.all([getLocale(), readProducts(category)]);
  return rows.map((p) => localize(p, locale));
}

/** Featured products first, topped up with the rest so the home grid always fills two rows of three. */
export async function getFeaturedProducts(limit = 6): Promise<Product[]> {
  const products = await getProducts();
  return [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, limit);
}

export async function getProduct(slug: string): Promise<Product | null> {
  const [locale, row] = await Promise.all([
    getLocale(),
    showingDrafts()
      ? readProducts().then((rows) => rows.find((p) => p.slug === slug) ?? null)
      : first<ProductRow>(`select ${columns} from products where published = 1 and slug = ?`, slug),
  ]);
  return row ? localize(row, locale) : null;
}

/** Slugs only, locale-independent — for the sitemap. */
export async function getProductSlugs(): Promise<string[]> {
  return (await all<{ slug: string }>("select slug from products where published = 1")).map((row) => row.slug);
}

/** Last edit of each published product, for the sitemap's lastmod. */
export async function getProductUpdates(): Promise<Record<string, string>> {
  const rows = await all<{ slug: string; updated_at: string }>("select slug, updated_at from products where published = 1");
  return Object.fromEntries(rows.map((row) => [row.slug, row.updated_at]));
}

/**
 * Name and category of a product for server actions and notifications, which have no [lang] segment.
 * The name is English unless a locale is passed.
 */
export async function getProductSummary(slug: string, locale: Locale = "en"): Promise<Pick<Product, "name" | "category"> | null> {
  const row = await first<Pick<ProductRow, "slug" | "name" | "category" | "translations">>(
    "select slug, name, category, translations from products where slug = ?",
    slug,
  );
  if (!row) return null;
  const name = locale === "en" ? "" : row.translations?.[locale]?.name;
  return { name: name || row.name, category: row.category };
}
