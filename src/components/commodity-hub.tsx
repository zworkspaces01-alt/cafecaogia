import { breadcrumbList, JsonLd, webPage } from "@/components/json-ld";
import { localeTags, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { hubPaths } from "@/lib/hubs";
import { site } from "@/lib/site";
import type { Category, Product } from "@/lib/types";

export type HubKey = Category;
export { hubPaths };

/** Raw export grades only; roasted and flavoured products live on /products. */
export const isExportGrade = (product: Product) => !/roast|flavou?red/i.test(`${product.name} ${product.grade}`);

/**
 * Structured data for a commodity landing page (/green-coffee, /cashew-kernels): a CollectionPage
 * listing the grades, plus its breadcrumb. The sections themselves come from the page builder.
 */
export function CommodityHubJsonLd({ hub, products, dict, locale }: { hub: HubKey; products: Product[]; dict: Dictionary; locale: Locale }) {
  const t = dict.hubs[hub];
  const pageUrl = `${site.url}/${locale}${hubPaths[hub]}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        ...webPage("CollectionPage", pageUrl, t.metaTitle, localeTags[locale]),
        description: t.metaDescription,
        mainEntity: {
          "@type": "ItemList",
          itemListElement: products.map((product, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: product.name,
            url: `${site.url}/${locale}/products/${product.slug}`,
          })),
        },
      },
      breadcrumbList([
        { name: dict.nav.home, url: `${site.url}/${locale}` },
        { name: dict.nav.products, url: `${site.url}/${locale}/products` },
        { name: t.eyebrow, url: pageUrl },
      ]),
    ],
  };
  return <JsonLd data={jsonLd} />;
}
