import Link from "next/link";
import { History } from "lucide-react";
import type { ReleaseItem } from "@/app/admin/publish-actions";
import { UndoReleaseButton } from "@/components/admin/undo-release";
import { PageTitle } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { formatTime } from "@/lib/admin/format";
import { all } from "@/lib/db";
import { cn } from "@/lib/utils";

export const metadata = { title: "Lịch sử xuất bản" };

type Release = { id: string; published_at: string; published_by: string; note: string; items: ReleaseItem[] };

const verbs: Record<ReleaseItem["action"], { label: string; tone: string }> = {
  create: { label: "Mới", tone: "bg-sky-100 text-sky-900" },
  update: { label: "Sửa", tone: "bg-amber-100 text-amber-900" },
  delete: { label: "Xoá", tone: "bg-red-100 text-red-700" },
};

/** Where a released item is edited now. */
const hrefOf = (item: ReleaseItem) => {
  const [kind, ref] = [item.key.slice(0, item.key.indexOf(":")), item.key.slice(item.key.indexOf(":") + 1)];
  return kind === "page" ? `/admin/pages/${ref}` : `/admin/${kind}?id=${ref}`;
};

export default async function HistoryPage() {
  const { user } = await requirePermission("content.read");
  const releases = await all<Release>("select * from releases order by published_at desc limit 50");
  const canUndo = user.permissions.includes("content.publish");

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 p-5 md:p-8">
      <PageTitle
        title="Lịch sử xuất bản"
        description="50 lần xuất bản gần nhất. “Hoàn tác” nạp lại trạng thái trước lần đó vào bản nháp để bạn xem rồi Xuất bản — website chưa đổi ngay. Mỗi trang còn có lịch sử riêng (nút Phiên bản trong trình sửa trang)."
      />
      {releases.length === 0 && <p className="rounded-3xl bg-white p-8 text-center text-sm text-muted">Chưa có lần xuất bản nào.</p>}
      <ol className="space-y-3">
        {releases.map((r, i) => (
          <li key={r.id} className="rounded-3xl bg-white p-5">
            <div className="flex flex-wrap items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-sand text-muted">
                <History className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-forest">
                  {formatTime(r.published_at)}
                  {i === 0 && <span className="ms-2 rounded-full bg-lime px-2 py-0.5 text-[11px] font-medium text-forest">Mới nhất</span>}
                </p>
                <p className="truncate text-xs text-muted">
                  {r.published_by} · {r.note || "Không có ghi chú"}
                </p>
              </div>
              {canUndo && <UndoReleaseButton id={r.id} />}
            </div>
            <ul className="mt-3 flex flex-wrap gap-1.5 ps-12">
              {r.items.map((item) => (
                <li key={item.key}>
                  <Link href={hrefOf(item)} className="inline-flex items-center gap-1.5 rounded-full bg-sand px-2.5 py-1 text-xs text-forest hover:bg-mist">
                    <span className={cn("rounded-full px-1.5 text-[10px] leading-4 font-medium", verbs[item.action].tone)}>{verbs[item.action].label}</span>
                    {item.group}: {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
