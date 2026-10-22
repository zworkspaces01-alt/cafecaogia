"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { ExternalLink, Monitor, RefreshCw, Smartphone, Tablet } from "lucide-react";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

// The real page with every draft applied (src/app/[lang]/preview), in an iframe. Rendered at the
// device's real width and scaled to fit, so the layout is the real one. Talks to PreviewBridge
// inside the frame: "select" when a block is clicked, "focus" to outline and scroll to a block.

export type Device = "desktop" | "tablet" | "mobile";

const deviceWidths: Record<Device, number> = { desktop: 1440, tablet: 820, mobile: 390 };
const deviceIcons = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
const deviceNames: Record<Device, string> = { desktop: "Máy tính", tablet: "Máy tính bảng", mobile: "Điện thoại" };
export const langNames: Record<Locale, string> = { en: "EN", ru: "RU", ar: "AR" };

/** What to outline once the frame is ready: a block id, or the first block of a type. */
export type PreviewFocus = { id: string } | { blockType: string } | null;

/** What editors can do with the preview (through its ref). */
export type PreviewHandle = { reload: () => void; focus: (target: PreviewFocus, scroll: boolean) => void };

export function StudioPreview({
  ref,
  src,
  lang,
  onLang,
  onSelect,
  focus = null,
  scrollOnReady = false,
}: {
  ref: React.Ref<PreviewHandle>;
  /** Preview URL without the language: "/preview/home?item=…". */
  src: string;
  lang: Locale;
  onLang: (lang: Locale) => void;
  onSelect?: (blockId: string) => void;
  /** Outlined again each time the page (re)loads. */
  focus?: PreviewFocus;
  /** Scroll to `focus` when a new page loads (collections); reloads after an autosave keep their position. */
  scrollOnReady?: boolean;
}) {
  const iframe = useRef<HTMLIFrameElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<Device>("desktop");
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [loading, setLoading] = useState(true);
  const url = `/${lang}${src}`;
  const focusRef = useRef(focus);
  /** The URL last scrolled to: reloads after an autosave keep the reader's scroll position. */
  const scrolledFor = useRef("");
  useEffect(() => {
    focusRef.current = focus;
  });

  const post = useCallback((message: Record<string, unknown>) => {
    iframe.current?.contentWindow?.postMessage({ source: "cg-editor", ...message }, window.location.origin);
  }, []);
  const focusOn = useCallback((target: PreviewFocus, scroll: boolean) => target && post({ type: "focus", ...target, scroll }), [post]);
  const reload = useCallback(() => {
    setLoading(true);
    try {
      iframe.current?.contentWindow?.location.reload();
    } catch {}
  }, []);
  useImperativeHandle(ref, () => ({ reload, focus: focusOn }), [reload, focusOn]);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setSize({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.source !== "cg-preview") return;
      if (event.data.type === "ready") {
        setLoading(false);
        focusOn(focusRef.current, scrollOnReady && scrolledFor.current !== url);
        scrolledFor.current = url;
      }
      if (event.data.type === "select" && typeof event.data.id === "string") onSelect?.(event.data.id);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [focusOn, onSelect, scrollOnReady, url]);

  const width = deviceWidths[device];
  const scale = size.width ? Math.min(1, (size.width - 32) / width) : 1;

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col bg-mist/50">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-mist bg-white px-3">
        <div className="flex rounded-lg bg-sand p-0.5">
          {locales.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => onLang(l)}
              className={cn("rounded-md px-2.5 py-1 text-xs font-semibold", lang === l ? "bg-white text-forest shadow-sm" : "text-muted")}
            >
              {langNames[l]}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg bg-sand p-0.5">
          {(Object.keys(deviceWidths) as Device[]).map((d) => {
            const Icon = deviceIcons[d];
            return (
              <button
                key={d}
                type="button"
                onClick={() => setDevice(d)}
                aria-label={deviceNames[d]}
                title={`${deviceNames[d]} (${deviceWidths[d]}px)`}
                className={cn("rounded-md p-1.5", device === d ? "bg-white text-forest shadow-sm" : "text-muted")}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
        <p className="ms-1 truncate font-mono text-xs text-muted" dir="ltr">
          {url.replace(/\/preview\/[^?]*/, "…").split("?")[0]} · {width}px{scale < 1 ? ` · ${Math.round(scale * 100)}%` : ""}
        </p>
        <div className="ms-auto flex items-center gap-1">
          {loading && <span className="me-1 text-xs text-muted">Đang tải…</span>}
          <button
            type="button"
            title="Tải lại"
            aria-label="Tải lại xem trước"
            onClick={reload}
            className="rounded-lg p-1.5 text-muted hover:bg-sand hover:text-forest"
          >
            <RefreshCw className="size-4" />
          </button>
          <a href={url} target="_blank" rel="noopener" title="Mở bản nháp ở tab mới" className="rounded-lg p-1.5 text-muted hover:bg-sand hover:text-forest">
            <ExternalLink className="size-4" />
          </a>
        </div>
      </div>
      <div ref={box} className="relative min-h-0 flex-1 overflow-hidden">
        {size.width > 0 && (
          <div
            className="absolute top-4 left-1/2 origin-top overflow-hidden rounded-lg bg-white shadow-xl ring-1 ring-black/5"
            style={{ width, height: (size.height - 32) / scale, transform: `translateX(-50%) scale(${scale})` }}
          >
            <iframe ref={iframe} key={url} src={url} title="Xem trước" className="size-full" onLoad={() => setLoading(false)} />
          </div>
        )}
      </div>
    </section>
  );
}
