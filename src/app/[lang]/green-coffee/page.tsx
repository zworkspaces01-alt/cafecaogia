import type { Metadata } from "next";
import { RenderBlocks } from "@/components/blocks/render-blocks";
import { CommodityHubJsonLd, hubPaths, isExportGrade } from "@/components/commodity-hub";
import { localeAlternates, openGraphBase } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { loadSystemPage, systemPageSeo } from "@/lib/pages";
import { getProducts } from "@/lib/products";
import { factoryPhotos } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.hubs.coffee;
  const custom = await systemPageSeo("green-coffee", locale);
  return {
    title: { absolute: custom.title ?? `${t.metaTitle} | Cao Gia` },
    description: custom.description ?? t.metaDescription,
    alternates: localeAlternates(locale, hubPaths.coffee),
    openGraph: { type: "website", ...openGraphBase(locale, hubPaths.coffee), images: [{ url: factoryPhotos.dryingBeds }] },
  };
}

export default async function GreenCoffeePage() {
  const [locale, dict, products, page] = await Promise.all([
    getLocale(),
    getDictionary(),
    getProducts("coffee"),
    loadSystemPage("green-coffee"),
  ]);
  return (
    <>
      <CommodityHubJsonLd hub="coffee" products={products.filter(isExportGrade)} dict={dict} locale={locale} />
      {/* Sections come from the page builder (admin → Trang). */}
      <RenderBlocks blocks={page?.blocks ?? []} locale={locale} />
    </>
  );
}
