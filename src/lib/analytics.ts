// Browser-side analytics: conversion events for whichever tools the CMS has enabled, and lead
// attribution (where the visitor came from) kept in localStorage until they send an inquiry.

import type { Attribution } from "@/lib/types";

type Params = Record<string, string | number | undefined>;

type AnalyticsWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  dataLayer?: unknown[];
  fbq?: (...args: unknown[]) => void;
  ym?: (...args: unknown[]) => void;
};

export type AnalyticsEvent = "generate_lead" | "whatsapp_click" | "email_click" | "phone_click";

/** Meta's standard events, so conversions can be optimized for in Ads Manager. */
const metaEvents: Record<AnalyticsEvent, string> = {
  generate_lead: "Lead",
  whatsapp_click: "Contact",
  email_click: "Contact",
  phone_click: "Contact",
};

let yandexId: number | null = null;

export function setYandexId(id: string) {
  yandexId = id ? Number(id) : null;
}

/** Sends an event to every loaded tool. Safe to call when none are configured. */
export function track(event: AnalyticsEvent, params: Params = {}) {
  const w = window as AnalyticsWindow;
  try {
    w.gtag?.("event", event, params);
    // Google Tag Manager listens for plain { event } objects (gtag's own entries are ignored by GTM triggers).
    w.dataLayer?.push({ event, ...params });
    w.fbq?.("track", metaEvents[event], params);
    if (yandexId) w.ym?.(yandexId, "reachGoal", event, params);
  } catch {
    // A blocked or half-loaded tracker must never break the page.
  }
}

/** Page views after client-side navigation, for tools that don't detect it on their own. */
export function trackPageView() {
  const w = window as AnalyticsWindow;
  try {
    w.fbq?.("track", "PageView");
    if (yandexId) w.ym?.(yandexId, "hit", location.href, { title: document.title });
  } catch {}
}

// ── Lead attribution ───────────────────────────────────────────────────────

const STORAGE_KEY = "cg-attribution";
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
const CLICK_IDS = ["gclid", "fbclid", "yclid", "msclkid"] as const;
const clip = (value: string | null | undefined) => (value ? value.slice(0, 300) : undefined);

let captured = false;

/**
 * Records where this visit came from. A visit with campaign tags, an ad click ID or an outside
 * referrer replaces the stored source; a direct visit keeps the earlier one (last non-direct click).
 */
export function captureAttribution() {
  if (captured) return;
  captured = true;
  try {
    const url = new URL(location.href);
    const params = url.searchParams;
    const referrer = document.referrer && new URL(document.referrer).host !== location.host ? document.referrer : "";
    const click = CLICK_IDS.find((key) => params.has(key));
    const source = params.get("utm_source");
    if (!source && !click && !referrer && readAttribution()) return;

    const attribution: Attribution = {
      source: clip(source),
      medium: clip(params.get("utm_medium")),
      campaign: clip(params.get("utm_campaign")),
      term: clip(params.get("utm_term")),
      content: clip(params.get("utm_content")),
      click,
      referrer: clip(referrer),
      landing: clip(url.pathname + url.search),
      at: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(attribution));
  } catch {
    // Storage can be unavailable (private mode, blocked cookies); the inquiry is just sent without a source.
  }
}

export function readAttribution(): Attribution | null {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Attribution | null;
    if (!stored?.at || Date.now() - Date.parse(stored.at) > MAX_AGE_MS) return null;
    return stored;
  } catch {
    return null;
  }
}
