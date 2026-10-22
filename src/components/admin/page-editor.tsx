"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowUp,
  Copy,
  Eye,
  EyeOff,
  GripVertical,
  History,
  List,
  MousePointerClick,
  Plus,
  RotateCcw,
  Settings2,
  Trash2,
  X,
} from "lucide-react";
import { deletePage, discardPageDraft, restorePageVersion, savePageDraft, updatePageSettings } from "@/app/admin/pages-actions";
import { BlockForm, IconButton } from "@/components/admin/block-fields";
import { SaveBadge, StudioToolbar, UndoRedo, WideScreenNotice, useStudio, type SaveState } from "@/components/admin/studio";
import { StudioPreview, langNames, type PreviewHandle } from "@/components/admin/studio-preview";
import { useEditorKeys, useLeaveWarning } from "@/components/admin/use-editor";
import { inputClass } from "@/components/admin/ui";
import { locales, type Locale } from "@/i18n/config";
import { moveBlock } from "@/lib/blocks/edit";
import { newBlockId } from "@/lib/blocks/resolve";
import { blockGroups, blockSchema, blocksFor } from "@/lib/blocks/schema";
import type { Block, PageSeo } from "@/lib/blocks/types";
import { formatTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export type EditorVersion = { id: string; published_at: string; published_by: string; note: string };

type Props = {
  pageRef: string;
  title: string;
  /** Locale-less site path ("" for the homepage). */
  path: string;
  system: boolean;
  pageId: string | null;
  slug: string;
  published: boolean;
  initialBlocks: Block[];
  initialSeo: PageSeo;
  hasDraft: boolean;
  versions: EditorVersion[];
  templates: Record<string, Block["content"]>;
  /** Every editable page, for the page switcher. */
  pages: { ref: string; label: string }[];
};

type Snapshot = { blocks: Block[]; seo: PageSeo };

const SAVE_DELAY = 800;
/** Edits closer together than this become one undo step, so typing isn't undone a letter at a time. */
const MERGE_MS = 600;
const UNDO_LIMIT = 80;
const PAGE_SETTINGS = "__page";

/** Short label for a block in the list: its schema name plus its own title, if any. */
function blockTitle(block: Block) {
  const c = block.content.en as Record<string, unknown>;
  const own = [c.title, c.accent].filter((v) => typeof v === "string" && v).join(" ");
  const first = Array.isArray(c.slides) ? (c.slides[0] as Record<string, unknown>)?.title : undefined;
  return String(own || first || "");
}

/** Whether an edit at this moment should open a new undo step (true) or merge into the last one. */
function startsUndoStep(lastEdit: { at: number }) {
  const now = Date.now();
  const fresh = now - lastEdit.at > MERGE_MS;
  lastEdit.at = now;
  return fresh;
}

export function PageEditor(props: Props) {
  const router = useRouter();
  const studio = useStudio();
  const canPublish = studio.can("content.publish");
  const [blocks, setBlocks] = useState(props.initialBlocks);
  const [seo, setSeo] = useState<PageSeo>(props.initialSeo);
  const [selected, setSelected] = useState<string | null>(null);
  const [lang, setLang] = useState<Locale>("en");
  const [previewLang, setPreviewLang] = useState<Locale>("en");
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(props.hasDraft);
  const [palette, setPalette] = useState<{ at: number } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [busy, startTransition] = useTransition();
  const [undoState, setUndoState] = useState({ canUndo: false, canRedo: false });
  const edits = useRef(0);
  const latest = useRef<Snapshot>({ blocks, seo });
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const lastEdit = useRef({ at: 0 });

  // Draft preview inside the real site layout (src/app/[lang]/preview/[ref]); reloaded after each save.
  // On (re)load it outlines the selected block again, without scrolling.
  const preview = useRef<PreviewHandle>(null);
  const reloadPreview = useCallback(() => preview.current?.reload(), []);

  const markEdited = () => {
    edits.current += 1;
    setSave("pending");
    setDirty(true);
  };
  const syncUndo = () => setUndoState({ canUndo: past.current.length > 0, canRedo: future.current.length > 0 });

  /** Records the current state as an undo step (merging rapid edits) before it changes. */
  const remember = () => {
    if (startsUndoStep(lastEdit.current) || past.current.length === 0) {
      past.current = [...past.current.slice(-(UNDO_LIMIT - 1)), latest.current];
    }
    future.current = [];
    syncUndo();
  };

  /** Every edit goes through here; the draft autosaves shortly after the last one. */
  const update = (next: Block[] | ((current: Block[]) => Block[])) => {
    remember();
    setBlocks(next);
    markEdited();
  };
  const updateSeo = (next: PageSeo) => {
    remember();
    setSeo(next);
    markEdited();
  };

  const applySnapshot = (snapshot: Snapshot) => {
    setBlocks(snapshot.blocks);
    setSeo(snapshot.seo);
    if (selected && selected !== PAGE_SETTINGS && !snapshot.blocks.some((b) => b.id === selected)) setSelected(null);
    lastEdit.current.at = 0;
    markEdited();
  };
  const undo = () => {
    const previous = past.current.at(-1);
    if (!previous) return;
    past.current = past.current.slice(0, -1);
    future.current = [latest.current, ...future.current];
    applySnapshot(previous);
    syncUndo();
  };
  const redo = () => {
    const next = future.current[0];
    if (!next) return;
    future.current = future.current.slice(1);
    past.current = [...past.current, latest.current];
    applySnapshot(next);
    syncUndo();
  };

  const saveDraft = useCallback(async () => {
    const edit = edits.current;
    setSave("saving");
    const result = await savePageDraft(props.pageRef, latest.current.blocks, latest.current.seo);
    if (edit !== edits.current) return false; // newer edits are waiting for their own save
    if (result.ok) {
      setSave("saved");
      setError(null);
      reloadPreview();
      studio.refreshChanges();
      return true;
    }
    setSave("error");
    setError(result.error);
    return false;
  }, [props.pageRef, reloadPreview, studio]);

  useEffect(() => {
    if (save !== "pending") return;
    const timer = setTimeout(saveDraft, SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [save, blocks, seo, saveDraft]);

  useEditorKeys({ undo: () => undo(), redo: () => redo(), save: () => void saveDraft() });
  // Warn before leaving with an edit that hasn't reached the server yet.
  useLeaveWarning(save === "pending" || save === "saving" || save === "error");

  // The Studio's Publish saves what is waiting first, and tells the editor what it published or threw away.
  const flush = useRef(async () => true);
  const { registerFlush, subscribe } = studio;
  useEffect(() => registerFlush(() => flush.current()), [registerFlush]);
  useEffect(() => {
    const key = `page:${props.pageRef}`;
    const off = [
      subscribe("published", (keys) => keys.includes(key) && setDirty(false)),
      subscribe("discarded", (keys) => keys.includes(key) && window.location.reload()),
    ];
    return () => off.forEach((f) => f());
  }, [subscribe, props.pageRef]);

  // Handlers and timers read the latest state through these refs.
  useLayoutEffect(() => {
    latest.current = { blocks, seo };
    flush.current = async () => (save === "pending" || save === "error" ? saveDraft() : true);
  });

  /** Selecting from the list scrolls the preview to the block. */
  const pick = (id: string | null) => {
    setSelected(id);
    if (id && id !== PAGE_SETTINGS) preview.current?.focus({ id }, true);
  };
  /** A click on a block in the preview selects it. */
  const onPreviewSelect = useCallback((id: string) => setSelected(id), []);

  const run = (action: () => Promise<{ ok: true } | { ok: false; error: string }>, after?: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error);
      setError(null);
      after?.();
    });

  const discard = () => {
    if (!confirm("Bỏ toàn bộ thay đổi chưa xuất bản và quay về bản đang chạy trên website?")) return;
    run(() => discardPageDraft(props.pageRef), () => window.location.reload());
  };
  const restore = (id: string | "default") =>
    startTransition(async () => {
      const result = await restorePageVersion(props.pageRef, id);
      if (!result.ok) return setError(result.error);
      remember();
      setBlocks(result.blocks);
      setDirty(true);
      setHistoryOpen(false);
      setSave("saved");
      reloadPreview();
      studio.refreshChanges();
    });

  const addBlock = (type: string, at: number) => {
    const template = props.templates[type] ?? { en: {} };
    const block: Block = { id: newBlockId(), type, content: structuredClone(template) };
    update((current) => [...current.slice(0, at), block, ...current.slice(at)]);
    setSelected(block.id);
    setPalette(null);
  };

  const selectedIndex = blocks.findIndex((b) => b.id === selected);
  const selectedBlock = selectedIndex >= 0 ? blocks[selectedIndex] : null;
  const selectedSchema = selectedBlock ? blockSchema(selectedBlock.type) : null;
  // A new block goes after the selected one, like VSAP Studio; otherwise at the end.
  const insertAt = selectedIndex >= 0 ? selectedIndex + 1 : blocks.length;

  return (
    <>
      <StudioToolbar>
        <SaveBadge state={save} error={error} dirty={dirty} />
        <UndoRedo canUndo={undoState.canUndo} canRedo={undoState.canRedo} onUndo={undo} onRedo={redo} />
        <span className="mx-1 h-6 w-px bg-mist" />
        <div className="relative">
          <button type="button" onClick={() => setHistoryOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm text-muted hover:bg-sand hover:text-forest">
            <History className="size-4" /> Phiên bản
          </button>
          {historyOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setHistoryOpen(false)} />
              <div className="absolute start-0 top-11 z-40 w-80 rounded-2xl border border-mist bg-white p-2 shadow-xl">
                <p className="px-2 py-1.5 text-xs text-muted">
                  {canPublish ? "Chọn một phiên bản để nạp vào bản nháp (website chưa đổi cho tới khi xuất bản)." : "Các lần xuất bản trang này. Biên tập chính khôi phục được."}
                </p>
                <ul className="max-h-80 overflow-y-auto">
                  {props.versions.map((v) => (
                    <li key={v.id}>
                      <button type="button" disabled={busy || !canPublish} onClick={() => restore(v.id)} className="w-full rounded-xl px-2 py-2 text-start text-sm enabled:hover:bg-sand">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-forest">{formatTime(v.published_at)}</span>
                          <span className="truncate text-xs text-muted">{v.published_by}</span>
                        </span>
                        {v.note && <span className="mt-0.5 block truncate text-xs text-muted">{v.note}</span>}
                      </button>
                    </li>
                  ))}
                  {props.versions.length === 0 && <li className="px-2 py-2 text-sm text-muted">Chưa có phiên bản nào được xuất bản.</li>}
                  {props.system && canPublish && (
                    <li className="mt-1 border-t border-mist pt-1">
                      <button type="button" disabled={busy} onClick={() => restore("default")} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-start text-sm text-forest hover:bg-sand">
                        <RotateCcw className="size-4" /> Bố cục mặc định của website
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            </>
          )}
        </div>
        {dirty && canPublish && (
          <button type="button" disabled={busy} onClick={discard} className="rounded-lg px-3 py-2 text-sm text-muted hover:bg-sand hover:text-forest disabled:opacity-50">
            Bỏ thay đổi trang này
          </button>
        )}
        {error && save !== "error" && <span className="truncate text-xs text-red-600">{error}</span>}
      </StudioToolbar>
      <WideScreenNotice what="Trình sửa trang" />

      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[240px_360px_1fr] xl:grid-cols-[260px_400px_1fr]">
        {/* Column 1: the page's blocks */}
        <aside className="flex min-h-0 flex-col border-e border-mist bg-white">
          <div className="border-b border-mist p-3">
            <span className="flex items-center justify-between">
              <span className="text-[11px] font-medium tracking-wider text-muted uppercase">Trang đang sửa</span>
              <Link href="/admin/pages" className="inline-flex items-center gap-1 text-xs text-leaf hover:underline">
                <List className="size-3.5" /> Tất cả trang
              </Link>
            </span>
            <select
              aria-label="Chọn trang để sửa"
              value={props.pageRef}
              onChange={async (e) => {
                const next = e.target.value;
                if (save === "pending" || save === "error") await saveDraft();
                router.push(`/admin/pages/${next}`);
              }}
              className={cn(inputClass, "mt-1 py-2")}
            >
              {props.pages.some((p) => p.ref === props.pageRef) ? null : <option value={props.pageRef}>{props.title}</option>}
              {props.pages.map((p) => (
                <option key={p.ref} value={p.ref}>
                  {p.label}
                </option>
              ))}
            </select>
            <p className="mt-1 ps-1 text-xs text-muted" dir="ltr">
              {props.path === "" ? "/{lang} — mọi trang" : `/{lang}${props.path}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => pick(PAGE_SETTINGS)}
            className={cn(
              "flex items-center gap-2 border-b border-mist px-4 py-3 text-start text-sm font-medium",
              selected === PAGE_SETTINGS ? "bg-sand text-forest" : "text-forest hover:bg-sand/60",
            )}
          >
            <Settings2 className="size-4 text-muted" /> Cài đặt trang & SEO
          </button>
          <p className="px-4 pt-3 pb-1 text-xs font-medium tracking-wide text-muted uppercase">Khối ({blocks.length})</p>
          <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-2">
            {blocks.map((block, i) => {
              const schema = blockSchema(block.type);
              const active = selected === block.id;
              return (
                <li
                  key={block.id}
                  draggable
                  onDragStart={() => setDragFrom(i)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    if (dragFrom !== null && dragFrom !== i) update((current) => moveBlock(current, dragFrom, i));
                    setDragFrom(null);
                  }}
                  onDragEnd={() => setDragFrom(null)}
                  className={cn("group flex items-center rounded-xl", active ? "bg-lime/40" : "hover:bg-sand", dragFrom === i && "opacity-40")}
                >
                  <span className="grid w-7 shrink-0 cursor-grab place-items-center self-stretch text-muted" title="Kéo để sắp xếp">
                    <GripVertical className="size-4" />
                  </span>
                  <button type="button" onClick={() => pick(block.id)} className="min-w-0 flex-1 py-2 text-start">
                    <span className={cn("block truncate text-sm font-medium", block.hidden ? "text-muted line-through" : "text-forest")}>
                      {schema?.label ?? block.type}
                    </span>
                    <span className="block truncate text-xs text-muted">{blockTitle(block) || " "}</span>
                  </button>
                  <IconButton label={block.hidden ? "Hiện trên website" : "Ẩn khỏi website"} onClick={() => update((c) => c.map((b) => (b.id === block.id ? { ...b, hidden: !b.hidden } : b)))}>
                    {block.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4 opacity-0 group-hover:opacity-100" />}
                  </IconButton>
                </li>
              );
            })}
          </ul>
          <div className="border-t border-mist p-2">
            <button
              type="button"
              onClick={() => setPalette({ at: insertAt })}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-mist py-2.5 text-sm font-medium text-leaf hover:border-leaf hover:bg-sand"
            >
              <Plus className="size-4" /> {selectedBlock ? "Thêm khối bên dưới" : "Thêm khối"}
            </button>
          </div>
        </aside>

        {/* Column 2: the selected block's fields, or page settings */}
        <section className="flex min-h-0 flex-col border-e border-mist bg-white">
          <div className="flex items-center gap-1 border-b border-mist px-4 py-2">
            <span className="me-2 text-xs text-muted">Ngôn ngữ sửa:</span>
            {locales.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLang(l)}
                className={cn("rounded-full px-3 py-1 text-xs font-medium", lang === l ? "bg-forest text-white" : "bg-sand text-forest hover:bg-mist")}
              >
                {langNames[l]}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-4">
            {selected === PAGE_SETTINGS ? (
              <PageSettings {...props} lang={lang} seo={seo} onSeo={updateSeo} />
            ) : selectedBlock && selectedSchema ? (
              <div dir={lang === "ar" ? "rtl" : undefined}>
                <div className="mb-4 flex items-start gap-2" dir="ltr">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-forest">{selectedSchema.label}</p>
                    <p className="text-xs text-muted">{selectedSchema.description}</p>
                  </div>
                  <IconButton label="Lên" disabled={selectedIndex === 0} onClick={() => update((c) => moveBlock(c, selectedIndex, selectedIndex - 1))}>
                    <ArrowUp className="size-4" />
                  </IconButton>
                  <IconButton label="Xuống" disabled={selectedIndex === blocks.length - 1} onClick={() => update((c) => moveBlock(c, selectedIndex, selectedIndex + 1))}>
                    <ArrowDown className="size-4" />
                  </IconButton>
                </div>
                {selectedBlock.hidden && (
                  <p className="mb-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900" dir="ltr">
                    Khối này đang ẩn — không hiện trên website và khung xem trước.
                  </p>
                )}
                <BlockForm block={selectedBlock} schema={selectedSchema} lang={lang} onChange={(next) => update((c) => c.map((b) => (b.id === next.id ? next : b)))} />
                <div className="mt-5 flex flex-wrap gap-2 border-t border-mist pt-4" dir="ltr">
                  <button
                    type="button"
                    onClick={() => {
                      const copy = { ...structuredClone(selectedBlock), id: newBlockId() };
                      update((c) => [...c.slice(0, selectedIndex + 1), copy, ...c.slice(selectedIndex + 1)]);
                      setSelected(copy.id);
                    }}
                    className="inline-flex h-9 items-center gap-1.5 rounded-full border border-mist px-3 text-xs text-forest hover:bg-sand"
                  >
                    <Copy className="size-3.5" /> Nhân bản
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(`Xoá khối "${selectedSchema.label}"? Có thể hoàn tác bằng ⌘Z.`)) return;
                      update((c) => c.filter((b) => b.id !== selectedBlock.id));
                      setSelected(null);
                    }}
                    className="ms-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="size-3.5" /> Xoá khối
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid h-full place-items-center text-center">
                <p className="max-w-60 text-sm text-muted">
                  <MousePointerClick className="mx-auto mb-2 size-6 text-leaf" />
                  Chọn một khối trong danh sách — hoặc bấm thẳng vào khối đó trên khung xem trước — để sửa.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Column 3: the real page with the draft */}
        <StudioPreview
          ref={preview}
          src={`/preview/${props.pageRef}`}
          focus={selected && selected !== PAGE_SETTINGS ? { id: selected } : null}
          lang={previewLang}
          onLang={setPreviewLang}
          onSelect={onPreviewSelect}
        />
      </div>

      {palette && <Palette pageRef={props.pageRef} onPick={(type) => addBlock(type, palette.at)} onClose={() => setPalette(null)} />}
    </>
  );
}

/** Blocks that can go on this page, grouped; templates and the site layout only offer their own. */
function Palette({ pageRef, onPick, onClose }: { pageRef: string; onPick: (type: string) => void; onClose: () => void }) {
  const available = blocksFor(pageRef);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="max-h-[85svh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-forest">Thêm khối</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sand" aria-label="Đóng">
            <X className="size-5" />
          </button>
        </div>
        {blockGroups.filter((group) => available.some((s) => s.group === group.key)).map((group) => (
          <div key={group.key} className="mt-5">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">{group.label}</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {available
                .filter((s) => s.group === group.key)
                .map((s) => (
                  <li key={s.type}>
                    <button type="button" onClick={() => onPick(s.type)} className="h-full w-full rounded-2xl border border-mist p-3 text-start hover:border-leaf hover:bg-sand">
                      <span className="block text-sm font-medium text-forest">{s.label}</span>
                      <span className="mt-0.5 block text-xs text-muted">{s.description}</span>
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageSettings(props: Props & { lang: Locale; seo: PageSeo; onSeo: (seo: PageSeo) => void }) {
  const router = useRouter();
  const [title, setTitle] = useState(props.title);
  const [slug, setSlug] = useState(props.slug);
  const [published, setPublished] = useState(props.published);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const seo = props.seo[props.lang] ?? {};
  const setSeo = (key: "title" | "description", value: string) => props.onSeo({ ...props.seo, [props.lang]: { ...seo, [key]: value } });

  return (
    <div className="space-y-6" dir="ltr">
      <section className="space-y-3">
        <p className="text-sm font-semibold text-forest">SEO ({langNames[props.lang]})</p>
        <p className="text-xs text-muted">
          {props.system ? "Để trống để dùng tiêu đề và mô tả mặc định (sửa được trong mục SEO)." : "Tiêu đề và mô tả hiện trên Google. Để trống ở RU/AR để dùng bản tiếng Anh."}
        </p>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-forest">Tiêu đề trang (title)</span>
          <input className={inputClass} dir="auto" value={seo.title ?? ""} onChange={(e) => setSeo("title", e.target.value)} />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-forest">Mô tả (meta description)</span>
          <textarea className={cn(inputClass, "min-h-20")} dir="auto" value={seo.description ?? ""} onChange={(e) => setSeo("description", e.target.value)} />
        </label>
      </section>

      {!props.system && props.pageId && (
        <section className="space-y-3 border-t border-mist pt-5">
          <p className="text-sm font-semibold text-forest">Trang</p>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-forest">Tên trang</span>
            <input className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-forest">Đường dẫn</span>
            <div className="flex items-center gap-1 text-sm text-muted">
              /en/
              <input className={inputClass} value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
          </label>
          <label className="flex items-center gap-2 text-sm text-forest">
            <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> Hiển thị trên website
          </label>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                startTransition(async () => {
                  const result = await updatePageSettings(props.pageId!, { title, slug, published });
                  setMessage(result.ok ? "Đã lưu." : result.error);
                  if (result.ok) router.refresh();
                })
              }
              className="inline-flex h-9 items-center rounded-full bg-forest px-4 text-sm font-medium text-white disabled:opacity-50"
            >
              Lưu cài đặt
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (!confirm("Xoá hẳn trang này cùng bản nháp và lịch sử?")) return;
                startTransition(async () => {
                  const result = await deletePage(props.pageId!);
                  if (result.ok) router.push("/admin/pages");
                  else setMessage(result.error);
                });
              }}
              className="inline-flex h-9 items-center rounded-full px-4 text-sm text-red-600 hover:bg-red-50"
            >
              Xoá trang
            </button>
          </div>
          {message && <p className="text-sm text-muted">{message}</p>}
          <p className="text-xs text-muted">Đổi đường dẫn có hiệu lực ngay; nội dung khối chỉ thay đổi khi bấm Xuất bản.</p>
        </section>
      )}
    </div>
  );
}
