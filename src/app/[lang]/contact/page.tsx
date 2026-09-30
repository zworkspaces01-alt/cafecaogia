import type { Metadata } from "next";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { Clock, Mail, MapPin } from "lucide-react";
import { InquiryForm } from "@/components/inquiry-form";
import { PageHero } from "@/components/page-hero";
import { format } from "@/i18n/format";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { getSettings, whatsappLink } from "@/lib/content";
import { getProducts } from "@/lib/products";
import { photos, site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return {
    title: dict.contact.metaTitle,
    description: dict.contact.metaDescription,
    alternates: localeAlternates(locale, "/contact"),
  };
}

export default async function ContactPage({ searchParams }: PageProps<"/[lang]/contact">) {
  const { product: productParam, sample } = await searchParams;
  const [locale, dict, products, settings] = await Promise.all([
    getLocale(),
    getDictionary(),
    getProducts(),
    getSettings(),
  ]);
  const { contact } = settings;
  const t = dict.contact;
  const selected = products.find((p) => p.slug === productParam);
  const { address } = contact;

  const contacts = [
    { icon: Mail, label: t.email, value: contact.email, href: `mailto:${contact.email}` },
    {
      icon: WhatsAppIcon,
      label: `${t.whatsapp} / ${t.phone}`,
      value: contact.whatsapp,
      href: whatsappLink(contact.whatsapp),
      ltr: true,
      brand: true,
    },
    { icon: MapPin, label: t.office, value: `${address.street}, ${address.locality}, ${address.country}`, ltr: true },
    { icon: Clock, label: t.hours, value: t.hoursValue },
  ];

  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={t.title} accent={t.accent} description={t.description} image={photos.portShip} />

      <section className="py-16 md:py-24">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_1.8fr]">
          <aside>
            <div data-reveal-stagger>
              <h2 className="text-2xl font-medium text-forest">{t.asideTitle}</h2>
              <p className="mt-3 text-muted">{t.asideBody}</p>
            </div>
            <ul data-reveal-stagger className="mt-8 space-y-3">
              {contacts.map(({ icon: Icon, label, value, href, ltr, brand }) => (
                <li key={label} className="flex items-start gap-4 rounded-2xl bg-white p-4">
                  <span
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${brand ? "bg-[#25d366] text-white" : "bg-lime text-forest"}`}
                  >
                    <Icon className="size-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xs text-muted">{label}</span>
                    {href ? (
                      <a
                        href={href}
                        dir={ltr ? "ltr" : undefined}
                        className="text-sm font-medium break-words text-forest hover:text-leaf"
                        {...(href.startsWith("http") && { target: "_blank", rel: "noopener noreferrer" })}
                      >
                        {value}
                      </a>
                    ) : (
                      <span dir={ltr ? "ltr" : undefined} className="block text-sm font-medium text-forest">
                        {value}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
            <div data-reveal className="mt-6 rounded-2xl border border-mist p-5 text-sm text-muted">
              <p className="font-medium text-forest">{t.tradeTerms}</p>
              <p className="mt-2">
                {t.incoterms}: {site.incoterms.join(", ")}
              </p>
              <p>
                {t.payment}: {site.paymentTerms.join(", ")}
              </p>
            </div>
          </aside>

          <InquiryForm
            locale={locale}
            t={dict.form}
            defaultProduct={selected?.slug}
            defaultMessage={selected && sample ? format(t.sampleMessage, { product: selected.name }) : undefined}
          />
        </div>
      </section>
    </>
  );
}
