import Image from "next/image";
import { Words } from "@/components/motion";
import { Eyebrow } from "@/components/ui";
import { PartnerMark } from "@/components/partner-logo";
import { getPartners } from "@/lib/content";
import { getDictionary } from "@/i18n/server";
import { markets, photos } from "@/lib/site";

export async function Markets() {
  const [dict, partners] = await Promise.all([getDictionary(), getPartners()]);
  const items = partners.length > 0 ? partners : null;

  return (
    <section id="markets" className="border-b border-mist bg-white">
      <div className="container-page flex flex-col gap-6 py-8 md:flex-row md:items-center md:gap-12">
        <p data-reveal className="shrink-0 text-sm leading-snug text-muted">
          {items ? (
            <span className="font-medium text-forest">{dict.partners.logosTitle}</span>
          ) : (
            <>
              {dict.trustStrip.trustedBy}
              <br className="hidden md:block" /> <span className="font-medium text-forest">{dict.trustStrip.across}</span>
            </>
          )}
        </p>
        <div className="relative flex-1 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
          <ul className="flex w-max animate-marquee items-center hover:[animation-play-state:paused] rtl:animate-marquee-rtl">
            {items
              ? [...items, ...items].map((partner, i) => (
                  <li
                    key={i}
                    aria-hidden={i >= items.length}
                    className="flex shrink-0 items-center pe-14 text-forest/45 grayscale transition-colors hover:text-forest"
                  >
                    <PartnerMark partner={partner} />
                  </li>
                ))
              : [...markets, ...markets].map((market, i) => (
                  <li
                    key={i}
                    aria-hidden={i >= markets.length}
                    className="flex items-center gap-12 pe-12 text-sm font-semibold tracking-[0.18em] whitespace-nowrap text-forest/45 uppercase"
                  >
                    {dict.markets[market]}
                    <span className="size-1.5 rounded-full bg-lime-deep" />
                  </li>
                ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

export async function Statement() {
  const { statement: t } = await getDictionary();

  return (
    <section className="py-20 md:py-28">
      <div className="container-page">
        <div data-reveal>
          <Eyebrow>{t.eyebrow}</Eyebrow>
        </div>
        <p data-words className="mt-6 text-3xl leading-[1.3] font-medium tracking-tight text-forest md:text-[2.75rem]">
          <Words text={t.part1} />{" "}
          <span className="text-moss">
            <Words text={t.part2} />
            <span
              data-word
              className="relative mx-2 inline-block h-[0.85em] w-[2.2em] translate-y-[0.1em] overflow-hidden rounded-full align-baseline"
            >
              <Image src={photos.cherriesHand} alt="" fill sizes="120px" className="object-cover" />
            </span>
            <Words text={t.part3} />
          </span>
        </p>
      </div>
    </section>
  );
}
