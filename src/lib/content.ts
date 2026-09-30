import "server-only";

import { cache } from "react";
import { samplePosts } from "@/data/posts";
import { defaultSettings, sampleCertifications, samplePartners, sampleTeam, sampleTestimonials } from "@/data/samples";
import type { Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import { mergeSettings } from "@/lib/settings";
import { getSupabase } from "@/lib/supabase";
import type { CertificationRow, PartnerRow, PostRow, SiteSettings, TeamMemberRow, TestimonialRow } from "@/lib/types";

type WithTranslations = { translations?: Record<string, Record<string, unknown> | undefined> | null };

/** Overlays the row's Russian/Arabic fields (when present and non-empty) on the English ones. */
function localize<T extends WithTranslations>(row: T, locale: Locale): Omit<T, "translations"> {
  const { translations, ...base } = row;
  if (locale === "en" || !translations?.[locale]) return base;
  const overrides = Object.fromEntries(
    Object.entries(translations[locale] ?? {}).filter(([, v]) => (Array.isArray(v) ? v.length > 0 : Boolean(v))),
  );
  return { ...base, ...overrides };
}

/** Reads a published, ordered content table, falling back to the bundled starter content. */
async function readTable<T>(table: string, fallback: T[]): Promise<T[]> {
  const supabase = getSupabase();
  if (!supabase) return fallback.filter((row) => (row as { published?: boolean }).published !== false);
  const { data, error } = await supabase.from(table).select("*").eq("published", true).order("sort_order");
  if (error) throw new Error(`Failed to load ${table}: ${error.message}`);
  return data as T[];
}

export type Testimonial = Omit<TestimonialRow, "translations">;
export type Partner = PartnerRow;
export type Certification = Omit<CertificationRow, "translations">;
export type TeamMember = Omit<TeamMemberRow, "translations">;
export type Post = Omit<PostRow, "translations">;

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = getSupabase();
  if (!supabase) return defaultSettings;
  const { data, error } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Failed to load site settings: ${error.message}`);
  return mergeSettings((data?.data ?? {}) as Partial<SiteSettings>);
});

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const [locale, rows] = await Promise.all([getLocale(), readTable<TestimonialRow>("testimonials", sampleTestimonials)]);
  return rows.map((row) => localize(row, locale));
});

export const getPartners = cache(async (): Promise<Partner[]> => readTable<PartnerRow>("partners", samplePartners));

export const getCertifications = cache(async (): Promise<Certification[]> => {
  const [locale, rows] = await Promise.all([
    getLocale(),
    readTable<CertificationRow>("certifications", sampleCertifications),
  ]);
  return rows.map((row) => localize(row, locale));
});

export const getTeam = cache(async (): Promise<TeamMember[]> => {
  const [locale, rows] = await Promise.all([getLocale(), readTable<TeamMemberRow>("team_members", sampleTeam)]);
  return rows.map((row) => localize(row, locale));
});

export async function getCeo(): Promise<TeamMember | null> {
  return (await getTeam()).find((m) => m.is_ceo) ?? null;
}

/** People buyers can contact directly (everyone except the CEO profile). */
export async function getContacts(): Promise<TeamMember[]> {
  return (await getTeam()).filter((m) => !m.is_ceo && (m.email || m.whatsapp));
}

export const whatsappLink = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;

/** Locale-free check used by the sitemap (which has no [lang] segment). */
export async function hasPublishedCeo(): Promise<boolean> {
  return (await readTable<TeamMemberRow>("team_members", sampleTeam)).some((m) => m.is_ceo);
}

// ── Insights ────────────────────────────────────────────────────────────────

/** Newest first. A missing `posts` table (migration 0005 not run yet) reads as "no posts" instead of breaking every page. */
const readPosts = cache(async (): Promise<PostRow[]> => {
  const supabase = getSupabase();
  if (!supabase) return samplePosts.filter((post) => post.published);
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .eq("published", true)
    .order("published_at", { ascending: false })
    .order("sort_order");
  if (error?.code === "PGRST205" || error?.code === "42P01") {
    console.warn("[posts] table not found — run supabase/migrations/0005_posts.sql");
    return [];
  }
  if (error) throw new Error(`Failed to load posts: ${error.message}`);
  return data as PostRow[];
});

export const getPosts = cache(async (): Promise<Post[]> => {
  const [locale, rows] = await Promise.all([getLocale(), readPosts()]);
  return rows.map((row) => localize(row, locale));
});

export async function getPost(slug: string): Promise<Post | null> {
  return (await getPosts()).find((post) => post.slug === slug) ?? null;
}

/** Articles tagged with a product, for its product page. */
export async function getPostsForProduct(slug: string): Promise<Post[]> {
  return (await getPosts()).filter((post) => post.product_slugs.includes(slug));
}

/** Locale-free, for generateStaticParams and the sitemap. */
export async function getPostSlugs(): Promise<{ slug: string; published_at: string }[]> {
  return (await readPosts()).map(({ slug, published_at }) => ({ slug, published_at }));
}
