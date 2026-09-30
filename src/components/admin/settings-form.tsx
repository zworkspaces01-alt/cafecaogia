"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Loader2, Plus, Trash2 } from "lucide-react";
import { saveSettings } from "@/app/admin/actions";
import { inputClass } from "@/components/admin/ui";
import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 md:p-8">
      <h2 className="text-lg font-semibold text-forest">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Text({
  label,
  value,
  onChange,
  wide,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  wide?: boolean;
  placeholder?: string;
}) {
  return (
    <label className={cn("grid gap-1.5", wide && "sm:col-span-2")}>
      <span className="text-sm font-medium text-forest">{label}</span>
      <input
        className={inputClass}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function SettingsForm({ initial }: { initial: SiteSettings }) {
  const [s, setS] = useState(initial);
  const [status, setStatus] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [saving, start] = useTransition();

  const patch = <K extends keyof SiteSettings>(key: K, value: Partial<SiteSettings[K]>) => {
    setStatus(null);
    setS((prev) => ({ ...prev, [key]: Array.isArray(value) ? value : { ...prev[key], ...value } }));
  };

  const save = () =>
    start(async () => {
      const result = await saveSettings(s);
      setStatus(
        result.ok ? { tone: "ok", text: "Đã lưu — website đã được cập nhật." } : { tone: "error", text: result.error },
      );
    });

  return (
    <div className="space-y-5">
      <Section title="Pháp nhân" description="Hiển thị ở footer, trang Giới thiệu, Hồ sơ công ty và dữ liệu SEO.">
        <Text
          label="Tên pháp lý (tiếng Anh)"
          value={s.company.legalName}
          onChange={(v) => patch("company", { legalName: v })}
          wide
        />
        <Text
          label="Tên pháp lý (tiếng Việt)"
          value={s.company.legalNameVi}
          onChange={(v) => patch("company", { legalNameVi: v })}
          wide
        />
        <Text
          label="Mã số doanh nghiệp"
          value={s.company.enterpriseCode}
          onChange={(v) => patch("company", { enterpriseCode: v })}
        />
        <Text
          label="Năm thành lập"
          value={String(s.company.foundingYear)}
          onChange={(v) => patch("company", { foundingYear: Number(v.replace(/\D/g, "")) || 0 })}
        />
      </Section>

      <Section title="Liên hệ">
        <Text label="Email chính" value={s.contact.email} onChange={(v) => patch("contact", { email: v })} />
        <Text label="Điện thoại" value={s.contact.phone} onChange={(v) => patch("contact", { phone: v })} />
        <Text
          label="WhatsApp"
          value={s.contact.whatsapp}
          onChange={(v) => patch("contact", { whatsapp: v })}
          placeholder="+84 ..."
        />
        <Text
          label="Mã quốc gia (2 chữ)"
          value={s.contact.address.countryCode}
          onChange={(v) => patch("contact", { address: { ...s.contact.address, countryCode: v.toUpperCase() } })}
        />
        <Text
          label="Địa chỉ (số nhà, đường)"
          value={s.contact.address.street}
          onChange={(v) => patch("contact", { address: { ...s.contact.address, street: v } })}
          wide
        />
        <Text
          label="Phường, thành phố"
          value={s.contact.address.locality}
          onChange={(v) => patch("contact", { address: { ...s.contact.address, locality: v } })}
        />
        <Text
          label="Quốc gia"
          value={s.contact.address.country}
          onChange={(v) => patch("contact", { address: { ...s.contact.address, country: v } })}
        />
      </Section>

      <Section title="Mạng xã hội" description="Để trống mục nào thì mục đó không hiển thị.">
        <Text
          label="LinkedIn"
          value={s.socials.linkedin}
          onChange={(v) => patch("socials", { linkedin: v })}
          placeholder="https://www.linkedin.com/company/…"
        />
        <Text
          label="Facebook"
          value={s.socials.facebook}
          onChange={(v) => patch("socials", { facebook: v })}
          placeholder="https://facebook.com/…"
        />
        <Text
          label="YouTube"
          value={s.socials.youtube}
          onChange={(v) => patch("socials", { youtube: v })}
          placeholder="https://youtube.com/@…"
        />
      </Section>

      <section className="rounded-3xl bg-white p-6 md:p-8">
        <h2 className="text-lg font-semibold text-forest">Hiệp hội / tổ chức thành viên</h2>
        <p className="mt-1 text-sm text-muted">
          Ví dụ: VICOFA — Hiệp hội Cà phê Ca cao Việt Nam, VINACAS — Hiệp hội Điều Việt Nam.
        </p>
        <div className="mt-5 space-y-2">
          {s.memberships.map((m, i) => (
            <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <input
                className={inputClass}
                placeholder="Tên"
                value={m.name}
                onChange={(e) =>
                  patch(
                    "memberships",
                    s.memberships.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)),
                  )
                }
              />
              <input
                className={inputClass}
                placeholder="Link (không bắt buộc)"
                value={m.url ?? ""}
                onChange={(e) =>
                  patch(
                    "memberships",
                    s.memberships.map((x, j) => (j === i ? { ...x, url: e.target.value } : x)),
                  )
                }
              />
              <button
                type="button"
                onClick={() =>
                  patch(
                    "memberships",
                    s.memberships.filter((_, j) => j !== i),
                  )
                }
                className="grid size-11 place-items-center rounded-xl text-muted hover:bg-red-50 hover:text-red-600"
                aria-label="Xoá"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => patch("memberships", [...s.memberships, { name: "", url: "" }])}
            className="inline-flex items-center gap-1.5 rounded-full border border-mist px-4 py-2 text-sm text-forest hover:bg-sand"
          >
            <Plus className="size-4" /> Thêm
          </button>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-6 md:p-8">
        <h2 className="text-lg font-semibold text-forest">Số liệu nổi bật</h2>
        <p className="mt-1 text-sm text-muted">
          Hiển thị ở trang chủ và trang Giới thiệu. Nên dùng số liệu có thể kiểm chứng.
        </p>
        <div className="mt-5 space-y-3">
          {s.stats.map((stat, i) => {
            const update = (next: Partial<SiteSettings["stats"][number]>) =>
              patch(
                "stats",
                s.stats.map((x, j) => (j === i ? { ...x, ...next } : x)),
              );
            return (
              <div key={i} className="grid gap-2 rounded-2xl bg-sand p-3 sm:grid-cols-[110px_1fr_1fr_1fr_auto]">
                <input
                  className={inputClass}
                  placeholder="12,000+"
                  value={stat.value}
                  onChange={(e) => update({ value: e.target.value })}
                />
                <input
                  className={inputClass}
                  placeholder="Nhãn tiếng Anh"
                  value={stat.label.en}
                  onChange={(e) => update({ label: { ...stat.label, en: e.target.value } })}
                />
                <input
                  className={inputClass}
                  placeholder="Tiếng Nga"
                  value={stat.label.ru}
                  onChange={(e) => update({ label: { ...stat.label, ru: e.target.value } })}
                />
                <input
                  className={inputClass}
                  dir="rtl"
                  placeholder="Tiếng Ả Rập"
                  value={stat.label.ar}
                  onChange={(e) => update({ label: { ...stat.label, ar: e.target.value } })}
                />
                <button
                  type="button"
                  onClick={() =>
                    patch(
                      "stats",
                      s.stats.filter((_, j) => j !== i),
                    )
                  }
                  className="grid size-11 place-items-center rounded-xl text-muted hover:bg-red-50 hover:text-red-600"
                  aria-label="Xoá"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => patch("stats", [...s.stats, { value: "", label: { en: "", ru: "", ar: "" } }])}
            className="inline-flex items-center gap-1.5 rounded-full border border-mist px-4 py-2 text-sm text-forest hover:bg-sand"
          >
            <Plus className="size-4" /> Thêm số liệu
          </button>
        </div>
      </section>

      <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-3xl bg-forest p-4 shadow-xl">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-6 text-sm font-medium text-forest hover:bg-lime-deep disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Lưu cài đặt
        </button>
        {status && (
          <span className={cn("flex items-center gap-2 text-sm", status.tone === "ok" ? "text-lime" : "text-red-300")}>
            {status.tone === "ok" && <CheckCircle2 className="size-4" />}
            {status.text}
          </span>
        )}
      </div>
    </div>
  );
}
