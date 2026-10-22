// Immutable edits on a block's content, used by the page editor. Client-safe.
// Texts are written to the language being edited; shared fields (images, links, options) always to
// English. List items are added, removed and moved in every language so indexes stay aligned.

import { locales, type Locale } from "@/i18n/config";
import type { Block, BlockContent, ListField } from "@/lib/blocks/types";

export type Path = (string | number)[];

export const toPath = (name: string): Path => name.split(".");

export function getIn(source: unknown, path: Path): unknown {
  return path.reduce<unknown>((value, key) => (value != null && typeof value === "object" ? (value as Record<string | number, unknown>)[key] : undefined), source);
}

export function setIn(source: unknown, path: Path, value: unknown): unknown {
  if (path.length === 0) return value;
  const [key, ...rest] = path;
  if (typeof key === "number") {
    const array = Array.isArray(source) ? [...source] : [];
    while (array.length < key) array.push({});
    array[key] = setIn(array[key], rest, value);
    return array;
  }
  const object = source != null && typeof source === "object" && !Array.isArray(source) ? { ...(source as Record<string, unknown>) } : {};
  object[key] = setIn(object[key], rest, value);
  return object;
}

const withContent = (block: Block, lang: Locale, content: BlockContent): Block => ({
  ...block,
  content: { ...block.content, [lang]: content },
});

/** Sets one value in the given language (shared values go to English). */
export function setValue(block: Block, lang: Locale, path: Path, value: unknown, shared = false): Block {
  const target = shared ? "en" : lang;
  return withContent(block, target, setIn(block.content[target] ?? {}, path, value) as BlockContent);
}

/** Applies a list operation to the list at `path` in every language that has content. */
function eachLanguage(block: Block, path: Path, op: (list: unknown[], lang: Locale, enLength: number) => unknown[]): Block {
  const enLength = (getIn(block.content.en, path) as unknown[] | undefined)?.length ?? 0;
  let next = block;
  for (const lang of locales) {
    const content = next.content[lang];
    if (!content && lang !== "en") continue;
    const current = getIn(content ?? {}, path);
    if (lang !== "en" && !Array.isArray(current)) continue;
    // Translations may be shorter than English; pad them so indexes line up before moving items.
    const list = [...((current as unknown[]) ?? [])];
    while (lang !== "en" && list.length < enLength) list.push({});
    next = withContent(next, lang, setIn(content ?? {}, path, op(list, lang, enLength)) as BlockContent);
  }
  return next;
}

/** An empty item for a list field: empty texts, empty lists, empty shared values. */
export function emptyItem(field: ListField): Record<string, unknown> {
  return Object.fromEntries(field.fields.map((f) => [f.name, f.type === "lines" || f.type === "pairs" ? [] : ""]));
}

export const addItem = (block: Block, path: Path, item: Record<string, unknown>) =>
  eachLanguage(block, path, (list, lang) => [...list, lang === "en" ? item : {}]);

export const removeItem = (block: Block, path: Path, index: number) =>
  eachLanguage(block, path, (list) => list.filter((_, i) => i !== index));

export const moveItem = (block: Block, path: Path, from: number, to: number) =>
  eachLanguage(block, path, (list) => {
    if (to < 0 || to >= list.length) return list;
    const next = [...list];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    return next;
  });

/** Moves a block within the page. */
export function moveBlock(blocks: Block[], from: number, to: number): Block[] {
  if (to < 0 || to >= blocks.length || from === to) return blocks;
  const next = [...blocks];
  const [block] = next.splice(from, 1);
  next.splice(to, 0, block);
  return next;
}
