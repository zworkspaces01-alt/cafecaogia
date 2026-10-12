import { ProductCard } from "@/components/product-card";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { getDictionary } from "@/i18n/server";
import type { Category, Product } from "@/lib/types";
import { ProductTabs } from "./product-tabs";

/** Six cards per tab, featured grades first. */
const pick = (products: Product[]) => [...products.filter((p) => p.featured), ...products.filter((p) => !p.featured)].slice(0, 6);

export async function FeaturedProducts({ products }: { products: Product[] }) {
  const dict = await getDictionary();
  const t = dict.featured;

  const list = (items: Product[], reveal: boolean) => (
    <ul
      data-reveal-stagger={reveal || undefined}
      className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 md:-mx-10 md:px-10 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0"
    >
      {items.map((product) => (
        <li key={product.slug} className="w-[80%] shrink-0 snap-start sm:w-[45%] lg:w-auto">
          <ProductCard product={product} categoryLabel={dict.categories[product.category]} />
        </li>
      ))}
    </ul>
  );

  const categories: Category[] = ["coffee", "cashew"];
  const tabs = [
    // Only the first list animates in: the hidden ones have no layout for the scroll trigger to measure.
    { key: "all", label: dict.productsPage.all, panel: list(pick(products), true) },
    ...categories
      .map((category) => ({ category, items: pick(products.filter((p) => p.category === category)) }))
      .filter(({ items }) => items.length > 0)
      .map(({ category, items }) => ({ key: category, label: dict.categories[category], panel: list(items, false) })),
  ];

  return (
    <section id="featured" className="scroll-mt-20 bg-white py-20 md:py-28">
      <div className="container-page">
        <SectionHeading eyebrow={t.eyebrow} title={t.title} accent={t.accent} description={t.description} />
      </div>

      <div className="container-page mt-12">
        <ProductTabs label={dict.productsPage.filterLabel} tabs={tabs} />
        <div data-reveal className="mt-12 flex justify-center">
          <ButtonLink href="/products" variant="outline-dark" arrow>
            {dict.common.viewAllProducts}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
