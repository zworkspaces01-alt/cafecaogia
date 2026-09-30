"use client";

import { useState, useTransition } from "react";
import { saveSeoSettings } from "@/app/admin/actions";
import { ImageInput, Toggle } from "@/components/admin/fields";
import { inputClass, Panel, SaveBar } from "@/components/admin/ui";
import { adminLocales } from "@/lib/admin/entities";
import { DESCRIPTION_LIMIT, seoPages, TITLE_LIMIT } from "@/lib/admin/seo-pages";
import type { MetaText, SeoPageKey, SeoSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

type Lang = (typeof adminLocales)[number]["code"];
export type SeoDefaults = Record<SeoPageKey, Record<Lang, MetaText>>;

function Counter({ length, limit }: { length: number; limit: number }) {
  return (
    <span className={cn("text-xs tabular-nums", length > limit ? "font-medium text-amber-700" : "text-muted")}>
      {length}/{limit}
      {length > limit && " — Google sẽ cắt bớt"}
    </span>
  );
}

const verificationFields = [
  {
    key: "google",
    label: "Google Search Console",
    href: "https://search.google.com/search-console",
    help: "Thêm tài sản → Tiền tố URL → Thẻ HTML. Dán cả thẻ <meta> hoặc chỉ phần content.",
  },
  {
    key: "bing",
    label: "Bing Webmaster Tools",
    href: "https://www.bing.com/webmasters",
    help: "Bing cũng cấp dữ liệu cho ChatGPT Search và Copilot. Hoặc nhập thẳng từ Search Console.",
  },
  {
    key: "yandex",
    label: "Yandex Webmaster",
    href: "https://webmaster.yandex.com",
    help: "Quan trọng cho khách hàng Nga/SNG.",
  },
] as const;

export function SeoForm({
  initial,
  defaults,
  siteName,
  siteUrl,
}: {
  initial: SeoSettings;
  defaults: SeoDefaults;
  siteName: string;
  siteUrl: string;
}) {
  const [seo, setSeo] = useState(initial);
  const [lang, setLang] = useState<Lang>("en");
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [saving, start] = useTransition();

  const update = (next: Partial<SeoSettings>) => {
    setStatus(null);
    setSeo((prev) => ({ ...prev, ...next }));
  };

  const setPageText = (page: SeoPageKey, patch: Partial<MetaText>) =>
    update({
      pages: {
        ...seo.pages,
        [page]: { ...seo.pages[page], [lang]: { ...seo.pages[page]?.[lang], ...patch } },
      },
    });

  const save = () =>
    start(async () => {
      const result = await saveSeoSettings(seo);
      setStatus(result.ok ? { tone: "ok", text: "Đã lưu — website đã được cập nhật." } : { tone: "error", text: result.error });
    });

  return (
    <div className="space-y-5">
      <Panel title="Cho phép Google lập chỉ mục">
        <Toggle
          checked={seo.indexing}
          onChange={(indexing) => update({ indexing })}
          label="Hiển thị website trên công cụ tìm kiếm"
          help="Chỉ tắt khi website đang thử nghiệm. Khi tắt, mọi trang có thẻ noindex và robots.txt chặn toàn bộ bot."
        />
        {!seo.indexing && (
          <p className="mt-4 rounded-2xl bg-red-50 p-4 text-sm text-red-800">
            Website đang bị ẩn khỏi Google, Bing, Yandex và các trợ lý AI. Bật lại trước khi ra mắt hoặc chạy quảng cáo.
          </p>
        )}
      </Panel>

      <Panel title="Xác minh quyền sở hữu" description="Cần để xem dữ liệu tìm kiếm và gửi sitemap. Sau khi lưu, bấm “Xác minh” ở công cụ tương ứng.">
        <div className="grid gap-4 md:grid-cols-3">
          {verificationFields.map((f) => (
            <label key={f.key} className="grid content-start gap-1.5">
              <span className="text-sm font-medium text-forest">
                {f.label}{" "}
                <a href={f.href} target="_blank" rel="noopener noreferrer" className="text-xs font-normal text-leaf hover:underline">
                  mở ↗
                </a>
              </span>
              <input
                className={inputClass}
                value={seo.verification[f.key]}
                placeholder='<meta name="…" content="…" />'
                onChange={(e) => update({ verification: { ...seo.verification, [f.key]: e.target.value } })}
              />
              <span className="text-xs text-muted">{f.help}</span>
            </label>
          ))}
        </div>
      </Panel>

      <Panel
        title="Ảnh chia sẻ mặc định"
        description="Hiện khi link website được chia sẻ qua Facebook, LinkedIn, WhatsApp, Zalo… Kích thước đề xuất 1200×630. Trang sản phẩm dùng ảnh sản phẩm."
      >
        <ImageInput value={seo.ogImage || null} onChange={(v) => update({ ogImage: v ?? "" })} folder="seo" />
      </Panel>

      <Panel
        title="Tiêu đề & mô tả trên Google"
        description="Để trống để dùng nội dung mặc định (chữ mờ). Mỗi ngôn ngữ nhập riêng. Tiêu đề sản phẩm sửa trong từng sản phẩm."
      >
        <div className="mb-5 flex flex-wrap gap-1.5">
          {adminLocales.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLang(l.code)}
              className={cn("rounded-full px-4 py-1.5 text-sm", lang === l.code ? "bg-forest text-white" : "bg-sand text-forest")}
            >
              {l.label}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {seoPages.map((page) => {
            const text = seo.pages[page.key]?.[lang] ?? {};
            const fallback = defaults[page.key][lang];
            const title = text.title?.trim() || fallback.title;
            const fullTitle = page.key === "home" ? title : `${title} | ${siteName}`;
            const description = text.description?.trim() || fallback.description;
            const dir = lang === "ar" ? "rtl" : undefined;
            return (
              <div key={page.key} className="grid gap-4 rounded-2xl bg-sand p-4 lg:grid-cols-[1fr_minmax(0,22rem)]">
                <div className="grid content-start gap-3">
                  <p className="text-sm font-medium text-forest">
                    {page.label} <span className="font-normal text-muted">/{lang}{page.path}</span>
                  </p>
                  <label className="grid gap-1">
                    <span className="flex justify-between gap-2 text-xs text-muted">
                      Tiêu đề <Counter length={fullTitle.length} limit={TITLE_LIMIT} />
                    </span>
                    <input
                      className={inputClass}
                      dir={dir}
                      value={text.title ?? ""}
                      placeholder={fallback.title}
                      onChange={(e) => setPageText(page.key, { title: e.target.value })}
                    />
                  </label>
                  <label className="grid gap-1">
                    <span className="flex justify-between gap-2 text-xs text-muted">
                      Mô tả <Counter length={description.length} limit={DESCRIPTION_LIMIT} />
                    </span>
                    <textarea
                      className={cn(inputClass, "resize-y")}
                      rows={2}
                      dir={dir}
                      value={text.description ?? ""}
                      placeholder={fallback.description}
                      onChange={(e) => setPageText(page.key, { description: e.target.value })}
                    />
                  </label>
                </div>

                {/* Approximation of a Google result */}
                <div dir={dir} className="self-start rounded-xl bg-white p-4 text-start">
                  <p className="truncate text-xs text-[#4d5156]">
                    {siteUrl.replace(/^https?:\/\//, "")}/{lang}
                    {page.path}
                  </p>
                  <p className="mt-1 line-clamp-1 text-lg leading-snug text-[#1a0dab]">{fullTitle}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">{description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Panel>

      <SaveBar label="Lưu cài đặt SEO" saving={saving} onSave={save} status={status} />
    </div>
  );
}
