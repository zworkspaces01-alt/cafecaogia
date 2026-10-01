"use client";

import Image from "next/image";
import { useState } from "react";
import { ClipboardCheck, Factory, MapPin, Ship, Sprout } from "lucide-react";
import { SectionHeading } from "@/components/ui";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { factoryPhotos } from "@/lib/site";
import { cn } from "@/lib/utils";

// Icon and photo per step; text comes from the dictionary (process.steps, same order).
const visuals = [
  { icon: Sprout, image: factoryPhotos.cherrySorting },
  { icon: Factory, image: factoryPhotos.greenhouseDrying },
  { icon: ClipboardCheck, image: factoryPhotos.greenBeansHand },
  { icon: Ship, image: factoryPhotos.sacksLiners },
];

export function Process({
  t,
  stats,
}: {
  t: Dictionary["process"];
  stats: { value: string; label: string }[];
}) {
  const [active, setActive] = useState(2);
  const steps = t.steps.map((text, i) => ({ ...text, ...visuals[i] }));
  const step = steps[active];

  return (
    <section id="process" className="scroll-mt-20 py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          accent={t.accent}
          description={t.description}
        />

        <div data-reveal-stagger role="tablist" aria-label={t.tablistLabel} className="mt-12 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const selected = i === active;
            return (
              <button
                key={s.title}
                role="tab"
                type="button"
                aria-selected={selected}
                aria-controls="process-panel"
                onClick={() => setActive(i)}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border p-3 text-start transition-colors",
                  selected ? "border-forest/10 bg-white shadow-sm" : "border-transparent bg-white/60 hover:bg-white",
                )}
              >
                <span
                  className={cn(
                    "grid size-10 shrink-0 place-items-center rounded-xl",
                    selected ? "bg-lime text-forest" : "bg-sand text-forest/60",
                  )}
                >
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-forest">{s.title}</span>
                  <span className="block text-xs text-muted">{s.caption}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div
          id="process-panel"
          role="tabpanel"
          data-reveal-image
          className="relative mt-4 aspect-[4/5] overflow-hidden rounded-3xl bg-mist sm:aspect-[16/10] lg:aspect-[16/7]"
        >
          {steps.map((s, i) => (
            <Image
              key={s.title}
              src={s.image}
              alt={`${s.title} — ${s.caption}`}
              fill
              sizes="(min-width: 1280px) 1200px, 100vw"
              className={cn(
                "object-cover transition-[opacity,scale] duration-1000",
                i === active ? "scale-100 opacity-100" : "scale-110 opacity-0",
              )}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent" />

          <span className="absolute start-5 bottom-5 flex items-center gap-2 rounded-full bg-ink/40 px-3 py-1.5 text-xs text-white backdrop-blur">
            <MapPin className="size-3.5" /> {step.location}
          </span>

          <div
            key={step.title}
            className="absolute end-5 top-5 w-56 animate-rise rounded-2xl bg-white/95 p-4 shadow-xl backdrop-blur md:end-8 md:top-8 md:w-64"
          >
            <p className="text-[11px] tracking-wide text-muted uppercase">{step.heading}</p>
            <p className="mt-2 text-3xl font-medium tracking-tight text-forest">{step.big}</p>
            <p className="mt-1 text-xs text-muted">{step.sub}</p>
            <div className="mt-4 flex gap-0.5" aria-hidden>
              {Array.from({ length: 28 }, (_, i) => (
                <span
                  key={i}
                  className="h-5 flex-1 rounded-[2px]"
                  style={{ backgroundColor: i < 7 ? "#e8c26a" : i < 13 ? "#c9e47a" : "#7fbf5b", opacity: 0.55 + (i % 4) * 0.12 }}
                />
              ))}
            </div>
            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-mist pt-3">
              {step.rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] text-muted">{label}</dt>
                  <dd className="text-sm font-medium text-forest">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        <dl data-reveal-stagger className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse rounded-2xl bg-white px-4 py-6 text-center">
              <dt className="mt-1 text-sm text-muted">{s.label}</dt>
              <dd data-count={s.value} dir="ltr" className="text-3xl font-medium tracking-tight text-forest tabular-nums md:text-4xl">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
