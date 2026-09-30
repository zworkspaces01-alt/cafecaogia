import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { AnalyticsForm } from "@/components/admin/analytics-form";
import { PageTitle, Panel } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { channelLabels, channelOf, sourceLabel } from "@/lib/attribution";
import { mergeSettings } from "@/lib/settings";
import type { Attribution, SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

export const metadata = { title: "Phân tích" };

type Lead = {
  created_at: string;
  status: string;
  locale: string;
  product_slug: string | null;
  attribution?: Attribution | null;
};

const periods = [30, 90, 365] as const;
const DAY = 24 * 60 * 60 * 1000;

const statusLabels: Record<string, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  quoted: "Đã báo giá",
  won: "Chốt đơn",
  lost: "Không thành",
};
const languageNames: Record<string, string> = { en: "Tiếng Anh", ru: "Tiếng Nga", ar: "Tiếng Ả Rập" };

type Row = { label: string; count: number };

function countBy(leads: Lead[], key: (lead: Lead) => string | null | undefined, limit = 8): Row[] {
  const counts = new Map<string, number>();
  for (const lead of leads) {
    const label = key(lead) || "—";
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const rows = [...counts].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count);
  if (rows.length <= limit) return rows;
  const other = rows.slice(limit - 1).reduce((sum, r) => sum + r.count, 0);
  return [...rows.slice(0, limit - 1), { label: "Khác", count: other }];
}

/** Horizontal share bars: one hue, value and share printed in ink beside each bar. */
function BarList({ title, rows, total }: { title: string; rows: Row[]; total: number }) {
  return (
    <div className="rounded-3xl bg-white p-6">
      <h3 className="text-sm font-semibold text-forest">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">Chưa có dữ liệu.</p>
      ) : (
        <table className="mt-4 w-full text-sm">
          <tbody>
            {rows.map((row) => {
              const share = total ? row.count / total : 0;
              return (
                <tr key={row.label} className="group" title={`${row.label}: ${row.count} (${Math.round(share * 100)}%)`}>
                  <td className="w-full py-1.5 pe-3">
                    <span className="block truncate text-forest">{row.label}</span>
                    <span className="mt-1 block h-1.5 rounded-full bg-sand">
                      <span
                        className="block h-full rounded-full bg-leaf transition-opacity group-hover:opacity-80"
                        style={{ width: `${Math.max(share * 100, 2)}%` }}
                      />
                    </span>
                  </td>
                  <td className="py-1.5 text-end font-medium whitespace-nowrap text-forest tabular-nums">{row.count}</td>
                  <td className="w-12 py-1.5 text-end text-xs whitespace-nowrap text-muted tabular-nums">{Math.round(share * 100)}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Kpi({ label, value, note }: { label: string; value: string; note?: React.ReactNode }) {
  return (
    <div className="rounded-3xl bg-white p-6">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-forest tabular-nums">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

/** The selected period, the one before it (for comparison) and the last 12 calendar months. */
function periodBounds(days: number) {
  const now = new Date();
  const since = now.getTime() - days * DAY;
  const monthRanges = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return {
      label: start.toLocaleDateString("vi-VN", { month: "2-digit", year: "2-digit" }),
      start: start.getTime(),
      end: end.getTime(),
    };
  });
  const from = new Date(Math.min(since - days * DAY, monthRanges[0].start)).toISOString();
  return { since, from, monthRanges };
}

export default async function AnalyticsPage({ searchParams }: PageProps<"/admin/analytics">) {
  const requested = Number((await searchParams).days);
  const days = periods.find((p) => p === requested) ?? 90;
  const { supabase } = await requireAdmin();

  const { since, from, monthRanges } = periodBounds(days);

  const query = (columns: string) =>
    supabase.from("inquiries").select(columns).gte("created_at", from).order("created_at").limit(5000);
  let result = await query("created_at, status, locale, product_slug, attribution");
  const migrated = result.error?.code !== "42703";
  if (!migrated) result = await query("created_at, status, locale, product_slug");
  if (result.error) throw new Error(result.error.message);
  const all = (result.data ?? []) as unknown as Lead[];

  const { data: settingsRow } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  const { analytics } = mergeSettings((settingsRow?.data ?? {}) as Partial<SiteSettings>);

  const time = (lead: Lead) => Date.parse(lead.created_at);
  const leads = all.filter((l) => time(l) >= since);
  const previous = all.filter((l) => time(l) >= since - days * DAY && time(l) < since);
  const won = leads.filter((l) => l.status === "won").length;
  const tracked = leads.filter((l) => l.attribution).length;
  const change = previous.length ? Math.round(((leads.length - previous.length) / previous.length) * 100) : null;

  const months = monthRanges.map(({ label, start, end }) => ({
    label,
    count: all.filter((l) => time(l) >= start && time(l) < end).length,
  }));
  const peak = Math.max(1, ...months.map((m) => m.count));

  const landing = (l: Lead) => l.attribution?.landing?.split("?")[0];

  return (
    <div className="space-y-6">
      <PageTitle title="Phân tích" description="Khách hàng tiềm năng đến từ đâu, và kết nối các công cụ đo lường truy cập.">
        <div className="flex gap-1.5 text-sm">
          {periods.map((p) => (
            <Link
              key={p}
              href={`/admin/analytics?days=${p}`}
              className={cn("rounded-full px-4 py-1.5", p === days ? "bg-forest text-white" : "bg-white text-forest")}
            >
              {p === 365 ? "12 tháng" : `${p} ngày`}
            </Link>
          ))}
        </div>
      </PageTitle>

      {!migrated && (
        <p className="flex gap-2 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          Chưa chạy migration supabase/migrations/0006_seo_analytics.sql — yêu cầu báo giá mới chưa được lưu nguồn truy cập.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Yêu cầu báo giá"
          value={String(leads.length)}
          note={change === null ? "Chưa có kỳ trước để so sánh" : `${change >= 0 ? "+" : ""}${change}% so với ${days} ngày trước đó`}
        />
        <Kpi label="Chốt đơn" value={String(won)} note={leads.length ? `${Math.round((won / leads.length) * 100)}% số yêu cầu` : undefined} />
        <Kpi
          label="Chưa xử lý"
          value={String(leads.filter((l) => l.status === "new").length)}
          note={<Link href="/admin/inquiries?status=new" className="text-leaf hover:underline">Xem danh sách →</Link>}
        />
        <Kpi label="Có dữ liệu nguồn" value={leads.length ? `${Math.round((tracked / leads.length) * 100)}%` : "—"} note={`${tracked}/${leads.length} yêu cầu`} />
      </div>

      <section className="rounded-3xl bg-white p-6">
        <h3 className="text-sm font-semibold text-forest">Yêu cầu báo giá theo tháng (12 tháng gần nhất)</h3>
        <div className="mt-6 flex h-40 items-end gap-0.5" role="img" aria-label="Biểu đồ số yêu cầu báo giá theo tháng">
          {months.map((m) => (
            <div key={m.label} className="group relative flex h-full flex-1 flex-col justify-end" title={`${m.label}: ${m.count}`}>
              <span className="pointer-events-none absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium text-forest opacity-0 tabular-nums group-hover:opacity-100">
                {m.count}
              </span>
              <span
                className="mx-auto w-full max-w-10 rounded-t-[4px] bg-leaf group-hover:opacity-80"
                style={{ height: m.count ? `${(m.count / peak) * 100}%` : "1px" }}
              />
            </div>
          ))}
        </div>
        <div className="mt-2 flex gap-0.5 border-t border-mist pt-2">
          {months.map((m) => (
            <span key={m.label} className="flex-1 text-center text-[10px] text-muted tabular-nums">
              {m.label}
            </span>
          ))}
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-xs text-muted">Xem dạng bảng</summary>
          <table className="mt-2 text-sm">
            <tbody>
              {months.map((m) => (
                <tr key={m.label}>
                  <td className="pe-6 text-muted">{m.label}</td>
                  <td className="text-end text-forest tabular-nums">{m.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <BarList title="Kênh" rows={countBy(leads, (l) => channelLabels[channelOf(l.attribution)])} total={leads.length} />
        <BarList
          title="Nguồn cụ thể"
          rows={countBy(leads.filter((l) => l.attribution), (l) => sourceLabel(l.attribution))}
          total={tracked}
        />
        <BarList title="Trang khách vào đầu tiên" rows={countBy(leads.filter((l) => l.attribution), landing)} total={tracked} />
        <BarList title="Sản phẩm được hỏi" rows={countBy(leads, (l) => l.product_slug ?? "(hỏi chung)")} total={leads.length} />
        <BarList title="Ngôn ngữ website" rows={countBy(leads, (l) => languageNames[l.locale] ?? l.locale)} total={leads.length} />
        <BarList title="Trạng thái xử lý" rows={countBy(leads, (l) => statusLabels[l.status] ?? l.status)} total={leads.length} />
      </div>

      <AnalyticsForm initial={analytics} />

      <Panel title="Sự kiện chuyển đổi được gửi tự động" description="Gửi tới mọi công cụ đã kết nối ở trên. Trong GA4, đánh dấu các sự kiện này là “Sự kiện chính” (Admin → Events) để đo hiệu quả quảng cáo.">
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          {[
            ["generate_lead", "Gửi form yêu cầu báo giá thành công (Meta: Lead)"],
            ["whatsapp_click", "Bấm bất kỳ nút/link WhatsApp nào (Meta: Contact)"],
            ["email_click", "Bấm link email (Meta: Contact)"],
            ["phone_click", "Bấm số điện thoại (Meta: Contact)"],
          ].map(([name, description]) => (
            <div key={name} className="rounded-2xl bg-sand p-4">
              <dt className="font-mono text-xs text-forest">{name}</dt>
              <dd className="mt-1 text-muted">{description}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted">
          Nguồn truy cập (utm_source, utm_medium, utm_campaign, gclid/fbclid, trang giới thiệu) được ghi lại 90 ngày trên trình duyệt khách và lưu kèm yêu cầu báo giá.
          Khi chạy quảng cáo hoặc gửi link cho khách, thêm tham số UTM, ví dụ: ?utm_source=linkedin&amp;utm_medium=social&amp;utm_campaign=robusta-2026.
        </p>
      </Panel>
    </div>
  );
}
