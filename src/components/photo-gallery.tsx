"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { format } from "@/i18n/format";
import { cn } from "@/lib/utils";

export type GalleryPhoto = { src: string; alt: string; tall?: boolean };
export type GallerySection = { key: string; title: string; description: string; count: string; photos: GalleryPhoto[] };

type Labels = { open: string; close: string; previous: string; next: string; counter: string };

/** Photo groups as grids; any photo opens full size in a modal viewer that steps through every group. */
export function PhotoGallery({ sections, labels }: { sections: GallerySection[]; labels: Labels }) {
  const all = sections.flatMap((section) => section.photos);
  // Where each section's photos start in `all`, so the viewer can step across sections.
  const starts = sections.map((_, i) => sections.slice(0, i).reduce((sum, s) => sum + s.photos.length, 0));
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);

  const step = useCallback(
    (delta: number) => setIndex((i) => (i === null ? i : (i + delta + all.length) % all.length)),
    [all.length],
  );

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (index !== null && !el.open) el.showModal();
    if (index === null && el.open) el.close();
    document.documentElement.style.overflow = index !== null ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [index]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Arrow keys follow the reading direction, so "next" is ArrowLeft in Arabic.
    const rtl = document.documentElement.dir === "rtl";
    if (e.key === "ArrowRight") step(rtl ? -1 : 1);
    if (e.key === "ArrowLeft") step(rtl ? 1 : -1);
  };

  const current = index === null ? null : all[index];

  return (
    <>
      <div className="space-y-20 md:space-y-28">
        {sections.map((section, s) => {
          const start = starts[s];
          return (
            <section key={section.key} id={section.key} className="scroll-mt-28">
              <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3 border-b border-mist pb-5">
                <div className="max-w-2xl">
                  <h2 className="text-3xl font-medium tracking-tight text-forest md:text-4xl">{section.title}</h2>
                  <p className="mt-2 leading-relaxed text-muted">{section.description}</p>
                </div>
                <span className="rounded-full bg-sand px-3 py-1 text-sm text-muted tabular-nums">{section.count}</span>
              </div>
              <ul className="mt-8 grid grid-flow-dense auto-rows-[9rem] grid-cols-2 gap-3 sm:auto-rows-[12rem] md:grid-cols-3 md:gap-4 lg:auto-rows-[14rem]">
                {section.photos.map((photo, i) => (
                  <li key={photo.src} className={cn(photo.tall && "row-span-2")}>
                    <button
                      type="button"
                      onClick={() => setIndex(start + i)}
                      aria-label={format(labels.open, { alt: photo.alt })}
                      className="group relative block size-full overflow-hidden rounded-2xl bg-mist md:rounded-3xl"
                    >
                      <Image
                        src={photo.src}
                        alt={photo.alt}
                        fill
                        sizes="(min-width: 768px) 33vw, 50vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent p-3 pt-10 text-start text-xs leading-snug text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 md:text-sm">
                        {photo.alt}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </div>

      <dialog
        ref={dialog}
        onClose={() => setIndex(null)}
        onKeyDown={onKeyDown}
        onClick={(e) => e.target === e.currentTarget && setIndex(null)}
        className="m-0 size-full max-h-none max-w-none bg-ink/95 p-0 text-white backdrop:bg-ink/80"
      >
        {current && index !== null && (
          <div className="flex size-full flex-col" onClick={(e) => e.target === e.currentTarget && setIndex(null)}>
            <div className="flex items-center justify-between gap-4 p-4">
              <span className="text-sm text-white/70 tabular-nums">
                {format(labels.counter, { current: index + 1, total: all.length })}
              </span>
              <button
                type="button"
                onClick={() => setIndex(null)}
                aria-label={labels.close}
                className="grid size-11 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="relative min-h-0 flex-1" onClick={(e) => e.target === e.currentTarget && setIndex(null)}>
              <Image key={current.src} src={current.src} alt={current.alt} fill sizes="100vw" className="object-contain" />
            </div>
            <div className="flex items-center justify-between gap-4 p-4">
              <button
                type="button"
                onClick={() => step(-1)}
                aria-label={labels.previous}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <ChevronLeft className="size-5 rtl:-scale-x-100" />
              </button>
              <p className="text-center text-sm leading-snug text-white/85">{current.alt}</p>
              <button
                type="button"
                onClick={() => step(1)}
                aria-label={labels.next}
                className="grid size-11 shrink-0 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
              >
                <ChevronRight className="size-5 rtl:-scale-x-100" />
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
