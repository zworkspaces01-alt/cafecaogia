import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CheckCircle2, Globe2, Mail, Plane, Ruler, ShieldCheck } from "lucide-react";
import { CtaBanner } from "@/components/cta-banner";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { JsonLd, schemaIds } from "@/components/json-ld";
import { LogoMark } from "@/components/logo";
import { PageHero } from "@/components/page-hero";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { getCeo, whatsappLink } from "@/lib/content";
import { imageUrl } from "@/lib/image-url";
import { pageMeta } from "@/lib/seo";
import { factoryPhotos, site } from "@/lib/site";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict, ceo] = await Promise.all([getLocale(), getDictionary(), getCeo()]);
  if (!ceo) return {};
  return {
    ...(await pageMeta("about-ceo", { title: dict.ceo.metaTitle, description: dict.ceo.metaDescription })),
    alternates: localeAlternates(locale, "/about-ceo"),
  };
}

const focusIcons = [Plane, ShieldCheck, Globe2, Ruler];

export default async function AboutCeoPage() {
  const [dict, leader, locale] = await Promise.all([getDictionary(), getCeo(), getLocale()]);
  if (!leader) notFound();
  const t = dict.ceo;

  const pageUrl = `${site.url}/${locale}/about-ceo`;
  const profileJsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    url: pageUrl,
    inLanguage: locale,
    mainEntity: {
      "@type": "Person",
      "@id": `${pageUrl}#person`,
      name: leader.name,
      jobTitle: leader.role,
      ...(leader.photo && { image: imageUrl(leader.photo) }),
      ...(leader.bio[0] && { description: leader.bio[0] }),
      worksFor: { "@type": "Organization", "@id": schemaIds.organization, name: site.name },
    },
  };

  return (
    <>
      <JsonLd data={profileJsonLd} />
      <PageHero
        eyebrow={t.eyebrow}
        title={t.title}
        accent={t.accent}
        description={t.description}
        image={factoryPhotos.processingFloor}
      />

      <section className="py-20 md:py-28">
        <div className="container-page grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div data-reveal-image className="relative aspect-[4/5] overflow-hidden rounded-3xl bg-forest">
            {leader.photo ? (
              <Image
                src={leader.photo}
                alt={leader.name}
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center">
                <LogoMark className="size-40 opacity-90" />
              </div>
            )}
            <div className="absolute inset-x-4 bottom-4 rounded-2xl bg-white/90 p-4 backdrop-blur">
              <p className="text-lg font-medium text-forest">{leader.name}</p>
              <p className="text-sm text-muted">{leader.role} · Cao Gia</p>
            </div>
          </div>

          <div data-reveal-stagger>
            <p className="text-sm tracking-[0.2em] text-moss uppercase">{leader.role}</p>
            <h2 className="mt-3 text-4xl font-medium tracking-tight text-forest md:text-5xl">{leader.name}</h2>
            <div className="mt-6 space-y-4 leading-relaxed text-muted">
              {leader.bio.map((paragraph) => (
                <p key={paragraph.slice(0, 24)}>{paragraph}</p>
              ))}
            </div>
            {leader.quote && (
              <blockquote className="mt-8 border-s-4 border-lime ps-5 font-serif text-2xl leading-snug text-forest italic md:text-3xl">
                &ldquo;{leader.quote}&rdquo;
              </blockquote>
            )}
            <div className="mt-8">
              <p className="text-sm text-muted">{t.contactTitle}</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {leader.email && (
                  <a
                    href={`mailto:${leader.email}`}
                    className="inline-flex h-11 items-center gap-2 rounded-full border border-forest/20 px-5 text-sm font-medium text-forest transition-colors hover:bg-forest hover:text-white"
                  >
                    <Mail className="size-4" /> {leader.email}
                  </a>
                )}
                {leader.whatsapp && (
                  <a
                    href={whatsappLink(leader.whatsapp)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center gap-2 rounded-full bg-[#25d366] px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
                    dir="ltr"
                  >
                    <WhatsAppIcon className="size-4" /> {leader.whatsapp}
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-20 md:py-28">
        <div className="container-page">
          <SectionHeading eyebrow={t.focusEyebrow} title={t.focusTitle} accent={t.focusAccent} />
          <ul data-reveal-stagger className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {t.focus.map((item, i) => {
              const Icon = focusIcons[i];
              return (
                <li key={item.title} className="rounded-3xl bg-sand p-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-lime text-forest">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="mt-6 text-lg font-medium text-forest">{item.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.body}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <section className="bg-forest py-20 text-white md:py-28">
        <div className="container-page">
          <SectionHeading
            tone="light"
            eyebrow={t.principlesEyebrow}
            title={t.principlesTitle}
            accent={t.principlesAccent}
          />
          <ol
            data-reveal-stagger
            className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4"
          >
            {t.principles.map((item, i) => (
              <li key={item.title} className="bg-forest p-6 md:p-8">
                <span className="font-serif text-5xl text-lime italic" dir="ltr">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-6 text-lg font-medium">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{item.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="py-20 md:py-28">
        <div className="container-page grid gap-10 lg:grid-cols-2 lg:items-center">
          <SectionHeading title={t.buyersTitle} accent={t.buyersAccent} />
          <div data-reveal-stagger className="rounded-3xl bg-white p-6 md:p-8">
            <ul className="space-y-4">
              {t.buyers.map((item) => (
                <li key={item} className="flex gap-3 text-forest">
                  <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-leaf" />
                  {item}
                </li>
              ))}
            </ul>
            <ButtonLink href="/contact" variant="dark" arrow className="mt-8">
              {dict.common.requestQuote}
            </ButtonLink>
          </div>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
