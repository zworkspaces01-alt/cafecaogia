"use client";

import Image from "next/image";
import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, Pause, Play } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { PACE } from "@/components/motion";
import { ButtonLink } from "@/components/ui";
import { format } from "@/i18n/format";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { photos } from "@/lib/site";
import { cn } from "@/lib/utils";

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SLIDE_SECONDS = 8;

// Visuals and links per slide; the text for each comes from the dictionary (hero.slides, same order).
const slides = [
  { image: photos.hero, primaryHref: "/contact", secondaryHref: "/products" },
  { image: photos.cherriesBranch, primaryHref: "/products?category=coffee", secondaryHref: "/contact" },
  { image: photos.cashewWood, primaryHref: "/products?category=cashew", secondaryHref: "/contact" },
  { image: photos.portSunset, primaryHref: "/contact", secondaryHref: "/process" },
];

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useReducedMotion() {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

export function Hero({ t, scrollLabel }: { t: Dictionary["hero"]; scrollLabel: string }) {
  const root = useRef<HTMLElement>(null);
  const previous = useRef<number | null>(null);
  const progress = useRef<gsap.core.Tween | null>(null);
  const swipeStart = useRef<number | null>(null);

  const [index, setIndex] = useState(0);
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const [inView, setInView] = useState(true);
  const reducedMotion = useReducedMotion();

  // Autoplay is off by default for reduced-motion users, but they can still press play.
  const paused = userPaused ?? reducedMotion;
  const playing = !paused && inView;
  const playingRef = useRef(playing);

  const go = useCallback((i: number) => setIndex((i + slides.length) % slides.length), []);

  // Parallax on the whole background stack + pause autoplay while the hero is off screen.
  useGSAP(
    () => {
      gsap.to("[data-slides-bg]", {
        yPercent: 12,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
      ScrollTrigger.create({
        trigger: root.current,
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => setInView(self.isActive),
      });
    },
    { scope: root },
  );

  // Slide transition: background crossfade with slow zoom, text lines slide out and in.
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      const from = previous.current;
      const to = index;
      previous.current = to;

      const reduce = window.matchMedia(reducedMotionQuery).matches;
      const bgIn = q(`[data-slide-bg="${to}"]`);
      const panelIn = q(`[data-slide-panel="${to}"]`);
      const linesIn = q(`[data-slide-panel="${to}"] [data-slide-line]`);
      const fadesIn = q(`[data-slide-panel="${to}"] [data-slide-fade]`);

      if (reduce) {
        gsap.set(q("[data-slide-bg]"), { autoAlpha: 0, zIndex: 0 });
        gsap.set(q("[data-slide-panel]"), { autoAlpha: 0 });
        gsap.set([bgIn, panelIn, linesIn, fadesIn], { autoAlpha: 1, zIndex: 1, yPercent: 0, y: 0, overwrite: true });
        return;
      }

      // `from === to` also happens when React re-runs effects (StrictMode) after a revert.
      const first = from === null || from === to;
      const enterDelay = (first ? 0.2 : 0.45) * PACE;

      if (first) {
        gsap.set(q("[data-slide-bg]"), { autoAlpha: 0 });
        gsap.set(q("[data-slide-panel]"), { autoAlpha: 0 });
      } else {
        const panelOut = q(`[data-slide-panel="${from}"]`);
        gsap.to(q(`[data-slide-panel="${from}"] [data-slide-line]`), {
          yPercent: -110,
          duration: 0.5 * PACE,
          ease: "power2.in",
          stagger: 0.05 * PACE,
          overwrite: true,
        });
        gsap.to(q(`[data-slide-panel="${from}"] [data-slide-fade]`), {
          autoAlpha: 0,
          y: -12,
          duration: 0.35 * PACE,
          ease: "power1.in",
          overwrite: true,
        });
        gsap.to(panelOut, { autoAlpha: 0, duration: 0.01, delay: 0.5 * PACE, overwrite: true });
        const bgOut = q(`[data-slide-bg="${from}"]`);
        gsap.set(bgOut, { zIndex: 0 });
        // Hide once the new slide has fully faded in over it, so only one full-screen layer paints.
        gsap.to(bgOut, { autoAlpha: 0, duration: 0.01, delay: 1.25 * PACE, overwrite: true });
      }

      gsap.set(bgIn, { zIndex: 1 });
      gsap.fromTo(bgIn, { autoAlpha: first ? 1 : 0 }, { autoAlpha: 1, duration: 1.2 * PACE, ease: "power2.inOut", overwrite: true });
      gsap.fromTo(
        bgIn.map((el) => el.firstElementChild),
        { scale: first ? 1.18 : 1.12 },
        { scale: 1, duration: SLIDE_SECONDS + 1.5, ease: "power1.out", overwrite: true },
      );
      gsap.set(panelIn, { autoAlpha: 1, overwrite: true });
      gsap.fromTo(
        linesIn,
        { yPercent: 115, autoAlpha: 0 },
        { yPercent: 0, autoAlpha: 1, duration: 1.1 * PACE, ease: "power3.out", stagger: 0.1 * PACE, delay: enterDelay, overwrite: true },
      );
      gsap.fromTo(
        fadesIn,
        { y: 24, autoAlpha: 0 },
        { y: 0, autoAlpha: 1, duration: 0.9 * PACE, ease: "power3.out", stagger: 0.1 * PACE, delay: enterDelay + 0.3 * PACE, overwrite: true },
      );
    },
    { scope: root, dependencies: [index] },
  );

  // Progress bar for the active slide; advancing to the next slide when it fills.
  useGSAP(
    () => {
      const q = gsap.utils.selector(root);
      progress.current?.kill();
      gsap.set(q("[data-slide-progress]"), { scaleX: 0 });
      progress.current = gsap.fromTo(
        q(`[data-slide-progress="${index}"]`),
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: SLIDE_SECONDS,
          ease: "none",
          paused: !playingRef.current,
          onComplete: () => go(index + 1),
        },
      );
    },
    { scope: root, dependencies: [index, go] },
  );

  useGSAP(
    () => {
      playingRef.current = playing;
      if (playing) progress.current?.play();
      else progress.current?.pause();
    },
    { dependencies: [playing] },
  );

  return (
    <section
      ref={root}
      aria-roledescription="carousel"
      aria-label={t.carouselLabel}
      className="relative isolate flex min-h-[640px] touch-pan-y flex-col overflow-hidden bg-forest text-white select-none md:min-h-svh"
      onPointerDown={(e) => {
        swipeStart.current = e.clientX;
      }}
      onPointerUp={(e) => {
        if (swipeStart.current === null) return;
        const dx = e.clientX - swipeStart.current;
        swipeStart.current = null;
        // Swiping toward the reading direction's start advances (left in LTR, right in RTL).
        const rtl = document.documentElement.dir === "rtl";
        if (Math.abs(dx) > 60) go(index + ((dx < 0) !== rtl ? 1 : -1));
      }}
    >
      <div data-slides-bg className="absolute inset-x-0 -top-[6%] -bottom-[6%] -z-10">
        {slides.map((slide, i) => (
          <div key={i} data-slide-bg={i} className={cn("absolute inset-0 overflow-hidden", i !== 0 && "opacity-0")}>
            <div className="absolute inset-0">
              <Image
                src={slide.image}
                alt={i === index ? t.slides[i].alt : ""}
                fill
                // The first slide is the LCP element; the others stay lazy until they are shown.
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : "auto"}
                sizes="100vw"
                className="object-cover"
              />
            </div>
          </div>
        ))}
      </div>
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/35 to-ink/30" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/70 via-ink/20 to-transparent rtl:bg-gradient-to-l" />

      <div className="container-page flex flex-1 flex-col justify-end pt-32 pb-12 md:pb-16">
        <div className="grid max-w-2xl" aria-live={playing ? "off" : "polite"}>
          {slides.map((slide, i) => {
            const text = t.slides[i];
            // Only the first slide is a heading; the rest would otherwise lead the page outline.
            const Heading = i === 0 ? "h1" : "p";
            const active = i === index;
            return (
              <div
                key={i}
                data-slide-panel={i}
                role="group"
                aria-roledescription="slide"
                aria-label={format(t.slideOf, { n: i + 1, total: slides.length, label: text.label })}
                aria-hidden={!active}
                inert={!active}
                className={cn("[grid-area:1/1] self-end", i !== 0 && "invisible")}
              >
                <p data-slide-fade className="mb-5 text-sm tracking-[0.2em] text-lime uppercase">
                  {text.eyebrow}
                </p>
                <Heading className="text-[2.6rem] leading-[1.08] font-medium tracking-tight text-balance sm:text-6xl md:text-7xl">
                  <span className="block overflow-hidden pb-[0.1em]">
                    <span data-slide-line className="block">
                      {text.title}
                    </span>
                  </span>{" "}
                  <span className="block overflow-hidden pb-[0.1em]">
                    <span data-slide-line className="block">
                      {text.lead} <em className="font-serif font-normal">{text.accent}</em>
                    </span>
                  </span>
                </Heading>
                <p data-slide-fade className="mt-6 max-w-lg text-base leading-relaxed text-white/80 md:text-lg">
                  {text.description}
                </p>
                <div data-slide-fade className="mt-8 flex flex-wrap gap-3">
                  <ButtonLink href={slide.primaryHref} arrow>
                    {text.primary}
                  </ButtonLink>
                  <ButtonLink href={slide.secondaryHref} variant="outline-light">
                    {text.secondary}
                  </ButtonLink>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div data-hero-fade className="border-t border-white/15">
        <div className="container-page flex items-center gap-6 py-5 text-sm">
          <a
            href="#markets"
            className="hidden shrink-0 items-center gap-2 tracking-[0.15em] text-white/80 uppercase hover:text-white sm:flex"
          >
            {scrollLabel} <ArrowDown className="size-4 animate-bounce" />
          </a>

          <div className="hidden flex-1 grid-cols-4 gap-4 md:grid" role="tablist" aria-label={t.chooseSlide}>
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={format(t.showSlide, { n: i + 1, label: t.slides[i].label })}
                onClick={() => go(i)}
                className="group text-start"
              >
                <span
                  className={cn(
                    "block truncate text-xs transition-colors",
                    i === index ? "text-white" : "text-white/55 group-hover:text-white/85",
                  )}
                >
                  {pad(i + 1)} · {t.slides[i].label}
                </span>
                <span className="mt-2 block h-0.5 overflow-hidden rounded-full bg-white/20">
                  <span data-slide-progress={i} className="block h-full origin-left scale-x-0 bg-lime rtl:origin-right" />
                </span>
              </button>
            ))}
          </div>

          <div className="ms-auto flex items-center gap-2">
            <span className="me-2 text-white/70 tabular-nums" dir="ltr">
              <span className="text-white">{pad(index + 1)}</span> / {pad(slides.length)}
            </span>
            <button
              type="button"
              onClick={() => setUserPaused(!paused)}
              aria-label={paused ? t.play : t.pause}
              className="grid size-11 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10"
            >
              {paused ? <Play className="size-4 rtl:-scale-x-100" /> : <Pause className="size-4" />}
            </button>
            <button
              type="button"
              onClick={() => go(index - 1)}
              aria-label={t.previous}
              className="grid size-11 place-items-center rounded-full border border-white/25 text-white transition-colors hover:bg-white/10"
            >
              <ArrowLeft className="size-4 rtl:-scale-x-100" />
            </button>
            <button
              type="button"
              onClick={() => go(index + 1)}
              aria-label={t.next}
              className="grid size-11 place-items-center rounded-full bg-lime text-forest transition-colors hover:bg-lime-deep"
            >
              <ArrowRight className="size-4 rtl:-scale-x-100" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
