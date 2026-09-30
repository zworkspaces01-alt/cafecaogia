import Image from "next/image";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { PartnerMark } from "@/components/partner-logo";
import { partnerSegmentImages } from "@/data/partners";
import { getPartners } from "@/lib/content";
import { getDictionary } from "@/i18n/server";

export async function Partners() {
  const [{ partners: t }, partners] = await Promise.all([getDictionary(), getPartners()]);

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          accent={t.accent}
          description={t.description}
        />

        {partners.length > 0 && (
          <div className="mt-12">
            <div data-reveal className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted">{t.logosTitle}</p>
            </div>
            <ul
              data-reveal-stagger
              className="mt-4 grid grid-cols-2 overflow-hidden rounded-3xl border border-mist sm:grid-cols-4"
            >
              {partners.map((partner) => (
                <li
                  key={partner.id}
                  className="group relative -mb-px -ms-px grid h-28 place-items-center border-s border-b border-mist px-4 text-forest/50 transition-colors duration-300 hover:bg-sand hover:text-forest"
                >
                  <PartnerMark partner={partner} className="transition-transform duration-300 group-hover:scale-105" />
                  <span className="absolute end-3 top-3 text-sm opacity-0 transition-opacity group-hover:opacity-100" aria-hidden>
                    {partner.country}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ul data-reveal-stagger className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {t.segments.map((segment, i) => (
            <li key={segment.title} className="group flex flex-col overflow-hidden rounded-3xl bg-sand">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={partnerSegmentImages[i]}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute start-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-forest tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h3 className="text-lg font-medium text-forest">{segment.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{segment.body}</p>
                <ul className="mt-5 flex flex-wrap gap-1.5">
                  {segment.products.map((product) => (
                    <li key={product} className="rounded-full bg-white px-3 py-1 text-xs text-forest">
                      {product}
                    </li>
                  ))}
                </ul>
              </div>
            </li>
          ))}
        </ul>

        <div
          data-reveal
          className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-forest px-6 py-6 text-white md:px-8"
        >
          <div>
            <p className="text-lg font-medium">
              {t.becomeTitle} <em className="font-serif font-normal text-lime">{t.becomeAccent}</em>
            </p>
            <p className="mt-1 text-sm text-white/70">
              {t.becomeBody}
            </p>
          </div>
          <ButtonLink href="/contact" arrow>
            {t.becomeCta}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
}
