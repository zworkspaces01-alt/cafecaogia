import { blockSchema } from "@/lib/blocks/schema";
import type { Block } from "@/lib/blocks/types";

const MAX_BYTES = 900_000;

/** Rejects anything that isn't a list of known blocks with English content. */
export function validBlocks(value: unknown): value is Block[] {
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
