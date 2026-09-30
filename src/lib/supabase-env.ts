import "server-only";

/**
 * Supabase project URL and public (anon / publishable) key.
 * Accepts both this project's names and the names Supabase/Vercel use by default, preferring
 * the NEXT_PUBLIC_* pair. Values that aren't an https/http URL are ignored so a stray
 * connection string can't break the build.
 */
export function getSupabaseEnv(): { url: string; key: string } | null {
  const url = [process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_URL]
    .map((v) => v?.trim().replace(/\/+$/, ""))
    .find((v) => v && /^https?:\/\/[^\s/]+$/i.test(v));

  const key = [
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    process.env.SUPABASE_ANON_KEY,
  ]
    .map((v) => v?.trim())
    .find(Boolean);

  return url && key ? { url, key } : null;
}
