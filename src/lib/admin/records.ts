import "server-only";

import { getEntity, type Entity, type Field } from "@/lib/admin/entities";
import { all, first } from "@/lib/db";

// Records (products, posts, testimonials…) as the Studio edits them. Edits are drafts in
// record_drafts until published; the website reads the tables, the preview reads both (lib/preview.ts).

export type Values = Record<string, unknown> & { translations?: Record<string, Record<string, unknown>> };

/** published: matches the website · changed: edited, not yet published · new: never published · deleted: removal pending. */
export type RecordStatus = "published" | "changed" | "new" | "deleted";

export type EditorItem = { id: string; values: Values; status: RecordStatus; updatedBy?: string; updatedAt?: string };

export type RecordDraft = { entity: string; record_id: string; data: Values; deleted: boolean; updated_by: string; updated_at: string };

const nullableTypes = new Set(["image", "file", "number", "date"]);
const nullableText = new Set(["product_slug", "url"]);

function normalize(field: Field, value: unknown): unknown {
  switch (field.type) {
    case "boolean":
      return Boolean(value);
    case "number": {
      if (value === "" || value === null || value === undefined) return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    case "gallery":
    case "lines":
      return Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];
    case "specs":
      return Array.isArray(value)
        ? value
            .map((s) => ({ label: String(s?.label ?? "").trim(), value: String(s?.value ?? "").trim() }))
            .filter((s) => s.label || s.value)
        : [];
    default: {
      const text = typeof value === "string" ? value.trim() : "";
      if (!text && (nullableTypes.has(field.type) || nullableText.has(field.name))) return null;
      return text;
    }
  }
}

const isEmpty = (v: unknown) => v === null || v === "" || (Array.isArray(v) && v.length === 0);

/**
 * The row stored for these values: every field cleaned up, translations kept only where filled in.
 * `strict` throws on a missing required field (publishing); previews and comparisons pass false.
 */
export function buildRow(entity: Entity, values: Values, strict = true) {
  const row: Record<string, unknown> = {};
  const translations: Record<string, Record<string, unknown>> = {};
  const incoming = values.translations ?? {};

  for (const field of entity.fields) {
    const value = normalize(field, values[field.name]);
    if (strict && field.required && isEmpty(value)) throw new Error(`Vui lòng nhập “${field.label}”.`);
    row[field.name] = value;

    if (field.translatable && entity.hasTranslations) {
      for (const lang of ["ru", "ar"]) {
        const translated = normalize(field, incoming[lang]?.[field.name]);
        if (!isEmpty(translated)) (translations[lang] ??= {})[field.name] = translated;
      }
    }
  }
  if (entity.hasTranslations) row.translations = translations;
  return row;
}

/** Whether two sets of values store the same row (ignores formatting such as trailing spaces). */
export function sameRow(entity: Entity, a: Values, b: Values) {
  return JSON.stringify(buildRow(entity, a, false)) === JSON.stringify(buildRow(entity, b, false));
}

/** Title of a record for lists, notifications and the release history. */
export const recordTitle = (entity: Entity, values: Values | null | undefined) =>
  String(values?.[entity.titleField] ?? "").trim() || "(chưa đặt tên)";

export function recordDrafts(entity?: string): Promise<RecordDraft[]> {
  return entity
    ? all<RecordDraft>("select * from record_drafts where entity = ? order by updated_at", entity)
    : all<RecordDraft>("select * from record_drafts order by updated_at");
}

export function recordDraft(entity: string, id: string) {
  return first<RecordDraft>("select * from record_drafts where entity = ? and record_id = ?", entity, id);
}

/** Admin list order: the entity's own, else sort_order. */
const orderOf = (entity: Entity) => entity.listOrder ?? { column: "sort_order", ascending: true };

function sortValues(entity: Entity, items: EditorItem[]) {
  const { column, ascending } = orderOf(entity);
  const key = (item: EditorItem) => item.values[column] as string | number | null;
  return items.sort((a, b) => {
    const x = key(a) ?? "";
    const y = key(b) ?? "";
    return (x < y ? -1 : x > y ? 1 : 0) * (ascending ? 1 : -1);
  });
}

/** Every record of an entity as the editor shows it: drafts applied, new ones included, removals marked. */
export async function editorItems(entityKey: string): Promise<EditorItem[]> {
  const entity = getEntity(entityKey)!;
  const [rows, drafts] = await Promise.all([all<Values & { id: string }>(`select * from ${entity.table}`), recordDrafts(entity.key)]);
  const byId = new Map(drafts.map((d) => [d.record_id, d]));
  const items: EditorItem[] = rows.map(({ id, ...values }) => {
    const draft = byId.get(id);
    byId.delete(id);
    if (!draft) return { id, values, status: "published" };
    return {
      id,
      values: { ...values, ...draft.data },
      status: draft.deleted ? "deleted" : "changed",
      updatedBy: draft.updated_by,
      updatedAt: draft.updated_at,
    };
  });
  for (const draft of byId.values()) {
    if (draft.deleted) continue;
    items.push({ id: draft.record_id, values: draft.data, status: "new", updatedBy: draft.updated_by, updatedAt: draft.updated_at });
  }
  return sortValues(entity, items);
}
