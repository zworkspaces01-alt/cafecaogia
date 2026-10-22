import { MediaView } from "@/components/admin/media-library";
import { requirePermission } from "@/lib/admin/auth";

export const metadata = { title: "Thư viện ảnh" };

export default async function MediaPage() {
  const { user } = await requirePermission("content.read");
  return <MediaView canDelete={user.permissions.includes("media.delete")} />;
}
