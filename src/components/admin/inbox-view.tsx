"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Download, Inbox, Loader2, Mail, Search } from "lucide-react";
import { setInquiryNote, setInquiryStatus } from "@/app/admin/actions";
import { inputClass } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { inquiryStatuses } from "@/lib/admin/inquiry-statuses";
import { channelLabels, channelOf, sourceLabel } from "@/lib/attribution";
import type { InquiryRow } from "@/lib/types";
import { formatTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

// Studio › Báo giá, like VSAP Studio's inbox: filters and search over the list on the left, the
// selected request on the right with its status, the sales team's internal note and quick replies.

const languageNames: Record<string, string> = { en: "Tiếng Anh", ru: "Tiếng Nga", ar: "Tiếng Ả Rập" };
const replySubjects: Record<string, string> = {
  en: "Cao Gia — your inquiry",
  ru: "Cao Gia — ваш запрос",
  ar: "Cao Gia — استفساركم",
};

export function InboxView({
  rows,
  counts,
  initialStatus,
  initialId,
}: {
  rows: InquiryRow[];
  counts: Record<string, number>;
  initialStatus: string;
  initialId: string | null;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(initialId ?? rows.find((r) => !initialStatus || r.status === initialStatus)?.id ?? null);

  useEffect(() => {
    const q = new URLSearchParams();
    if (status) q.set("status", status);
    if (selectedId) q.set("id", selectedId);
    history.replaceState(history.state, "", `/admin/inquiries${q.size ? `?${q}` : ""}`);
  }, [status, selectedId]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!status || r.status === status) &&
        (!q || [r.name, r.company, r.email, r.phone, r.country, r.product_slug, r.message, r.note].some((v) => v?.toLowerCase().includes(q))),
    );
  }, [rows, status, query]);
  const selected = rows.find((r) => r.id === selectedId) ?? null;
  const total = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      {/* The list */}
      <aside className={cn("flex min-h-0 shrink-0 flex-col border-mist bg-white lg:w-[24rem] lg:border-e", selected && "hidden lg:flex")}>
        <div className="space-y-3 border-b border-mist p-4">
          <div className="flex items-center justify-between gap-2">
            <h1 className="font-semibold text-forest">Yêu cầu báo giá</h1>
            <a
              href={`/admin/inquiries/export${status ? `?status=${status}` : ""}`}
              className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-muted hover:bg-sand hover:text-forest"
              title="Mở bằng Excel"
            >
              <Download className="size-3.5" /> Xuất CSV
            </a>
          </div>
          <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1">
            {[["", "Tất cả", total] as const, ...Object.entries(inquiryStatuses).map(([key, s]) => [key, s.label, counts[key] ?? 0] as const)].map(([key, label, n]) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatus(key)}
                className={cn("shrink-0 rounded-full px-3 py-1 text-xs", status === key ? "bg-forest text-white" : "bg-sand text-forest hover:bg-mist")}
              >
                {label} <span className="tabular-nums opacity-70">{n}</span>
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-mist px-2.5 py-1.5 focus-within:border-leaf">
            <Search className="size-3.5 text-muted" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm tên, công ty, email, nội dung…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
          </label>
        </div>
        <ul className="min-h-0 flex-1 divide-y divide-mist overflow-y-auto">
          {visible.map((r) => (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => setSelectedId(r.id)}
                className={cn("block w-full px-4 py-3 text-start", r.id === selectedId ? "bg-lime/15" : "hover:bg-sand")}
              >
                <span className="flex items-center gap-2">
                  {r.status === "new" && <span className="size-2 shrink-0 rounded-full bg-red-600" aria-label="Mới" />}
                  <span className={cn("min-w-0 flex-1 truncate text-sm", r.status === "new" ? "font-semibold text-forest" : "text-forest")}>
                    {r.name}
                    {r.company && <span className="font-normal text-muted"> · {r.company}</span>}
                  </span>
                  <span className="shrink-0 text-[11px] text-muted">{formatTime(r.created_at)}</span>
                </span>
                <span className="mt-0.5 block truncate text-xs text-muted">
                  {[r.product_slug, r.country].filter(Boolean).join(" · ") || "—"} — {r.message}
                </span>
              </button>
            </li>
          ))}
          {visible.length === 0 && (
            <li className="px-4 py-16 text-center text-sm text-muted">
              <Inbox className="mx-auto mb-2 size-6" />
              {rows.length ? "Không có yêu cầu nào khớp." : "Chưa có yêu cầu nào."}
            </li>
          )}
        </ul>
      </aside>

      {/* The selected request */}
      {selected ? (
        <Detail key={selected.id} inquiry={selected} onBack={() => setSelectedId(null)} onChanged={() => router.refresh()} />
      ) : (
        <div className="hidden flex-1 place-items-center text-sm text-muted lg:grid">Chọn một yêu cầu để xem.</div>
      )}
    </div>
  );
}

function Detail({ inquiry: q, onBack, onChanged }: { inquiry: InquiryRow; onBack: () => void; onChanged: () => void }) {
  const [note, setNote] = useState(q.note ?? "");
  const [saved, setSaved] = useState(q.note ?? "");
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const changeStatus = (status: string) =>
    startTransition(async () => {
      const result = await setInquiryStatus(q.id, status);
      if (!result.ok) return setError(result.error);
      setError(null);
      onChanged();
    });
  const saveNote = () => {
    if (note === saved) return;
    startTransition(async () => {
      const result = await setInquiryNote(q.id, note);
      if (!result.ok) return setError(result.error);
      setSaved(note);
      setError(null);
      onChanged();
    });
  };

  const facts = [
    ["Email", q.email],
    ["Điện thoại", q.phone],
    ["Quốc gia", q.country],
    ["Sản phẩm", q.product_slug],
    // Quantity and Incoterm are only on inquiries sent before the form was shortened.
    ["Số lượng", q.quantity],
    ["Incoterm", q.incoterm],
    ["Website", languageNames[q.locale] ?? q.locale],
    ["Nguồn", q.attribution ? `${sourceLabel(q.attribution)} · ${channelLabels[channelOf(q.attribution)]}` : null],
    ["Trang vào đầu tiên", q.attribution?.landing],
  ].filter(([, value]) => value);

  return (
    <section className="min-h-0 flex-1 overflow-y-auto bg-sand">
      <div className="mx-auto max-w-3xl space-y-5 p-5 md:p-8">
        <button type="button" onClick={onBack} className="text-sm text-leaf lg:hidden">
          ← Danh sách
        </button>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-forest">{q.name}</h2>
            <p className="mt-0.5 text-sm text-muted">
              {[q.company, formatTime(q.created_at)].filter(Boolean).join(" · ")}
            </p>
          </div>
          {busy && <Loader2 className="size-5 animate-spin text-muted" />}
        </div>

        <div className="flex flex-wrap gap-1.5">
          {Object.entries(inquiryStatuses).map(([key, s]) => (
            <button
              key={key}
              type="button"
              disabled={busy}
              onClick={() => key !== q.status && changeStatus(key)}
              className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition", q.status === key ? s.tone : "bg-white text-muted hover:text-forest")}
            >
              {s.label}
            </button>
          ))}
        </div>

        <dl className="grid gap-x-6 gap-y-3 rounded-2xl bg-white p-5 text-sm sm:grid-cols-2">
          {facts.map(([label, value]) => (
            <div key={label} className="min-w-0">
              <dt className="text-xs text-muted">{label}</dt>
              <dd className="truncate text-forest" title={String(value)}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="rounded-2xl bg-white p-5 text-sm whitespace-pre-wrap text-forest" dir="auto">
          {q.message}
        </p>

        <div className="flex flex-wrap gap-2">
          <a
            href={`mailto:${q.email}?subject=${encodeURIComponent(replySubjects[q.locale] ?? replySubjects.en)}`}
            className="inline-flex h-10 items-center gap-2 rounded-full bg-forest px-4 text-sm text-white hover:bg-leaf"
          >
            <Mail className="size-4" /> Trả lời email
          </a>
          {q.phone && (
            <a
              href={`https://wa.me/${String(q.phone).replace(/\D/g, "")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#25d366] px-4 text-sm text-white"
            >
              <WhatsAppIcon className="size-4" /> WhatsApp
            </a>
          )}
        </div>

        <label className="block">
          <span className="mb-1.5 flex items-center justify-between text-xs font-medium text-forest">
            Ghi chú nội bộ (khách không thấy)
            {note !== saved ? <span className="font-normal text-muted">Chưa lưu</span> : saved && <span className="font-normal text-leaf">Đã lưu</span>}
          </span>
          <textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            placeholder="VD: Đã gửi báo giá CIF Hamburg 20 tấn, chờ mẫu…"
            className={cn(inputClass, "resize-y")}
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </section>
  );
}
