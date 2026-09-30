import type { Metadata } from "next";
import { CtaBanner } from "@/components/cta-banner";
import Link from "@/components/link";
import { PageHero } from "@/components/page-hero";
import { ProductCard } from "@/components/product-card";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { getProducts } from "@/lib/products";
import { photos } from "@/lib/site";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return {
    title: dict.productsPage.metaTitle,
    description: dict.productsPage.metaDescription,
    alternates: localeAlternates(locale, "/products"),
  };
}

function parseCategory(value: string | string[] | undefined): Category | undefined {
  return value === "coffee" || value === "cashew" ? value : undefined;
}

export default async function ProductsPage({ searchParams }: PageProps<"/[lang]/products">) {
  const category = parseCategory((await searchParams).category);
  const [dict, products] = await Promise.all([getDictionary(), getProducts(category)]);
  const t = dict.productsPage;

  const filters: { value?: Category; label: string }[] = [
    { label: t.all },
    { value: "coffee", label: dict.categories.coffee },
    { value: "cashew", label: dict.categories.cashew },
  ];

  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={t.title} accent={t.accent} description={t.description} image={photos.coffeeSack} />

      <section className="py-16 md:py-20">
        <div className="container-page">
          <nav data-reveal aria-label={t.filterLabel} className="flex flex-wrap gap-2">
            {filters.map((f) => {
              const active = f.value === category;
              return (
                <Link
                  key={f.label}
                  href={f.value ? `/products?category=${f.value}` : "/products"}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "rounded-full px-5 py-2 text-sm transition-colors",
                    active ? "bg-forest text-white" : "bg-white text-forest hover:bg-mist",
                  )}
                >
                  {f.label}
                </Link>
              );
            })}
          </nav>

          <ul data-reveal-stagger className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <li key={product.slug}>
                <ProductCard product={product} categoryLabel={dict.categories[product.category]} />
              </li>
            ))}
          </ul>
          {products.length === 0 && <p className="mt-10 text-muted">{t.empty}</p>}
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
