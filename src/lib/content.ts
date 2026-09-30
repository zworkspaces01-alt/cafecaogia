import "server-only";

import { cache } from "react";
import { defaultSettings, sampleCertifications, samplePartners, sampleTeam, sampleTestimonials } from "@/data/samples";
import type { Locale } from "@/i18n/config";
import { getLocale } from "@/i18n/server";
import { getSupabase } from "@/lib/supabase";
import type { CertificationRow, PartnerRow, SiteSettings, TeamMemberRow, TestimonialRow } from "@/lib/types";

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

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const supabase = getSupabase();
  if (!supabase) return defaultSettings;
  const { data, error } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  if (error) throw new Error(`Failed to load site settings: ${error.message}`);
  const saved = (data?.data ?? {}) as Partial<SiteSettings>;
  // Shallow-merge each group so newly added settings keep their defaults.
  return {
    company: { ...defaultSettings.company, ...saved.company },
    contact: {
      ...defaultSettings.contact,
      ...saved.contact,
      address: { ...defaultSettings.contact.address, ...saved.contact?.address },
    },
    socials: { ...defaultSettings.socials, ...saved.socials },
    memberships: saved.memberships ?? defaultSettings.memberships,
    stats: saved.stats?.length ? saved.stats : defaultSettings.stats,
  };
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
