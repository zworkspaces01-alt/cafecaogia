"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from "lucide-react";
import { ImageInput } from "@/components/admin/fields";
import { inputClass } from "@/components/admin/ui";
import type { Locale } from "@/i18n/config";
import { addItem, emptyItem, getIn, moveItem, removeItem, setValue, toPath, type Path } from "@/lib/blocks/edit";
import { isSharedField, type Block, type BlockSchema, type Field, type ListField } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

type Props = { block: Block; lang: Locale; onChange: (block: Block) => void };

/** The form for one block: its schema's fields, in the language being edited. */
export function BlockForm({ block, schema, lang, onChange }: Props & { schema: BlockSchema }) {
  return (
    <div className="space-y-4">
      {schema.fields.map((field) => (
        <FieldRow key={field.name} field={field} path={toPath(field.name)} block={block} lang={lang} onChange={onChange} />
      ))}
    </div>
  );
}

function Label({ field, shared, lang }: { field: Field; shared: boolean; lang: Locale }) {
  return (
    <span className="mb-1.5 flex items-center gap-2 text-xs font-medium text-forest">
      {field.label}
      {shared && lang !== "en" && <span className="rounded-full bg-sand px-1.5 py-px text-[10px] font-normal text-muted">dùng chung</span>}
    </span>
  );
}

function FieldRow({ field, path, block, lang, onChange }: Props & { field: Field; path: Path }) {
  if (field.type === "list") return <ListEditor field={field} path={path} block={block} lang={lang} onChange={onChange} />;

  const shared = isSharedField(field);
  const source = shared ? block.content.en : block.content[lang];
  const value = getIn(source, path);
  const english = getIn(block.content.en, path);
  const set = (next: unknown) => onChange(setValue(block, lang, path, next, shared));
  const placeholder = lang !== "en" && !shared ? english : undefined;

  return (
    <label className="block">
      <Label field={field} shared={shared} lang={lang} />
      <FieldInput field={field} value={value} placeholder={placeholder} onValue={set} />
      {field.help && <span className="mt-1 block text-[11px] text-muted">{field.help}</span>}
    </label>
  );
}

function FieldInput({ field, value, placeholder, onValue }: { field: Field; value: unknown; placeholder?: unknown; onValue: (v: unknown) => void }) {
  const text = typeof value === "string" ? value : "";
  const hint = typeof placeholder === "string" ? placeholder : Array.isArray(placeholder) ? placeholder.join("\n") : "";

  switch (field.type) {
    case "text":
    case "url":
      return (
        <input
          className={inputClass}
          dir="auto"
          value={text}
          placeholder={field.type === "url" ? "/contact hoặc https://…" : hint}
          onChange={(e) => onValue(e.target.value)}
        />
      );
    case "textarea":
      return <textarea className={cn(inputClass, "min-h-24 resize-y")} dir="auto" value={text} placeholder={hint} onChange={(e) => onValue(e.target.value)} />;
    case "lines": {
      const lines = Array.isArray(value) ? (value as string[]) : [];
      return (
        <textarea
          className={cn(inputClass, "min-h-24 resize-y")}
          dir="auto"
          value={lines.join("\n")}
          placeholder={hint || "Mỗi dòng một mục"}
          onChange={(e) => onValue(e.target.value === "" ? [] : e.target.value.split("\n"))}
        />
      );
    }
    case "pairs":
      return <PairsInput value={value} placeholder={placeholder} onValue={onValue} />;
    case "image":
      return <ImageInput folder="pages" value={text || null} onChange={(v) => onValue(v ?? "")} />;
    case "select":
      return (
        <select className={inputClass} value={text} onChange={(e) => onValue(e.target.value)}>
          <option value="">—</option>
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    default:
      return null;
  }
}

/** Label/value rows ("Moisture" / "12.5%"). */
function PairsInput({ value, placeholder, onValue }: { value: unknown; placeholder?: unknown; onValue: (v: unknown) => void }) {
  const rows = Array.isArray(value) ? (value as string[][]) : [];
  const hints = Array.isArray(placeholder) ? (placeholder as string[][]) : [];
  const count = Math.max(rows.length, hints.length);
  const set = (i: number, j: number, text: string) => {
    const next = Array.from({ length: count }, (_, k) => [...(rows[k] ?? ["", ""])]);
    next[i][j] = text;
    onValue(next);
  };
  return (
    <div className="space-y-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex gap-2">
          {[0, 1].map((j) => (
            <input key={j} className={inputClass} dir="auto" value={rows[i]?.[j] ?? ""} placeholder={hints[i]?.[j] ?? ""} onChange={(e) => set(i, j, e.target.value)} />
          ))}
          <button
            type="button"
            onClick={() => onValue(rows.filter((_, k) => k !== i))}
            className="grid size-11 shrink-0 place-items-center rounded-xl text-muted hover:bg-sand hover:text-red-600"
            aria-label="Xoá dòng"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onValue([...rows, ["", ""]])} className="inline-flex items-center gap-1 text-xs font-medium text-leaf hover:text-forest">
        <Plus className="size-3.5" /> Thêm dòng
      </button>
    </div>
  );
}

/** A repeatable list (slides, cards, FAQ items…). Adding, removing and reordering applies to every language. */
function ListEditor({ field, path, block, lang, onChange }: Props & { field: ListField; path: Path }) {
  const items = (getIn(block.content.en, path) as Record<string, unknown>[] | undefined) ?? [];
  const [open, setOpen] = useState<number | null>(null);

  return (
    <div>
      <span className="mb-1.5 block text-xs font-medium text-forest">
        {field.label} <span className="font-normal text-muted">({items.length})</span>
      </span>
      <ul className="space-y-2">
        {items.map((item, i) => {
          const localized = getIn(block.content[lang], [...path, i, field.titleField ?? ""]);
          const title = (typeof localized === "string" && localized) || String(item[field.titleField ?? ""] ?? "") || `Mục ${i + 1}`;
          const expanded = open === i;
          return (
            <li key={i} className="rounded-2xl border border-mist bg-white">
              <div className="flex items-center gap-1 ps-3">
                <button type="button" onClick={() => setOpen(expanded ? null : i)} className="flex min-h-11 flex-1 items-center gap-2 text-start text-sm text-forest">
                  <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", expanded && "rotate-180")} />
                  <span className="line-clamp-1" dir="auto">
                    {title}
                  </span>
                </button>
                <IconButton label="Lên" disabled={i === 0} onClick={() => (onChange(moveItem(block, path, i, i - 1)), setOpen(null))}>
                  <ArrowUp className="size-4" />
                </IconButton>
                <IconButton label="Xuống" disabled={i === items.length - 1} onClick={() => (onChange(moveItem(block, path, i, i + 1)), setOpen(null))}>
                  <ArrowDown className="size-4" />
                </IconButton>
                <IconButton label="Xoá" danger onClick={() => (onChange(removeItem(block, path, i)), setOpen(null))}>
                  <Trash2 className="size-4" />
                </IconButton>
              </div>
              {expanded && (
                <div className="space-y-4 border-t border-mist p-3">
                  {field.fields.map((sub) => (
                    <FieldRow key={sub.name} field={sub} path={[...path, i, ...toPath(sub.name)]} block={block} lang={lang} onChange={onChange} />
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        onClick={() => (onChange(addItem(block, path, emptyItem(field))), setOpen(items.length))}
        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-leaf hover:text-forest"
      >
        <Plus className="size-3.5" /> Thêm mục
      </button>
    </div>
  );
}

export function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:bg-sand disabled:opacity-30 disabled:hover:bg-transparent",
        danger ? "hover:text-red-600" : "hover:text-forest",
      )}
    >
      {children}
    </button>
  );
}
