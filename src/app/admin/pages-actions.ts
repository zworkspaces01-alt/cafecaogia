"use server";

import { revalidatePath, updateTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { requireAdmin } from "@/lib/admin/auth";
import { defaultPageBlocks } from "@/lib/blocks/defaults";
import { blockSchema } from "@/lib/blocks/schema";
import {
  isSystemPageKey,
  reservedSlugs,
  slugPattern,
  systemPages,
  type Block,
  type PageSeo,
  type SystemPageKey,
} from "@/lib/blocks/types";
import { CMS_CACHE_TAG, encodeValue, first, getDb, insert, isUniqueViolation, now, run, update } from "@/lib/db";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

const MAX_BYTES = 900_000;

function refreshSite() {
  updateTag(CMS_CACHE_TAG);
  revalidatePath("/", "layout");
}

/** Rejects anything that isn't a list of known blocks with English content. */
function validBlocks(value: unknown): value is Block[] {
  if (!Array.isArray(value) || value.length > 80) return false;
  const ids = new Set<string>();
  for (const block of value) {
    if (typeof block !== "object" || block === null) return false;
    const { id, type, content } = block as Block;
    if (typeof id !== "string" || !id || ids.has(id) || !blockSchema(type)) return false;
    if (typeof content !== "object" || content === null || typeof content.en !== "object") return false;
    ids.add(id);
  }
  return JSON.stringify(value).length < MAX_BYTES;
}

/**
 * Finds the page a reference points at (a system key or a row id). A system page without a row gets
 * one, holding its current default layout as the published version, so the live site doesn't change
 * until the editor publishes.
 */
type PageRef = { id: string; key: string | null; slug: string; title: string; published: boolean };

async function resolvePage(ref: string) {
  const { user } = await requireAdmin();
  const system = isSystemPageKey(ref);
  const found = await first<PageRef>(
    `select id, key, slug, title, published from pages where ${system ? "key" : "id"} = ?`,
    ref,
  );
  if (found) return { user, page: found };
  if (!system) throw new Error("Không tìm thấy trang.");

  const meta = systemPages.find((p) => p.key === ref)!;
  const record = {
    key: ref,
    slug: meta.path.replace(/^\//, ""),
    title: meta.label,
    blocks: await defaultPageBlocks(ref as SystemPageKey),
    published: true,
    published_at: now(),
  };
  const id = await insert("pages", record);
  return { user, page: { id, key: record.key, slug: record.slug, title: record.title, published: true } };
}

/** Writes the working draft of a page (one per page). */
function upsertDraft(pageId: string, blocks: Block[], seo: PageSeo, email: string) {
  return run(
    `insert into page_drafts (page_id, blocks, seo, updated_by, updated_at) values (?, ?, ?, ?, ?)
     on conflict (page_id) do update set blocks = excluded.blocks, seo = excluded.seo,
       updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    pageId,
    encodeValue("blocks", blocks),
    encodeValue("seo", seo ?? {}),
    email,
    now(),
  );
}

/** Turns an error into a result, but lets Next's own control flow (the login redirect) through. */
function fail(e: unknown): { ok: false; error: string } {
  unstable_rethrow(e);
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

/** Saves the working draft (autosave). Visitors keep seeing the published version. */
export async function savePageDraft(ref: string, blocks: unknown, seo: PageSeo): Promise<Result<{ savedAt: string }>> {
  if (!validBlocks(blocks)) return { ok: false, error: "Dữ liệu khối không hợp lệ." };
  try {
    const { user, page } = await resolvePage(ref);
    await upsertDraft(page.id, blocks, seo, user.email);
    return { ok: true, savedAt: now() };
  } catch (e) {
    return fail(e);
  }
}

/** Publishes the draft: it becomes the live page and is kept in the version history. */
export async function publishPage(ref: string): Promise<Result> {
  try {
    const { user, page } = await resolvePage(ref);
    const draft = await first<{ blocks: Block[]; seo: PageSeo }>("select blocks, seo from page_drafts where page_id = ?", page.id);
    if (!draft) return { ok: false, error: "Không có thay đổi nào để xuất bản." };
    if (!validBlocks(draft.blocks)) return { ok: false, error: "Bản nháp có khối không hợp lệ." };

    // One batch = one transaction: the live page, its history entry and the cleared draft change together.
    const at = now();
    const blocks = encodeValue("blocks", draft.blocks);
    const seo = encodeValue("seo", draft.seo ?? {});
    const db = getDb();
    await db.batch([
      db
        .prepare("update pages set blocks = ?, seo = ?, published = 1, published_at = ?, updated_at = ? where id = ?")
        .bind(blocks, seo, at, at, page.id),
      db
        .prepare("insert into page_versions (page_id, blocks, seo, published_by, published_at) values (?, ?, ?, ?, ?)")
        .bind(page.id, blocks, seo, user.email, at),
      db.prepare("delete from page_drafts where page_id = ?").bind(page.id),
    ]);
    refreshSite();
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Throws the draft away; the editor reloads the published version. */
export async function discardPageDraft(ref: string): Promise<Result> {
  try {
    const { page } = await resolvePage(ref);
    await run("delete from page_drafts where page_id = ?", page.id);
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Loads a published version (or, for a system page, the default layout) into the draft. */
export async function restorePageVersion(ref: string, versionId: string | "default"): Promise<Result<{ blocks: Block[] }>> {
  try {
    const { user, page } = await resolvePage(ref);
    let blocks: Block[];
    let seo: PageSeo = {};
    if (versionId === "default") {
      if (!isSystemPageKey(ref)) return { ok: false, error: "Trang này không có bố cục mặc định." };
      blocks = await defaultPageBlocks(ref);
    } else {
      const version = await first<{ blocks: Block[]; seo: PageSeo }>(
        "select blocks, seo from page_versions where id = ? and page_id = ?",
        versionId,
        page.id,
      );
      if (!version) return { ok: false, error: "Không tìm thấy phiên bản này." };
      blocks = version.blocks;
      seo = version.seo;
    }
    await upsertDraft(page.id, blocks, seo, user.email);
    return { ok: true, blocks };
  } catch (e) {
    return fail(e);
  }
}

const slugError = (slug: string) =>
  !slugPattern.test(slug)
    ? "Đường dẫn chỉ gồm chữ thường không dấu, số và dấu gạch ngang."
    : reservedSlugs.has(slug)
      ? "Đường dẫn này đã được website dùng."
      : null;

/** Creates an empty custom page (unpublished until its first publish). */
export async function createPage(title: string, slug: string): Promise<Result<{ id: string }>> {
  await requireAdmin();
  const cleanTitle = String(title).trim();
  const cleanSlug = String(slug).trim().toLowerCase();
  if (!cleanTitle) return { ok: false, error: "Vui lòng nhập tên trang." };
  const invalid = slugError(cleanSlug);
  if (invalid) return { ok: false, error: invalid };
  try {
    return { ok: true, id: await insert("pages", { title: cleanTitle, slug: cleanSlug, blocks: [], published: false }) };
  } catch (e) {
    return isUniqueViolation(e) ? { ok: false, error: "Đường dẫn này đã có trang khác dùng." } : fail(e);
  }
}

/** Renames a custom page, changes its address, or takes it off the site. */
export async function updatePageSettings(id: string, values: { title: string; slug: string; published: boolean }): Promise<Result> {
  await requireAdmin();
  const page = await first<{ key: string | null }>("select key from pages where id = ?", id);
  if (!page) return { ok: false, error: "Không tìm thấy trang." };
  const changes: Record<string, unknown> = { title: values.title.trim() || "Trang", published: values.published };
  if (!page.key) {
    const slug = values.slug.trim().toLowerCase();
    const invalid = slugError(slug);
    if (invalid) return { ok: false, error: invalid };
    changes.slug = slug;
  }
  try {
    await update("pages", id, changes);
  } catch (e) {
    return isUniqueViolation(e) ? { ok: false, error: "Đường dẫn này đã có trang khác dùng." } : fail(e);
  }
  refreshSite();
  return { ok: true };
}

/** Deletes a custom page with its draft and history. System pages can't be deleted. */
export async function deletePage(id: string): Promise<Result> {
  await requireAdmin();
  await run("delete from pages where id = ? and key is null", id);
  refreshSite();
  return { ok: true };
}
