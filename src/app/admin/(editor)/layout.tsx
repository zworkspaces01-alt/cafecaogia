import { requireAdmin } from "@/lib/admin/auth";

/** Full-screen admin tools (the page editor) without the CMS sidebar. */
export default async function EditorLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
