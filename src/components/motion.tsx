"use client";

import { useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/** Global tempo for page animations: 1 = snappy, higher = slower and more noticeable. */
export const PACE = 1.6;

/**
 * Wraps <main> and wires up every page animation declaratively, so sections can stay
 * server components and just carry data attributes:
 *
 * - data-hero-bg / data-hero-line / data-hero-fade  intro timeline on page load
 * - data-reveal                                     fade up when scrolled into view
 * - data-reveal-stagger                             children fade up one after another
 * - data-reveal-image                               clip-path wipe + image zoom-out
 * - data-parallax                                   drifts vertically while scrolling (scrubbed)
 * - data-words > [data-word]                        words light up as you scroll
 * - data-count="12,000+"                            counts up from 0
 * - data-heading > [data-heading-line]              heading lines rise out of their masks
 * - data-grow-group > [data-grow]                   bars grow in reading order (scaleX)
 * - data-progress-line                              vertical rail that fills as its parent scrolls by
 *
 * Elements are pre-hidden by the `motion-pending` class (see layout.tsx / globals.css)
 * to avoid a flash before hydration. Users who prefer reduced motion get no animation.
 */
export function MotionMain({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useGSAP(
    () => {
      const q = gsap.utils.selector(scope);
      const mm = gsap.matchMedia();

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
        intro
          .fromTo(q("[data-hero-bg]"), { scale: 1.18 }, { scale: 1, duration: 2.2 * PACE, ease: "power2.out" }, 0)
          .fromTo(
            q("[data-hero-line]"),
            { yPercent: 115, autoAlpha: 0 },
            { yPercent: 0, autoAlpha: 1, duration: 1.1 * PACE, stagger: 0.12 * PACE },
            0.2 * PACE,
          )
          .fromTo(
            q("[data-hero-fade]"),
            { y: 24, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.9 * PACE, stagger: 0.1 * PACE, clearProps: "transform" },
            0.55 * PACE,
          );

        q("[data-hero-bg]").forEach((bg) => {
          gsap.to(bg, {
            yPercent: 12,
            ease: "none",
            scrollTrigger: { trigger: bg.parentElement, start: "top top", end: "bottom top", scrub: true },
          });
        });

        q("[data-heading]").forEach((heading) => {
          gsap.fromTo(
            heading.querySelectorAll("[data-heading-line]"),
            { yPercent: 110, autoAlpha: 0 },
            {
              yPercent: 0,
              autoAlpha: 1,
              duration: 1.1 * PACE,
              ease: "power3.out",
              stagger: 0.12 * PACE,
              clearProps: "transform",
              scrollTrigger: { trigger: heading, start: "top 88%", once: true },
            },
          );
        });

        q("[data-grow-group]").forEach((group) => {
          gsap.fromTo(
            group.querySelectorAll("[data-grow]"),
            { scaleX: 0 },
            {
              scaleX: 1,
              duration: 0.7 * PACE,
              ease: "power2.out",
              stagger: 0.03 * PACE,
              clearProps: "transform,scale",
              scrollTrigger: { trigger: group, start: "top 80%", once: true },
            },
          );
        });

        q("[data-progress-line]").forEach((line) => {
          gsap.fromTo(
            line,
            { scaleY: 0 },
            {
              scaleY: 1,
              ease: "none",
              scrollTrigger: { trigger: line.parentElement, start: "top 60%", end: "bottom 60%", scrub: 0.6 },
            },
          );
        });

        q("[data-reveal]").forEach((el) => {
          gsap.fromTo(
            el,
            { y: 56, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 1 * PACE,
              ease: "power3.out",
              clearProps: "transform",
              scrollTrigger: { trigger: el, start: "top 88%", once: true },
            },
          );
        });

        q("[data-reveal-stagger]").forEach((group) => {
          gsap.fromTo(
            group.children,
            { y: 64, autoAlpha: 0 },
            {
              y: 0,
              autoAlpha: 1,
              duration: 1 * PACE,
              ease: "power3.out",
              stagger: 0.12 * PACE,
              clearProps: "transform",
              scrollTrigger: { trigger: group, start: "top 85%", once: true },
            },
          );
        });

        q("[data-reveal-image]").forEach((frame) => {
          const trigger = { trigger: frame, start: "top 85%", once: true };
          gsap.fromTo(
            frame,
            { clipPath: "inset(100% 0% 0% 0%)", autoAlpha: 1 },
            { clipPath: "inset(0% 0% 0% 0%)", duration: 1.3 * PACE, ease: "expo.out", clearProps: "clipPath", scrollTrigger: trigger },
          );
          gsap.fromTo(
            frame.querySelectorAll("img"),
            { scale: 1.3 },
            { scale: 1, duration: 1.6 * PACE, ease: "expo.out", clearProps: "transform,scale", scrollTrigger: trigger },
          );
        });

        q("[data-parallax]").forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: -8 },
            {
              yPercent: 8,
              ease: "none",
              scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
            },
          );
        });

        q("[data-words]").forEach((block) => {
          gsap.fromTo(
            block.querySelectorAll("[data-word]"),
            { opacity: 0.14 },
            {
              opacity: 1,
              ease: "none",
              stagger: 0.05 * PACE,
              scrollTrigger: { trigger: block, start: "top 85%", end: "bottom 35%", scrub: 1 },
            },
          );
        });

        q("[data-count]").forEach((el) => {
          const [, prefix = "", digits = "0", suffix = ""] = el.dataset.count?.match(/^(\D*)([\d,.]+)(.*)$/) ?? [];
          const target = Number(digits.replace(/,/g, ""));
          // Years count up from a nearby value instead of 0.
          const counter = { value: target > 1900 && !digits.includes(",") ? target - 12 : 0 };
          gsap.to(counter, {
            value: target,
            duration: 2 * PACE,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
            onUpdate: () => {
              const n = Math.round(counter.value);
              el.textContent = `${prefix}${digits.includes(",") ? n.toLocaleString("en-US") : n}${suffix}`;
            },
          });
        });
      });

      document.documentElement.classList.remove("motion-pending");
      document.fonts?.ready.then(() => ScrollTrigger.refresh());
    },
    { scope, dependencies: [pathname], revertOnUpdate: true },
  );

  return (
    <div ref={scope} className="flex flex-1 flex-col">
      <main className="flex-1">{children}</main>
      {footer}
    </div>
  );
}

/** Splits text into word spans for the scroll-lit `data-words` effect. */
export function Words({ text }: { text: string }) {
  return text.split(" ").map((word, i) => (
    <span key={i}>
      {i > 0 && " "}
      <span data-word>{word}</span>
    </span>
  ));
}
