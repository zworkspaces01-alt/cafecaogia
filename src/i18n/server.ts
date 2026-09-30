import { notFound } from "next/navigation";
import { lang } from "next/root-params";
import { isLocale, type Locale } from "@/i18n/config";
import { loadDictionary } from "@/i18n/dictionaries";

/** Current locale from the `[lang]` root segment. Usable in any Server Component. */
export async function getLocale(): Promise<Locale> {
  const value = await lang();
  if (!isLocale(value)) notFound();
  return value;
}

export async function getDictionary() {
  return loadDictionary(await getLocale());
}
