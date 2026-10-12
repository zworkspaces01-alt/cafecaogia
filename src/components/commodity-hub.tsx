import { ArrowUpRight, Plus } from "lucide-react";
import { CtaBanner } from "@/components/cta-banner";
import { breadcrumbList, JsonLd, webPage } from "@/components/json-ld";
import Link from "@/components/link";
import { PageHero } from "@/components/page-hero";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { localeTags, type Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { site } from "@/lib/site";
import { hubPaths } from "@/lib/hubs";
import type { Category, Product } from "@/lib/types";

export type HubKey = Category;
export { hubPaths };

/** Raw export grades only; roasted and flavoured products live on /products. */
export const isExportGrade = (product: Product) => !/roast|flavou?red/i.test(`${product.name} ${product.grade}`);

/**
 * A commodity landing page: Cao Gia's grades and terms first (what a buyer searching "Vietnam robusta
 * exporter" wants), then origin, grading and packing background with cited industry figures.
 */
export function CommodityHub({
  hub,
  products,
  dict,
  locale,
  image,
}: {
  hub: HubKey;
  products: Product[];
  dict: Dictionary;
  locale: Locale;
  image: string;
}) {
  const t = dict.hubs[hub];
  const l = dict.hubs.labels;
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

  return (
    <>
      <JsonLd data={jsonLd} />
      <PageHero eyebrow={t.eyebrow} title={t.title} accent={t.accent} description={t.description} image={image} />

      {/* Grades and terms */}
      <section className="py-20 md:py-28">
        <div className="container-page">
          <SectionHeading title={t.gradesTitle} accent={t.gradesAccent} description={t.gradesDescription} />

          <div data-reveal className="relative mt-12 overflow-x-auto rounded-3xl border border-mist bg-white">
            <table className="w-full min-w-[40rem] text-start text-sm">
              <thead className="bg-sand text-xs tracking-wide text-muted uppercase">
                <tr>
                  {[l.grade, l.spec, l.origin, l.moq].map((label) => (
                    <th key={label} scope="col" className="px-5 py-4 text-start font-medium">
                      {label}
                    </th>
                  ))}
                  <th scope="col" className="px-5 py-4">
                    <span className="sr-only">{l.view}</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {products.map((product) => (
                  <tr key={product.slug} className="align-top">
                    <th scope="row" className="px-5 py-4 text-start font-medium text-forest">
                      <Link href={`/products/${product.slug}`} className="hover:text-leaf">
                        {product.name}
                      </Link>
                    </th>
                    <td className="px-5 py-4 text-muted">{product.grade}</td>
                    <td className="px-5 py-4 text-muted">{product.origin}</td>
                    <td className="px-5 py-4 text-muted">{product.moq}</td>
                    <td className="px-5 py-4 text-end">
                      <Link
                        href={`/contact?product=${product.slug}`}
                        className="inline-flex min-h-11 items-center gap-1 text-sm font-medium whitespace-nowrap text-leaf hover:text-forest"
                      >
                        {l.quote} <ArrowUpRight className="size-4 rtl:-scale-x-100" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div data-reveal className="mt-8 rounded-3xl bg-sand p-6 md:p-8">
            <p className="font-medium text-forest">{l.termsTitle}</p>
            <dl className="mt-5 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              {dict.tradeTerms.items.map((term) => (
                <div key={term.label}>
                  <dt className="text-sm text-muted">{term.label}</dt>
                  <dd className="mt-1 text-lg font-medium text-forest">{term.value}</dd>
                  <dd className="text-sm text-muted">{term.detail}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Industry figures */}
      <section className="bg-forest py-20 text-white md:py-28">
        <div className="container-page">
          <SectionHeading tone="light" title={t.factsTitle} accent={t.factsAccent} />
          <dl data-reveal-stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.facts.map((fact) => (
              <div key={fact.label} className="rounded-3xl bg-white/[0.06] p-6 ring-1 ring-white/10">
                <dt className="sr-only">{fact.label}</dt>
                <dd dir="ltr" className="text-4xl font-medium tracking-tight text-lime rtl:text-end">
                  {fact.value}
                </dd>
                <dd className="mt-3 text-sm leading-relaxed text-white/75">{fact.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Origin */}
      <section className="py-20 md:py-28">
        <div className="container-page">
          <SectionHeading title={t.originTitle} accent={t.originAccent} />
          <div data-reveal-stagger className="mt-12 grid gap-4 lg:grid-cols-3">
            {t.origins.map((origin) => (
              <article key={origin.title} className="rounded-3xl bg-white p-6 md:p-8">
                <h3 className="text-lg font-medium text-forest">{origin.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{origin.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Grading guide, packing and compliance */}
      <section className="bg-white py-20 md:py-28">
        <div className="container-page">
          <SectionHeading title={t.guideTitle} accent={t.guideAccent} description={t.guideIntro} />
          <div data-reveal className="relative mt-12 overflow-x-auto rounded-3xl border border-mist">
            <table className="w-full min-w-[32rem] text-start text-sm">
              <thead className="bg-sand text-xs tracking-wide text-muted uppercase">
                <tr>
                  {t.guideColumns.map((column) => (
                    <th key={column} scope="col" className="px-5 py-4 text-start font-medium">
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-mist">
                {t.guideRows.map(([grade, size, use]) => (
                  <tr key={grade}>
                    <th scope="row" className="px-5 py-4 text-start font-medium text-forest">
                      {grade}
                    </th>
                    <td dir="ltr" className="px-5 py-4 text-muted rtl:text-end">
                      {size}
                    </td>
                    <td className="px-5 py-4 text-muted">{use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p data-reveal className="mt-5 max-w-3xl text-sm leading-relaxed text-muted">
            {t.guideNote}
          </p>

          <div data-reveal-stagger className="mt-12 grid gap-4 lg:grid-cols-2">
            {t.notes.map((note) => (
              <article key={note.title} className="rounded-3xl bg-sand p-6 md:p-8">
                <h3 className="text-lg font-medium text-forest">{note.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted">{note.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Buyer questions and sources */}
      <section className="py-20 md:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <SectionHeading title={l.faqTitle} />
            <div data-reveal className="mt-8">
              <ButtonLink href="/contact" variant="dark" arrow>
                {l.quote}
              </ButtonLink>
            </div>
          </div>
          <div data-reveal className="divide-y divide-mist border-y border-mist">
            {t.faq.map((faq) => (
              <details key={faq.q} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-start text-base font-medium text-forest md:text-lg [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand transition-all group-open:rotate-45 group-open:bg-lime">
                    <Plus className="size-4" />
                  </span>
                </summary>
                <p className="max-w-2xl pb-6 text-[15px] leading-relaxed text-muted">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>

        <div className="container-page mt-16">
          <h2 className="text-sm font-medium text-forest">{l.sourcesTitle}</h2>
          <p className="mt-1 text-xs text-muted">{l.sourcesNote}</p>
          <ol className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {t.sources.map((source) => (
              <li key={source.url}>
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-start gap-1 text-muted underline decoration-mist underline-offset-4 hover:text-forest"
                >
                  {source.label}
                  <ArrowUpRight className="mt-0.5 size-3.5 shrink-0 rtl:-scale-x-100" />
                </a>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
