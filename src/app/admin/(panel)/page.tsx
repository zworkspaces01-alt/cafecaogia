import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Inbox } from "lucide-react";
import { Badge, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { entities } from "@/lib/admin/entities";

export default async function DashboardPage() {
  const { supabase } = await requireAdmin();

  const counts = await Promise.all(
    entities.map(async (entity) => {
      const [{ count: total }, { count: samples }, { data: sampleRows }] = await Promise.all([
        supabase.from(entity.table).select("id", { count: "exact", head: true }),
        supabase.from(entity.table).select("id", { count: "exact", head: true }).eq("is_sample", true),
        supabase.from(entity.table).select(`id, ${entity.titleField}`).eq("is_sample", true).order("sort_order").limit(8),
      ]);
      return { entity, total: total ?? 0, samples: samples ?? 0, sampleRows: (sampleRows ?? []) as unknown as Record<string, string>[] };
    }),
  );

  const [{ count: newInquiries }, { data: recent }] = await Promise.all([
    supabase.from("inquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("inquiries").select("id, created_at, name, company, country, product_slug, status").order("created_at", { ascending: false }).limit(5),
  ]);

  const totalSamples = counts.reduce((sum, c) => sum + c.samples, 0);

  return (
    <div className="space-y-8">
      <PageTitle title="Tổng quan" description="Quản lý nội dung website Cao Gia bằng 3 ngôn ngữ." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link href="/admin/inquiries" className="group rounded-3xl bg-forest p-6 text-white">
          <Inbox className="size-6 text-lime" />
          <p className="mt-4 text-4xl font-semibold">{newInquiries ?? 0}</p>
          <p className="mt-1 text-sm text-white/70">Yêu cầu báo giá mới</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm text-lime">
            Xem tất cả <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
        {counts.map(({ entity, total, samples }) => (
          <Link key={entity.key} href={`/admin/${entity.key}`} className="rounded-3xl bg-white p-6 transition-shadow hover:shadow-lg">
            <p className="text-sm text-muted">{entity.label}</p>
            <p className="mt-2 text-3xl font-semibold text-forest">{total}</p>
            <div className="mt-3">{samples > 0 ? <Badge tone="sample">{samples} nội dung mẫu</Badge> : <Badge tone="ok">Đã là nội dung thật</Badge>}</div>
          </Link>
        ))}
      </div>

      <section className="rounded-3xl bg-white p-6 md:p-8">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-forest">
          {totalSamples > 0 ? <AlertTriangle className="size-5 text-amber-600" /> : <CheckCircle2 className="size-5 text-leaf" />}
          Nội dung mẫu cần thay trước khi chạy quảng cáo
        </h2>
        <p className="mt-1 text-sm text-muted">
          Các mục dưới đây là nội dung giả lập (tên người, công ty đều tự đặt). Thay bằng thông tin thật rồi bỏ đánh dấu “Nội dung mẫu”.
        </p>
        {totalSamples === 0 ? (
          <p className="mt-5 text-sm text-leaf">Tuyệt vời — không còn nội dung mẫu nào.</p>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            {counts
              .filter((c) => c.samples > 0)
              .map(({ entity, samples, sampleRows }) => (
                <div key={entity.key}>
                  <p className="text-sm font-medium text-forest">
                    {entity.label} <span className="text-muted">({samples})</span>
                  </p>
                  <ul className="mt-2 space-y-1">
                    {sampleRows.map((row) => (
                      <li key={row.id}>
                        <Link href={`/admin/${entity.key}/${row.id}`} className="text-sm text-leaf hover:underline">
                          {row[entity.titleField] || "(chưa đặt tên)"}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 md:p-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-forest">Yêu cầu báo giá gần đây</h2>
          <Link href="/admin/inquiries" className="text-sm text-leaf hover:underline">
            Xem tất cả
          </Link>
        </div>
        {recent?.length ? (
          <ul className="mt-4 divide-y divide-mist">
            {recent.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <span>
                  <span className="font-medium text-forest">{q.name}</span>
                  <span className="text-muted"> · {[q.company, q.country].filter(Boolean).join(", ")}</span>
                </span>
                <span className="text-xs text-muted">{new Date(q.created_at).toLocaleString("vi-VN")}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm text-muted">Chưa có yêu cầu nào.</p>
        )}
      </section>
    </div>
  );
}
