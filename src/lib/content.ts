import "server-only";

import { cache } from "react";
import type { Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import { all, first } from "@/lib/db";
import { mergeSettings } from "@/lib/settings";
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

type ContentTable = "testimonials" | "partners" | "certifications" | "team_members";

/** Reads a published content table in CMS order. */
function readTable<T>(table: ContentTable): Promise<T[]> {
  return all<T>(`select * from ${table} where published = 1 order by sort_order`);
}

export type Testimonial = Omit<TestimonialRow, "translations">;
export type Partner = PartnerRow;
export type Certification = Omit<CertificationRow, "translations">;
export type TeamMember = Omit<TeamMemberRow, "translations">;
export type Post = Omit<PostRow, "translations">;

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const row = await first<{ data: Partial<SiteSettings> }>("select data from site_settings where id = 1");
  return mergeSettings(row?.data ?? {});
});

export const getTestimonials = cache(async (): Promise<Testimonial[]> => {
  const [locale, rows] = await Promise.all([getLocale(), readTable<TestimonialRow>("testimonials")]);
  return rows.map((row) => localize(row, locale));
});

export const getPartners = cache(async (): Promise<Partner[]> => readTable<PartnerRow>("partners"));

export const getCertifications = cache(async (): Promise<Certification[]> => {
  const [locale, rows] = await Promise.all([
    getLocale(),
    readTable<CertificationRow>("certifications"),
  ]);
  return rows.map((row) => localize(row, locale));
});

export const getTeam = cache(async (): Promise<TeamMember[]> => {
  const [locale, rows] = await Promise.all([getLocale(), readTable<TeamMemberRow>("team_members")]);
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
  return (await readTable<TeamMemberRow>("team_members")).some((m) => m.is_ceo);
}

// ── Insights ────────────────────────────────────────────────────────────────

/** Newest first. */
const readPosts = cache(
  (): Promise<PostRow[]> => all<PostRow>("select * from posts where published = 1 order by published_at desc, sort_order"),
);

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

/** Locale-free, for the sitemap. */
export async function getPostSlugs(): Promise<{ slug: string; published_at: string }[]> {
  return (await readPosts()).map(({ slug, published_at }) => ({ slug, published_at }));
}
