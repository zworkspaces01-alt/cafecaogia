"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, Menu, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import { LanguageSwitcher, LanguageTabs } from "@/components/language-switcher";
import Link from "@/components/link";
import { Logo } from "@/components/logo";
import { MegaMenuPanel, MegaMenuTrigger, type MenuProduct } from "@/components/products-mega-menu";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { nav } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader({
  locale,
  nav: labels,
  common,
  menu,
  whatsappHref,
  showInsights,
}: {
  locale: Locale;
  nav: Dictionary["nav"];
  common: Dictionary["common"];
  menu: { products: MenuProduct[]; t: Dictionary["megaMenu"]; categories: Dictionary["categories"] };
  whatsappHref: string;
  /** The Insights link only appears once at least one article is published. */
  showInsights: boolean;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [megaOpen, setMegaOpen] = useState(false);
  const closeTimer = useRef<number | undefined>(undefined);

  // Hover intent: open immediately, close after a short grace period so the pointer can
  // travel from the trigger to the panel.
  const openMega = () => {
    window.clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const scheduleCloseMega = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMegaOpen(false), 180);
  };

  useEffect(() => {
    if (!megaOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMegaOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [megaOpen]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Path without the locale prefix, e.g. "/ru/products/x" → "/products/x".
  const path = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/";
  const items = nav.filter((item) => item.href !== "/insights" || showInsights);
  const isActive = (href: string) => (href === "/" ? path === "/" : !href.includes("#") && path.startsWith(href));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 animate-drop transition-all duration-300 print:hidden",
        scrolled || open || megaOpen ? "bg-forest/90 py-3 shadow-lg shadow-black/10 backdrop-blur-md" : "py-6",
      )}
      onMouseLeave={scheduleCloseMega}
    >
      <div className="container-page flex items-center justify-between gap-6">
        <Logo label={common.homeLabel} />

        <nav
          aria-label={common.mainNav}
          className="hidden items-center gap-1 rounded-full border border-white/20 bg-white/10 p-1 backdrop-blur-md lg:flex"
        >
          {items
            .filter((item) => item.href !== "/contact")
            .map((item) =>
              item.key === "products" ? (
                <div key={item.href} onMouseEnter={openMega}>
                  <MegaMenuTrigger
                    label={labels.products}
                    open={megaOpen}
                    active={isActive(item.href)}
                    onToggle={() => setMegaOpen((v) => !v)}
                  />
                </div>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors",
                    isActive(item.href) ? "bg-white text-forest" : "text-white/85 hover:bg-white/15 hover:text-white",
                  )}
                >
                  {item.href === "/" && <Home className="size-3.5" />}
                  {labels[item.key]}
                </Link>
              ),
            )}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden lg:block">
            <LanguageSwitcher locale={locale} label={common.language} />
          </div>
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={common.chatWhatsApp}
            title={common.chatWhatsApp}
            className="group relative grid size-11 shrink-0 place-items-center rounded-full bg-[#25d366] text-white shadow-md shadow-[#25d366]/30 transition-transform hover:scale-110"
          >
            <span aria-hidden className="absolute inset-0 animate-wa-ping rounded-full bg-[#25d366] [animation-duration:3.2s]" />
            <WhatsAppIcon className="relative size-5" />
          </a>
          <Link
            href="/contact"
            className="hidden h-10 items-center rounded-full bg-white px-5 text-sm font-medium whitespace-nowrap text-forest transition-colors hover:bg-lime sm:inline-flex"
          >
            {common.requestQuote}
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="grid size-11 place-items-center rounded-full border border-white/25 text-white lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? common.closeMenu : common.openMenu}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {megaOpen && (
        <div onMouseEnter={openMega}>
          <MegaMenuPanel
            products={menu.products}
            t={menu.t}
            categories={menu.categories}
            onNavigate={() => setMegaOpen(false)}
          />
        </div>
      )}

      {open && (
        <nav
          id="mobile-nav"
          aria-label={common.mobileNav}
          className="container-page mt-3 grid gap-1 pb-4 lg:hidden [&>*]:animate-rise [&>*:nth-child(2)]:[animation-delay:40ms] [&>*:nth-child(3)]:[animation-delay:80ms] [&>*:nth-child(4)]:[animation-delay:120ms] [&>*:nth-child(5)]:[animation-delay:160ms] [&>*:nth-child(6)]:[animation-delay:200ms] [&>*:nth-child(7)]:[animation-delay:240ms]"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "rounded-xl px-4 py-3 text-base",
                isActive(item.href) ? "bg-white text-forest" : "text-white/90 hover:bg-white/10",
              )}
            >
              {labels[item.key]}
            </Link>
          ))}
          <div className="mt-2">
            <LanguageTabs locale={locale} label={common.language} onSelect={() => setOpen(false)} />
          </div>
        </nav>
      )}
    </header>
  );
}
