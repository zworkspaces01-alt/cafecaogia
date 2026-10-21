import "server-only";

import { getCloudflareContext } from "@opennextjs/cloudflare";

/** Tag for public reads, so a CMS save can expire them (see refreshSite in app/admin/actions.ts). */
export const CMS_CACHE_TAG = "cms";

/** The CMS database (D1 binding `DB` in wrangler.jsonc). Only available at request time, never during `next build`. */
export function getDb(): D1Database {
  return getCloudflareContext().env.DB;
}

// D1 stores booleans as 0/1 and arrays/objects as JSON text. Column names are unique in meaning
// across tables, so one list each covers the whole schema (migrations/0001_init.sql).
const JSON_COLUMNS = new Set(["gallery", "specs", "translations", "bio", "product_slugs", "data", "attribution"]);
const BOOL_COLUMNS = new Set(["featured", "published", "is_sample", "is_ceo"]);

export type Row = Record<string, unknown>;
export type Value = string | number | null;

function decodeRow<T>(row: Row): T {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    if (JSON_COLUMNS.has(key) && typeof value === "string") out[key] = JSON.parse(value);
    else if (BOOL_COLUMNS.has(key) && typeof value === "number") out[key] = value === 1;
    else out[key] = value;
  }
  return out as T;
}

/** Converts an app value to what D1 stores for that column. */
export function encodeValue(column: string, value: unknown): Value {
  if (value === undefined || value === null) return null;
  if (JSON_COLUMNS.has(column)) return JSON.stringify(value);
  if (typeof value === "boolean") return value ? 1 : 0;
  if (typeof value === "number" || typeof value === "string") return value;
  return JSON.stringify(value);
}

export async function all<T = Row>(sql: string, ...params: Value[]): Promise<T[]> {
  const { results } = await getDb()
    .prepare(sql)
    .bind(...params)
    .all<Row>();
  return results.map((row) => decodeRow<T>(row));
}

export async function first<T = Row>(sql: string, ...params: Value[]): Promise<T | null> {
  const row = await getDb()
    .prepare(sql)
    .bind(...params)
    .first<Row>();
  return row ? decodeRow<T>(row) : null;
}

export async function run(sql: string, ...params: Value[]) {
  return getDb()
    .prepare(sql)
    .bind(...params)
    .run();
}

/** `count(*)` of a query, e.g. count("select count(*) as n from inquiries where status = ?", "new"). */
export async function count(sql: string, ...params: Value[]): Promise<number> {
  return (await first<{ n: number }>(sql, ...params))?.n ?? 0;
}

/** Inserts a record (undefined fields are left to the column default) and returns its id. */
export async function insert(table: string, record: Row): Promise<string> {
  const entries = Object.entries(record).filter(([, value]) => value !== undefined);
  const columns = entries.map(([column]) => column).join(", ");
  const placeholders = entries.map(() => "?").join(", ");
  const row = await first<{ id: string }>(
    `insert into ${table} (${columns}) values (${placeholders}) returning id`,
    ...entries.map(([column, value]) => encodeValue(column, value)),
  );
  return row!.id;
}

/** Updates the given fields of one row by id and bumps updated_at. */
export async function update(table: string, id: string, record: Row) {
  const entries = Object.entries({ ...record, updated_at: now() }).filter(([, value]) => value !== undefined);
  const assignments = entries.map(([column]) => `${column} = ?`).join(", ");
  return run(
    `update ${table} set ${assignments} where id = ?`,
    ...entries.map(([column, value]) => encodeValue(column, value)),
    id,
  );
}

export const now = () => new Date().toISOString();

/** Thrown by D1 when a unique column (e.g. slug) already holds the value. */
export const isUniqueViolation = (error: unknown) => /UNIQUE constraint failed/i.test(String((error as Error)?.message ?? error));
