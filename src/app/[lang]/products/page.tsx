import type { Metadata } from "next";
import { RenderBlocks } from "@/components/blocks/render-blocks";
import { breadcrumbList, JsonLd, webPage } from "@/components/json-ld";
import { localeTags } from "@/i18n/config";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { loadSystemPage, systemPageSeo } from "@/lib/pages";
import { getProducts } from "@/lib/products";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";
import type { Category } from "@/lib/types";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  const custom = await systemPageSeo("products", locale);
  return {
    ...(await pageMeta("products", { title: dict.productsPage.metaTitle, description: dict.productsPage.metaDescription })),
    ...(custom.title && { title: custom.title }),
    ...(custom.description && { description: custom.description }),
    alternates: localeAlternates(locale, "/products"),
  };
}

function parseCategory(value: string | string[] | undefined): Category | undefined {
  return value === "coffee" || value === "cashew" ? value : undefined;
}

// Filters come from the query string, so this page renders per request rather than from the ISR cache.
export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: PageProps<"/[lang]/products">) {
  const category = parseCategory((await searchParams).category);
  const [locale, dict, products, page] = await Promise.all([getLocale(), getDictionary(), getProducts(category), loadSystemPage("products")]);

  const pageUrl = `${site.url}/${locale}/products`;
  const pageJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...webPage("CollectionPage", pageUrl, dict.productsPage.metaTitle, localeTags[locale]),
        mainEntity: {
          "@type": "ItemList",
          itemListElement: products.map((product, i) => ({ "@type": "ListItem", position: i + 1, name: product.name, url: `${pageUrl}/${product.slug}` })),
        },
      },
      breadcrumbList([
        { name: dict.nav.home, url: `${site.url}/${locale}` },
        { name: dict.nav.products, url: pageUrl },
      ]),
    ],
  };

  return (
    <>
      <JsonLd data={pageJsonLd} />
      {/* Sections come from the page builder (admin → Trang). */}
      <RenderBlocks blocks={page?.blocks ?? []} locale={locale} context={{ productCategory: category }} />
    </>
  );
}
