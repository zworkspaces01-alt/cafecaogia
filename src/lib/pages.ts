import "server-only";

import { cache } from "react";
import { defaultPageBlocks } from "@/lib/blocks/defaults";
import { isSystemPageKey, type Block, type PageSeo, type SystemPageKey } from "@/lib/blocks/types";
import { all, first } from "@/lib/db";

export type PageRow = {
  id: string;
  key: string | null;
  slug: string;
  title: string;
  blocks: Block[];
  seo: PageSeo;
  published: boolean;
  published_at: string | null;
  updated_at: string;
};

export type LoadedPage = { page: PageRow | null; blocks: Block[]; seo: PageSeo };

type Ref = { key: SystemPageKey } | { slug: string };

const where = (ref: Ref): [string, string] => ("key" in ref ? ["key = ?", ref.key] : ["slug = ?", ref.slug]);

/** Published row. */
async function readPublished(ref: Ref): Promise<PageRow | null> {
  const [condition, value] = where(ref);
  return first<PageRow>(`select * from pages where ${condition} and published = 1`, value);
}

/**
 * The blocks a page renders for visitors: the published layout or, for a system page never saved,
 * its default layout from code. Drafts are only shown by the preview route (loadDraft).
 */
export const loadPage = cache(async (refKey: string): Promise<LoadedPage | null> => {
  const ref: Ref = refKey.startsWith("slug:") ? { slug: refKey.slice(5) } : { key: refKey as SystemPageKey };
  const page = await readPublished(ref);
  if (page) return { page, blocks: page.blocks, seo: page.seo ?? {} };
  if ("key" in ref) return { page: null, blocks: await defaultPageBlocks(ref.key), seo: {} };
  return null;
});

/**
 * The working version of a page for the editor's preview: its draft, else what is published, else
 * (system pages) the default layout. `ref` is a system page key or a page id. Callers check the admin.
 */
export async function loadDraft(ref: string): Promise<{ title: string; blocks: Block[] } | null> {
  const system = isSystemPageKey(ref);
  const page = await first<PageRow>(`select * from pages where ${system ? "key" : "id"} = ?`, ref);
  if (!page && !system) return null;
  const draft = page ? await first<{ blocks: Block[] }>("select blocks from page_drafts where page_id = ?", page.id) : null;
  const blocks = draft?.blocks ?? page?.blocks ?? (system ? await defaultPageBlocks(ref) : []);
  return { title: page?.title ?? ref, blocks };
}

export const loadSystemPage = (key: SystemPageKey) => loadPage(key);
export const loadCustomPage = (slug: string) => loadPage(`slug:${slug}`);

/** Published custom pages, for the sitemap. */
export function listCustomPages(): Promise<{ slug: string; updated_at: string }[]> {
  return all("select slug, updated_at from pages where key is null and published = 1");
}

/** Title/description set for a system page in the page builder (current language, then English). */
export async function systemPageSeo(key: SystemPageKey, locale: string): Promise<{ title?: string; description?: string }> {
  const loaded = await loadSystemPage(key);
  const seo = loaded?.seo ?? {};
  const local = (seo as Record<string, { title?: string; description?: string } | undefined>)[locale] ?? {};
  return {
    title: local.title?.trim() || seo.en?.title?.trim() || undefined,
    description: local.description?.trim() || seo.en?.description?.trim() || undefined,
  };
}
