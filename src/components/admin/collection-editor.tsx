"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { AlertTriangle, Copy, ExternalLink, EyeOff, GripVertical, Plus, RotateCcw, Search, Trash2, Undo } from "lucide-react";
import { discardChanges, loadCollection, removeRecord, saveRecordDrafts } from "@/app/admin/publish-actions";
import { RecordFields, RecordToggles, type Lang, type Values } from "@/components/admin/record-fields";
import { SaveBadge, StudioToolbar, UndoRedo, WideScreenNotice, useStudio, type SaveState } from "@/components/admin/studio";
import { StudioPreview, langNames, type PreviewFocus, type PreviewHandle } from "@/components/admin/studio-preview";
import { useAutosave, useEditorKeys, useLatest, useLeaveWarning, useUndo } from "@/components/admin/use-editor";
import { adminLocales, getEntity, type Entity } from "@/lib/admin/entities";
import type { EditorItem, RecordStatus } from "@/lib/admin/records";
import type { Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

// A collection (products, posts, testimonials…) in the Studio, laid out like VSAP Studio's: the list
// on the left (drag to reorder), the selected item's form, and the real page with the drafts on the
// right. Edits autosave as drafts; the top bar's Publish puts them live.

type Item = { id: string; values: Values; status: RecordStatus };

const statusBadges: Partial<Record<RecordStatus, { label: string; tone: string }>> = {
  new: { label: "Mới", tone: "bg-sky-100 text-sky-900" },
  changed: { label: "Đã sửa", tone: "bg-amber-100 text-amber-900" },
  deleted: { label: "Sẽ xoá", tone: "bg-red-100 text-red-700" },
};

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const newId = () => crypto.randomUUID().replace(/-/g, "");

/** Where the item shows on the website: the page to preview and the block to outline. */
function previewOf(entity: Entity, values: Values | undefined): { src: string; focus: PreviewFocus } {
  const slug = encodeURIComponent(String(values?.slug ?? ""));
  switch (entity.key) {
    case "products":
      return { src: `/preview/product-template?item=${slug}`, focus: null };
    case "posts":
      return { src: `/preview/post-template?item=${slug}`, focus: null };
    case "testimonials":
      return { src: "/preview/home", focus: { blockType: "testimonials" } };
    case "partners":
      return { src: "/preview/home", focus: { blockType: "industryPartners" } };
    case "certifications":
      return { src: "/preview/home", focus: { blockType: "compliance" } };
    default:
      return values?.is_ceo ? { src: "/preview/about-ceo", focus: { blockType: "ceoProfile" } } : { src: "/preview/contact", focus: { blockType: "contactForm" } };
  }
}

/** What would stop this item from publishing. */
function problems(entity: Entity, item: Item, items: Item[]) {
  const found: string[] = [];
  for (const field of entity.fields) {
    const v = item.values[field.name];
    if (field.required && (v === null || v === undefined || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && !v.length))) {
      found.push(`Chưa nhập “${field.label}”.`);
    }
  }
  const slug = item.values.slug;
  if (typeof slug === "string" && slug) {
    if (!slugPattern.test(slug)) found.push("Đường dẫn (slug) chỉ gồm chữ thường không dấu, số và gạch ngang.");
    else if (items.some((other) => other.id !== item.id && other.status !== "deleted" && other.values.slug === slug)) {
      found.push(`Đường dẫn “${slug}” đang trùng với ${entity.singular} khác.`);
    }
  }
  return found;
}

export function CollectionEditor({ entityKey, initialItems, initialId }: { entityKey: string; initialItems: EditorItem[]; initialId: string | null }) {
  const entity = getEntity(entityKey)!;
  const studio = useStudio();
  const canWrite = studio.can("content.write");
  const [items, setItems] = useState<Item[]>(initialItems);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialItems.some((i) => i.id === initialId) ? initialId : (initialItems[0]?.id ?? null),
  );
  const [lang, setLang] = useState<Lang>("en");
  const [previewLang, setPreviewLang] = useState<Locale>("en");
  const [query, setQuery] = useState("");
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState<number | null>(null);
  const [busy, startTransition] = useTransition();
  const dirty = useRef(new Set<string>());
  const edits = useRef(0);

  const selected = items.find((i) => i.id === selectedId) ?? null;
  // The preview follows what was last saved, so it doesn't reload on every keystroke of a slug.
  const [previewed, setPreviewed] = useState<Values | undefined>(selected?.values);
  const { src, focus } = previewOf(entity, previewed);
  const preview = useRef<PreviewHandle>(null);
  const sortable = !entity.listOrder;

  useEffect(() => {
    const q = new URLSearchParams(location.search);
    if (selectedId) q.set("id", selectedId);
    else q.delete("id");
    history.replaceState(history.state, "", `${location.pathname}${q.size ? `?${q}` : ""}`);
  }, [selectedId]);

  const undoable = useUndo<Item[]>(items, (snapshot) => {
    // Field edits and reordering are undone; items added or removed since stay as they are.
    setItems((current) =>
      current.map((item) => {
        const before = snapshot.find((s) => s.id === item.id);
        if (!before || before.values === item.values) return item;
        dirty.current.add(item.id);
        return { ...item, values: before.values };
      }),
    );
    edits.current += 1;
    setSave("pending");
  });

  /** Every edit goes through here; the drafts autosave shortly after the last one. */
  const edit = (ids: string[], fn: (current: Item[]) => Item[]) => {
    if (!canWrite) return;
    undoable.remember();
    setItems(fn);
    ids.forEach((id) => dirty.current.add(id));
    edits.current += 1;
    setSave("pending");
  };
  const setValues = (id: string, values: Values) => edit([id], (current) => current.map((i) => (i.id === id ? { ...i, values } : i)));

  const saveNow = useLatest(async (): Promise<boolean> => {
    const ids = [...dirty.current];
    if (!ids.length) return save !== "error";
    const edit = edits.current;
    dirty.current.clear();
    setSave("saving");
    const payload = items.filter((i) => ids.includes(i.id) && i.status !== "deleted").map(({ id, values }) => ({ id, values }));
    const result = await saveRecordDrafts(entity.key, payload);
    if (!result.ok) {
      ids.forEach((id) => dirty.current.add(id));
      setSave("error");
      setError(result.error);
      return false;
    }
    setItems((current) => current.map((i) => (result.statuses[i.id] ? { ...i, status: result.statuses[i.id] } : i)));
    setError(null);
    if (edit === edits.current) setSave("saved");
    setPreviewed(items.find((i) => i.id === selectedId)?.values);
    preview.current?.reload();
    studio.refreshChanges();
    return true;
  });

  useAutosave(save === "pending", items, saveNow);
  useLeaveWarning(save === "pending" || save === "saving" || save === "error");
  useEditorKeys({ undo: undoable.undo, redo: undoable.redo, save: () => void saveNow() });

  const reload = useLatest(async () => {
    await saveNow();
    const result = await loadCollection(entity.key);
    if (!result.ok) return setError(result.error);
    setItems(result.items);
    undoable.reset();
    preview.current?.reload();
  });
  const { registerFlush, subscribe } = studio;
  useEffect(() => registerFlush(saveNow), [registerFlush, saveNow]);
  useEffect(() => {
    const mine = (keys: string[]) => keys.some((k) => k.startsWith(`${entity.key}:`));
    const off = [subscribe("published", (keys) => mine(keys) && reload()), subscribe("discarded", (keys) => mine(keys) && reload())];
    return () => off.forEach((f) => f());
  }, [subscribe, reload, entity.key]);

  const pick = (id: string) => {
    setSelectedId(id);
    setPreviewed(items.find((i) => i.id === id)?.values);
  };

  const add = (base?: Item) => {
    const id = newId();
    const today = new Date().toISOString().slice(0, 10);
    const dates = Object.fromEntries(entity.fields.filter((f) => f.type === "date").map((f) => [f.name, today]));
    const order = Math.max(0, ...items.map((i) => Number(i.values.sort_order) || 0)) + 10;
    const singular = entity.singular.charAt(0).toUpperCase() + entity.singular.slice(1);
    const values: Values = base
      ? { ...structuredClone(base.values), [entity.titleField]: `${base.values[entity.titleField] ?? ""} (bản sao)`, sort_order: order }
      : { ...dates, ...structuredClone(entity.defaults), [entity.titleField]: `${singular} mới`, sort_order: order };
    if (entity.fields.some((f) => f.name === "slug")) values.slug = `${base ? String(base.values.slug ?? "ban-sao") : "moi"}-${id.slice(0, 6)}`;
    const item: Item = { id, values, status: "new" };
    edit([id], (current) => {
      const at = base ? current.findIndex((i) => i.id === base.id) + 1 : current.length;
      return [...current.slice(0, at), item, ...current.slice(at)];
    });
    setSelectedId(id);
    setPreviewed(values);
  };

  const remove = (item: Item) => {
    if (!confirm(`Xoá “${item.values[entity.titleField] || "mục này"}”? ${item.status === "new" ? "Mục chưa xuất bản sẽ mất hẳn." : "Website chỉ xoá khi bạn bấm Xuất bản."}`)) return;
    startTransition(async () => {
      await saveNow();
      const result = await removeRecord(entity.key, item.id);
      if (!result.ok) return setError(result.error);
      dirty.current.delete(item.id);
      setItems((current) =>
        result.status ? current.map((i) => (i.id === item.id ? { ...i, status: result.status! } : i)) : current.filter((i) => i.id !== item.id),
      );
      if (!result.status) setSelectedId(items.find((i) => i.id !== item.id)?.id ?? null);
      preview.current?.reload();
      studio.refreshChanges();
    });
  };

  const restore = (item: Item) =>
    startTransition(async () => {
      const result = await saveRecordDrafts(entity.key, [{ id: item.id, values: item.values }]);
      if (!result.ok) return setError(result.error);
      setItems((current) => current.map((i) => (i.id === item.id ? { ...i, status: result.statuses[item.id] } : i)));
      preview.current?.reload();
      studio.refreshChanges();
    });

  const discard = (item: Item) => {
    if (!confirm("Bỏ các thay đổi chưa xuất bản của mục này và quay về bản đang chạy trên website?")) return;
    startTransition(async () => {
      await saveNow();
      const result = await discardChanges([`${entity.key}:${item.id}`]);
      if (!result.ok) return setError(result.error);
      await reload();
      studio.refreshChanges();
    });
  };

  const drop = (from: number, to: number) => {
    if (from === to) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const changed = next.filter((item, i) => Number(item.values.sort_order) !== (i + 1) * 10).map((i) => i.id);
    edit(changed, () => next.map((item, i) => (changed.includes(item.id) ? { ...item, values: { ...item.values, sort_order: (i + 1) * 10 } } : item)));
  };

  const q = query.trim().toLowerCase();
  const visible = q ? items.filter((i) => String(i.values[entity.titleField] ?? "").toLowerCase().includes(q)) : items;
  const issues = selected && selected.status !== "deleted" ? problems(entity, selected, items) : [];
  const pending = items.some((i) => i.status !== "published");
  const title = (item: Item) => String(item.values[entity.titleField] ?? "") || "(chưa đặt tên)";
  const publicUrl = selected && selected.status !== "new" ? (entity.publicPath?.(selected.values) ?? (entity.key === "products" && selected.values.slug ? `/en/products/${selected.values.slug}` : null)) : null;

  return (
    <>
      <StudioToolbar>
        <SaveBadge state={save} error={error} dirty={pending} />
        {canWrite && <UndoRedo canUndo={undoable.canUndo} canRedo={undoable.canRedo} onUndo={undoable.undo} onRedo={undoable.redo} />}
        {busy && <span className="text-xs text-muted">Đang xử lý…</span>}
      </StudioToolbar>
      <WideScreenNotice what={`Trình sửa ${entity.label.toLowerCase()}`} />

      <div className="hidden min-h-0 flex-1 lg:flex">
        {/* Column 1: the list */}
        <aside className="flex w-64 shrink-0 flex-col border-e border-mist bg-white xl:w-72">
          <div className="border-b border-mist px-4 py-4">
            <h1 className="text-base font-semibold text-forest">{entity.label}</h1>
            <p className="mt-0.5 text-xs leading-snug text-muted">{entity.description}</p>
            {items.length > 8 && (
              <label className="mt-3 flex items-center gap-2 rounded-lg border border-mist px-2.5 py-1.5 focus-within:border-leaf">
                <Search className="size-3.5 text-muted" />
                <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
              </label>
            )}
          </div>
          <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {visible.map((item) => {
              const index = items.indexOf(item);
              const image = entity.imageField ? (item.values[entity.imageField] as string | null) : null;
              const badge = statusBadges[item.status];
              const draggable = sortable && canWrite && !query;
              return (
                <li
                  key={item.id}
                  draggable={draggable}
                  onDragStart={() => setDrag(index)}
                  onDragOver={(e) => draggable && e.preventDefault()}
                  onDrop={() => {
                    if (drag !== null) drop(drag, index);
                    setDrag(null);
                  }}
                  onDragEnd={() => setDrag(null)}
                  className={cn(
                    "group flex items-center gap-2 rounded-lg border p-1.5 transition",
                    item.id === selectedId ? "border-leaf bg-lime/15" : "border-transparent hover:border-mist",
                    drag === index && "opacity-40",
                  )}
                >
                  {draggable && <GripVertical className="size-4 shrink-0 cursor-grab text-muted/70" />}
                  {entity.imageField && (
                    <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-sand">
                      {image && <Image src={image} alt="" fill sizes="36px" className="object-cover" />}
                    </span>
                  )}
                  <button type="button" onClick={() => pick(item.id)} className="min-w-0 flex-1 text-start">
                    <span className={cn("block truncate text-sm", item.status === "deleted" ? "text-muted line-through" : "text-forest")}>{title(item)}</span>
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                      {badge && <span className={cn("shrink-0 rounded-full px-1.5 text-[10px] leading-4 font-medium", badge.tone)}>{badge.label}</span>}
                      {!item.values.published && item.status !== "deleted" && <EyeOff className="size-3 shrink-0" aria-label="Đang ẩn" />}
                      {Boolean(item.values.is_sample) && <span className="shrink-0 rounded-full bg-amber-100 px-1.5 text-[10px] leading-4 text-amber-900">Mẫu</span>}
                      <span className="truncate">{entity.subtitleField ? String(item.values[entity.subtitleField] ?? "") : ""}</span>
                    </span>
                  </button>
                </li>
              );
            })}
            {visible.length === 0 && <li className="px-2 py-6 text-center text-sm text-muted">{query ? "Không tìm thấy." : `Chưa có ${entity.singular} nào.`}</li>}
          </ol>
          {canWrite && (
            <div className="border-t border-mist p-3">
              <button type="button" onClick={() => add()} className="flex w-full items-center justify-center gap-2 rounded-lg bg-forest py-2.5 text-sm font-medium text-white hover:bg-ink">
                <Plus className="size-4" /> Thêm {entity.singular}
              </button>
            </div>
          )}
        </aside>

        {/* Column 2: the selected item's fields */}
        <section className="flex w-[26rem] shrink-0 flex-col border-e border-mist bg-white xl:w-[30rem]">
          {selected ? (
            <>
              <div className="flex items-start gap-2 border-b border-mist px-5 py-4">
                <div className="min-w-0 flex-1">
                  <h2 className="truncate font-semibold text-forest">{title(selected)}</h2>
                  <p className="truncate text-xs text-muted">
                    {statusBadges[selected.status]?.label ?? "Đang khớp với website"}
                    {entity.subtitleField && selected.values[entity.subtitleField] ? ` · ${selected.values[entity.subtitleField]}` : ""}
                  </p>
                </div>
                {publicUrl && (
                  <a href={publicUrl} target="_blank" rel="noopener" title="Xem trên website" className="rounded-lg p-1.5 text-muted hover:bg-sand hover:text-forest">
                    <ExternalLink className="size-4" />
                  </a>
                )}
                {canWrite && selected.status !== "deleted" && (
                  <>
                    <button type="button" title="Nhân bản" onClick={() => add(selected)} className="rounded-lg p-1.5 text-muted hover:bg-sand hover:text-forest">
                      <Copy className="size-4" />
                    </button>
                    <button type="button" title="Xoá" onClick={() => remove(selected)} className="rounded-lg p-1.5 text-muted hover:bg-red-50 hover:text-red-600">
                      <Trash2 className="size-4" />
                    </button>
                  </>
                )}
                {studio.can("content.publish") && selected.status === "changed" && (
                  <button type="button" title="Bỏ thay đổi chưa xuất bản" onClick={() => discard(selected)} className="rounded-lg p-1.5 text-muted hover:bg-sand hover:text-forest">
                    <Undo className="size-4" />
                  </button>
                )}
              </div>
              {entity.hasTranslations && selected.status !== "deleted" && (
                <div className="flex items-center gap-1 border-b border-mist px-5 py-2">
                  <span className="me-2 text-xs text-muted">Ngôn ngữ sửa:</span>
                  {adminLocales.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      title={l.label}
                      onClick={() => setLang(l.code)}
                      className={cn("rounded-full px-3 py-1 text-xs font-medium", lang === l.code ? "bg-forest text-white" : "bg-sand text-forest hover:bg-mist")}
                    >
                      {langNames[l.code]}
                    </button>
                  ))}
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-y-auto p-5">
                {selected.status === "deleted" ? (
                  <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-800">
                    <p>Mục này sẽ bị xoá khỏi website ở lần Xuất bản tới.</p>
                    {canWrite && (
                      <button type="button" disabled={busy} onClick={() => restore(selected)} className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-forest">
                        <RotateCcw className="size-3.5" /> Giữ lại
                      </button>
                    )}
                  </div>
                ) : (
                  <fieldset disabled={!canWrite} className="space-y-5" dir={lang === "ar" ? "rtl" : undefined}>
                    {issues.length > 0 && (
                      <div className="flex gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-900" dir="ltr">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
                        <span>
                          Cần sửa trước khi xuất bản: {issues.join(" ")}
                        </span>
                      </div>
                    )}
                    {lang === "en" && <RecordToggles entity={entity} values={selected.values} onChange={(v) => setValues(selected.id, v)} />}
                    <RecordFields entity={entity} values={selected.values} lang={lang} onChange={(v) => setValues(selected.id, v)} />
                  </fieldset>
                )}
              </div>
            </>
          ) : (
            <div className="grid flex-1 place-items-center p-8 text-center text-sm text-muted">Chọn một mục bên trái{canWrite ? " hoặc thêm mới" : ""}.</div>
          )}
        </section>

        {/* Column 3: where it shows on the website, with the drafts */}
        <StudioPreview ref={preview} src={src} focus={focus} lang={previewLang} onLang={setPreviewLang} scrollOnReady />
      </div>
    </>
  );
}
