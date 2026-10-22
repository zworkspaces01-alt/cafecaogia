// Page builder data model. Client-safe: shared by the admin editor and the site renderer.
//
// A page is an ordered list of blocks. Each block keeps its content per language: `content.en` holds
// the full structure (texts plus shared settings such as images, links and options); `content.ru` and
// `content.ar` hold only translated texts, overlaid on English by index and key (see resolve.ts).
// Structural edits (adding, removing or reordering list items) are applied to every language at once.

import type { Locale } from "@/i18n/config";

export type BlockContent = Record<string, unknown>;

export type Block = {
  /** Stable id, unique within the page. */
  id: string;
  type: string;
  /** Hidden blocks stay in the page but aren't rendered. */
  hidden?: boolean;
  content: Partial<Record<Locale, BlockContent>> & { en: BlockContent };
};

/** Per-language SEO overrides for a page. */
export type PageSeo = Partial<Record<Locale, { title?: string; description?: string }>>;

/** Pages that exist in code (their routes, JSON-LD and data stay in code; their blocks are editable). */
export const systemPages = [
  { key: "home", path: "", label: "Trang chủ" },
  { key: "about", path: "/about", label: "Giới thiệu (About)" },
  { key: "process", path: "/process", label: "Quy trình (Process)" },
  { key: "green-coffee", path: "/green-coffee", label: "Cà phê nhân (Green coffee)" },
  { key: "cashew-kernels", path: "/cashew-kernels", label: "Hạt điều (Cashew kernels)" },
] as const;

export type SystemPageKey = (typeof systemPages)[number]["key"];

export const isSystemPageKey = (value: string): value is SystemPageKey => systemPages.some((p) => p.key === value);

/** Paths a custom page can't take: existing routes and reserved prefixes. */
export const reservedSlugs = new Set([
  "about",
  "about-ceo",
  "admin",
  "api",
  "cashew-kernels",
  "company-profile",
  "contact",
  "gallery",
  "green-coffee",
  "insights",
  "preview",
  "process",
  "products",
]);

export const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// ── Editor field schema ──────────────────────────────────────────────────────

type FieldBase = {
  /** Key in the block content; a dot reaches into a nested object ("kinds.bank"). */
  name: string;
  /** Admin label (Vietnamese). */
  label: string;
  help?: string;
};

/** Translated per language. */
export type TextField = FieldBase & { type: "text" | "textarea" };
/** A list of short texts (one per line), translated per language. */
export type LinesField = FieldBase & { type: "lines" };
/** Label/value pairs ("Moisture" / "12.5%"), translated per language. */
export type PairsField = FieldBase & { type: "pairs" };
/** Shared across languages (edited once, stored in English). */
export type SharedField = FieldBase &
  (
    | { type: "image" }
    | { type: "url" }
    | { type: "select"; options: { value: string; label: string }[] }
  );
/** A list of items, each with its own fields; items are added, removed and reordered in every language. */
export type ListField = FieldBase & {
  type: "list";
  fields: (TextField | LinesField | PairsField | SharedField)[];
  /** Field shown as the item's title in the collapsed list. */
  titleField?: string;
};

export type Field = TextField | LinesField | PairsField | SharedField | ListField;

export const isSharedField = (field: Field) => field.type === "image" || field.type === "url" || field.type === "select";

export type BlockGroup = "home" | "page" | "content";

/** What the editor knows about a block type. */
export type BlockSchema = {
  type: string;
  label: string;
  description: string;
  group: BlockGroup;
  fields: Field[];
};
