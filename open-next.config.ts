import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import kvIncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/kv-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

// - KV stores rendered pages (ISR); a short-lived copy in each data centre's Cache API saves KV reads.
//   (Images are on Cloudinary, so the site needs no R2.)
// - The D1 tag cache lets `revalidatePath` from the admin CMS refresh pages immediately.
// - The Durable Object queue regenerates stale pages in the background.
export default {
  ...defineCloudflareConfig({
    incrementalCache: withRegionalCache(kvIncrementalCache, { mode: "short-lived" }),
    tagCache: d1NextTagCache,
    queue: doQueue,
  }),
  // `npm run build` is the OpenNext build (so Workers Builds' default build command works), so the
  // Next.js build it wraps has to be called directly instead of through `npm run build`.
  buildCommand: "npx next build",
};
