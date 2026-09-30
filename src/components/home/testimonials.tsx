"use client";

import Image from "next/image";
import { useRef } from "react";
import { ArrowLeft, ArrowRight, Quote, Star } from "lucide-react";
import { SectionHeading } from "@/components/ui";
import { format } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { cn } from "@/lib/utils";

export type TestimonialCard = {
  id: string;
  quote: string;
  name: string;
  role: string;
  company: string;
  country: string;
  flag: string;
  product: string | null;
  since: number | null;
  rating: number;
  image: string | null;
  logo: string | null;
};

export function Testimonials({ labels, items }: { labels: Dictionary["testimonials"]; items: TestimonialCard[] }) {
  const track = useRef<HTMLUListElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector("li");
    // In RTL layouts "next" scrolls toward negative scrollLeft.
    const rtl = getComputedStyle(el).direction === "rtl";
    el.scrollBy({ left: dir * (rtl ? -1 : 1) * ((card?.clientWidth ?? 400) + 20), behavior: "smooth" });
  };

  return (
    <section className="py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow={labels.eyebrow}
          title={labels.title}
          accent={labels.accent}
          description={labels.description}
        />

        <ul ref={track} data-reveal-stagger className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto">
          {items.map((t) => (
            <li
              key={t.id}
              className="grid w-[88%] shrink-0 snap-start grid-cols-1 gap-4 rounded-3xl bg-white p-4 sm:grid-cols-[1.3fr_1fr] md:w-[calc(50%-10px)]"
            >
              <figure className="flex flex-col p-3">
                <div className="flex items-center justify-between">
                  <Quote className="size-8 fill-mist text-mist" />
                  <div className="flex gap-0.5" role="img" aria-label={format(labels.rated, { n: t.rating })}>
                    {Array.from({ length: 5 }, (_, s) => (
                      <Star
                        key={s}
                        className={cn("size-4", s < t.rating ? "fill-amber-400 text-amber-400" : "fill-mist text-mist")}
                      />
                    ))}
                  </div>
                </div>
                <blockquote className="mt-5 flex-1 text-[17px] leading-relaxed font-medium text-forest">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-mist pt-5">
                  {t.logo ? (
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-sand">
                      <Image src={t.logo} alt={t.company} fill sizes="44px" className="object-contain p-1.5" />
                    </span>
                  ) : (
                    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-forest text-sm font-medium text-lime">
                      {t.name
                        .split(" ")
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2)}
                    </span>
                  )}
                  <span className="min-w-0">
                    <span className="block text-sm font-medium text-forest">{t.name}</span>
                    <span className="block truncate text-xs text-muted">
                      {t.role} · {t.company}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      <span aria-hidden>{t.flag}</span> {t.country}
                    </span>
                  </span>
                </figcaption>
              </figure>
              <div className="relative hidden overflow-hidden rounded-2xl bg-mist sm:block">
                {t.image && <Image src={t.image} alt="" fill sizes="300px" className="object-cover" />}
                <div className="absolute inset-x-3 bottom-3 space-y-1.5">
                  {t.product && (
                    <span className="block w-fit rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-forest backdrop-blur">
                      {format(labels.buys, { product: t.product })}
                    </span>
                  )}
                  {t.since && (
                    <span className="block w-fit rounded-full bg-forest/85 px-3 py-1 text-xs text-white backdrop-blur">
                      {format(labels.since, { year: t.since })}
                    </span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => scroll(-1)}
            aria-label={labels.previous}
            className="grid size-11 place-items-center rounded-full border border-forest/15 text-forest hover:bg-white"
          >
            <ArrowLeft className="size-4 rtl:-scale-x-100" />
          </button>
          <button
            type="button"
            onClick={() => scroll(1)}
            aria-label={labels.next}
            className="grid size-11 place-items-center rounded-full bg-forest text-white hover:bg-leaf"
          >
            <ArrowRight className="size-4 rtl:-scale-x-100" />
          </button>
        </div>
      </div>
    </section>
  );
}
