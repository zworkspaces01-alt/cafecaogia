import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { Badge, PageTitle } from "@/components/admin/ui";
import { requireAdmin } from "@/lib/admin/auth";
import { getEntity } from "@/lib/admin/entities";

export default async function EntityListPage({ params, searchParams }: PageProps<"/admin/[entity]">) {
  const entity = getEntity((await params).entity);
  if (!entity) notFound();
  const { filter } = await searchParams;
  const { supabase } = await requireAdmin();

  let query = supabase.from(entity.table).select("*").order("sort_order").order("created_at");
  if (filter === "sample") query = query.eq("is_sample", true);
  const { data: rows, error } = await query;
  if (error) throw new Error(error.message);

  return (
    <div className="space-y-6">
      <PageTitle title={entity.label} description={entity.description}>
        <Link
          href={`/admin/${entity.key}/new`}
          className="inline-flex h-10 items-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white hover:bg-leaf"
        >
          <Plus className="size-4" /> Thêm {entity.singular}
        </Link>
      </PageTitle>

      <div className="flex gap-2 text-sm">
        <Link href={`/admin/${entity.key}`} className={`rounded-full px-4 py-1.5 ${filter !== "sample" ? "bg-forest text-white" : "bg-white text-forest"}`}>
          Tất cả
        </Link>
        <Link href={`/admin/${entity.key}?filter=sample`} className={`rounded-full px-4 py-1.5 ${filter === "sample" ? "bg-forest text-white" : "bg-white text-forest"}`}>
          Chỉ nội dung mẫu
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-3xl bg-white p-8 text-sm text-muted">Chưa có {entity.singular} nào.</p>
      ) : (
        <ul className="divide-y divide-mist overflow-hidden rounded-3xl bg-white">
          {rows.map((row) => {
            const image = entity.imageField ? (row[entity.imageField] as string | null) : null;
            return (
              <li key={row.id}>
                <Link href={`/admin/${entity.key}/${row.id}`} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-sand">
                  <span className="relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-xl bg-mist text-xs text-muted">
                    {image ? <Image src={image} alt="" fill sizes="48px" className="object-cover" /> : "—"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-forest">{String(row[entity.titleField] ?? "")}</span>
                    {entity.subtitleField && <span className="block truncate text-xs text-muted">{String(row[entity.subtitleField] ?? "")}</span>}
                  </span>
                  <span className="flex shrink-0 flex-wrap justify-end gap-1.5">
                    {row.is_ceo && <Badge tone="info">CEO</Badge>}
                    {row.featured && <Badge tone="info">Nổi bật</Badge>}
                    {row.is_sample && <Badge tone="sample">Mẫu</Badge>}
                    {!row.published && <Badge tone="hidden">Đang ẩn</Badge>}
                  </span>
                  <span className="hidden w-10 text-end text-xs text-muted sm:block">#{row.sort_order}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
