import type { Metadata } from "next";
import { locales, localeTags, type Locale } from "@/i18n/config";

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
