import { notFound } from "next/navigation";
import { RecordForm } from "@/components/admin/record-form";
import { requireAdmin } from "@/lib/admin/auth";
import { getEntity } from "@/lib/admin/entities";

export default async function EditRecordPage({ params }: PageProps<"/admin/[entity]/[id]">) {
  const { entity: key, id } = await params;
  const entity = getEntity(key);
  if (!entity) notFound();

  if (id === "new") {
    // Date fields start at today (computed per request, not when the module loaded).
    const today = new Date().toISOString().slice(0, 10);
    const dates = Object.fromEntries(entity.fields.filter((f) => f.type === "date").map((f) => [f.name, today]));
    return <RecordForm entityKey={entity.key} id={null} initial={{ ...dates, ...entity.defaults }} />;
  }

  const { supabase } = await requireAdmin();
  const { data, error } = await supabase.from(entity.table).select("*").eq("id", id).maybeSingle();
  if (error || !data) notFound();

  return <RecordForm entityKey={entity.key} id={id} initial={data} />;
}
