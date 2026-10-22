import Link from "next/link";
import { Copy, ExternalLink, FileText, LayoutTemplate, PanelsTopLeft } from "lucide-react";
import { NewPageForm } from "@/components/admin/new-page-form";
import { Badge, PageTitle } from "@/components/admin/ui";
import { requirePermission } from "@/lib/admin/auth";
import { all } from "@/lib/db";
import { systemPages } from "@/lib/blocks/types";

type Row = { id: string; key: string | null; slug: string; title: string; published: boolean; updated_at: string };

export const metadata = { title: "Trang" };

export default async function PagesListPage() {
  await requirePermission("content.read");
  const [rows, drafts] = await Promise.all([
    all<Row>("select id, key, slug, title, published, updated_at from pages order by created_at"),
    all<{ page_id: string }>("select page_id from page_drafts"),
  ]);
  const withDraft = new Set(drafts.map((d) => d.page_id));
  const custom = rows.filter((row) => !row.key);
  const groups = [
    { kind: "page", title: "Trang của website", icon: LayoutTemplate, note: "" },
    {
      kind: "template",
      title: "Mẫu trang",
      icon: Copy,
      note: "Bố cục dùng chung cho mọi trang sản phẩm / bài viết. Nội dung riêng của từng sản phẩm, bài viết sửa ở mục Sản phẩm và Bài viết.",
    },
    { kind: "layout", title: "Giao diện chung", icon: PanelsTopLeft, note: "Menu, footer và nút liên hệ nổi xuất hiện trên mọi trang." },
  ] as const;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-5 md:p-8">
      <PageTitle title="Trang" description="Sắp xếp, ẩn hiện và sửa nội dung từng khối trên trang, xem trước trước khi xuất bản." />


      {groups.map((group) => (
        <section key={group.kind} className="rounded-3xl bg-white p-6">
          <h2 className="flex items-center gap-2 font-semibold text-forest">
            <group.icon className="size-5" /> {group.title}
          </h2>
          {group.note && <p className="mt-1 text-sm text-muted">{group.note}</p>}
          <ul className="mt-4 divide-y divide-mist">
            {systemPages
              .filter((page) => page.kind === group.kind)
              .map((page) => {
                const row = rows.find((r) => r.key === page.key);
                return (
                  <li key={page.key} className="flex flex-wrap items-center gap-3 py-3">
                    <Link href={`/admin/pages/${page.key}`} className="font-medium text-forest hover:text-leaf">
                      {page.label}
                    </Link>
                    {page.kind !== "layout" && <span className="text-xs text-muted">/en{page.path}</span>}
                    {row && withDraft.has(row.id) && <Badge tone="sample">Có bản nháp</Badge>}
                    {!row && <Badge tone="info">Bố cục mặc định</Badge>}
                    {page.kind === "page" && page.key !== "not-found" && (
                      <a href={`/en${page.path}`} target="_blank" className="ms-auto inline-flex items-center gap-1 text-xs text-muted hover:text-forest">
                        Xem <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </li>
                );
              })}
          </ul>
        </section>
      ))}

      <section className="rounded-3xl bg-white p-6">
        <h2 className="flex items-center gap-2 font-semibold text-forest">
          <FileText className="size-5" /> Trang tự tạo
        </h2>
        <ul className="mt-4 divide-y divide-mist">
          {custom.map((page) => (
            <li key={page.id} className="flex flex-wrap items-center gap-3 py-3">
              <Link href={`/admin/pages/${page.id}`} className="font-medium text-forest hover:text-leaf">
                {page.title}
              </Link>
              <span className="text-xs text-muted">/en/{page.slug}</span>
              {page.published ? <Badge tone="ok">Đang hiển thị</Badge> : <Badge tone="hidden">Chưa xuất bản</Badge>}
              {withDraft.has(page.id) && <Badge tone="sample">Có bản nháp</Badge>}
              {page.published && (
                <a href={`/en/${page.slug}`} target="_blank" className="ms-auto inline-flex items-center gap-1 text-xs text-muted hover:text-forest">
                  Xem <ExternalLink className="size-3.5" />
                </a>
              )}
            </li>
          ))}
          {custom.length === 0 && <li className="py-3 text-sm text-muted">Chưa có trang nào. Tạo landing page mới bên dưới.</li>}
        </ul>
        <div className="mt-6 border-t border-mist pt-6">
          <NewPageForm />
        </div>
      </section>
    </div>
  );
}
