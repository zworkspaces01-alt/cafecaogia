import type { Metadata } from "next";
import Image from "next/image";
import { ArrowUpRight, Building2, HeartHandshake, Leaf, ShieldCheck, Timer } from "lucide-react";
import { CtaBanner } from "@/components/cta-banner";
import { PageHero } from "@/components/page-hero";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { format } from "@/i18n/format";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { getSettings } from "@/lib/content";
import { pageMeta } from "@/lib/seo";
import { buyerVisitPhotos, factoryPhotos, photos, site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return {
    ...(await pageMeta("about", { title: dict.about.metaTitle, description: dict.about.metaDescription })),
    alternates: localeAlternates(locale, "/about"),
  };
}

// Icons and photos, same order as `about.values` / `about.regions` in the dictionaries.
const valueIcons = [ShieldCheck, HeartHandshake, Leaf, Timer];
const regionImages = [photos.cherriesBranch, photos.hillside, photos.cashewApple];

export default async function AboutPage() {
  const [locale, dict, settings] = await Promise.all([getLocale(), getDictionary(), getSettings()]);
  const t = dict.about;
  const { company, contact, memberships } = settings;
  const stats = settings.stats.map((s) => ({ value: s.value, label: s.label[locale] || s.label.en }));
  const { address } = contact;

  const companyDetails = [
    { label: dict.footer.company, value: `${company.legalName} (${company.legalNameVi})` },
    { label: dict.footer.enterpriseCode, value: company.enterpriseCode },
    { label: dict.stats.founded, value: String(company.foundingYear) },
    { label: dict.contact.office, value: `${address.street}, ${address.locality}, ${address.country}` },
  ];

  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={t.title} accent={t.accent} description={t.description} image={factoryPhotos.pallets} />

      <section className="py-20 md:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <SectionHeading eyebrow={t.storyEyebrow} title={t.storyTitle} accent={t.storyAccent} />
            <div data-reveal-stagger className="mt-6 space-y-4 leading-relaxed text-muted">
              {t.story.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div data-reveal-image className="relative aspect-[3/4] overflow-hidden rounded-3xl">
              <Image src={factoryPhotos.cherrySorting} alt={t.harvesterAlt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            </div>
            <div data-reveal-image className="relative mt-12 aspect-[3/4] overflow-hidden rounded-3xl">
              <Image src={photos.cashewRaw} alt={t.kernelsAlt} fill sizes="(min-width: 1024px) 25vw, 50vw" className="object-cover" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow={t.valuesEyebrow}
            title={t.valuesTitle}
            accent={t.valuesAccent}
            description={t.valuesDescription}
          />
          <ul data-reveal-stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.values.map(({ title, body }, i) => {
              const Icon = valueIcons[i];
              return (
                <li key={title} className="rounded-3xl bg-sand p-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-lime text-forest">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-6 text-lg font-medium text-forest">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{body}</p>
                </li>
              );
            })}
          </ul>
          <dl data-reveal-stagger className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse rounded-3xl bg-forest px-6 py-8 text-white">
                <dt className="mt-1 text-sm text-white/65">{s.label}</dt>
                <dd data-count={s.value} dir="ltr" className="text-start text-4xl font-medium tracking-tight text-lime tabular-nums rtl:text-end">
                  {s.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow={t.regionsEyebrow}
            title={t.regionsTitle}
            accent={t.regionsAccent}
            description={t.regionsDescription}
          />
          <ul data-reveal-stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {t.regions.map((r, i) => (
              <li key={r.name} className="overflow-hidden rounded-3xl bg-white">
                <div className="relative aspect-[4/3]">
                  <Image
                    src={regionImages[i]}
                    alt={format(t.regionAlt, { product: r.product, region: r.name })}
                    fill
                    sizes="(min-width: 768px) 33vw, 100vw"
                    className="object-cover"
                  />
                  <span className="absolute start-4 top-4 rounded-full bg-lime px-3 py-1 text-xs font-medium text-forest">
                    {r.product}
                  </span>
                </div>
                <div className="p-6">
                  <p className="text-xs tracking-wide text-moss uppercase">{r.area}</p>
                  <h3 className="mt-1 text-xl font-medium text-forest">{r.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{r.body}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div data-reveal className="rounded-3xl border border-mist bg-white p-6 md:p-8">
              <h2 className="flex items-center gap-3 text-lg font-medium text-forest">
                <Building2 className="size-5 text-leaf" /> {t.legalTitle}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {format(t.brandNote, { legalName: company.legalName, year: company.foundingYear })}
              </p>
              <dl className="mt-5 grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
                {companyDetails.map((item) => (
                  <div key={item.label}>
                    <dt className="text-muted">{item.label}</dt>
                    <dd className="mt-0.5 font-medium text-forest" dir="auto">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
              {memberships.length > 0 && (
                <div className="mt-6 border-t border-mist pt-5">
                  <p className="text-sm text-muted">{t.membershipsTitle}</p>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {memberships.map((m) => (
                      <li key={m.name}>
                        {m.url ? (
                          <a href={m.url} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full bg-sand px-3 py-1.5 text-xs font-medium text-forest hover:bg-mist">
                            {m.name}
                          </a>
                        ) : (
                          <span className="inline-flex rounded-full bg-sand px-3 py-1.5 text-xs font-medium text-forest">{m.name}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <ButtonLink href="/company-profile" variant="outline-dark" arrow className="mt-6">
                {dict.profile.download}
              </ButtonLink>
            </div>

            <div data-reveal className="flex flex-col rounded-3xl bg-forest p-6 text-white md:p-8">
              <ShieldCheck className="size-8 text-lime" />
              <h2 className="mt-5 text-xl font-medium">{t.verifyTitle}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">
                {format(t.verifyBody, { code: company.enterpriseCode })}
              </p>
              <p className="mt-5 font-mono text-3xl tracking-wider text-lime" dir="ltr">
                {company.enterpriseCode}
              </p>
              <a
                href={site.registryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-white px-5 text-sm font-medium text-forest transition-colors hover:bg-lime"
              >
                {t.verifyCta} <ArrowUpRight className="size-4 rtl:-scale-x-100" />
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="container-page">
          <SectionHeading
            eyebrow={t.visitsEyebrow}
            title={t.visitsTitle}
            accent={t.visitsAccent}
            description={t.visitsDescription}
          />
          <ul data-reveal-stagger className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4">
            {buyerVisitPhotos.map((src, i) => (
              <li key={src} className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-mist">
                <Image
                  src={src}
                  alt={t.visitPhotos[i]}
                  fill
                  sizes="(min-width: 768px) 33vw, 50vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
