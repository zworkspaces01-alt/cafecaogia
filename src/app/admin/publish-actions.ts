"use server";

import { revalidatePath, updateTag } from "next/cache";
import { after } from "next/server";
import { unstable_rethrow } from "next/navigation";
import { allowed } from "@/lib/admin/auth";
import { audit } from "@/lib/admin/audit";
import { getEntity, entities } from "@/lib/admin/entities";
import { buildRow, editorItems, recordDraft, recordDrafts, recordTitle, sameRow, type EditorItem, type RecordStatus, type Values } from "@/lib/admin/records";
import { validBlocks } from "@/lib/blocks/validate";
import type { Block, PageSeo } from "@/lib/blocks/types";
import { CMS_CACHE_TAG, all, encodeValue, first, getDb, insertStatement, isUniqueViolation, now, updateStatement } from "@/lib/db";
import { submitToIndexNow } from "@/lib/indexnow";
import { site } from "@/lib/site";
import { escapeHtml, notifyTelegram } from "@/lib/telegram";

// Drafts and Publish for the whole Studio, like VSAP Studio: pages and records (products, posts…) are
// edited as drafts; one Publish puts the chosen changes live together and records them as a release,
// which can later be undone (its previous state goes back into the drafts for review).

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

/** "page:<system key or page id>" or "<entity key>:<record id>". */
export type ChangeKey = string;

export type Change = {
  key: ChangeKey;
  kind: "page" | "record";
  /** "Trang", "Sản phẩm", … */
  group: string;
  title: string;
  action: "create" | "update" | "delete";
  updatedBy: string;
  updatedAt: string;
  href: string;
};

export type ReleaseItem = {
  key: ChangeKey;
  kind: "page" | "record";
  group: string;
  title: string;
  action: Change["action"];
  /** State before the release: a page's { pageId, blocks, seo }, a record's row; null = didn't exist. */
  before: Record<string, unknown> | null;
};

function fail(e: unknown): { ok: false; error: string } {
  unstable_rethrow(e);
  return { ok: false, error: e instanceof Error ? e.message : String(e) };
}

function refreshSite() {
  updateTag(CMS_CACHE_TAG);
  revalidatePath("/", "layout");
}

const recordId = /^[0-9a-f]{32}$|^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_RECORD_BYTES = 300_000;
/** Releases kept for undo. */
const KEEP_RELEASES = 50;

/** Only the entity's own fields are kept in a draft (not ids or timestamps). */
function draftData(entityKey: string, values: Values): Values {
  const entity = getEntity(entityKey)!;
  const data: Values = {};
  for (const field of entity.fields) if (field.name in values) data[field.name] = values[field.name];
  if (entity.hasTranslations) data.translations = values.translations ?? {};
  return data;
}

function upsertRecordDraft(entity: string, id: string, data: Values, deleted: boolean, email: string) {
  return getDb()
    .prepare(
      `insert into record_drafts (entity, record_id, data, deleted, updated_by, updated_at) values (?, ?, ?, ?, ?, ?)
       on conflict (entity, record_id) do update set data = excluded.data, deleted = excluded.deleted,
         updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
    )
    .bind(entity, id, encodeValue("data", data), deleted ? 1 : 0, email, now());
}

const deleteRecordDraft = (entity: string, id: string) =>
  getDb().prepare("delete from record_drafts where entity = ? and record_id = ?").bind(entity, id);

// ── Record drafts ───────────────────────────────────────────────────────────

/** Every record of an entity with its drafts (the collection editor reloads with this after a publish). */
export async function loadCollection(entityKey: string): Promise<Result<{ items: EditorItem[] }>> {
  if (!getEntity(entityKey)) return { ok: false, error: "Loại nội dung không hợp lệ." };
  const auth = await allowed("content.read");
  if (!auth.ok) return auth;
  return { ok: true, items: await editorItems(entityKey) };
}

/**
 * Autosave of the collection editor: each item's values become its draft. A draft that matches the
 * published row again is dropped, so the status reads "matches the website".
 */
export async function saveRecordDrafts(
  entityKey: string,
  items: { id: string; values: Values }[],
): Promise<Result<{ statuses: Record<string, RecordStatus> }>> {
  const entity = getEntity(entityKey);
  if (!entity) return { ok: false, error: "Loại nội dung không hợp lệ." };
  const auth = await allowed("content.write");
  if (!auth.ok) return auth;
  const { user } = auth;
  if (!Array.isArray(items) || items.length > 200) return { ok: false, error: "Dữ liệu không hợp lệ." };

  try {
    const statuses: Record<string, RecordStatus> = {};
    const statements: D1PreparedStatement[] = [];
    for (const { id, values } of items) {
      if (!recordId.test(id) || typeof values !== "object" || values === null) return { ok: false, error: "Dữ liệu không hợp lệ." };
      const data = draftData(entity.key, values);
      if (JSON.stringify(data).length > MAX_RECORD_BYTES) return { ok: false, error: `“${recordTitle(entity, data)}” quá dài để lưu.` };
      const row = await first<Values>(`select * from ${entity.table} where id = ?`, id);
      if (row && sameRow(entity, row, data)) {
        statements.push(deleteRecordDraft(entity.key, id));
        statuses[id] = "published";
      } else {
        statements.push(upsertRecordDraft(entity.key, id, data, false, user.email));
        statuses[id] = row ? "changed" : "new";
      }
    }
    if (statements.length) await getDb().batch(statements);
    return { ok: true, statuses };
  } catch (e) {
    return fail(e);
  }
}

/** Marks a record for removal at the next publish (a never-published one is simply dropped). */
export async function removeRecord(entityKey: string, id: string): Promise<Result<{ status: RecordStatus | null }>> {
  const entity = getEntity(entityKey);
  if (!entity || !recordId.test(id)) return { ok: false, error: "Dữ liệu không hợp lệ." };
  const auth = await allowed("content.write");
  if (!auth.ok) return auth;
  const { user } = auth;
  try {
    const row = await first<Values>(`select * from ${entity.table} where id = ?`, id);
    if (!row) {
      await deleteRecordDraft(entity.key, id).run();
      return { ok: true, status: null };
    }
    const draft = await recordDraft(entity.key, id);
    await upsertRecordDraft(entity.key, id, draft?.data ?? draftData(entity.key, row), true, user.email).run();
    return { ok: true, status: "deleted" };
  } catch (e) {
    return fail(e);
  }
}

// ── Pending changes ─────────────────────────────────────────────────────────

async function pendingChanges(): Promise<Change[]> {
  const [pages, drafts] = await Promise.all([
    all<{ id: string; key: string | null; title: string; published: boolean; updated_by: string; updated_at: string }>(
      `select p.id, p.key, p.title, p.published, d.updated_by, d.updated_at
       from page_drafts d join pages p on p.id = d.page_id order by d.updated_at`,
    ),
    recordDrafts(),
  ]);
  const changes: Change[] = pages.map((p) => ({
    key: `page:${p.key ?? p.id}`,
    kind: "page",
    group: "Trang",
    title: p.title,
    action: p.published ? "update" : "create",
    updatedBy: p.updated_by,
    updatedAt: p.updated_at,
    href: `/admin/pages/${p.key ?? p.id}`,
  }));

  const existing = new Map<string, Set<string>>();
  for (const entity of entities) {
    if (!drafts.some((d) => d.entity === entity.key)) continue;
    existing.set(entity.key, new Set((await all<{ id: string }>(`select id from ${entity.table}`)).map((r) => r.id)));
  }
  for (const draft of drafts) {
    const entity = getEntity(draft.entity);
    if (!entity) continue;
    const exists = existing.get(entity.key)?.has(draft.record_id);
    if (draft.deleted && !exists) continue;
    changes.push({
      key: `${entity.key}:${draft.record_id}`,
      kind: "record",
      group: entity.label,
      title: recordTitle(entity, draft.data),
      action: draft.deleted ? "delete" : exists ? "update" : "create",
      updatedBy: draft.updated_by,
      updatedAt: draft.updated_at,
      href: `/admin/${entity.key}?id=${draft.record_id}`,
    });
  }
  return changes.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function listChanges(): Promise<Result<{ changes: Change[] }>> {
  const auth = await allowed("content.read");
  if (!auth.ok) return auth;
  return { ok: true, changes: await pendingChanges() };
}

const splitKey = (key: ChangeKey) => {
  const at = key.indexOf(":");
  return [key.slice(0, at), key.slice(at + 1)] as const;
};

type PageRow = { id: string; key: string | null; title: string; blocks: Block[]; seo: PageSeo; published: boolean };

function pageByRef(ref: string) {
  return first<PageRow>("select id, key, title, blocks, seo, published from pages where key = ? or id = ?", ref, ref);
}

/** Puts the chosen pending changes (all when `keys` is null) live together, as one release. */
export async function publishChanges(keys: ChangeKey[] | null, note = ""): Promise<Result<{ published: ChangeKey[] }>> {
  const auth = await allowed("content.publish");
  if (!auth.ok) return auth;
  const { user } = auth;

  try {
    const wanted = keys ? new Set(keys) : null;
    const changes = (await pendingChanges()).filter((c) => !wanted || wanted.has(c.key));
    if (!changes.length) return { ok: false, error: "Không có thay đổi nào để xuất bản." };

    const db = getDb();
    const at = now();
    const cleanNote = String(note).trim().slice(0, 200);
    const statements: D1PreparedStatement[] = [];
    const items: ReleaseItem[] = [];
    const indexPaths = new Set<string>();

    for (const change of changes) {
      const [kind, ref] = splitKey(change.key);
      const label = `${change.group} “${change.title}”`;

      if (kind === "page") {
        const page = await pageByRef(ref);
        const draft = page && (await first<{ blocks: Block[]; seo: PageSeo }>("select blocks, seo from page_drafts where page_id = ?", page.id));
        if (!page || !draft) continue;
        if (!validBlocks(draft.blocks)) return { ok: false, error: `${label}: bản nháp có khối không hợp lệ.` };
        const blocks = encodeValue("blocks", draft.blocks);
        const seo = encodeValue("seo", draft.seo ?? {});
        // One batch = one transaction: live page, its history entry and the cleared draft change together.
        statements.push(
          db.prepare("update pages set blocks = ?, seo = ?, published = 1, published_at = ?, updated_at = ? where id = ?").bind(blocks, seo, at, at, page.id),
          db
            .prepare("insert into page_versions (page_id, blocks, seo, published_by, published_at, note) values (?, ?, ?, ?, ?, ?)")
            .bind(page.id, blocks, seo, user.email, at, cleanNote),
          db.prepare("delete from page_drafts where page_id = ?").bind(page.id),
        );
        items.push({ ...pick(change), before: page.published ? { pageId: page.id, blocks: page.blocks, seo: page.seo } : { pageId: page.id, unpublished: true } });
        continue;
      }

      const entity = getEntity(kind);
      const draft = entity && (await recordDraft(entity.key, ref));
      if (!entity || !draft) continue;
      const row = await first<Values & { id: string }>(`select * from ${entity.table} where id = ?`, ref);
      const before = row ? draftData(entity.key, row) : null;
      const slugOf = (v: Values | null) => (typeof v?.slug === "string" && v.slug ? v.slug : null);
      const section = entity.key === "products" ? "/products" : entity.key === "posts" ? "/insights" : null;

      if (draft.deleted) {
        if (row) statements.push(db.prepare(`delete from ${entity.table} where id = ?`).bind(ref));
      } else {
        let built: Record<string, unknown>;
        try {
          built = buildRow(entity, draft.data);
        } catch (e) {
          return { ok: false, error: `${label}: ${(e as Error).message}` };
        }
        if (typeof built.slug === "string") {
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(built.slug)) return { ok: false, error: `${label}: đường dẫn (slug) chỉ gồm chữ thường không dấu, số và gạch ngang.` };
          const taken = await first(`select id from ${entity.table} where slug = ? and id != ?`, built.slug, ref);
          if (taken) return { ok: false, error: `${label}: đường dẫn “${built.slug}” đã có ${entity.singular} khác dùng.` };
        }
        statements.push(row ? updateStatement(entity.table, ref, built) : insertStatement(entity.table, { id: ref, ...built }));
        if (section && slugOf(built)) indexPaths.add(`${section}/${built.slug}`);
      }
      if (section && slugOf(before)) indexPaths.add(`${section}/${before!.slug}`);
      if (section) indexPaths.add(section).add("/");
      statements.push(deleteRecordDraft(entity.key, ref));
      items.push({ ...pick(change), before });
    }
    if (!items.length) return { ok: false, error: "Không có thay đổi nào để xuất bản." };

    // Page snapshots can be large; past ~1.5 MB keep only the records' (pages keep their own history).
    let itemsJson = JSON.stringify(items);
    if (itemsJson.length > 1_500_000) {
      itemsJson = JSON.stringify(items.map((item) => (item.kind === "page" ? { ...item, before: null } : item)));
    }
    statements.push(
      db.prepare("insert into releases (published_at, published_by, note, items) values (?, ?, ?, ?)").bind(at, user.email, cleanNote, itemsJson),
      db
        .prepare(`delete from releases where id not in (select id from releases order by published_at desc limit ${KEEP_RELEASES})`)
        .bind(),
    );

    try {
      await db.batch(statements);
    } catch (e) {
      if (isUniqueViolation(e)) return { ok: false, error: "Có đường dẫn (slug) bị trùng giữa các mục đang xuất bản." };
      throw e;
    }

    refreshSite();
    const summary = items.map((i) => `${i.group} “${i.title}”`).join(", ");
    await audit(user.email, "publish", `${items.length} thay đổi`, [cleanNote, summary].filter(Boolean).join(" — "));
    after(async () => {
      if (indexPaths.size) await submitToIndexNow([...indexPaths]);
      const verbs = { create: "➕", update: "✏️", delete: "🗑" };
      const lines = items.slice(0, 15).map((i) => `${verbs[i.action]} ${escapeHtml(i.group)}: <b>${escapeHtml(i.title)}</b>`);
      if (items.length > 15) lines.push(`… và ${items.length - 15} thay đổi khác`);
      await notifyTelegram(
        "content",
        `🚀 ${escapeHtml(user.name)} đã xuất bản ${items.length} thay đổi${cleanNote ? ` — <i>${escapeHtml(cleanNote)}</i>` : ""}\n${lines.join("\n")}`,
        [{ text: "Lịch sử xuất bản", url: `${site.url}/admin/history` }],
      );
    });
    return { ok: true, published: items.map((i) => i.key) };
  } catch (e) {
    return fail(e);
  }
}

const pick = (c: Change) => ({ key: c.key, kind: c.kind, group: c.group, title: c.title, action: c.action });

/** Throws pending changes away; the website and the published versions stay as they are. */
export async function discardChanges(keys: ChangeKey[]): Promise<Result> {
  const auth = await allowed("content.publish");
  if (!auth.ok) return auth;
  const { user } = auth;
  try {
    const db = getDb();
    const changes = (await pendingChanges()).filter((c) => keys.includes(c.key));
    const statements: D1PreparedStatement[] = [];
    for (const change of changes) {
      const [kind, ref] = splitKey(change.key);
      if (kind === "page") {
        const page = await pageByRef(ref);
        if (page) statements.push(db.prepare("delete from page_drafts where page_id = ?").bind(page.id));
      } else statements.push(deleteRecordDraft(kind, ref));
    }
    if (statements.length) await db.batch(statements);
    if (changes.length) await audit(user.email, "discard", changes.map((c) => `${c.group} “${c.title}”`).join(", "));
    return { ok: true };
  } catch (e) {
    return fail(e);
  }
}

/** Loads the state from before a release into the drafts, to review and publish again. */
export async function undoRelease(id: string): Promise<Result<{ count: number }>> {
  const auth = await allowed("content.publish");
  if (!auth.ok) return auth;
  const { user } = auth;
  try {
    const release = await first<{ items: ReleaseItem[]; published_at: string }>("select items, published_at from releases where id = ?", id);
    if (!release) return { ok: false, error: "Không tìm thấy lần xuất bản này." };
    const db = getDb();
    const statements: D1PreparedStatement[] = [];
    let skipped = 0;

    for (const item of release.items) {
      const [kind, ref] = splitKey(item.key);
      if (kind === "page") {
        const before = item.before as { pageId: string; blocks?: Block[]; seo?: PageSeo; unpublished?: boolean } | null;
        if (!before?.blocks) {
          skipped++;
          continue;
        }
        statements.push(
          db
            .prepare(
              `insert into page_drafts (page_id, blocks, seo, updated_by, updated_at) values (?, ?, ?, ?, ?)
               on conflict (page_id) do update set blocks = excluded.blocks, seo = excluded.seo,
                 updated_by = excluded.updated_by, updated_at = excluded.updated_at`,
            )
            .bind(before.pageId, encodeValue("blocks", before.blocks), encodeValue("seo", before.seo ?? {}), user.email, now()),
        );
        continue;
      }
      const entity = getEntity(kind);
      if (!entity) continue;
      const row = await first<Values>(`select * from ${entity.table} where id = ?`, ref);
      if (item.before) statements.push(upsertRecordDraft(entity.key, ref, item.before as Values, false, user.email));
      else if (row) statements.push(upsertRecordDraft(entity.key, ref, draftData(entity.key, row), true, user.email));
    }
    if (statements.length) await db.batch(statements);
    await audit(user.email, "release.undo", release.published_at, `${statements.length} mục vào bản nháp${skipped ? `, ${skipped} trang bỏ qua` : ""}`);
    return { ok: true, count: statements.length };
  } catch (e) {
    return fail(e);
  }
}
