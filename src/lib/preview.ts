import "server-only";

import { cache } from "react";
import { entities } from "@/lib/admin/entities";
import { buildRow, editorItems } from "@/lib/admin/records";

// The Studio preview (src/app/[lang]/preview) shows the website as it will be after Publish: page
// drafts and record drafts together. The preview route turns this on for its request; the content
// readers in lib/content.ts and lib/products.ts then read draftRows() instead of the published rows.

const state = cache(() => ({ drafts: false }));

/** For the current request only (React cache is per request). */
export function showDrafts() {
  state().drafts = true;
}

export const showingDrafts = () => state().drafts;

/** The visible rows of a content table with pending drafts applied, in sort_order. */
export async function draftRows<T>(table: string): Promise<T[]> {
  const entity = entities.find((e) => e.table === table);
  if (!entity) throw new Error(`No entity for table ${table}`);
  const items = await editorItems(entity.key);
  return items
    .filter((item) => item.status !== "deleted")
    .map((item) => ({ ...item.values, ...buildRow(entity, item.values, false), id: item.id }) as Record<string, unknown>)
    .filter((row) => row.published)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)) as T[];
}
