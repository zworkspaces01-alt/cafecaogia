// Merges a block's translated content over its English content. Client-safe.

import type { Locale } from "@/i18n/config";
import type { Block, BlockContent } from "@/lib/blocks/types";

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isEmpty = (value: unknown) =>
  value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0);

/**
 * English decides the structure (which keys and how many list items); a translation replaces a value
 * only where it is non-empty. Lists are merged item by item, so a missing translation falls back to
 * English for that item alone.
 */
export function overlay(base: unknown, override: unknown): unknown {
  if (isEmpty(override)) return base;
  if (Array.isArray(base)) {
    if (!Array.isArray(override)) return base;
    return base.map((item, i) => overlay(item, override[i]));
  }
  if (isObject(base)) {
    if (!isObject(override)) return base;
    return Object.fromEntries(Object.entries(base).map(([key, value]) => [key, overlay(value, override[key])]));
  }
  return typeof override === typeof base || base === undefined ? override : base;
}

/** The content a block renders with in `locale`. */
export function resolveContent<T = BlockContent>(block: Block, locale: Locale): T {
  const base = block.content.en;
  return (locale === "en" ? base : overlay(base, block.content[locale])) as T;
}

/** Reads a dotted path ("kinds.bank") from an object. */
export function getPath(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => (isObject(value) ? value[key] : undefined), source);
}

/** Returns a copy of `source` with the dotted `path` set to `value`. */
export function setPath<T extends Record<string, unknown>>(source: T, path: string, value: unknown): T {
  const [key, ...rest] = path.split(".");
  if (rest.length === 0) return { ...source, [key]: value };
  const child = isObject(source[key]) ? (source[key] as Record<string, unknown>) : {};
  return { ...source, [key]: setPath(child, rest.join("."), value) };
}

/** Short random id for new blocks. */
export const newBlockId = () => Math.random().toString(36).slice(2, 10);
