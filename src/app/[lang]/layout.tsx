import type { Metadata } from "next";
import { Amiri, Cormorant_Garamond, Geist, IBM_Plex_Sans_Arabic } from "next/font/google";
import { Analytics } from "@/components/analytics";
import { ContactDock } from "@/components/contact-dock";
import { MotionMain } from "@/components/motion";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { isRtl, localeTags } from "@/i18n/config";
import { localeAlternates, openGraphBase } from "@/i18n/metadata";
import { getDictionary, getLocale } from "@/i18n/server";
import { getContacts, getPosts, getSettings, whatsappLink } from "@/lib/content";
import { getProducts } from "@/lib/products";
import { imageUrl } from "@/lib/image-url";
import { systemPageSeo } from "@/lib/pages";
import { pageMeta } from "@/lib/seo";
import { factoryPhotos, site } from "@/lib/site";
import "../globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

// Display serif for headline accents; covers Latin and Cyrillic, so English and Russian share it.
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  weight: ["400", "500"],
  style: ["normal", "italic"],
  subsets: ["latin", "latin-ext", "cyrillic"],
});

// Locale-specific faces: declared everywhere but only downloaded on pages that use them.

const plexArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-plex-arabic",
  weight: ["400", "500", "600"],
  subsets: ["arabic"],
  preload: false,
});

const amiri = Amiri({
  variable: "--font-amiri",
  weight: ["400", "700"],
  subsets: ["arabic"],
  preload: false,
});

// Pages render on their first visit and are then cached (ISR), because the CMS database (D1) is
// only reachable inside the Worker, not during `next build`. Unknown languages 404 via getLocale().
export function generateStaticParams() {
  return [];
}

// CMS saves refresh pages immediately; this daily refresh is only a safety net. Kept long because
// every regeneration is a write to the KV page cache (1,000 writes/day on the Workers Free plan).
export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const [locale, dict, { seo }] = await Promise.all([getLocale(), getDictionary(), getSettings()]);
  const [defaults, custom] = await Promise.all([
    pageMeta("home", { title: dict.meta.title, description: dict.meta.description }),
    systemPageSeo("home", locale),
  ]);
  const home = { title: custom.title ?? defaults.title, description: custom.description ?? defaults.description };
  const { google, bing, yandex } = seo.verification;
  return {
    metadataBase: new URL(site.url),
    title: { default: home.title, template: `%s | ${site.name}` },
    description: home.description,
    keywords: [...dict.meta.keywords, site.name],
    alternates: localeAlternates(locale, "/"),
    openGraph: {
      type: "website",
      ...openGraphBase(locale),
      images: [{ url: imageUrl(seo.ogImage.trim() || factoryPhotos.sacksSilos) }],
    },
    twitter: { card: "summary_large_image" },
    robots: seo.indexing
      ? { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } }
      : { index: false, follow: false },
    verification: {
      google: google || undefined,
      yandex: yandex || undefined,
      other: bing ? { "msvalidate.01": bing } : undefined,
    },
  };
}

// Pre-hides animated elements to avoid a flash before hydration. The timeout is a safety net
// so content still appears if JavaScript fails to load.
const motionPendingScript = `if(!matchMedia("(prefers-reduced-motion: reduce)").matches){var d=document.documentElement;d.classList.add("motion-pending");setTimeout(function(){d.classList.remove("motion-pending")},3000)}`;

export default async function RootLayout({ children }: LayoutProps<"/[lang]">) {
  const [locale, dict, products, settings, contacts, posts] = await Promise.all([
    getLocale(),
    getDictionary(),
    getProducts(),
    getSettings(),
    getContacts(),
    getPosts(),
  ]);
  const whatsapp = settings.contact.whatsapp;
  const menuProducts = products.map(({ slug, name, grade, category, image, featured }) => ({
    slug,
    name,
    grade,
    category,
    image,
    featured,
  }));
  const fonts = [geistSans, cormorant, plexArabic, amiri].map((f) => f.variable).join(" ");

  return (
    <html lang={localeTags[locale]} dir={isRtl(locale) ? "rtl" : "ltr"} className={fonts} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionPendingScript }} />
      </head>
      <body className="flex min-h-svh flex-col">
        <SiteHeader
          locale={locale}
          nav={dict.nav}
          common={dict.common}
          menu={{ products: menuProducts, t: dict.megaMenu, categories: dict.categories }}
          whatsappHref={whatsappLink(whatsapp, dict.common.whatsappGreeting)}
          showInsights={posts.length > 0}
        />
        <MotionMain footer={<SiteFooter />}>{children}</MotionMain>
        <ContactDock
          labels={{
            requestQuote: dict.common.requestQuote,
            chat: dict.common.chatWhatsApp,
            greeting: dict.common.whatsappGreeting,
            nudge: dict.common.whatsappNudge,
            online: dict.common.online,
            dismiss: dict.common.dismiss,
          }}
          whatsapp={whatsapp}
          contactName={contacts[0]?.name ?? site.name}
        />
        <Analytics ids={settings.analytics} />
      </body>
    </html>
  );
}
