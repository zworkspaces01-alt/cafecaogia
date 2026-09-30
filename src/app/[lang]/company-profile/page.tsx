import type { Metadata } from "next";
import { LogoMark, Wordmark } from "@/components/logo";
import { PrintButton } from "@/components/print-button";
import { localeTags } from "@/i18n/config";
import { format } from "@/i18n/format";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { getContacts, getSettings } from "@/lib/content";
import { getProducts } from "@/lib/products";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return {
    ...(await pageMeta("company-profile", { title: dict.profile.metaTitle, description: dict.profile.metaDescription })),
    alternates: localeAlternates(locale, "/company-profile"),
  };
}

/** A print-ready one-document company profile (A4). "Download PDF" uses the browser's Save as PDF. */
export default async function CompanyProfilePage() {
  const [locale, dict, products, settings, contacts] = await Promise.all([
    getLocale(),
    getDictionary(),
    getProducts(),
    getSettings(),
    getContacts(),
  ]);
  const t = dict.profile;
  const { company } = settings;
  const { address } = settings.contact;
  const contact = contacts[0];
  const today = new Intl.DateTimeFormat(localeTags[locale], { year: "numeric", month: "long" }).format(new Date());

  const details = [
    { label: dict.footer.company, value: company.legalName },
    { label: "", value: company.legalNameVi },
    { label: dict.footer.enterpriseCode, value: company.enterpriseCode },
    { label: dict.stats.founded, value: String(company.foundingYear) },
    { label: dict.contact.office, value: `${address.street}, ${address.locality}, ${address.country}` },
  ].filter((d) => d.label);

  return (
    <div className="bg-forest pt-28 print:bg-white print:pt-0">
      <div className="bg-sand py-10 md:py-14 print:bg-white print:py-0">
        <article className="container-page max-w-4xl">
          <div className="rounded-3xl bg-white p-6 shadow-xl shadow-black/5 md:p-12 print:rounded-none print:p-0 print:shadow-none">
            <header className="flex flex-wrap items-start justify-between gap-6 border-b border-mist pb-8">
              <div className="flex items-center gap-4">
                <LogoMark tone="onLight" className="size-14" />
                <div>
                  <Wordmark tone="onLight" className="text-3xl" />
                  <p className="mt-1 text-xs tracking-[0.3em] text-muted uppercase" dir="ltr">
                    Coffee · Cashew · Vietnam
                  </p>
                </div>
              </div>
              <div className="text-end">
                <h1 className="text-2xl font-medium text-forest">{t.title}</h1>
                <p className="mt-1 text-sm text-muted">{format(t.prepared, { date: today })}</p>
              </div>
            </header>

            <div className="mt-6">
              <PrintButton label={t.print} hint={t.printHint} />
            </div>

            <section className="mt-10 break-inside-avoid">
              <h2 className="text-lg font-medium text-forest">{t.aboutTitle}</h2>
              <p className="mt-3 text-sm leading-relaxed text-muted">{dict.meta.description}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {format(dict.about.brandNote, { legalName: company.legalName, year: company.foundingYear })}
              </p>
              <dl className="mt-5 grid gap-x-8 gap-y-3 rounded-2xl bg-sand p-5 text-sm sm:grid-cols-2 print:bg-transparent print:p-0">
                {details.map((d) => (
                  <div key={d.label}>
                    <dt className="text-muted">{d.label}</dt>
                    <dd className="font-medium text-forest" dir="auto">
                      {d.value}
                      {d.label === dict.footer.company && <span className="block font-normal text-muted">{company.legalNameVi}</span>}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-10">
              <h2 className="text-lg font-medium text-forest">{t.productsTitle}</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-start text-sm">
                  <thead>
                    <tr className="border-b border-mist text-xs text-muted">
                      <th className="py-2 pe-4 text-start font-normal">{t.product}</th>
                      <th className="py-2 pe-4 text-start font-normal">{t.grade}</th>
                      <th className="py-2 pe-4 text-start font-normal">{dict.product.origin}</th>
                      <th className="py-2 pe-4 text-start font-normal">{dict.product.moq}</th>
                      <th className="py-2 text-start font-normal">{dict.product.packing}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-mist">
                    {products.map((p) => (
                      <tr key={p.slug} className="break-inside-avoid align-top">
                        <td className="py-3 pe-4 font-medium text-forest">
                          {p.name}
                          <span className="block text-xs font-normal text-muted">{dict.categories[p.category]}</span>
                        </td>
                        <td className="py-3 pe-4 text-muted">{p.grade}</td>
                        <td className="py-3 pe-4 text-muted">{p.origin}</td>
                        <td className="py-3 pe-4 text-muted">{p.moq}</td>
                        <td className="py-3 text-muted">{p.packaging}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mt-10 break-inside-avoid">
              <h2 className="text-lg font-medium text-forest">{t.termsTitle}</h2>
              <dl className="mt-4 grid gap-3 sm:grid-cols-3">
                {dict.tradeTerms.items.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-mist p-4">
                    <dt className="text-xs text-muted">{item.label}</dt>
                    <dd className="mt-1 font-medium text-forest">{item.value}</dd>
                    <dd className="mt-0.5 text-xs text-muted">{item.detail}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="mt-10 grid gap-8 md:grid-cols-2 print:grid-cols-2">
              <div className="break-inside-avoid">
                <h2 className="text-lg font-medium text-forest">{t.processTitle}</h2>
                <ol className="mt-4 space-y-3">
                  {dict.processPage.steps.map((step, i) => (
                    <li key={step.title} className="flex gap-3 text-sm">
                      <span className="grid size-6 shrink-0 place-items-center rounded-full bg-lime text-xs font-medium text-forest" dir="ltr">
                        {i + 1}
                      </span>
                      <span>
                        <span className="block font-medium text-forest">{step.title}</span>
                        <span className="block text-muted">{step.lead}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="break-inside-avoid">
                <h2 className="text-lg font-medium text-forest">{dict.compliance.documentsTitle}</h2>
                <ul className="mt-4 list-disc space-y-1.5 ps-5 text-sm text-muted marker:text-leaf">
                  {dict.compliance.documents.map((doc) => (
                    <li key={doc}>{doc}</li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="mt-10 break-inside-avoid rounded-2xl bg-forest p-6 text-white print:border print:border-forest print:bg-white print:text-forest">
              <h2 className="text-lg font-medium">{t.contactTitle}</h2>
              <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-3">
                {contact && (
                  <div>
                    <dt className="opacity-60">{t.contactPerson}</dt>
                    <dd className="font-medium">{contact.name}</dd>
                    <dd className="opacity-80">{contact.role}</dd>
                  </div>
                )}
                <div>
                  <dt className="opacity-60">{dict.contact.email}</dt>
                  <dd className="font-medium">{settings.contact.email}</dd>
                  {contact && <dd className="opacity-80">{contact.email}</dd>}
                </div>
                <div>
                  <dt className="opacity-60">{dict.contact.whatsapp}</dt>
                  <dd className="font-medium" dir="ltr">
                    {settings.contact.whatsapp}
                  </dd>
                  <dd className="opacity-80" dir="ltr">
                    {site.url.replace(/^https?:\/\//, "")}
                  </dd>
                </div>
              </dl>
              <p className="mt-5 border-t border-white/15 pt-4 text-xs opacity-70 print:border-mist">
                {format(dict.about.verifyBody, { code: company.enterpriseCode })} — {site.registryUrl.replace(/^https?:\/\//, "")}
              </p>
            </section>
          </div>
        </article>
      </div>
    </div>
  );
}
