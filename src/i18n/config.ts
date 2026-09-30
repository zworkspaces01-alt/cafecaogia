// Shared by server and client code — keep this file free of server-only imports.

export const locales = ["en", "ru", "ar"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, { native: string; short: string }> = {
  en: { native: "English", short: "EN" },
  ru: { native: "Русский", short: "RU" },
  ar: { native: "العربية", short: "AR" },
};

/** BCP 47 tags used for Intl formatting and hreflang. */
export const localeTags: Record<Locale, string> = { en: "en", ru: "ru", ar: "ar" };

export const isLocale = (value: string | undefined): value is Locale =>
  !!value && (locales as readonly string[]).includes(value);

export const isRtl = (locale: Locale) => locale === "ar";

export const LOCALE_COOKIE = "NEXT_LOCALE";

/** Prefixes an internal path with the locale: "/products" → "/ru/products", "/#process" → "/ru#process". */
export function localizeHref(href: string, locale: string | undefined) {
  if (!locale || !href.startsWith("/") || href.startsWith("//")) return href;
  const [, first] = href.split(/[/?#]/);
  if (isLocale(first)) return href;
  if (href === "/") return `/${locale}`;
  if (href.startsWith("/#") || href.startsWith("/?")) return `/${locale}${href.slice(1)}`;
  return `/${locale}${href}`;
}

/** Swaps the locale segment of a pathname: "/ru/products" → "/ar/products". */
export function switchLocalePath(pathname: string, locale: Locale) {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) parts[1] = locale;
  else parts.splice(1, 0, locale);
  return parts.join("/") || `/${locale}`;
}
