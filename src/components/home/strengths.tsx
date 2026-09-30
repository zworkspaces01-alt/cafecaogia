"use client";

import Image from "next/image";
import { useState } from "react";
import { FlaskConical, Handshake, Minus, Plus, Ship, Sprout } from "lucide-react";
import { SectionHeading } from "@/components/ui";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { photos } from "@/lib/site";
import { cn } from "@/lib/utils";

// Icon and photo per item; text comes from the dictionary (strengths.items, same order).
const visuals = [
  { icon: Sprout, image: photos.harvesters },
  { icon: FlaskConical, image: photos.greenBeansScoop },
  { icon: Handshake, image: photos.coffeeSack },
  { icon: Ship, image: photos.port },
];

export function Strengths({ t }: { t: Dictionary["strengths"] }) {
  const items = t.items.map((text, i) => ({ ...text, ...visuals[i] }));
  const [active, setActive] = useState(1);

  return (
    <section className="bg-white py-20 md:py-28">
      <div className="container-page">
        <SectionHeading
          eyebrow={t.eyebrow}
          title={t.title}
          accent={t.accent}
          description={t.description}
        />

        <div className="mt-14 grid gap-8 lg:grid-cols-2">
          <div data-reveal-stagger className="space-y-3">
            {items.map((item, i) => {
              const open = i === active;
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className={cn("rounded-2xl border transition-colors", open ? "border-mist bg-sand" : "border-mist bg-white")}
                >
                  <h3>
                    <button
                      type="button"
                      onClick={() => setActive(open ? -1 : i)}
                      aria-expanded={open}
                      aria-controls={`strength-${i}`}
                      className="flex w-full items-center gap-4 p-4 text-start md:p-5"
                    >
                      <span
                        className={cn(
                          "grid size-10 shrink-0 place-items-center rounded-xl transition-colors",
                          open ? "bg-lime text-forest" : "bg-sand text-forest/70",
                        )}
                      >
                        <Icon className="size-5" />
                      </span>
                      <span className="flex-1 text-base font-medium text-forest md:text-lg">{item.title}</span>
                      {open ? <Minus className="size-5 text-forest" /> : <Plus className="size-5 text-muted" />}
                    </button>
                  </h3>
                  <div
                    id={`strength-${i}`}
                    className={cn("grid transition-all duration-300", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}
                  >
                    <div className="overflow-hidden">
                      <p className="mx-4 mb-4 rounded-xl bg-white p-5 text-[15px] leading-relaxed text-muted md:mx-5 md:mb-5">
                        {item.body}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div data-reveal-image className="relative min-h-[360px] overflow-hidden rounded-3xl bg-mist lg:min-h-0">
            {items.map((item, i) => (
              <Image
                key={item.title}
                src={item.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className={cn(
                  "object-cover transition-[opacity,scale] duration-700",
                  i === Math.max(active, 0) ? "scale-100 opacity-100" : "scale-105 opacity-0",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
