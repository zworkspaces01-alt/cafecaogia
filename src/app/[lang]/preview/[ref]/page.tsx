import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PreviewBridge } from "@/components/admin/preview-bridge";
import { RenderBlocks, type BlockContext } from "@/components/blocks/render-blocks";
import { ContactDock } from "@/components/contact-dock";
import { PreviewBanner } from "@/components/preview-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getDictionary, getLocale } from "@/i18n/server";
import { currentAdmin } from "@/lib/admin/auth";
import type { Block } from "@/lib/blocks/types";
import { chromeFromBlocks } from "@/lib/chrome";
import { getContacts, getPosts, getSettings, whatsappLink } from "@/lib/content";
import { loadDraft, loadSystemPage } from "@/lib/pages";
import { getProducts } from "@/lib/products";
import { site } from "@/lib/site";

// The page builder's live preview: a page's working draft inside the real site layout. Rendered per
// request (never cached) and only for signed-in admins; everyone else gets a 404.
//  - templates (product-template, post-template) render with a sample product / article; `?item=<slug>`
//    picks which one;
//  - the site layout ("layout") renders its draft header, footer and contact buttons around the
//    published homepage, and the published ones from the site layout are hidden (see globals.css).
export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Xem trước", robots: { index: false, follow: false } };

export default async function PreviewPage({ params, searchParams }: PageProps<"/[lang]/preview/[ref]">) {
  const [{ ref }, { item }, locale, admin] = await Promise.all([params, searchParams, getLocale(), currentAdmin()]);
  if (!admin) notFound();
  const draft = await loadDraft(ref);
  if (!draft) notFound();

  if (ref === "layout") return <LayoutPreview blocks={draft.blocks} />;

  const context: BlockContext = {};
  const pick = typeof item === "string" ? item : undefined;
  if (ref === "product-template") {
    const products = await getProducts();
    context.product = products.find((p) => p.slug === pick) ?? products[0];
  } else if (ref === "post-template") {
    const posts = await getPosts();
    context.post = posts.find((p) => p.slug === pick) ?? posts[0];
  }

  return (
    <>
      <RenderBlocks blocks={draft.blocks} locale={locale} context={context} preview />
      <PreviewBanner />
      <PreviewBridge />
    </>
  );
}

/** Draft header, footer and floating buttons around the published homepage. */
async function LayoutPreview({ blocks }: { blocks: Block[] }) {
  const [locale, dict, products, settings, contacts, posts, home] = await Promise.all([
    getLocale(),
    getDictionary(),
    getProducts(),
    getSettings(),
    getContacts(),
    getPosts(),
    loadSystemPage("home"),
  ]);
  const chrome = chromeFromBlocks(blocks, locale, dict);
  const whatsapp = settings.contact.whatsapp;
  const menuProducts = products.map(({ slug, name, grade, category, image, featured }) => ({ slug, name, grade, category, image, featured }));

  return (
    <div data-chrome-preview className="contents">
      <div data-cms-block={chrome.ids.header} className="contents">
        <SiteHeader
          locale={locale}
          nav={chrome.nav}
          common={chrome.common}
          menu={{ products: menuProducts, t: dict.megaMenu, categories: dict.categories }}
          whatsappHref={whatsappLink(whatsapp, chrome.common.whatsappGreeting)}
          showInsights={posts.length > 0}
        />
      </div>
      <RenderBlocks blocks={home?.blocks ?? []} locale={locale} />
      <div data-cms-block={chrome.ids.footer}>
        <SiteFooter t={chrome.footer} />
      </div>
      <div data-cms-block={chrome.ids.dock} className="contents">
        <ContactDock labels={chrome.dock} whatsapp={whatsapp} contactName={contacts[0]?.name ?? site.name} />
      </div>
      <PreviewBanner />
      <PreviewBridge />
    </div>
  );
}
