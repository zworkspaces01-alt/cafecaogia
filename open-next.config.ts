import { defineCloudflareConfig } from "@opennextjs/cloudflare";
import doQueue from "@opennextjs/cloudflare/overrides/queue/do-queue";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import d1NextTagCache from "@opennextjs/cloudflare/overrides/tag-cache/d1-next-tag-cache";

// - R2 stores rendered pages (ISR).
// - The D1 tag cache lets `revalidatePath` from the admin CMS refresh pages immediately.
// - The Durable Object queue regenerates stale pages in the background.
// One-time setup (see README): create the R2 bucket and D1 database, then put the D1 id in wrangler.jsonc.
export default defineCloudflareConfig({
  incrementalCache: r2IncrementalCache,
  tagCache: d1NextTagCache,
  queue: doQueue,
});
