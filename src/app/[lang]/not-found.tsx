import { RenderBlocks } from "@/components/blocks/render-blocks";
import { getLocale } from "@/i18n/server";
import { loadSystemPage } from "@/lib/pages";

// The 404 message comes from the page builder (admin → Trang → Trang 404).
export default async function NotFound() {
  const [locale, page] = await Promise.all([getLocale(), loadSystemPage("not-found")]);
  return <RenderBlocks blocks={page?.blocks ?? []} locale={locale} />;
}
