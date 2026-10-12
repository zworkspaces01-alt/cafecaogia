import "server-only";

import { locales } from "@/i18n/config";
import { site } from "@/lib/site";

/**
 * IndexNow key. Public by design: search engines fetch it from /<key>.txt (public/) to confirm the
 * site owns the submissions. To rotate, generate a new key and rename the file in public/.
 */
export const INDEXNOW_KEY = "6396105613a1887da5d4edd86d6c877f";

/**
 * Tells Bing, Yandex, Seznam and Naver that pages changed, so they recrawl them within minutes.
 * Paths are locale-less ("/products/robusta-s18-clean"); every locale's URL is sent. Skipped outside
 * the production domain, and failures are only logged — publishing never depends on it.
 */
export async function submitToIndexNow(paths: string[]) {
  const { hostname } = new URL(site.url);
  if (process.env.NODE_ENV !== "production" || hostname === "localhost" || hostname.endsWith(".vercel.app")) return;

  const urlList = paths.flatMap((path) => locales.map((locale) => `${site.url}/${locale}${path === "/" ? "" : path}`));
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ host: hostname, key: INDEXNOW_KEY, keyLocation: `${site.url}/${INDEXNOW_KEY}.txt`, urlList }),
    });
    if (!res.ok && res.status !== 202) console.error(`[indexnow] ${res.status} ${await res.text()}`);
  } catch (error) {
    console.error("[indexnow] request failed", error);
  }
}
