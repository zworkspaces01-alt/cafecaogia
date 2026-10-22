import Link from "next/link";
import { PageTitle } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { auditActions, type AuditAction } from "@/lib/admin/audit";
import { all } from "@/lib/db";
import { formatTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Nhật ký" };

type Entry = { id: number; at: string; actor: string; action: AuditAction; target: string; detail: string };

/** Groups of actions for the filter chips. */
const filters: { key: string; label: string; actions: AuditAction[] }[] = [
  { key: "", label: "Tất cả", actions: [] },
  { key: "login", label: "Đăng nhập", actions: ["login", "login.failed", "login.locked"] },
  { key: "content", label: "Nội dung", actions: ["publish", "discard", "release.undo", "page.create", "page.settings", "page.delete", "page.restore", "media.delete"] },
  { key: "inquiries", label: "Báo giá", actions: ["inquiry.status", "inquiry.note", "inquiry.export"] },
  { key: "system", label: "Cài đặt & tài khoản", actions: ["settings", "user.create", "user.update", "user.password", "user.own-password"] },
];

const danger = new Set<AuditAction>(["login.failed", "login.locked", "page.delete", "media.delete"]);

export default async function AuditPage({ searchParams }: PageProps<"/admin/audit">) {
  await requirePermission("audit");
  const { group, actor } = await searchParams;
  const filter = filters.find((f) => f.key === group) ?? filters[0];
  const where: string[] = [];
  const params: string[] = [];
  if (filter.actions.length) {
    where.push(`action in (${filter.actions.map(() => "?").join(", ")})`);
    params.push(...filter.actions);
  }
  if (typeof actor === "string" && actor) {
    where.push("actor = ?");
    params.push(actor);
  }
  const entries = await all<Entry>(`select * from audit_log ${where.length ? `where ${where.join(" and ")}` : ""} order by at desc limit 300`, ...params);
  const link = (next: { group?: string; actor?: string }) => {
    const q = new URLSearchParams(Object.entries({ group: filter.key, actor: typeof actor === "string" ? actor : "", ...next }).filter(([, v]) => v));
    return `/admin/audit${q.size ? `?${q}` : ""}`;
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-5 md:p-8">
      <PageTitle title="Nhật ký" description="Đăng nhập (cả sai mật khẩu), xuất bản, cài đặt, tài khoản và xử lý báo giá — 300 mục gần nhất. Sai mật khẩu 8 lần trong 15 phút sẽ khoá tạm email đó." />
      <div className="flex flex-wrap items-center gap-2 text-sm">
        {filters.map((f) => (
          <Link key={f.key} href={link({ group: f.key })} className={cn("rounded-full px-4 py-1.5", f.key === filter.key ? "bg-forest text-white" : "bg-white text-forest")}>
            {f.label}
          </Link>
        ))}
        {typeof actor === "string" && actor && (
          <Link href={link({ actor: "" })} className="rounded-full bg-lime/40 px-3 py-1.5 text-xs text-forest">
            {actor} ✕
          </Link>
        )}
      </div>
      <ol className="divide-y divide-mist overflow-hidden rounded-3xl bg-white">
        {entries.map((e) => (
          <li key={e.id} className="grid gap-1 px-5 py-3 text-sm sm:grid-cols-[8.5rem_12rem_1fr] sm:gap-4">
            <span className="text-xs text-muted tabular-nums">{formatTime(e.at)}</span>
            <Link href={link({ actor: e.actor })} className="truncate text-xs text-leaf hover:underline">
              {e.actor || "—"}
            </Link>
            <span className="min-w-0">
              <span className={cn("font-medium", danger.has(e.action) ? "text-red-700" : "text-forest")}>{auditActions[e.action] ?? e.action}</span>
              {e.target && <span className="text-forest"> · {e.target}</span>}
              {e.detail && <span className="block truncate text-xs text-muted" title={e.detail}>{e.detail}</span>}
            </span>
          </li>
        ))}
        {entries.length === 0 && <li className="px-5 py-10 text-center text-sm text-muted">Chưa có mục nào.</li>}
      </ol>
    </div>
  );
}
