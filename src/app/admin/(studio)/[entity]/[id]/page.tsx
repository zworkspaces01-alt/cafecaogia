import { notFound, redirect } from "next/navigation";
import { getEntity } from "@/lib/admin/entities";

/** Old record links (Telegram notices, bookmarks) open the record in its collection. */
export default async function RecordLink({ params }: PageProps<"/admin/[entity]/[id]">) {
  const { entity: key, id } = await params;
  if (!getEntity(key)) notFound();
  redirect(id === "new" ? `/admin/${key}` : `/admin/${key}?id=${encodeURIComponent(id)}`);
}
