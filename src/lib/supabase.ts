import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Every public read is tagged so a CMS save can expire it (see refreshSite in app/admin/actions.ts). */
export const CMS_CACHE_TAG = "cms";

let client: SupabaseClient | null | undefined;

/** Returns null when Supabase isn't configured, so the site can run on sample data. */
export function getSupabase(): SupabaseClient | null {
  if (client !== undefined) return client;

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  client =
    url && key
      ? createClient(url, key, {
          auth: { persistSession: false },
          global: {
            fetch: (input, init) => fetch(input, { ...init, next: { tags: [CMS_CACHE_TAG], revalidate: 3600 } }),
          },
        })
      : null;
  return client;
}
