"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
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
  Plus,
  RotateCcw,
  Smartphone,
  Trash2,
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
import { blockGroups, blockSchema, blockSchemas } from "@/lib/blocks/schema";
import type { Block, PageSeo } from "@/lib/blocks/types";
import { cn } from "@/lib/utils";

export type EditorVersion = { id: string; published_at: string; published_by: string };

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
};

type SaveState = "idle" | "pending" | "saving" | "saved" | "error";

const langNames: Record<Locale, string> = { en: "EN", ru: "RU", ar: "AR" };
const time = (iso: string) => new Date(iso).toLocaleString("vi-VN", { dateStyle: "short", timeStyle: "short" });

/** Short label for a block in the list: its schema name plus its own title, if any. */
function blockTitle(block: Block) {
  const c = block.content.en as Record<string, unknown>;
  const own = [c.title, c.accent].filter((v) => typeof v === "string" && v).join(" ");
  const first = Array.isArray(c.slides) ? (c.slides[0] as Record<string, unknown>)?.title : undefined;
  return String(own || first || "");
}

export function PageEditor(props: Props) {
  const router = useRouter();
  const [blocks, setBlocks] = useState(props.initialBlocks);
  const [seo, setSeo] = useState<PageSeo>(props.initialSeo);
  const [selected, setSelected] = useState<string | null>(null);
  const [lang, setLang] = useState<Locale>("en");
  const [tab, setTab] = useState<"blocks" | "page">("blocks");
  const [previewLang, setPreviewLang] = useState<Locale>("en");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [save, setSave] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(props.hasDraft);
  const [palette, setPalette] = useState<{ at: number } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [busy, startTransition] = useTransition();
  const iframe = useRef<HTMLIFrameElement>(null);
  const edits = useRef(0);

  // Draft preview inside the real site layout (src/app/[lang]/preview/[ref]); reloaded after each save.
  const previewSrc = `/${previewLang}/preview/${props.pageRef}`;
  const reloadPreview = useCallback(() => {
    try {
      iframe.current?.contentWindow?.location.reload();
    } catch {
      if (iframe.current) iframe.current.src = previewSrc;
    }
  }, [previewSrc]);

  /** Every edit goes through here; the draft autosaves shortly after the last one. */
  const update = (next: Block[] | ((current: Block[]) => Block[])) => {
    setBlocks(next);
    edits.current += 1;
    setSave("pending");
    setDirty(true);
  };
  const updateSeo = (next: PageSeo) => {
    setSeo(next);
    edits.current += 1;
    setSave("pending");
    setDirty(true);
  };

  useEffect(() => {
    if (save !== "pending") return;
    const edit = edits.current;
    const timer = setTimeout(async () => {
      setSave("saving");
      const result = await savePageDraft(props.pageRef, blocks, seo);
      if (edit !== edits.current) return; // newer edits are waiting for their own save
      if (result.ok) {
        setSave("saved");
        setError(null);
        reloadPreview();
      } else {
        setSave("error");
        setError(result.error);
      }
    }, 900);
    return () => clearTimeout(timer);
  }, [save, blocks, seo, props.pageRef, reloadPreview]);

  const run = (action: () => Promise<{ ok: true } | { ok: false; error: string }>, after?: () => void) =>
    startTransition(async () => {
      const result = await action();
      if (!result.ok) return setError(result.error);
      setError(null);
      after?.();
    });

  const publish = () => run(() => publishPage(props.pageRef), () => (setDirty(false), reloadPreview(), router.refresh()));
  const discard = () => {
    if (!confirm("Bỏ toàn bộ thay đổi chưa xuất bản?")) return;
    run(() => discardPageDraft(props.pageRef), () => window.location.reload());
  };
  const restore = (id: string | "default") =>
    startTransition(async () => {
      const result = await restorePageVersion(props.pageRef, id);
      if (!result.ok) return setError(result.error);
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

  const savingText = { idle: "", pending: "Đang chờ lưu…", saving: "Đang lưu nháp…", saved: "Đã lưu nháp", error: "Lỗi khi lưu" }[save];

  return (
    <div className="flex h-svh flex-col bg-sand">
      {/* Top bar */}
      <header className="flex flex-wrap items-center gap-3 border-b border-mist bg-white px-4 py-2.5">
        <Link href="/admin/pages" className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sand hover:text-forest" aria-label="Danh sách trang">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <p className="truncate font-semibold text-forest">{props.title}</p>
          <p className="text-xs text-muted" dir="ltr">
            /{"{lang}"}
            {props.path || ""}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            dirty ? "bg-amber-100 text-amber-900" : "bg-lime/60 text-forest",
          )}
        >
          {dirty ? "Có thay đổi chưa xuất bản" : props.published || !props.pageId ? "Đã xuất bản" : "Chưa xuất bản"}
        </span>
        <span className={cn("flex items-center gap-1.5 text-xs", save === "error" ? "text-red-600" : "text-muted")}>
          {(save === "saving" || save === "pending") && <Loader2 className="size-3.5 animate-spin" />}
          {savingText}
        </span>
        <div className="ms-auto flex items-center gap-2">
          <div className="relative">
            <button type="button" onClick={() => setHistoryOpen((o) => !o)} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-mist px-3 text-sm text-forest hover:bg-sand">
              <History className="size-4" /> Lịch sử
            </button>
            {historyOpen && (
              <div className="absolute end-0 top-11 z-30 w-80 rounded-2xl border border-mist bg-white p-2 shadow-xl">
                <p className="px-2 py-1.5 text-xs text-muted">Chọn một phiên bản để nạp vào bản nháp.</p>
                <ul className="max-h-80 overflow-y-auto">
                  {props.versions.map((v) => (
                    <li key={v.id}>
                      <button type="button" disabled={busy} onClick={() => restore(v.id)} className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2 text-start text-sm hover:bg-sand">
                        <span className="text-forest">{time(v.published_at)}</span>
                        <span className="truncate text-xs text-muted">{v.published_by}</span>
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
              Huỷ nháp
            </button>
          )}
          <button
            type="button"
            disabled={busy || save === "pending" || save === "saving" || !dirty}
            onClick={publish}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-forest px-4 text-sm font-medium text-white hover:bg-ink disabled:opacity-40"
          >
            {busy && <Loader2 className="size-4 animate-spin" />} Xuất bản
          </button>
        </div>
        {error && <p className="w-full text-sm text-red-600">{error}</p>}
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[420px_1fr]">
        {/* Left: blocks and page settings */}
        <aside className="flex min-h-0 flex-col border-e border-mist bg-white">
          <div className="flex border-b border-mist text-sm">
            {(["blocks", "page"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={cn("flex-1 py-3 font-medium", tab === key ? "border-b-2 border-forest text-forest" : "text-muted hover:text-forest")}
              >
                {key === "blocks" ? `Khối (${blocks.length})` : "Cài đặt trang"}
              </button>
            ))}
          </div>

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

          <div className="min-h-0 flex-1 overflow-y-auto p-4" dir={lang === "ar" ? "rtl" : undefined}>
            {tab === "blocks" ? (
              <>
                <ul className="space-y-2" dir="ltr">
                  {blocks.map((block, i) => {
                    const schema = blockSchema(block.type);
                    const open = selected === block.id;
                    return (
                      <li
                        key={block.id}
                        draggable
                        onDragStart={() => setDragFrom(i)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => {
                          if (dragFrom !== null) update((current) => moveBlock(current, dragFrom, i));
                          setDragFrom(null);
                        }}
                        className={cn("rounded-2xl border bg-white", open ? "border-forest" : "border-mist", dragFrom === i && "opacity-50", block.hidden && "bg-sand/60")}
                      >
                        <div className="flex items-center gap-1 pe-1">
                          <span className="grid size-9 cursor-grab place-items-center text-muted" title="Kéo để sắp xếp">
                            <GripVertical className="size-4" />
                          </span>
                          <button type="button" onClick={() => setSelected(open ? null : block.id)} className="min-w-0 flex-1 py-2.5 text-start">
                            <span className={cn("block truncate text-sm font-medium", block.hidden ? "text-muted line-through" : "text-forest")}>
                              {schema?.label ?? block.type}
                            </span>
                            <span className="block truncate text-xs text-muted">{blockTitle(block)}</span>
                          </button>
                          <IconButton label={block.hidden ? "Hiện" : "Ẩn"} onClick={() => update((c) => c.map((b) => (b.id === block.id ? { ...b, hidden: !b.hidden } : b)))}>
                            {block.hidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                          </IconButton>
                          <IconButton label="Lên" disabled={i === 0} onClick={() => update((c) => moveBlock(c, i, i - 1))}>
                            <ArrowUp className="size-4" />
                          </IconButton>
                          <IconButton label="Xuống" disabled={i === blocks.length - 1} onClick={() => update((c) => moveBlock(c, i, i + 1))}>
                            <ArrowDown className="size-4" />
                          </IconButton>
                        </div>
                        {open && schema && (
                          <div className="border-t border-mist p-4" dir={lang === "ar" ? "rtl" : undefined}>
                            <p className="mb-4 text-xs text-muted" dir="ltr">
                              {schema.description}
                            </p>
                            <BlockForm block={block} schema={schema} lang={lang} onChange={(next) => update((c) => c.map((b) => (b.id === next.id ? next : b)))} />
                            <div className="mt-5 flex flex-wrap gap-2 border-t border-mist pt-4" dir="ltr">
                              <button
                                type="button"
                                onClick={() => {
                                  const copy = { ...structuredClone(block), id: newBlockId() };
                                  update((c) => [...c.slice(0, i + 1), copy, ...c.slice(i + 1)]);
                                  setSelected(copy.id);
                                }}
                                className="inline-flex h-9 items-center gap-1.5 rounded-full border border-mist px-3 text-xs text-forest hover:bg-sand"
                              >
                                <Copy className="size-3.5" /> Nhân bản
                              </button>
                              <button type="button" onClick={() => setPalette({ at: i + 1 })} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-mist px-3 text-xs text-forest hover:bg-sand">
                                <Plus className="size-3.5" /> Thêm khối bên dưới
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!confirm(`Xoá khối "${schema.label}"?`)) return;
                                  update((c) => c.filter((b) => b.id !== block.id));
                                  setSelected(null);
                                }}
                                className="ms-auto inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-xs text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="size-3.5" /> Xoá khối
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <button
                  type="button"
                  onClick={() => setPalette({ at: blocks.length })}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-mist py-3 text-sm font-medium text-leaf hover:border-leaf hover:bg-sand"
                >
                  <Plus className="size-4" /> Thêm khối
                </button>
              </>
            ) : (
              <PageSettings {...props} lang={lang} seo={seo} onSeo={updateSeo} />
            )}
          </div>
        </aside>

        {/* Right: live preview */}
        <section className="hidden min-h-0 flex-col lg:flex">
          <div className="flex items-center gap-2 border-b border-mist bg-white px-4 py-2">
            <span className="text-xs text-muted">Xem trước:</span>
            {locales.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setPreviewLang(l)}
                className={cn("rounded-full px-3 py-1 text-xs font-medium", previewLang === l ? "bg-forest text-white" : "bg-sand text-forest hover:bg-mist")}
              >
                {langNames[l]}
              </button>
            ))}
            <div className="ms-3 flex rounded-full bg-sand p-0.5">
              {(["desktop", "mobile"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDevice(d)}
                  aria-label={d === "desktop" ? "Máy tính" : "Điện thoại"}
                  className={cn("grid size-8 place-items-center rounded-full", device === d ? "bg-white text-forest shadow" : "text-muted")}
                >
                  {d === "desktop" ? <Monitor className="size-4" /> : <Smartphone className="size-4" />}
                </button>
              ))}
            </div>
            <a href={previewSrc} target="_blank" rel="noopener" className="ms-auto inline-flex items-center gap-1 text-xs text-muted hover:text-forest">
              Mở tab mới <ExternalLink className="size-3.5" />
            </a>
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-4">
            <iframe
              ref={iframe}
              key={previewSrc}
              src={previewSrc}
              title="Xem trước trang"
              className={cn("mx-auto h-full rounded-xl border border-mist bg-white shadow-sm", device === "desktop" ? "w-full" : "w-[390px]")}
            />
          </div>
        </section>
      </div>

      {palette && <Palette onPick={(type) => addBlock(type, palette.at)} onClose={() => setPalette(null)} />}
    </div>
  );
}

function Palette({ onPick, onClose }: { onPick: (type: string) => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/40 p-4" onClick={onClose}>
      <div className="max-h-[85svh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-forest">Thêm khối</h2>
          <button type="button" onClick={onClose} className="grid size-9 place-items-center rounded-lg text-muted hover:bg-sand" aria-label="Đóng">
            <X className="size-5" />
          </button>
        </div>
        {blockGroups.map((group) => (
          <div key={group.key} className="mt-5">
            <p className="text-xs font-medium tracking-wide text-muted uppercase">{group.label}</p>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {blockSchemas
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
