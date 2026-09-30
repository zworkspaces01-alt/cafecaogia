import { ProductCard } from "@/components/product-card";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { getDictionary } from "@/i18n/server";
import type { Product } from "@/lib/types";

export async function FeaturedProducts({ products }: { products: Product[] }) {
  const dict = await getDictionary();
  const t = dict.featured;

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container-page">
        <SectionHeading eyebrow={t.eyebrow} title={t.title} accent={t.accent} description={t.description} />
      </div>

      <div className="container-page mt-12">
        <ul
          data-reveal-stagger
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 md:-mx-10 md:px-10 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0"
        >
          {products.slice(0, 6).map((product) => (
            <li key={product.slug} className="w-[80%] shrink-0 snap-start sm:w-[45%] lg:w-auto">
              <ProductCard product={product} categoryLabel={dict.categories[product.category]} />
            </li>
          ))}
        </ul>
        <div data-reveal className="mt-12 flex justify-center">
          <ButtonLink href="/products" variant="outline-dark" arrow>
            {dict.common.viewAllProducts}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
