import { notFound } from "next/navigation";
import { PageEditor, type EditorVersion } from "@/components/admin/page-editor";
import { requireAdmin } from "@/lib/admin/auth";
import { all, first } from "@/lib/db";
import { blockTemplates, defaultPageBlocks } from "@/lib/blocks/defaults";
import { isSystemPageKey, systemPages, type Block, type PageSeo } from "@/lib/blocks/types";

export const metadata = { title: "Sửa trang" };

// Row ids: 32 hex characters (D1 default), or a dashed uuid.
const rowId = /^(?:[0-9a-f]{32}|[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export default async function EditPage({ params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const system = isSystemPageKey(ref);
  if (!system && !rowId.test(ref)) notFound();
  await requireAdmin();

  type PageRecord = { id: string; key: string | null; slug: string; title: string; blocks: Block[]; seo: PageSeo; published: boolean };
  const page = await first<PageRecord>(
    `select id, key, slug, title, blocks, seo, published from pages where ${system ? "key" : "id"} = ?`,
    ref,
  );
  if (!page && !system) notFound();

  const [draft, versions, templates, customPages] = await Promise.all([
    page ? first<{ blocks: Block[]; seo: PageSeo }>("select blocks, seo from page_drafts where page_id = ?", page.id) : null,
    page
      ? all<EditorVersion>(
          "select id, published_at, published_by, note from page_versions where page_id = ? order by published_at desc limit 30",
          page.id,
        )
      : [],
    blockTemplates(),
    all<{ id: string; title: string }>("select id, title from pages where key is null order by created_at"),
  ]);
  // For the editor's page switcher: system pages first, then custom ones.
  const pageLinks = [
    ...systemPages.map((p) => ({ ref: p.key as string, label: p.label })),
    ...customPages.map((p) => ({ ref: p.id, label: p.title })),
  ];

  const meta = system ? systemPages.find((p) => p.key === ref)! : null;
  const blocks = draft?.blocks ?? page?.blocks ?? (system ? await defaultPageBlocks(ref) : []);

  return (
    <PageEditor
      pageRef={ref}
      title={meta?.label ?? page!.title}
      path={meta ? meta.path : `/${page!.slug}`}
      system={system}
      pageId={page?.id ?? null}
      slug={page?.slug ?? ""}
      published={page?.published ?? true}
      initialBlocks={blocks}
      initialSeo={draft?.seo ?? page?.seo ?? {}}
      hasDraft={Boolean(draft)}
      versions={versions}
      templates={templates}
      pages={pageLinks}
    />
  );
}
