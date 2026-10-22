import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenderBlocks } from "@/components/blocks/render-blocks";
import { JsonLd, schemaIds } from "@/components/json-ld";
import { format } from "@/i18n/format";
import { localeAlternates, openGraphBase } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { imageUrl } from "@/lib/image-url";
import { loadSystemPage } from "@/lib/pages";
import { getProduct } from "@/lib/products";
import { site } from "@/lib/site";

export const revalidate = 3600;

// Rendered on first visit, then cached (see [lang]/layout.tsx).
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[slug]">): Promise<Metadata> {
  const [product, locale, dict] = await Promise.all([getProduct((await params).slug), getLocale(), getDictionary()]);
  if (!product) return {};
  return {
    title:
      product.seo_title?.trim() ||
      format(dict.product.metaTitle, { name: product.name, category: dict.categories[product.category] }),
    description:
      product.seo_description?.trim() ||
      format(dict.product.metaDescription, {
        summary: product.summary,
        grade: product.grade,
        origin: product.origin,
        moq: product.moq,
      }),
    alternates: localeAlternates(locale, `/products/${product.slug}`),
    openGraph: {
      type: "website",
      ...openGraphBase(locale, `/products/${product.slug}`),
      images: [{ url: imageUrl(product.image), alt: product.name }],
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/products/[slug]">) {
  const [product, dict, locale, template] = await Promise.all([
    getProduct((await params).slug),
    getDictionary(),
    getLocale(),
    loadSystemPage("product-template"),
  ]);
  if (!product) notFound();
  const t = dict.product;
  const categoryLabel = dict.categories[product.category];

  const pageUrl = `${site.url}/${locale}/products/${product.slug}`;
  const property = (name: string, value: string) => ({ "@type": "PropertyValue", name, value });
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${pageUrl}#product`,
        url: pageUrl,
        sku: product.slug,
        name: product.name,
        description: product.description,
        image: [product.image, ...product.gallery].map((src) => imageUrl(src)),
        category: categoryLabel,
        countryOfOrigin: "VN",
        brand: { "@type": "Brand", name: site.name },
        manufacturer: { "@type": "Organization", "@id": schemaIds.organization, name: site.name },
        // Grade specs, origin, packing and MOQ as machine-readable facts (no public prices, so no Offer).
        additionalProperty: [
          ...product.specs.filter((s) => s.label && s.value).map((s) => property(s.label, s.value)),
          ...(product.origin ? [property(t.origin, product.origin)] : []),
          ...(product.packaging ? [property(t.packing, product.packaging)] : []),
          ...(product.moq ? [property(t.moq, product.moq)] : []),
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: dict.nav.home, item: `${site.url}/${locale}` },
          { "@type": "ListItem", position: 2, name: t.products, item: `${site.url}/${locale}/products` },
          { "@type": "ListItem", position: 3, name: product.name, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      {/* Layout from the page builder's product template (admin → Trang → Mẫu trang sản phẩm). */}
      <RenderBlocks blocks={template?.blocks ?? []} locale={locale} context={{ product }} />
    </>
  );
}
