import type { Metadata } from "next";
import Image from "next/image";
import { CheckCircle2, ClipboardCheck, Factory, Package, Ship, Sprout, Trees } from "lucide-react";
import { CtaBanner } from "@/components/cta-banner";
import { PageHero } from "@/components/page-hero";
import { localeAlternates } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { pageMeta } from "@/lib/seo";
import { photos } from "@/lib/site";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict] = await Promise.all([getLocale(), getDictionary()]);
  return {
    ...(await pageMeta("process", { title: dict.processPage.metaTitle, description: dict.processPage.metaDescription })),
    alternates: localeAlternates(locale, "/process"),
  };
}

// Icon and photo per step, same order as `processPage.steps` in the dictionaries.
const visuals = [
  { icon: Trees, image: photos.hillside },
  { icon: Sprout, image: photos.harvester },
  { icon: Factory, image: photos.cashewRaw },
  { icon: ClipboardCheck, image: photos.greenBeans },
  { icon: Package, image: photos.coffeeSack },
  { icon: Ship, image: photos.port },
];

export default async function ProcessPage() {
  const { processPage: t } = await getDictionary();

  return (
    <>
      <PageHero eyebrow={t.eyebrow} title={t.title} accent={t.accent} description={t.description} image={photos.harvesters} />

      <section className="py-20 md:py-28">
        <div className="container-page">
          <ol className="relative">
            {/* Timeline rail; the lime fill grows with scroll (data-progress-line). */}
            <span aria-hidden className="absolute start-5 top-0 bottom-0 w-px bg-mist md:start-1/2" />
            <span
              aria-hidden
              data-progress-line
              className="absolute start-5 top-0 bottom-0 w-px origin-top bg-leaf md:start-1/2"
            />

            {t.steps.map((step, i) => {
              const { icon: Icon, image } = visuals[i];
              const flip = i % 2 === 1;
              return (
                <li key={step.title} className="relative grid gap-8 pb-20 ps-14 last:pb-0 md:grid-cols-2 md:gap-16 md:ps-0">
                  <span className="absolute start-0 top-0 z-10 grid size-10 place-items-center rounded-full bg-lime text-forest ring-8 ring-sand md:start-1/2 md:-translate-x-1/2 rtl:md:translate-x-1/2">
                    <Icon className="size-5" />
                  </span>

                  <div
                    data-reveal-image
                    className={cn(
                      "relative aspect-[4/3] overflow-hidden rounded-3xl bg-mist",
                      flip ? "md:order-2" : "md:order-1",
                    )}
                  >
                    <Image src={image} alt={step.title} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
                    <span className="absolute start-4 bottom-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-forest backdrop-blur">
                      {step.meta}
                    </span>
                  </div>

                  <div
                    data-reveal-stagger
                    className={cn("flex flex-col justify-center", flip ? "md:order-1 md:items-end md:text-end" : "md:order-2")}
                  >
                    <p className="text-sm tracking-[0.2em] text-moss uppercase">
                      {t.step} <span dir="ltr">{String(i + 1).padStart(2, "0")}</span>
                    </p>
                    <h2 className="mt-3 text-3xl font-medium tracking-tight text-forest md:text-4xl">{step.title}</h2>
                    <p className="mt-4 max-w-md leading-relaxed text-muted">{step.lead}</p>
                    <ul className={cn("mt-6 space-y-2.5", flip && "md:items-end")}>
                      {step.points.map((point) => (
                        <li key={point} className={cn("flex gap-2.5 text-sm text-forest", flip && "md:flex-row-reverse")}>
                          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-leaf" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      <CtaBanner />
    </>
  );
}
