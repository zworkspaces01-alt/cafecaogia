import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { RenderBlocks } from "@/components/blocks/render-blocks";
import { PreviewBanner } from "@/components/preview-banner";
import { getLocale } from "@/i18n/server";
import { currentAdmin } from "@/lib/admin/auth";
import { loadDraft } from "@/lib/pages";

// The page builder's live preview: a page's working draft inside the real site layout. Rendered per
// request (never cached) and only for signed-in admins; everyone else gets a 404.
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Xem trước", robots: { index: false, follow: false } };

export default async function PreviewPage({ params }: PageProps<"/[lang]/preview/[ref]">) {
  const [{ ref }, locale, admin] = await Promise.all([params, getLocale(), currentAdmin()]);
  if (!admin) notFound();
  const draft = await loadDraft(ref);
  if (!draft) notFound();
  return (
    <>
      <RenderBlocks blocks={draft.blocks} locale={locale} />
      <PreviewBanner />
    </>
  );
}
