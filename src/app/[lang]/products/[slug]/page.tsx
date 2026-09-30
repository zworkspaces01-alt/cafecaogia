import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/link";
import { notFound } from "next/navigation";
import { ChevronRight, MapPin, Package, Scale } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { format } from "@/i18n/format";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { imageUrl } from "@/lib/image-url";
import { getProduct, getProductSlugs, getProducts } from "@/lib/products";
import { site } from "@/lib/site";

export const revalidate = 3600;

export async function generateStaticParams() {
  return (await getProductSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps<"/[lang]/products/[slug]">): Promise<Metadata> {
  const [product, locale, dict] = await Promise.all([getProduct((await params).slug), getLocale(), getDictionary()]);
  if (!product) return {};
  return {
    title: format(dict.product.metaTitle, { name: product.name, category: dict.categories[product.category] }),
    description: product.summary,
    alternates: localeAlternates(locale, `/products/${product.slug}`),
    openGraph: { images: [{ url: imageUrl(product.image) }] },
  };
}

export default async function ProductPage({ params }: PageProps<"/[lang]/products/[slug]">) {
  const [product, dict] = await Promise.all([getProduct((await params).slug), getDictionary()]);
  if (!product) notFound();
  const t = dict.product;
  const categoryLabel = dict.categories[product.category];

  const related = (await getProducts(product.category)).filter((p) => p.slug !== product.slug).slice(0, 3);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: imageUrl(product.image),
    category: categoryLabel,
    countryOfOrigin: "VN",
    brand: { "@type": "Brand", name: site.name },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      <div className="bg-forest pt-28" />

      <section className="py-10 md:py-14">
        <div className="container-page">
          <nav aria-label={dict.common.breadcrumb} className="flex items-center gap-1.5 text-sm text-muted">
            <Link href="/products" className="hover:text-forest">
              {t.products}
            </Link>
            <ChevronRight className="size-3.5 rtl:-scale-x-100" />
            <Link href={`/products?category=${product.category}`} className="hover:text-forest">
              {categoryLabel}
            </Link>
            <ChevronRight className="size-3.5 rtl:-scale-x-100" />
            <span className="text-forest">{product.name}</span>
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
            <div data-reveal-stagger className="grid grid-cols-2 gap-3 self-start lg:sticky lg:top-24">
              <div className="relative col-span-2 aspect-[4/3] overflow-hidden rounded-3xl bg-mist">
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  priority
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>
              {product.gallery.slice(0, 2).map((src) => (
                <div key={src} className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-mist">
                  <Image src={src} alt="" fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
                </div>
              ))}
            </div>

            <div data-reveal-stagger>
              <p className="text-sm tracking-wide text-moss uppercase">{product.grade}</p>
              <h1 className="mt-2 text-4xl leading-tight font-medium tracking-tight text-forest md:text-5xl">
                {product.name}
              </h1>
              <p className="mt-5 text-lg leading-relaxed text-forest/80">{product.summary}</p>
              <p className="mt-4 leading-relaxed text-muted">{product.description}</p>

              <ul className="mt-8 grid gap-3 sm:grid-cols-3">
                {[
                  { icon: MapPin, label: t.origin, value: product.origin },
                  { icon: Scale, label: t.moq, value: product.moq },
                  { icon: Package, label: t.packing, value: product.packaging },
                ].map(({ icon: Icon, label, value }) => (
                  <li key={label} className="rounded-2xl bg-white p-4">
                    <Icon className="size-4 text-leaf" />
                    <p className="mt-3 text-xs text-muted">{label}</p>
                    <p className="mt-0.5 text-sm font-medium text-forest">{value}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-8 overflow-hidden rounded-2xl bg-white">
                <h2 className="border-b border-mist px-5 py-4 text-sm font-medium text-forest">{t.specification}</h2>
                <dl className="divide-y divide-mist">
                  {product.specs.map((spec) => (
                    <div key={spec.label} className="flex justify-between gap-4 px-5 py-3 text-sm">
                      <dt className="text-muted">{spec.label}</dt>
                      <dd className="text-end font-medium text-forest">{spec.value}</dd>
                    </div>
                  ))}
                  <div className="flex justify-between gap-4 px-5 py-3 text-sm">
                    <dt className="text-muted">{t.terms}</dt>
                    <dd className="text-end font-medium text-forest">
                      {site.incoterms.slice(0, 3).join(" / ")} · {site.paymentTerms.join(", ")}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <ButtonLink href={`/contact?product=${product.slug}`} variant="dark" arrow>
                  {t.requestQuote}
                </ButtonLink>
                <ButtonLink href={`/contact?product=${product.slug}&sample=1`} variant="outline-dark">
                  {t.askSample}
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-white py-20">
          <div className="container-page">
            <SectionHeading title={t.relatedTitle} accent={t.relatedAccent} />
            <ul data-reveal-stagger className="mt-10 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((p) => (
                <li key={p.slug}>
                  <ProductCard product={p} categoryLabel={dict.categories[p.category]} />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
