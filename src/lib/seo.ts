import "server-only";

import { getLocale } from "@/i18n/server";
import { getSettings } from "@/lib/content";
import type { MetaText, SeoPageKey } from "@/lib/types";

/** A page's title and description: the CMS override for the current language, else the built-in copy. */
export async function pageMeta(page: SeoPageKey, fallback: MetaText): Promise<MetaText> {
  const [locale, { seo }] = await Promise.all([getLocale(), getSettings()]);
  const override = seo.pages[page]?.[locale];
  return {
    title: override?.title?.trim() || fallback.title,
    description: override?.description?.trim() || fallback.description,
  };
}
