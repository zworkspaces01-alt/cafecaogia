import Link from "next/link";
import { Mail } from "lucide-react";
import { InquiryStatusSelect } from "@/components/admin/inquiry-status";
import { Badge, PageTitle } from "@/components/admin/ui";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { requireAdmin } from "@/lib/admin/auth";
import { channelLabels, channelOf, sourceLabel } from "@/lib/attribution";

const languageNames: Record<string, string> = { en: "Tiếng Anh", ru: "Tiếng Nga", ar: "Tiếng Ả Rập" };
const statusLabels: Record<string, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  quoted: "Đã báo giá",
  won: "Chốt đơn",
  lost: "Không thành",
};

export default async function InquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  const { status } = await searchParams;
  const { supabase } = await requireAdmin();

  let query = supabase.from("inquiries").select("*").order("created_at", { ascending: false }).limit(200);
  if (typeof status === "string" && statusLabels[status]) query = query.eq("status", status);
  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <PageTitle title="Yêu cầu báo giá" description="Gửi từ form Liên hệ trên website (cả 3 ngôn ngữ)." />

      <div className="flex flex-wrap gap-2 text-sm">
        {[["", "Tất cả"], ...Object.entries(statusLabels)].map(([key, label]) => (
          <Link
            key={key}
            href={key ? `/admin/inquiries?status=${key}` : "/admin/inquiries"}
            className={`rounded-full px-4 py-1.5 ${(status ?? "") === key ? "bg-forest text-white" : "bg-white text-forest"}`}
          >
            {label}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-3xl bg-white p-8 text-sm text-muted">Chưa có yêu cầu nào.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((q) => (
            <li key={q.id} className="rounded-3xl bg-white p-5 md:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-forest">
                    {q.name}
                    {q.company && <span className="font-normal text-muted"> · {q.company}</span>}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    {new Date(q.created_at).toLocaleString("vi-VN")} · {q.country && `${q.country} · `}Website {languageNames[q.locale] ?? q.locale}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {q.status === "new" && <Badge tone="sample">Mới</Badge>}
                  <InquiryStatusSelect id={q.id} status={q.status} labels={statusLabels} />
                </div>
              </div>

              <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
                {/* Quantity and Incoterm are only on inquiries sent before the form was shortened */}
                {[
                  ["Điện thoại", q.phone],
                  ["Sản phẩm", q.product_slug],
                  ["Số lượng", q.quantity],
                  ["Incoterm", q.incoterm],
                  ["Nguồn", q.attribution ? `${sourceLabel(q.attribution)} · ${channelLabels[channelOf(q.attribution)]}` : null],
                  ["Trang vào đầu tiên", q.attribution?.landing],
                ]
                  .filter(([label, value]) => value || label === "Điện thoại")
                  .map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-muted">{label}</dt>
                      <dd className="text-forest">{value || "—"}</dd>
                    </div>
                  ))}
              </dl>
              <p className="mt-4 rounded-2xl bg-sand p-4 text-sm whitespace-pre-wrap text-forest">{q.message}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={`mailto:${q.email}?subject=${encodeURIComponent("Cao Gia — your inquiry")}`}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-forest px-4 text-sm text-white hover:bg-leaf"
                >
                  <Mail className="size-4" /> Trả lời {q.email}
                </a>
                {q.phone && (
                  <a
                    href={`https://wa.me/${String(q.phone).replace(/\D/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center gap-2 rounded-full bg-[#25d366] px-4 text-sm text-white"
                  >
                    <WhatsAppIcon className="size-4" /> WhatsApp
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
