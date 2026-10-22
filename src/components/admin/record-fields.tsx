"use client";

import { useRef } from "react";
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote } from "lucide-react";
import { FileInput, GalleryInput, ImageInput, SpecsInput, Toggle } from "@/components/admin/fields";
import { inputClass } from "@/components/admin/ui";
import type { Entity, Field } from "@/lib/admin/entities";
import { cn } from "@/lib/utils";

// The form of one record in the collection editor, generated from its entity (lib/admin/entities.ts).
// English is the full record; Russian and Arabic show only the translatable fields, with the English
// text as a hint, and are stored in `translations`.

export type Values = Record<string, unknown> & { translations?: Record<string, Record<string, unknown>> };
export type Lang = "en" | "ru" | "ar";

/** Shown as switches above the form; sort_order is set by dragging in the list. */
export const isToggle = (field: Field) => field.type === "boolean";
const hidden = new Set(["sort_order"]);

export function RecordToggles({ entity, values, onChange }: { entity: Entity; values: Values; onChange: (values: Values) => void }) {
  return (
    <div className="grid gap-3 rounded-2xl bg-sand p-4">
      {entity.fields.filter(isToggle).map((field) => (
        <Toggle
          key={field.name}
          label={field.label}
          help={field.help}
          checked={Boolean(values[field.name])}
          onChange={(v) => onChange({ ...values, [field.name]: v })}
        />
      ))}
    </div>
  );
}

export function RecordFields({ entity, values, lang, onChange }: { entity: Entity; values: Values; lang: Lang; onChange: (values: Values) => void }) {
  const fields = entity.fields.filter((f) => !isToggle(f) && !hidden.has(f.name) && (lang === "en" || f.translatable));
  const get = (field: Field) => (lang === "en" || !field.translatable ? values[field.name] : values.translations?.[lang]?.[field.name]);
  const set = (field: Field, value: unknown) => {
    if (lang === "en" || !field.translatable) return onChange({ ...values, [field.name]: value });
    const translations = { ...values.translations };
    translations[lang] = { ...translations[lang], [field.name]: value };
    onChange({ ...values, translations });
  };

  return (
    <div className="space-y-5">
      {lang !== "en" && (
        <p className="rounded-xl bg-sky-50 px-4 py-3 text-xs text-sky-900">
          Chỉ các trường cần dịch hiển thị ở đây. Để trống → website dùng bản tiếng Anh. Chữ mờ trong ô là bản tiếng Anh để tham khảo.
        </p>
      )}
      {fields.map((field) => (
        <div key={`${lang}-${field.name}`} className="grid gap-1.5">
          <span className="text-sm font-medium text-forest">
            {field.label}
            {field.required && lang === "en" && <span className="text-red-600"> *</span>}
          </span>
          <FieldInput entity={entity} field={field} value={get(field)} english={values[field.name]} lang={lang} onChange={(v) => set(field, v)} />
          {field.help && lang === "en" && <span className="text-xs text-muted">{field.help}</span>}
        </div>
      ))}
    </div>
  );
}

function FieldInput({
  entity,
  field,
  value,
  english,
  lang,
  onChange,
}: {
  entity: Entity;
  field: Field;
  value: unknown;
  english: unknown;
  lang: Lang;
  onChange: (value: unknown) => void;
}) {
  const hint = lang !== "en" && typeof english === "string" ? english : undefined;
  const dir = lang === "ar" ? "rtl" : undefined;

  switch (field.type) {
    case "textarea":
      if (field.name === "body") return <MarkdownInput value={(value as string) ?? ""} placeholder={hint} dir={dir} onChange={onChange} />;
      return (
        <textarea
          rows={field.name === "description" || field.name === "quote" ? 5 : 3}
          className={cn(inputClass, "resize-y")}
          dir={dir}
          placeholder={hint ?? field.placeholder}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "date":
      return <input type="date" className={cn(inputClass, "max-w-52")} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return (
        <input
          type="number"
          className={cn(inputClass, "max-w-40")}
          value={(value as number | null) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      );
    case "select":
      return (
        <select className={cn(inputClass, "max-w-xs")} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "image":
      return <ImageInput folder={entity.key} value={(value as string | null) ?? null} onChange={onChange} />;
    case "file":
      return <FileInput folder={entity.key} value={(value as string | null) ?? null} onChange={onChange} />;
    case "gallery":
      return <GalleryInput folder={entity.key} value={(value as string[]) ?? []} onChange={onChange} />;
    case "lines":
      return (
        <textarea
          rows={5}
          className={cn(inputClass, "resize-y")}
          dir={dir}
          placeholder={lang !== "en" ? ((english as string[]) ?? []).join("\n\n") : (field.placeholder ?? "Mỗi dòng là một đoạn văn")}
          value={((value as string[]) ?? []).join("\n")}
          onChange={(e) => onChange(e.target.value.split("\n"))}
        />
      );
    case "specs":
      return (
        <SpecsInput
          value={(value as { label: string; value: string }[]) ?? []}
          onChange={onChange}
          placeholder={lang !== "en" ? ((english as { label: string; value: string }[]) ?? []) : undefined}
        />
      );
    default:
      return (
        <input className={inputClass} dir={dir} placeholder={hint ?? field.placeholder} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />
      );
  }
}

type Tool = { label: string; icon: typeof Bold; kind: "wrap" | "line"; before: string; after?: string; sample: string };

const tools: Tool[] = [
  { label: "Tiêu đề mục (##)", icon: Heading2, kind: "line", before: "## ", sample: "Tiêu đề mục" },
  { label: "Tiêu đề nhỏ (###)", icon: Heading3, kind: "line", before: "### ", sample: "Tiêu đề nhỏ" },
  { label: "Chữ đậm", icon: Bold, kind: "wrap", before: "**", after: "**", sample: "chữ đậm" },
  { label: "Chữ nghiêng", icon: Italic, kind: "wrap", before: "*", after: "*", sample: "chữ nghiêng" },
  { label: "Liên kết", icon: Link2, kind: "wrap", before: "[", after: "](/contact)", sample: "chữ liên kết" },
  { label: "Gạch đầu dòng", icon: List, kind: "line", before: "- ", sample: "Ý thứ nhất" },
  { label: "Danh sách số", icon: ListOrdered, kind: "line", before: "1. ", sample: "Bước thứ nhất" },
  { label: "Khung ghi chú (>)", icon: Quote, kind: "line", before: "> ", sample: "Ghi chú" },
];

/** Article body: a textarea with buttons for the Markdown the article renderer understands. */
function MarkdownInput({ value, placeholder, dir, onChange }: { value: string; placeholder?: string; dir?: "rtl"; onChange: (value: string) => void }) {
  const area = useRef<HTMLTextAreaElement>(null);

  /** Wraps the selection (inline) or prefixes the selected lines (block). */
  const apply = ({ kind, before, after = "", sample }: Tool) => {
    const el = area.current;
    if (!el) return;
    const { selectionStart: start, selectionEnd: end } = el;
    let next: string;
    let cursor: [number, number];
    if (kind === "wrap") {
      const text = value.slice(start, end) || sample;
      next = value.slice(0, start) + before + text + after + value.slice(end);
      cursor = [start + before.length, start + before.length + text.length];
    } else {
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      const block = value.slice(lineStart, end) || sample;
      const lines = block.split("\n").map((line, i) => `${before === "1. " ? `${i + 1}. ` : before}${line}`);
      next = value.slice(0, lineStart) + lines.join("\n") + value.slice(Math.max(end, lineStart));
      cursor = [lineStart, lineStart + lines.join("\n").length];
    }
    onChange(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(...cursor);
    });
  };



  return (
    <div className="overflow-hidden rounded-xl border border-mist focus-within:border-leaf focus-within:ring-2 focus-within:ring-lime/60">
      <div className="flex flex-wrap gap-0.5 border-b border-mist bg-sand px-1.5 py-1">
        {tools.map((tool) => (
          <button key={tool.label} type="button" title={tool.label} aria-label={tool.label} onClick={() => apply(tool)} className="rounded-md p-1.5 text-muted hover:bg-white hover:text-forest">
            <tool.icon className="size-4" />
          </button>
        ))}
      </div>
      <textarea
        ref={area}
        rows={22}
        className="block w-full resize-y bg-white px-3.5 py-2.5 font-mono text-[13px] leading-relaxed text-forest outline-none placeholder:text-muted/60"
        dir={dir}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
