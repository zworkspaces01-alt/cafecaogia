"use client";

import Image from "next/image";
import { useState } from "react";
import { Expand } from "lucide-react";
import { PhotoLightbox, type GalleryPhoto, type LightboxLabels } from "@/components/photo-gallery";
import { ButtonLink, SectionHeading } from "@/components/ui";
import { cn } from "@/lib/utils";

export type StoryPhoto = GalleryPhoto & { group: string };

type Labels = LightboxLabels & {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  all: string;
  view: string;
  filterLabel: string;
  seeAll: string;
};

/**
 * Which tiles are large (2×2 on desktop, full width on mobile). With b large tiles among n, the
 * 4-column grid fills completely when n + 3b is a multiple of 4, i.e. b ≡ n (mod 4).
 */
function largeTiles(n: number) {
  const count = n % 4 || (n >= 12 ? 4 : 0);
  const every = count > 0 ? Math.ceil(n / count) : Infinity;
  return (i: number) => i % every === 0 && i / every < count;
}

/** Homepage photo mosaic with stage filters; tiles open the shared full-size viewer. */
export function PhotoStories({
  photos,
  featured,
  groups,
  labels,
}: {
  photos: StoryPhoto[];
  /** Photos shown under "All" — a mix across stages, a multiple of 6 so the mosaic tiles evenly. */
  featured: StoryPhoto[];
  groups: { key: string; title: string }[];
  labels: Labels;
}) {
  const [filter, setFilter] = useState<string | null>(null);
  const [index, setIndex] = useState<number | null>(null);
  const shown = filter ? photos.filter((p) => p.group === filter) : featured;
  const isLarge = largeTiles(shown.length);
  const groupTitle = Object.fromEntries(groups.map((g) => [g.key, g.title]));

  const chip = (key: string | null, label: string) => (
    <button
      key={key ?? "all"}
      type="button"
      onClick={() => setFilter(key)}
      aria-pressed={filter === key}
      className={cn(
        "h-10 rounded-full border px-4 text-sm whitespace-nowrap transition-colors",
        filter === key ? "border-forest bg-forest text-white" : "border-mist bg-white text-forest hover:border-forest/40",
      )}
    >
      {label}
    </button>
  );

  return (
    <section className="py-20 md:py-28">
      <div className="container-page">
        <SectionHeading eyebrow={labels.eyebrow} title={labels.title} accent={labels.accent} description={labels.description} />

        <div
          role="group"
          aria-label={labels.filterLabel}
          className="-mx-5 mt-10 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] md:mx-0 md:flex-wrap md:px-0"
        >
          {chip(null, labels.all)}
          {groups.map((g) => chip(g.key, g.title))}
        </div>

        <ul
          key={filter ?? "all"}
          className="mt-8 grid grid-flow-dense auto-rows-[10rem] grid-cols-2 gap-3 sm:auto-rows-[13rem] lg:auto-rows-[11rem] lg:grid-cols-4 lg:gap-4"
        >
          {shown.map((photo, i) => (
            <li
              key={photo.src}
              className={cn("animate-[rise_0.6s_cubic-bezier(0.2,0.7,0.2,1)_both]", isLarge(i) && "col-span-2 lg:row-span-2")}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${labels.view}: ${photo.alt}`}
                className="group relative block size-full overflow-hidden rounded-2xl bg-mist text-start text-white md:rounded-3xl"
              >
                <Image
                  src={photo.src}
                  alt={photo.alt}
                  fill
                  sizes={isLarge(i) ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/5 to-ink/35" />
                <span className="absolute inset-x-3 top-3 truncate text-[10px] font-medium tracking-[0.14em] text-white/85 uppercase md:inset-x-4 md:top-4 md:text-[11px] md:tracking-[0.2em]">
                  {groupTitle[photo.group]}
                </span>
                <span className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-3 md:inset-x-4 md:bottom-4">
                  <span className={cn("line-clamp-2 text-xs leading-snug md:text-sm", !isLarge(i) && "max-md:hidden")}>{photo.alt}</span>
                  <span className="ms-auto inline-flex shrink-0 items-center gap-1 rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur transition-colors group-hover:bg-white group-hover:text-forest">
                    <Expand className="size-3" />
                    {labels.view}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <ButtonLink href="/gallery" variant="outline-dark" arrow>
            {labels.seeAll}
          </ButtonLink>
        </div>
      </div>

      <PhotoLightbox photos={shown} index={index} onIndexChange={setIndex} labels={labels} />
    </section>
  );
}
