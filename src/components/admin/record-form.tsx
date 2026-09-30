"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { ArrowLeft, CheckCircle2, ExternalLink, Loader2, Trash2 } from "lucide-react";
import { deleteRecord, saveRecord } from "@/app/admin/actions";
import { FileInput, GalleryInput, ImageInput, SpecsInput, Toggle } from "@/components/admin/fields";
import { inputClass } from "@/components/admin/ui";
import { adminLocales, getEntity, type Field } from "@/lib/admin/entities";
import { cn } from "@/lib/utils";

type Values = Record<string, unknown> & { translations?: Record<string, Record<string, unknown>> };
type Lang = (typeof adminLocales)[number]["code"];

const sidebarTypes = new Set(["boolean"]);
const sidebarNames = new Set(["sort_order"]);

export function RecordForm({ entityKey, id, initial }: { entityKey: string; id: string | null; initial: Values }) {
  const entity = getEntity(entityKey)!;
  const router = useRouter();
  const [values, setValues] = useState<Values>(initial);
  const [lang, setLang] = useState<Lang>("en");
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const get = (field: Field) => (lang === "en" ? values[field.name] : values.translations?.[lang]?.[field.name]);
  const set = (field: Field, value: unknown) => {
    setStatus(null);
    setValues((prev) => {
      if (lang === "en" || !field.translatable) return { ...prev, [field.name]: value };
      const translations = { ...prev.translations };
      translations[lang] = { ...translations[lang], [field.name]: value };
      return { ...prev, translations };
    });
  };

  const mainFields = entity.fields.filter((f) => !sidebarTypes.has(f.type) && !sidebarNames.has(f.name));
  const visibleFields = lang === "en" ? mainFields : mainFields.filter((f) => f.translatable);
  const sideFields = entity.fields.filter((f) => sidebarTypes.has(f.type) || sidebarNames.has(f.name));

  const save = () =>
    startSave(async () => {
      const result = await saveRecord(entity.key, id, values);
      if (!result.ok) return setStatus({ tone: "error", text: result.error });
      setStatus({ tone: "ok", text: "Đã lưu — website đã được cập nhật." });
      if (!id && result.id) router.replace(`/admin/${entity.key}/${result.id}`);
      else router.refresh();
    });

  const remove = () => {
    if (!id || !confirm(`Xoá ${entity.singular} này? Không thể hoàn tác.`)) return;
    startDelete(async () => {
      const result = await deleteRecord(entity.key, id);
      if (!result.ok) return setStatus({ tone: "error", text: result.error });
      router.push(`/admin/${entity.key}`);
    });
  };

  const renderInput = (field: Field) => {
    const value = get(field);
    const english = values[field.name];
    const hint = lang !== "en" && typeof english === "string" ? english : undefined;

    switch (field.type) {
      case "textarea":
        return (
          <textarea
            rows={field.name === "description" || field.name === "quote" ? 5 : 3}
            className={cn(inputClass, "resize-y")}
            dir={lang === "ar" ? "rtl" : undefined}
            placeholder={hint ?? field.placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => set(field, e.target.value)}
          />
        );
      case "number":
        return (
          <input
            type="number"
            className={cn(inputClass, "max-w-40")}
            value={(value as number | null) ?? ""}
            onChange={(e) => set(field, e.target.value === "" ? null : Number(e.target.value))}
          />
        );
      case "select":
        return (
          <select
            className={cn(inputClass, "max-w-xs")}
            value={(value as string) ?? ""}
            onChange={(e) => set(field, e.target.value)}
          >
            {field.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        );
      case "image":
        return (
          <ImageInput folder={entity.key} value={(value as string | null) ?? null} onChange={(v) => set(field, v)} />
        );
      case "file":
        return (
          <FileInput folder={entity.key} value={(value as string | null) ?? null} onChange={(v) => set(field, v)} />
        );
      case "gallery":
        return <GalleryInput folder={entity.key} value={(value as string[]) ?? []} onChange={(v) => set(field, v)} />;
      case "lines":
        return (
          <textarea
            rows={5}
            className={cn(inputClass, "resize-y")}
            dir={lang === "ar" ? "rtl" : undefined}
            placeholder={lang !== "en" ? ((english as string[]) ?? []).join("\n\n") : "Mỗi dòng là một đoạn văn"}
            value={((value as string[]) ?? []).join("\n")}
            onChange={(e) => set(field, e.target.value.split("\n"))}
          />
        );
      case "specs":
        return (
          <SpecsInput
            value={(value as { label: string; value: string }[]) ?? []}
            onChange={(v) => set(field, v)}
            placeholder={lang !== "en" ? ((english as { label: string; value: string }[]) ?? []) : undefined}
          />
        );
      default:
        return (
          <input
            className={inputClass}
            dir={lang === "ar" ? "rtl" : undefined}
            placeholder={hint ?? field.placeholder}
            value={(value as string) ?? ""}
            onChange={(e) => set(field, e.target.value)}
          />
        );
    }
  };

  const title =
    String(values[entity.titleField] || "") ||
    `${entity.singular.charAt(0).toUpperCase()}${entity.singular.slice(1)} mới`;
  const publicUrl =
    entity.key === "products" && values.slug
      ? `/en/products/${values.slug}`
      : entity.key === "team" && values.is_ceo
        ? "/en/about-ceo"
        : null;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/admin/${entity.key}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-forest"
        >
          <ArrowLeft className="size-4" /> {entity.label}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-forest">{title}</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px] xl:items-start">
        <div className="space-y-5 rounded-3xl bg-white p-6 md:p-8">
          {entity.hasTranslations && (
            <div className="-mt-1 flex flex-wrap gap-1 rounded-2xl bg-sand p-1">
              {adminLocales.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLang(l.code)}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-2 text-sm transition-colors",
                    lang === l.code ? "bg-white font-medium text-forest shadow-sm" : "text-muted hover:text-forest",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
          {lang !== "en" && (
            <p className="rounded-xl bg-sky-50 px-4 py-3 text-xs text-sky-900">
              Chỉ các trường cần dịch hiển thị ở đây. Để trống → website dùng bản tiếng Anh. Chữ mờ trong ô là bản tiếng
              Anh để tham khảo.
            </p>
          )}

          {visibleFields.map((field) => (
            <div key={`${lang}-${field.name}`} className="grid gap-1.5">
              <span className="text-sm font-medium text-forest">
                {field.label}
                {field.required && lang === "en" && <span className="text-red-600"> *</span>}
              </span>
              {renderInput(field)}
              {field.help && lang === "en" && <span className="text-xs text-muted">{field.help}</span>}
            </div>
          ))}
        </div>

        <aside className="space-y-5 rounded-3xl bg-white p-6 xl:sticky xl:top-6">
          {sideFields.map((field) =>
            field.type === "boolean" ? (
              <Toggle
                key={field.name}
                label={field.label}
                help={field.help}
                checked={Boolean(values[field.name])}
                onChange={(v) => {
                  setStatus(null);
                  setValues((prev) => ({ ...prev, [field.name]: v }));
                }}
              />
            ) : (
              <label key={field.name} className="grid gap-1.5">
                <span className="text-sm font-medium text-forest">{field.label}</span>
                <input
                  type="number"
                  className={cn(inputClass, "max-w-32")}
                  value={(values[field.name] as number | null) ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({
                      ...prev,
                      [field.name]: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                />
                {field.help && <span className="text-xs text-muted">{field.help}</span>}
              </label>
            ),
          )}

          {status && (
            <p
              role="status"
              className={cn(
                "flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm",
                status.tone === "ok" ? "bg-lime/40 text-forest" : "bg-red-50 text-red-700",
              )}
            >
              {status.tone === "ok" && <CheckCircle2 className="mt-0.5 size-4 shrink-0" />}
              {status.text}
            </p>
          )}

          <div className="grid gap-2 border-t border-mist pt-5">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-forest text-sm font-medium text-white hover:bg-leaf disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              {id ? "Lưu thay đổi" : `Tạo ${entity.singular}`}
            </button>
            {publicUrl && id && (
              <a
                href={publicUrl}
                target="_blank"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-mist text-sm text-forest hover:bg-sand"
              >
                <ExternalLink className="size-4" /> Xem trên website
              </a>
            )}
            {id && (
              <button
                type="button"
                onClick={remove}
                disabled={deleting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full text-sm text-red-600 hover:bg-red-50 disabled:opacity-60"
              >
                {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />} Xoá
              </button>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
