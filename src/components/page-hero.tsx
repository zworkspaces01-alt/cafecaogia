import Image from "next/image";
import type { ReactNode } from "react";
import { Eyebrow } from "@/components/ui";

export function PageHero({
  eyebrow,
  title,
  accent,
  description,
  image,
}: {
  eyebrow: string;
  title: ReactNode;
  accent?: ReactNode;
  description?: ReactNode;
  image: string;
}) {
  return (
    <section className="relative isolate overflow-hidden bg-forest text-white">
      <div data-hero-bg className="absolute inset-x-0 -top-[6%] -bottom-[6%] -z-10">
        <Image src={image} alt="" fill priority sizes="100vw" className="object-cover" />
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/55 to-ink/40" />
      <div className="container-page pt-40 pb-16 md:pt-48 md:pb-20">
        <div className="max-w-2xl">
          <div data-hero-fade>
            <Eyebrow tone="light">{eyebrow}</Eyebrow>
          </div>
          <h1 className="mt-5 text-4xl leading-[1.05] font-medium tracking-tight md:text-6xl">
            <span className="block overflow-hidden pb-[0.08em]">
              <span data-hero-line className="block">
                {title}
              </span>
            </span>
            {accent && (
              <span className="block overflow-hidden pb-[0.08em]">
                <em data-hero-line className="block font-serif font-normal">
                  {accent}
                </em>
              </span>
            )}
          </h1>
          {description && <p data-hero-fade className="mt-5 max-w-xl text-white/80 md:text-lg">{description}</p>}
        </div>
      </div>
    </section>
  );
}
