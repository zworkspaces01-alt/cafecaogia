import type { Attribution } from "@/lib/types";

const fields = ["source", "medium", "campaign", "term", "content", "click", "referrer", "landing", "at"] as const;

/** Parses the attribution JSON posted with an inquiry, keeping only known short string fields. */
export function parseAttribution(raw: string): Attribution | null {
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (!value || typeof value !== "object") return null;
    const clean = Object.fromEntries(
      fields.flatMap((key) => (typeof value[key] === "string" && value[key] ? [[key, value[key].slice(0, 300)]] : [])),
    ) as Attribution;
    return Object.keys(clean).length ? clean : null;
  } catch {
    return null;
  }
}

export type Channel = "paid" | "search" | "ai" | "social" | "email" | "referral" | "direct" | "unknown";

export const channelLabels: Record<Channel, string> = {
  paid: "Quảng cáo trả phí",
  search: "Tìm kiếm tự nhiên (Google, Bing, Yandex…)",
  ai: "Trợ lý AI (ChatGPT, Perplexity, Gemini…)",
  social: "Mạng xã hội",
  email: "Email",
  referral: "Website khác giới thiệu",
  direct: "Truy cập trực tiếp",
  unknown: "Không rõ (gửi trước khi có đo lường)",
};

const searchHosts = /(^|\.)(google|bing|yandex|duckduckgo|baidu|yahoo|naver|ecosia|seznam|coccoc)\./;
const aiHosts = /(^|\.)(chatgpt\.com|openai\.com|perplexity\.ai|claude\.ai|gemini\.google\.com|copilot\.microsoft\.com|you\.com|phind\.com|deepseek\.com)$/;
const socialHosts =
  /(^|\.)(facebook|fb|instagram|linkedin|lnkd|t|x|twitter|youtube|tiktok|pinterest|reddit|vk|ok|telegram|whatsapp|zalo)\.(com|me|co|ru|in|vn|org)$/;

const hostOf = (url?: string) => {
  try {
    return url ? new URL(url).hostname.replace(/^www\./, "") : "";
  } catch {
    return "";
  }
};

/** Buckets a lead's source the way GA4's default channel grouping does, plus AI assistants. */
export function channelOf(a: Attribution | null | undefined): Channel {
  if (!a) return "unknown";
  const medium = a.medium?.toLowerCase() ?? "";
  const source = a.source?.toLowerCase() ?? "";
  const host = hostOf(a.referrer);

  if (a.click || /^(cpc|ppc|paid|paidsearch|paid_social|cpm|display)/.test(medium)) return "paid";
  if (medium === "email" || source === "newsletter") return "email";
  if (aiHosts.test(host) || /chatgpt|perplexity|claude|gemini|copilot/.test(source)) return "ai";
  if (medium === "social" || socialHosts.test(host) || /facebook|instagram|linkedin|youtube|tiktok|zalo/.test(source)) return "social";
  if (medium === "organic" || searchHosts.test(host)) return "search";
  if (host || source) return "referral";
  return "direct";
}

/** "google / cpc", "linkedin.com" … — a short human label for the inquiry list. */
export function sourceLabel(a: Attribution | null | undefined): string {
  if (!a) return "";
  if (a.source) return [a.source, a.medium].filter(Boolean).join(" / ");
  return hostOf(a.referrer) || "(trực tiếp)";
}
