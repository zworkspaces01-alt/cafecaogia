import { PartnerMark } from "@/components/partner-logo";
import { SectionHeading } from "@/components/ui";
import { getDictionary } from "@/i18n/server";
import { getPartners, type Partner } from "@/lib/content";
import type { Dictionary } from "@/i18n/dictionaries/en";

/**
 * Closing logo wall: the bank and shipping lines behind every Cao Gia shipment (edited in the
 * admin under "Đối tác"), as an endless strip that pauses on hover. Visitors who prefer reduced
 * motion get a static grid instead.
 */
export async function IndustryPartners({ t: text }: { t?: Dictionary["industryPartners"] } = {}) {
  const [dict, partners] = await Promise.all([getDictionary(), getPartners()]);
  const t = text ?? dict.industryPartners;
  if (partners.length === 0) return null;

  const logo = (partner: Partner) => (
    <>
      <PartnerMark
        partner={partner}
        className="transition duration-300 group-hover:scale-105"
      />
      {/* Rows saved before migration 0010 have no kind yet. */}
      {(partner.kind === "bank" || partner.kind === "shipping") && <span className="text-xs text-muted">{t.kinds[partner.kind]}</span>}
    </>
  );

  // Two copies of the list per half, so a single half is wider than the screen; the strip slides by
  // exactly one half (-50%) and loops without a seam.
  const half = [...partners, ...partners];

  return (
    <section className="pb-20 md:pb-28">
      <div className="container-page">
        <SectionHeading eyebrow={t.eyebrow} title={t.title} accent={t.accent} description={t.description} />

        <div
          data-reveal
          className="mt-12 overflow-hidden rounded-3xl border border-mist bg-white py-8 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] motion-reduce:hidden"
        >
          <ul className="flex w-max animate-marquee hover:[animation-play-state:paused] rtl:animate-marquee-rtl">
            {[...half, ...half].map((partner, i) => (
              <li
                key={i}
                aria-hidden={i >= partners.length || undefined}
                className="group flex w-40 shrink-0 flex-col items-center justify-center gap-3 px-4 text-forest md:w-56 md:gap-4 md:px-6"
              >
                {logo(partner)}
              </li>
            ))}
          </ul>
        </div>

        <ul className="mt-12 hidden grid-cols-2 overflow-hidden rounded-3xl border border-mist bg-white motion-reduce:grid sm:grid-cols-3 lg:grid-cols-6">
          {partners.map((partner) => (
            <li
              key={partner.id}
              className="group -mb-px -ms-px flex h-36 flex-col items-center justify-center gap-4 border-s border-b border-mist px-4 text-forest"
            >
              {logo(partner)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
