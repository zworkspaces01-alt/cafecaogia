"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useTransition } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  History,
  Loader2,
  Monitor,
  MousePointerClick,
  Plus,
  Redo2,
  RefreshCw,
  RotateCcw,
  Settings2,
  Smartphone,
  Tablet,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import {
  deletePage,
  discardPageDraft,
  publishPage,
  restorePageVersion,
  savePageDraft,
  updatePageSettings,
} from "@/app/admin/pages-actions";
import { BlockForm, IconButton } from "@/components/admin/block-fields";
import { inputClass } from "@/components/admin/ui";
import { locales, type Locale } from "@/i18n/config";
import { moveBlock } from "@/lib/blocks/edit";
import { newBlockId } from "@/lib/blocks/resolve";
import { blockGroups, blockSchema, blocksFor } from "@/lib/blocks/schema";
import type { Block, PageSeo } from "@/lib/blocks/types";
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

type SaveState = "idle" | "pending" | "saving" | "saved" | "error";
type Snapshot = { blocks: Block[]; seo: PageSeo };
type Device = "desktop" | "tablet" | "mobile";

const langNames: Record<Locale, string> = { en: "EN", ru: "RU", ar: "AR" };
const time = (iso: string) => new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });
/** Real widths the preview renders at; it is scaled down to fit the panel, so layouts aren't squeezed. */
const deviceWidths: Record<Device, number> = { desktop: 1440, tablet: 820, mobile: 390 };
const deviceIcons = { desktop: Monitor, tablet: Tablet, mobile: Smartphone };
const deviceNames: Record<Device, string> = { desktop: "Máy tính", tablet: "Máy tính bảng", mobile: "Điện thoại" };
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

const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

export function PageEditor(props: Props) {
  const router = useRouter();
  const [blocks, setBlocks] = useState(props.initialBlocks);
  const [seo, setSeo] = useState<PageSeo>(props.initialSeo);
  const [selected, setSelected] = useState<string | null>(null);
  const [lang, setLang] = useState<Locale>("en");
  const [previewLang, setPreviewLang] = useState<Locale>("en");
  const [device, setDevice] = useState<Device>("desktop");
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(props.hasDraft);
  const [palette, setPalette] = useState<{ at: number } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [busy, startTransition] = useTransition();
  const [undoState, setUndoState] = useState({ canUndo: false, canRedo: false });
  const iframe = useRef<HTMLIFrameElement>(null);
  const edits = useRef(0);
  const latest = useRef<Snapshot>({ blocks, seo });
  const past = useRef<Snapshot[]>([]);
  const future = useRef<Snapshot[]>([]);
  const lastEdit = useRef({ at: 0 });

  // Draft preview inside the real site layout (src/app/[lang]/preview/[ref]); reloaded after each save.
  const previewSrc = `/${previewLang}/preview/${props.pageRef}`;
  const reloadPreview = useCallback(() => {
    try {
      iframe.current?.contentWindow?.location.reload();
    } catch {
      if (iframe.current) iframe.current.src = previewSrc;
    }
  }, [previewSrc]);

  const toPreview = useCallback((message: Record<string, unknown>) => {
    iframe.current?.contentWindow?.postMessage({ source: "cg-editor", ...message }, window.location.origin);
  }, []);

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
      return true;
    }
    setSave("error");
    setError(result.error);
    return false;
  }, [props.pageRef, reloadPreview]);

  useEffect(() => {
    if (save !== "pending") return;
    const timer = setTimeout(saveDraft, SAVE_DELAY);
    return () => clearTimeout(timer);
  }, [save, blocks, seo, saveDraft]);

  // Keyboard: ⌘Z / ⇧⌘Z / ⌘Y undo and redo (left to the browser while typing in a field), ⌘S saves now.
  const keys = useRef({ undo, redo, saveDraft });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return;
      const key = event.key.toLowerCase();
      if (key === "s") {
        event.preventDefault();
        void keys.current.saveDraft();
      } else if ((key === "z" || key === "y") && !isTyping(event.target)) {
        event.preventDefault();
        if (key === "y" || event.shiftKey) keys.current.redo();
        else keys.current.undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Warn before leaving with an edit that hasn't reached the server yet.
  useEffect(() => {
    if (save !== "pending" && save !== "saving" && save !== "error") return;
    const onUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [save]);

  // Preview → editor: a click on a block selects it; on (re)load, re-highlight the selection.
  const selectedRef = useRef(selected);
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.data?.source !== "cg-preview") return;
      if (event.data.type === "select" && typeof event.data.id === "string") setSelected(event.data.id);
      if (event.data.type === "ready" && selectedRef.current && selectedRef.current !== PAGE_SETTINGS) {
        toPreview({ type: "focus", id: selectedRef.current, scroll: false });
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [toPreview]);

  // Handlers and timers read the latest state through these refs.
  useLayoutEffect(() => {
    latest.current = { blocks, seo };
    selectedRef.current = selected;
    keys.current = { undo, redo, saveDraft };
  });

  /** Selecting from the list scrolls the preview to the block. */
  const pick = (id: string | null) => {
    setSelected(id);
    if (id && id !== PAGE_SETTINGS) toPreview({ type: "focus", id, scroll: true });
  };

  const run = (action: () => Promise<{ ok: true } | { ok: false; error: string }>, after?: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error);
      setError(null);
      after?.();
    });

  const publish = (note: string) =>
    startTransition(async () => {
      if (save === "pending" || save === "error") {
        const saved = await saveDraft();
        if (!saved) return;
      }
      const result = await publishPage(props.pageRef, note);
      if (!result.ok) return setError(result.error);
      setError(null);
      setDirty(false);
      setPublishOpen(false);
      reloadPreview();
      router.refresh();
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

  const status =
    save === "pending" || save === "saving"
      ? { text: "Đang lưu…", tone: "text-muted" }
      : save === "error"
        ? { text: "Lưu lỗi", tone: "text-red-600" }
        : dirty
          ? { text: "Đã lưu nháp — chưa xuất bản", tone: "text-amber-700" }
          : { text: "Khớp với website", tone: "text-leaf" };

  return (
    <div className="flex h-svh flex-col bg-sand">
      {/* Studio needs room for three columns. */}
      <div className="grid flex-1 place-items-center p-8 text-center lg:hidden">
        <p className="max-w-sm text-sm text-muted">Trình sửa trang cần màn hình rộng hơn (từ 1024px). Hãy mở trên máy tính.</p>
      </div>

      {/* Top bar */}
      <header className="hidden flex-wrap items-center gap-3 border-b border-mist bg-white px-4 py-2.5 lg:flex">
        <Link href="/admin/pages" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sand hover:text-forest" aria-label="Danh sách trang">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <select
            aria-label="Chọn trang để sửa"
            value={props.pageRef}
            onChange={(e) => router.push(`/admin/pages/${e.target.value}`)}
            className="max-w-64 truncate rounded-lg bg-transparent py-1 pe-6 font-semibold text-forest hover:bg-sand"
          >
            {props.pages.some((p) => p.ref === props.pageRef) ? null : <option value={props.pageRef}>{props.title}</option>}
            {props.pages.map((p) => (
              <option key={p.ref} value={p.ref}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="ps-1 text-xs text-muted" dir="ltr">
            /{"{lang}"}
            {props.path || ""}
          </p>
        </div>
        <span className={cn("flex items-center gap-1.5 text-xs font-medium", status.tone)}>
          {(save === "saving" || save === "pending") && <Loader2 className="size-3.5 animate-spin" />}
          {status.text}
        </span>
        <div className="ms-auto flex items-center gap-2">
          <div className="flex items-center">
            <IconButton label="Hoàn tác (⌘Z)" disabled={!undoState.canUndo} onClick={undo}>
              <Undo2 className="size-4" />
            </IconButton>
            <IconButton label="Làm lại (⇧⌘Z)" disabled={!undoState.canRedo} onClick={redo}>
              <Redo2 className="size-4" />
            </IconButton>
          </div>
          <div className="relative">
            <button type="button" onClick={() => setHistoryOpen((o) => !o)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-mist px-3 text-sm text-forest hover:bg-sand">
              <History className="size-4" /> Lịch sử
            </button>
            {historyOpen && (
              <div className="absolute end-0 top-11 z-30 w-80 rounded-2xl border border-mist bg-white p-2 shadow-xl">
                <p className="px-2 py-1.5 text-xs text-muted">Chọn một phiên bản để nạp vào bản nháp (website chưa đổi cho tới khi xuất bản).</p>
                <ul className="max-h-80 overflow-y-auto">
                  {props.versions.map((v) => (
                    <li key={v.id}>
                      <button type="button" disabled={busy} onClick={() => restore(v.id)} className="w-full rounded-xl px-2 py-2 text-start text-sm hover:bg-sand">
                        <span className="flex items-center justify-between gap-2">
                          <span className="text-forest">{time(v.published_at)}</span>
                          <span className="truncate text-xs text-muted">{v.published_by}</span>
                        </span>
                        {v.note && <span className="mt-0.5 block truncate text-xs text-muted">{v.note}</span>}
                      </button>
                    </li>
                  ))}
                  {props.versions.length === 0 && <li className="px-2 py-2 text-sm text-muted">Chưa có phiên bản nào được xuất bản.</li>}
                  {props.system && (
                    <li className="mt-1 border-t border-mist pt-1">
                      <button type="button" disabled={busy} onClick={() => restore("default")} className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-start text-sm text-forest hover:bg-sand">
                        <RotateCcw className="size-4" /> Bố cục mặc định của website
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
          {dirty && (
            <button type="button" disabled={busy} onClick={discard} className="inline-flex h-9 items-center rounded-full border border-mist px-3 text-sm text-forest hover:bg-sand disabled:opacity-50">
              Huỷ thay đổi
            </button>
          )}
          <button
            type="button"
            disabled={busy || save === "saving" || !dirty}
            onClick={() => setPublishOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-forest px-4 text-sm font-medium text-white hover:bg-ink disabled:opacity-40"
          >
            Xuất bản
          </button>
        </div>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </header>

      <div className="hidden min-h-0 flex-1 lg:grid lg:grid-cols-[260px_400px_1fr]">
        {/* Column 1: the page's blocks */}
        <aside className="flex min-h-0 flex-col border-e border-mist bg-white">
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
        <Preview
          iframeRef={iframe}
          src={previewSrc}
          device={device}
          onDevice={setDevice}
          lang={previewLang}
          onLang={setPreviewLang}
          onReload={reloadPreview}
        />
      </div>

      {palette && <Palette pageRef={props.pageRef} onPick={(type) => addBlock(type, palette.at)} onClose={() => setPalette(null)} />}
      {publishOpen && <PublishDialog busy={busy} onPublish={publish} onClose={() => setPublishOpen(false)} />}
    </div>
  );
}

function Preview({
  iframeRef,
  src,
  device,
  onDevice,
  lang,
  onLang,
  onReload,
}: {
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
  src: string;
  device: Device;
  onDevice: (device: Device) => void;
  lang: Locale;
  onLang: (lang: Locale) => void;
  onReload: () => void;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setBox({ width: entry.contentRect.width, height: entry.contentRect.height }));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const width = deviceWidths[device];
  const scale = box.width ? Math.min(1, box.width / width) : 1;

  return (
    <section className="flex min-h-0 flex-col">
      <div className="flex items-center gap-2 border-b border-mist bg-white px-4 py-2">
        <span className="text-xs text-muted">Xem trước:</span>
        {locales.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => onLang(l)}
            className={cn("rounded-full px-3 py-1 text-xs font-medium", lang === l ? "bg-forest text-white" : "bg-sand text-forest hover:bg-mist")}
          >
            {langNames[l]}
          </button>
        ))}
        <div className="ms-3 flex rounded-full bg-sand p-0.5">
          {(Object.keys(deviceWidths) as Device[]).map((d) => {
            const Icon = deviceIcons[d];
            return (
              <button
                key={d}
                type="button"
                onClick={() => onDevice(d)}
                aria-label={deviceNames[d]}
                title={`${deviceNames[d]} (${deviceWidths[d]}px)`}
                className={cn("grid size-8 place-items-center rounded-full", device === d ? "bg-white text-forest shadow" : "text-muted")}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </div>
        <span className="text-xs text-muted tabular-nums">
          {width}px{scale < 1 ? ` · ${Math.round(scale * 100)}%` : ""}
        </span>
        <IconButton label="Tải lại xem trước" onClick={onReload}>
          <RefreshCw className="size-4" />
        </IconButton>
        <a href={src} target="_blank" rel="noopener" className="ms-auto inline-flex items-center gap-1 text-xs text-muted hover:text-forest">
          Mở bản nháp ở tab mới <ExternalLink className="size-3.5" />
        </a>
      </div>
      <div className="min-h-0 flex-1 p-4">
        <div ref={frame} className="relative h-full w-full overflow-hidden">
          {/* Rendered at the device's real width, then scaled to fit, so the layout is the real one. */}
          <div className="mx-auto" style={{ width: width * scale, height: box.height }}>
            <iframe
              ref={iframeRef}
              key={src}
              src={src}
              title="Xem trước trang"
              className="origin-top-left rounded-xl border border-mist bg-white shadow-sm"
              style={{ width, height: box.height / scale, transform: `scale(${scale})` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function PublishDialog({ busy, onPublish, onClose }: { busy: boolean; onPublish: (note: string) => void; onClose: () => void }) {
  const [note, setNote] = useState("");
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <form
        className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          onPublish(note);
        }}
      >
        <h2 className="text-lg font-semibold text-forest">Xuất bản lên website</h2>
        <p className="mt-1 text-sm text-muted">Khách sẽ thấy ngay bản nháp này. Phiên bản được lưu vào Lịch sử để khôi phục khi cần.</p>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-xs font-medium text-forest">Ghi chú (không bắt buộc)</span>
          <input className={inputClass} value={note} maxLength={200} autoFocus placeholder="Ví dụ: đổi ảnh hero, thêm FAQ" onChange={(e) => setNote(e.target.value)} />
        </label>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="inline-flex h-10 items-center rounded-full border border-mist px-4 text-sm text-forest hover:bg-sand">
            Huỷ
          </button>
          <button type="submit" disabled={busy} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-forest px-5 text-sm font-medium text-white hover:bg-ink disabled:opacity-50">
            {busy && <Loader2 className="size-4 animate-spin" />} Xuất bản
          </button>
        </div>
      </form>
    </div>
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
