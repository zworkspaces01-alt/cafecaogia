import type { Metadata } from "next";
import { CommodityHub, hubPaths, isExportGrade } from "@/components/commodity-hub";
import { localeAlternates, openGraphBase } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { getProducts } from "@/lib/products";
import { factoryPhotos } from "@/lib/site";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const t = dict.hubs.cashew;
  return {
    title: { absolute: `${t.metaTitle} | Cao Gia` },
    description: t.metaDescription,
    alternates: localeAlternates(locale, hubPaths.cashew),
    openGraph: { type: "website", ...openGraphBase(locale, hubPaths.cashew), images: [{ url: factoryPhotos.cashewKernelsPile }] },
  };
}

export default async function CashewKernelsPage() {
  const [locale, dict, products] = await Promise.all([getLocale(), getDictionary(), getProducts("cashew")]);
  return (
    <CommodityHub
      hub="cashew"
      products={products.filter(isExportGrade)}
      dict={dict}
      locale={locale}
      image={factoryPhotos.cashewKernelsPile}
    />
  );
}
