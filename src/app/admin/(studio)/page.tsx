import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Inbox } from "lucide-react";
import { Badge, PageTitle } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { entities } from "@/lib/admin/entities";
import { all, count } from "@/lib/db";
import type { InquiryRow } from "@/lib/types";

export default async function DashboardPage() {
  const { user } = await requirePermission("content.read");

  const counts = await Promise.all(
    entities.map(async (entity) => {
      const [total, samples, sampleRows] = await Promise.all([
        count(`select count(*) as n from ${entity.table}`),
        count(`select count(*) as n from ${entity.table} where is_sample = 1`),
        all<Record<string, string>>(
          `select id, ${entity.titleField} from ${entity.table} where is_sample = 1 order by sort_order limit 8`,
        ),
      ]);
      return { entity, total, samples, sampleRows };
    }),
  );

  const inbox = user.permissions.includes("inquiries");
  const [newInquiries, recent] = inbox
    ? await Promise.all([
        count("select count(*) as n from inquiries where status = 'new'"),
        all<InquiryRow>("select id, created_at, name, company, country, product_slug, status from inquiries order by created_at desc limit 5"),
      ])
    : [0, []];

  const totalSamples = counts.reduce((sum, c) => sum + c.samples, 0);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-5 md:p-8">
      <PageTitle title="Tổng quan" description="Quản lý nội dung website Cao Gia bằng 3 ngôn ngữ. Mọi chỉnh sửa lưu thành bản nháp — bấm Xuất bản ở góc trên để đưa lên website." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {inbox && (
        <Link href="/admin/inquiries" className="group rounded-3xl bg-forest p-6 text-white">
          <Inbox className="size-6 text-lime" />
          <p className="mt-4 text-4xl font-semibold">{newInquiries ?? 0}</p>
          <p className="mt-1 text-sm text-white/70">Yêu cầu báo giá mới</p>
          <span className="mt-4 inline-flex items-center gap-1 text-sm text-lime">
            Xem tất cả <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </span>
        </Link>
        )}
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
                        <Link href={`/admin/${entity.key}?id=${row.id}`} className="text-sm text-leaf hover:underline">
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

      {inbox && (
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
      )}
    </div>
  );
}
