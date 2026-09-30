import "server-only";

/**
 * Supabase project URL and public (anon / publishable) key.
 * Accepts both this project's names and the names Supabase/Vercel use by default, preferring
 * the NEXT_PUBLIC_* pair. Tolerates surrounding quotes, whitespace, a trailing slash or a pasted
 * "/rest/v1" suffix; ignores values that aren't an http(s) URL (e.g. a Postgres connection string)
 * and, on hosted platforms, localhost URLs that a cloud build can never reach.
 */

const URL_VARS = ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_URL"] as const;
const KEY_VARS = ["NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"] as const;

// Read explicitly (not via process.env[name]) so Next.js can inline NEXT_PUBLIC_* values at build time.
function readVars(): Record<(typeof URL_VARS)[number] | (typeof KEY_VARS)[number], string | undefined> {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
  };
}

const clean = (v: string | undefined) => v?.trim().replace(/^["']|["']$/g, "").trim() || undefined;

/** Returns why a URL value can't be used, or null when it's fine. */
function urlProblem(value: string): string | null {
  const onHostedPlatform = Boolean(process.env.VERCEL || process.env.CF_PAGES);
  if (!/^https?:\/\/[a-z0-9.-]+(:\d+)?$/i.test(value)) return "không phải địa chỉ dạng https://…supabase.co";
  if (onHostedPlatform && /\/\/(localhost|127\.0\.0\.1)\b/.test(value)) return "là địa chỉ local, máy chủ không truy cập được";
  return null;
}

const normalizeUrl = (v: string) => v.replace(/\/rest\/v1\/?$/i, "").replace(/\/+$/, "");

export function getSupabaseEnv(): { url: string; key: string } | null {
  const vars = readVars();
  const url = URL_VARS.map((name) => clean(vars[name]))
    .map((v) => (v ? normalizeUrl(v) : v))
    .find((v): v is string => Boolean(v) && urlProblem(v!) === null);
  const key = KEY_VARS.map((name) => clean(vars[name])).find(Boolean);
  return url && key ? { url, key } : null;
}

/** Human-readable (Vietnamese) reasons the configuration is unusable — names only, never values. */
export function describeSupabaseEnvProblems(): string[] {
  const vars = readVars();
  const problems: string[] = [];

  const urls = URL_VARS.map((name) => ({ name, value: clean(vars[name]) }));
  if (urls.every((u) => !u.value)) {
    problems.push("Thiếu NEXT_PUBLIC_SUPABASE_URL (chưa khai báo, hoặc chưa bật cho môi trường này).");
  } else if (!urls.some((u) => u.value && urlProblem(normalizeUrl(u.value)) === null)) {
    for (const u of urls) if (u.value) problems.push(`${u.name} ${urlProblem(normalizeUrl(u.value))}.`);
  }

  if (KEY_VARS.every((name) => !clean(vars[name]))) {
    problems.push("Thiếu NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (chưa khai báo, hoặc chưa bật cho môi trường này).");
  }
  return problems;
}
