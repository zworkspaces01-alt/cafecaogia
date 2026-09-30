"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { FileText, ImagePlus, Loader2, Plus, Trash2, Upload, X } from "lucide-react";
import { signUpload } from "@/app/admin/actions";
import { inputClass } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

type Spec = { label: string; value: string };

async function uploadToCloudinary(file: File, folder: string, kind: "image" | "auto") {
  const sig = await signUpload(folder);
  if (!sig.ok) throw new Error(sig.error);
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("signature", sig.signature);
  body.append("folder", sig.folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/${kind}/upload`, { method: "POST", body });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Tải lên thất bại.");
  return json.secure_url as string;
}

function useUpload(folder: string, kind: "image" | "auto", onDone: (url: string) => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      onDone(await uploadToCloudinary(file, folder, kind));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, upload };
}

export function ImageInput({
  value,
  onChange,
  folder,
  compact,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
  folder: string;
  compact?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { busy, error, upload } = useUpload(folder, "image", onChange);

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-dashed border-mist bg-sand",
          compact ? "aspect-square w-28" : "aspect-[16/10] w-full max-w-sm",
        )}
      >
        {value ? (
          <>
            <Image src={value} alt="" fill unoptimized className="object-cover" />
            <button
              type="button"
              onClick={() => onChange(null)}
              className="absolute end-2 top-2 grid size-7 place-items-center rounded-full bg-white/90 text-forest shadow hover:bg-white"
              aria-label="Xoá ảnh"
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid h-full w-full place-items-center text-muted hover:text-forest"
          >
            <span className="flex flex-col items-center gap-1 text-xs">
              {busy ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
              {busy ? "Đang tải lên…" : "Tải ảnh lên"}
            </span>
          </button>
        )}
      </div>
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
      {!compact && (
        <div className="flex max-w-sm gap-2">
          <input
            className={inputClass}
            placeholder="…hoặc dán đường dẫn ảnh"
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value || null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="grid size-11 shrink-0 place-items-center rounded-xl border border-mist bg-white text-forest hover:bg-sand"
            aria-label="Tải ảnh lên"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          </button>
        </div>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function FileInput({
  value,
  onChange,
  folder,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  folder: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { busy, error, upload } = useUpload(folder, "auto", onChange);
  return (
    <div className="space-y-2">
      <div className="flex max-w-lg gap-2">
        <input
          className={inputClass}
          placeholder="Đường dẫn file PDF"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex h-11 shrink-0 items-center gap-2 rounded-xl border border-mist bg-white px-4 text-sm text-forest hover:bg-sand"
        >
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />} Tải PDF
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/*"
        hidden
        onChange={(e) => upload(e.target.files?.[0])}
      />
      {value && (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-leaf hover:underline"
        >
          <FileText className="size-3.5" /> Mở file hiện tại
        </a>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export function GalleryInput({
  value,
  onChange,
  folder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  folder: string;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {value.map((src, i) => (
        <ImageInput
          key={`${src}-${i}`}
          compact
          folder={folder}
          value={src}
          onChange={(next) =>
            onChange(next ? value.map((v, j) => (j === i ? next : v)) : value.filter((_, j) => j !== i))
          }
        />
      ))}
      <ImageInput compact folder={folder} value={null} onChange={(next) => next && onChange([...value, next])} />
    </div>
  );
}

export function SpecsInput({
  value,
  onChange,
  placeholder,
}: {
  value: Spec[];
  onChange: (v: Spec[]) => void;
  placeholder?: Spec[];
}) {
  const rows = value.length ? value : [];
  const update = (i: number, key: keyof Spec, v: string) =>
    onChange(rows.map((row, j) => (j === i ? { ...row, [key]: v } : row)));
  return (
    <div className="space-y-2">
      {rows.map((row, i) => (
        <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2">
          <input
            className={inputClass}
            placeholder={placeholder?.[i]?.label ?? "Chỉ tiêu"}
            value={row.label}
            onChange={(e) => update(i, "label", e.target.value)}
          />
          <input
            className={inputClass}
            placeholder={placeholder?.[i]?.value ?? "Giá trị"}
            value={row.value}
            onChange={(e) => update(i, "value", e.target.value)}
          />
          <button
            type="button"
            onClick={() => onChange(rows.filter((_, j) => j !== i))}
            className="grid size-11 place-items-center rounded-xl text-muted hover:bg-red-50 hover:text-red-600"
            aria-label="Xoá dòng"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onChange([...rows, { label: "", value: "" }])}
          className="inline-flex items-center gap-1.5 rounded-full border border-mist bg-white px-4 py-2 text-sm text-forest hover:bg-sand"
        >
          <Plus className="size-4" /> Thêm dòng
        </button>
        {placeholder && placeholder.length > 0 && rows.length === 0 && (
          <button
            type="button"
            onClick={() => onChange(placeholder.map(() => ({ label: "", value: "" })))}
            className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-leaf hover:underline"
          >
            Tạo {placeholder.length} dòng theo bản tiếng Anh
          </button>
        )}
      </div>
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  help,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  help?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <span className="relative mt-0.5 inline-flex">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <span className="h-6 w-10 rounded-full bg-mist transition-colors peer-checked:bg-leaf peer-focus-visible:ring-2 peer-focus-visible:ring-lime" />
        <span className="absolute start-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4 rtl:peer-checked:-translate-x-4" />
      </span>
      <span>
        <span className="block text-sm font-medium text-forest">{label}</span>
        {help && <span className="mt-0.5 block text-xs text-muted">{help}</span>}
      </span>
    </label>
  );
}
