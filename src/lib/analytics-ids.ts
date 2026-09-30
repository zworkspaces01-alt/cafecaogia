// Tracking IDs are interpolated into inline scripts, so each one must match its tool's exact format.
// Checked when the CMS saves them and again before rendering.

import type { AnalyticsSettings } from "@/lib/types";

export const analyticsTools: Record<
  keyof AnalyticsSettings,
  { label: string; pattern: RegExp; example: string; help: string; dashboard: string }
> = {
  ga4: {
    label: "Google Analytics 4",
    pattern: /^G-[A-Z0-9]{4,16}$/,
    example: "G-XXXXXXXXXX",
    help: "Admin → Data streams → Web → Measurement ID.",
    dashboard: "https://analytics.google.com/",
  },
  gtm: {
    label: "Google Tag Manager",
    pattern: /^GTM-[A-Z0-9]{4,12}$/,
    example: "GTM-XXXXXXX",
    help: "Chỉ dùng nếu đội marketing quản lý thẻ bằng GTM. Không cần nếu đã điền GA4 ở trên.",
    dashboard: "https://tagmanager.google.com/",
  },
  metaPixel: {
    label: "Meta Pixel (Facebook/Instagram)",
    pattern: /^\d{10,20}$/,
    example: "123456789012345",
    help: "Events Manager → Data sources → Pixel ID. Cần khi chạy quảng cáo Facebook/Instagram.",
    dashboard: "https://business.facebook.com/events_manager2",
  },
  yandexMetrica: {
    label: "Yandex Metrica",
    pattern: /^\d{5,12}$/,
    example: "98765432",
    help: "Nên có cho thị trường Nga/SNG — Yandex là công cụ tìm kiếm chính ở đó.",
    dashboard: "https://metrika.yandex.com/",
  },
  clarity: {
    label: "Microsoft Clarity",
    pattern: /^[a-z0-9]{6,20}$/,
    example: "abcd1234ef",
    help: "Miễn phí: bản đồ nhiệt và ghi lại phiên truy cập để xem khách dùng trang thế nào.",
    dashboard: "https://clarity.microsoft.com/",
  },
  cloudflare: {
    label: "Cloudflare Web Analytics",
    pattern: /^[a-f0-9]{32}$/,
    example: "0123456789abcdef0123456789abcdef",
    help: "Không dùng cookie. Cloudflare dashboard → Analytics & Logs → Web Analytics → token trong đoạn JS.",
    dashboard: "https://dash.cloudflare.com/?to=/:account/web-analytics",
  },
};

export const analyticsKeys = Object.keys(analyticsTools) as (keyof AnalyticsSettings)[];

/** Keeps only well-formed IDs; anything else is dropped (blank). */
export function validAnalytics(ids: Partial<AnalyticsSettings>): AnalyticsSettings {
  return Object.fromEntries(
    analyticsKeys.map((key) => {
      const value = String(ids[key] ?? "").trim();
      return [key, analyticsTools[key].pattern.test(value) ? value : ""];
    }),
  ) as AnalyticsSettings;
}
