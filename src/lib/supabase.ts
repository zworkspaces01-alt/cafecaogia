import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseEnv } from "@/lib/supabase-env";

/** Every public read is tagged so a CMS save can expire it (see refreshSite in app/admin/actions.ts). */
export const CMS_CACHE_TAG = "cms";

const DEPLOYMENT_ID =
  process.env.VERCEL_DEPLOYMENT_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.CF_VERSION_METADATA ?? "local";

let client: SupabaseClient | null | undefined;

/** Returns null when Supabase isn't configured, so the site can run on sample data. */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  const env = getSupabaseEnv();
  const host = env ? new URL(env.url).host : null;
  // Printed once per process so build logs show which project is used (host only, never the key).
  console.info(host ? `[supabase] using ${host}` : "[supabase] not configured — using bundled sample content");

  client = env
    ? createClient(env.url, env.key, {
        auth: { persistSession: false },
        global: {
          fetch: async (input, init) => {
            try {
              // The deployment id is part of the cache key, so every deploy starts with fresh data even
                // though some hosts (e.g. Vercel's Data Cache) keep cached fetches across deployments.
                const headers = new Headers(init?.headers);
                headers.set("x-cache-version", DEPLOYMENT_ID);
                return await fetch(input, { ...init, headers, next: { tags: [CMS_CACHE_TAG], revalidate: 3600 } });
            } catch (error) {
              // Surface the real network cause (ENOTFOUND, ECONNREFUSED, …) instead of "fetch failed".
              const cause = (error as { cause?: { code?: string; message?: string } }).cause;
              console.error(`[supabase] request to ${host} failed: ${cause?.code ?? ""} ${cause?.message ?? error}`);
              throw error;
            }
          },
        },
      })
    : null;
  return client;
}
