import "server-only";

import type { Locale } from "@/i18n/config";
import type { Dictionary } from "./en";

export type { Dictionary };

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  en: () => import("./en").then((m) => m.en),
  ru: () => import("./ru").then((m) => m.ru),
  ar: () => import("./ar").then((m) => m.ar),
};

/** Loads a dictionary for an explicit locale — for Server Actions, which can't read root params. */
export const loadDictionary = (locale: Locale) => loaders[locale]();
