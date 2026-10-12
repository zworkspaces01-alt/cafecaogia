import type { Metadata } from "next";
import { locales, localeTags, type Locale } from "@/i18n/config";
import { site } from "@/lib/site";

/** Canonical + hreflang alternates for a locale-less path such as "/products". */
export function localeAlternates(locale: Locale, path = ""): Metadata["alternates"] {
  const suffix = path === "/" ? "" : path;
  return {
    canonical: `/${locale}${suffix}`,
    languages: {
      ...Object.fromEntries(locales.map((l) => [localeTags[l], `/${l}${suffix}`])),
      "x-default": `/en${suffix}`,
    },
  };
}

const ogLocales: Record<Locale, string> = { en: "en_US", ru: "ru_RU", ar: "ar_AR" };

/**
 * Open Graph fields shared by every page. Next.js replaces (not merges) a parent's `openGraph`, so a
 * page that sets its own must spread this in; pass the locale-less path to also set `og:url`.
 */
export function openGraphBase(locale: Locale, path?: string) {
  return {
    siteName: site.name,
    locale: ogLocales[locale],
    alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocales[l]),
    ...(path !== undefined && { url: `/${locale}${path === "/" ? "" : path}` }),
  };
}
