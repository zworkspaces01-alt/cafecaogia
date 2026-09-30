"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { captureAttribution, setYandexId, track, trackPageView, type AnalyticsEvent } from "@/lib/analytics";

/** Contact links anywhere on the site count as conversions, without wiring up each button. */
function contactEvent(href: string): AnalyticsEvent | null {
  if (href.startsWith("https://wa.me/") || href.startsWith("https://api.whatsapp.com/")) return "whatsapp_click";
  if (href.startsWith("mailto:")) return "email_click";
  if (href.startsWith("tel:")) return "phone_click";
  return null;
}

export function AnalyticsEvents({ yandexMetrica }: { yandexMetrica: string }) {
  const pathname = usePathname();
  const lastPath = useRef(pathname);

  useEffect(() => {
    setYandexId(yandexMetrica);
    captureAttribution();

    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href") ?? "";
      const event = contactEvent(href);
      if (event) track(event, { link_url: href.split("?")[0], page_path: location.pathname });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [yandexMetrica]);

  // The tags record the first page view themselves; later client-side navigations are sent here.
  useEffect(() => {
    if (pathname === lastPath.current) return;
    lastPath.current = pathname;
    trackPageView();
  }, [pathname]);

  return null;
}
