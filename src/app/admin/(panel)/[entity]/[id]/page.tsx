import { notFound } from "next/navigation";
import { RecordForm } from "@/components/admin/record-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getEntity } from "@/lib/admin/entities";

export default async function EditRecordPage({ params }: PageProps<"/admin/[entity]/[id]">) {
  const { entity: key, id } = await params;
  const entity = getEntity(key);
  if (!entity) notFound();

  if (id === "new") return <RecordForm entityKey={entity.key} id={null} initial={{ ...entity.defaults }} />;

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from(entity.table).select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();

  return <RecordForm entityKey={entity.key} id={id} initial={data} />;
}
