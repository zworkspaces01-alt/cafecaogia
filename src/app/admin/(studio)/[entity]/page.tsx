import { notFound } from "next/navigation";
import { CollectionEditor } from "@/components/admin/collection-editor";
import { requirePermission } from "@/lib/admin/auth";
import { getEntity } from "@/lib/admin/entities";
import { editorItems } from "@/lib/admin/records";

export default async function CollectionPage({ params, searchParams }: PageProps<"/admin/[entity]">) {
  const entity = getEntity((await params).entity);
  if (!entity) notFound();
  await requirePermission("content.read");
  const { id } = await searchParams;
  const items = await editorItems(entity.key);
  return <CollectionEditor key={entity.key} entityKey={entity.key} initialItems={items} initialId={typeof id === "string" ? id : null} />;
}
