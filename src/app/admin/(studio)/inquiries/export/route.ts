import { allowed } from "@/lib/admin/auth";
import { audit } from "@/lib/admin/audit";
import { channelLabels, channelOf, sourceLabel } from "@/lib/attribution";
import { all } from "@/lib/db";
import type { InquiryRow } from "@/lib/types";

// Studio › Báo giá › Xuất CSV: every request (or one status), for Excel. A BOM makes Excel read UTF-8.

const columns: [string, (q: InquiryRow) => string | null | undefined][] = [
  ["Ngày gửi", (q) => q.created_at],
  ["Trạng thái", (q) => q.status],
  ["Họ tên", (q) => q.name],
  ["Công ty", (q) => q.company],
  ["Email", (q) => q.email],
  ["Điện thoại", (q) => q.phone],
  ["Quốc gia", (q) => q.country],
  ["Sản phẩm", (q) => q.product_slug],
  ["Số lượng", (q) => q.quantity],
  ["Incoterm", (q) => q.incoterm],
  ["Ngôn ngữ", (q) => q.locale],
  ["Nội dung", (q) => q.message],
  ["Ghi chú nội bộ", (q) => q.note],
  ["Nguồn", (q) => sourceLabel(q.attribution)],
  ["Kênh", (q) => channelLabels[channelOf(q.attribution)]],
  ["Trang vào đầu tiên", (q) => q.attribution?.landing],
];

/** Quotes a cell; a leading = + - @ is defused so Excel doesn't run it as a formula. */
const cell = (value: string | null | undefined) => {
  const text = String(value ?? "").replace(/^[=+\-@]/, "'$&");
  return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export async function GET(request: Request) {
  const auth = await allowed("inquiries");
  if (!auth.ok) return new Response(auth.error, { status: 403 });
  const status = new URL(request.url).searchParams.get("status");
  const rows = status
    ? await all<InquiryRow>("select * from inquiries where status = ? order by created_at desc", status)
    : await all<InquiryRow>("select * from inquiries order by created_at desc");
  const csv = [columns.map(([name]) => name), ...rows.map((q) => columns.map(([, get]) => get(q)))]
    .map((line) => line.map(cell).join(","))
    .join("\r\n");
  await audit(auth.user.email, "inquiry.export", status ?? "tất cả", `${rows.length} yêu cầu`);
  return new Response(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cao-gia-bao-gia-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
