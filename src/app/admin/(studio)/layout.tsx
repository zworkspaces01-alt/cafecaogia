import { Studio } from "@/components/admin/studio";
import { requireAdmin } from "@/lib/admin/auth";
import { count, first } from "@/lib/db";

/** Every Studio screen sits in the same shell: top bar with Publish, icon rail of sections. */
export default async function StudioLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireAdmin();
  const content = user.permissions.includes("content.read");

  const [pending, inquiries, release] = await Promise.all([
    content
      ? count("select (select count(*) from page_drafts) + (select count(*) from record_drafts) as n")
      : 0,
    user.permissions.includes("inquiries") ? count("select count(*) as n from inquiries where status = 'new'") : 0,
    content ? first<{ published_at: string }>("select published_at from releases order by published_at desc limit 1") : null,
  ]);

  return (
    <Studio user={user} initialPending={pending} initialInquiries={inquiries} lastPublishedAt={release?.published_at ?? null}>
      {children}
    </Studio>
  );
}
