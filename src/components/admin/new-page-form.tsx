"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { createPage } from "@/app/admin/pages-actions";
import { inputClass } from "@/components/admin/ui";

/** Turns a title into a URL slug: lowercase ASCII words joined by hyphens (Vietnamese accents removed). */
const slugify = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export function NewPageForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        startTransition(async () => {
          const result = await createPage(title, slug);
          if (!result.ok) return setError(result.error);
          router.push(`/admin/pages/${result.id}`);
        });
      }}
    >
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-forest">Tên trang mới</span>
        <input
          className={inputClass}
          value={title}
          placeholder="Ví dụ: Robusta cho thị trường Nga"
          onChange={(e) => {
            setTitle(e.target.value);
            if (!touched) setSlug(slugify(e.target.value));
          }}
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-xs font-medium text-forest">Đường dẫn (/en/…)</span>
        <input
          className={inputClass}
          value={slug}
          placeholder="robusta-russia"
          onChange={(e) => {
            setTouched(true);
            setSlug(e.target.value);
          }}
        />
      </label>
      <button disabled={busy || !title || !slug} className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white hover:bg-leaf disabled:opacity-50">
        <Plus className="size-4" /> Tạo trang
      </button>
      {error && <p className="text-sm text-red-600 sm:col-span-3">{error}</p>}
    </form>
  );
}
