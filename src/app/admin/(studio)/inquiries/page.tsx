import { InboxView } from "@/components/admin/inbox-view";
import { requirePermission } from "@/lib/admin/auth";
import { inquiryStatuses } from "@/lib/admin/inquiry-statuses";
import { all } from "@/lib/db";
import type { InquiryRow } from "@/lib/types";

export const metadata = { title: "Báo giá" };

export default async function InquiriesPage({ searchParams }: PageProps<"/admin/inquiries">) {
  await requirePermission("inquiries");
  const { status, id } = await searchParams;
  const [rows, counts] = await Promise.all([
    all<InquiryRow>("select * from inquiries order by created_at desc limit 1000"),
    all<{ status: string; n: number }>("select status, count(*) as n from inquiries group by status"),
  ]);
  return (
    <InboxView
      rows={rows}
      counts={Object.fromEntries(counts.map((c) => [c.status, c.n]))}
      initialStatus={typeof status === "string" && status in inquiryStatuses ? status : ""}
      initialId={typeof id === "string" ? id : null}
    />
  );
}
