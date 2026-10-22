"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Copy, ImagePlus, Loader2, Trash2, Upload, X } from "lucide-react";
import { deleteMedia, listMedia, type MediaItem } from "@/app/admin/media-actions";
import { uploadToCloudinary } from "@/components/admin/upload";
import { formatTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

// Studio › Thư viện ảnh, and the picker every image field opens: what the CMS uploaded to Cloudinary
// (folder caogia/), newest first. Drop files to upload them.

const size = (bytes: number) => (bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`);

function useMedia() {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [next, setNext] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);

  const show = useCallback((result: Awaited<ReturnType<typeof listMedia>>, append: boolean) => {
    if (!result.ok) return setError(result.error);
    setError(null);
    setItems((current) => (append ? [...(current ?? []), ...result.items] : result.items));
    setNext(result.next);
  }, []);
  const load = useCallback(async (cursor?: string) => show(await listMedia(cursor), Boolean(cursor)), [show]);
  useEffect(() => {
    listMedia().then((result) => show(result, false));
  }, [show]);

  const upload = async (files: File[]) => {
    setUploading((n) => n + files.length);
    try {
      for (const file of files) {
        await uploadToCloudinary(file, "library", file.type.startsWith("image/") ? "image" : "auto");
        setUploading((n) => n - 1);
      }
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(0);
    }
  };
  const remove = async (id: string) => {
    const result = await deleteMedia(id);
    if (!result.ok) return setError(result.error);
    setItems((current) => current?.filter((m) => m.id !== id) ?? null);
  };
  return { items, next, error, uploading, upload, remove, more: () => next && load(next) };
}

function DropZone({ uploading, onFiles }: { uploading: number; onFiles: (files: File[]) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  return (
    <button
      type="button"
      onClick={() => input.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        onFiles([...e.dataTransfer.files]);
      }}
      className={cn(
        "flex w-full flex-col items-center gap-1.5 rounded-2xl border-2 border-dashed px-4 py-6 text-sm transition",
        over ? "border-leaf bg-lime/15 text-forest" : "border-mist text-muted hover:border-leaf hover:text-forest",
      )}
    >
      {uploading ? <Loader2 className="size-6 animate-spin" /> : <Upload className="size-6" />}
      {uploading ? `Đang tải lên ${uploading} file…` : "Kéo ảnh vào đây hoặc bấm để chọn (JPG, PNG, WebP, SVG, PDF)"}
      <input ref={input} type="file" accept="image/*,application/pdf" multiple hidden onChange={(e) => onFiles([...(e.target.files ?? [])])} />
    </button>
  );
}

export function MediaView({ canDelete }: { canDelete: boolean }) {
  const media = useMedia();
  const [copied, setCopied] = useState("");
  return (
    <div className="mx-auto w-full max-w-6xl space-y-5 p-5 md:p-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-forest">Thư viện ảnh</h1>
        <p className="mt-1 text-sm text-muted">Ảnh và file tải lên từ CMS, lưu trên Cloudinary. Dùng được ở mọi ô ảnh (nút “Thư viện”).</p>
      </div>
      <DropZone uploading={media.uploading} onFiles={media.upload} />
      {media.error && <p className="text-sm text-red-600">{media.error}</p>}
      {!media.items && !media.error && <Loader2 className="mx-auto mt-16 size-6 animate-spin text-muted" />}
      {media.items?.length === 0 && <p className="mt-16 text-center text-sm text-muted">Chưa có ảnh nào được tải lên.</p>}
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {media.items?.map((m) => (
          <li key={m.id} className="overflow-hidden rounded-2xl bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnails, already resized */}
            <img src={m.url.replace("/image/upload/", "/image/upload/f_auto,q_auto,c_fill,w_400,h_300/")} alt="" loading="lazy" className="aspect-[4/3] w-full bg-sand object-cover" />
            <div className="p-2.5">
              <p className="truncate text-xs font-medium text-forest" title={m.id}>
                {m.name}.{m.format}
              </p>
              <p className="text-[11px] text-muted">
                {m.width}×{m.height} · {size(m.bytes)} · {formatTime(m.createdAt)}
              </p>
              <div className="mt-2 flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(m.url);
                    setCopied(m.id);
                    setTimeout(() => setCopied(""), 1500);
                  }}
                  className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-sand py-1 text-xs text-forest hover:bg-mist"
                >
                  {copied === m.id ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied === m.id ? "Đã chép" : "Chép link"}
                </button>
                {canDelete && (
                  <button
                    type="button"
                    title="Xoá"
                    onClick={() => confirm(`Xoá “${m.name}”? Nơi nào đang dùng ảnh này sẽ bị trống.`) && media.remove(m.id)}
                    className="rounded-md px-2 text-muted hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
      {media.next && (
        <button type="button" onClick={media.more} className="mx-auto block rounded-full border border-mist bg-white px-5 py-2 text-sm text-forest hover:bg-sand">
          Xem thêm
        </button>
      )}
    </div>
  );
}

/** The library as a dialog: pick an image for a field, or upload new ones first. */
export function MediaPicker({ onPick, onClose }: { onPick: (url: string) => void; onClose: () => void }) {
  const media = useMedia();
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label="Thư viện ảnh" className="flex max-h-[85svh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-mist px-5 py-3">
          <h2 className="flex items-center gap-2 font-semibold text-forest">
            <ImagePlus className="size-5" /> Chọn ảnh từ thư viện
          </h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-1 text-muted hover:bg-sand">
            <X className="size-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
          <DropZone uploading={media.uploading} onFiles={media.upload} />
          {media.error && <p className="text-sm text-red-600">{media.error}</p>}
          {!media.items && !media.error && <Loader2 className="mx-auto my-10 size-6 animate-spin text-muted" />}
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
            {media.items?.map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(m.url);
                    onClose();
                  }}
                  title={m.name}
                  className="block w-full overflow-hidden rounded-xl ring-leaf hover:ring-2"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Cloudinary thumbnails, already resized */}
                  <img src={m.url.replace("/image/upload/", "/image/upload/f_auto,q_auto,c_fill,w_240,h_240/")} alt="" loading="lazy" className="aspect-square w-full bg-sand object-cover" />
                </button>
              </li>
            ))}
          </ul>
          {media.next && (
            <button type="button" onClick={media.more} className="mx-auto block rounded-full border border-mist px-5 py-2 text-sm text-forest hover:bg-sand">
              Xem thêm
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
