"use client";

import Image from "next/image";
import { ArrowUpRight, Bean, ChevronDown, Nut, PackageCheck } from "lucide-react";
import Link from "@/components/link";
import type { Dictionary } from "@/i18n/dictionaries/en";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export type MenuProduct = { slug: string; name: string; grade: string; category: Category; image: string; featured: boolean };

/** Trigger button for the desktop nav; the panel itself is rendered by the header. */
export function MegaMenuTrigger({
  label,
  open,
  active,
  onToggle,
}: {
  label: string;
  open: boolean;
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="products-mega-menu"
      className={cn(
        "flex items-center gap-1 rounded-full px-4 py-1.5 text-sm whitespace-nowrap transition-colors",
        active || open ? "bg-white text-forest" : "text-white/85 hover:bg-white/15 hover:text-white",
      )}
    >
      {label}
      <ChevronDown className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} />
    </button>
  );
}

/** Rows per sub-column before a category's list wraps into another sub-column. */
const ROWS = 6;
const MAX_SUBCOLUMNS = 2;

export function MegaMenuPanel({
  products,
  t,
  categories,
  onNavigate,
  hoverProps,
}: {
  products: MenuProduct[];
  t: Dictionary["megaMenu"];
  categories: Dictionary["categories"];
  onNavigate: () => void;
  /** Keeps the menu open while the pointer is over the card itself (not the empty space beside it). */
  hoverProps?: Pick<React.HTMLAttributes<HTMLDivElement>, "onPointerEnter" | "onPointerLeave">;
}) {
  const columns = (
    [
      { category: "coffee", title: t.coffeeTitle, icon: Bean },
      { category: "cashew", title: t.cashewTitle, icon: Nut },
    ] as const
  )
    .map((column) => {
      const items = products.filter((p) => p.category === column.category);
      const span = Math.min(MAX_SUBCOLUMNS, Math.max(1, Math.ceil(items.length / ROWS)));
      // Keep the panel a fixed height: long categories show a "view all" row instead of growing.
      const limit = span * ROWS;
      const shown = items.length > limit ? items.slice(0, limit - 1) : items;
      return { ...column, items, shown, span };
    })
    .filter((column) => column.items.length > 0);
  const totalSpan = columns.reduce((sum, c) => sum + c.span, 0);
  const featured = products.find((p) => p.featured) ?? products[0];

  return (
    <div id="products-mega-menu" className="container-page mt-3 hidden lg:block">
      <div
        {...hoverProps}
        className="grid max-h-[calc(100dvh-6rem)] animate-[rise_0.5s_cubic-bezier(0.2,0.7,0.2,1)_both] grid-cols-[minmax(0,1fr)_15rem] gap-6 overflow-y-auto rounded-3xl bg-white p-6 text-forest shadow-2xl shadow-black/20 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-8 xl:p-8">
        <div className="grid content-start gap-x-6 xl:gap-x-8" style={{ gridTemplateColumns: `repeat(${totalSpan}, minmax(0, 1fr))` }}>
          {columns.map(({ category, title, icon: Icon, items, shown, span }, col) => (
            <div key={category} style={{ gridColumn: `span ${span}` }}>
              <Link
                href={`/products?category=${category}`}
                onClick={onNavigate}
                className="flex items-center gap-2 border-b border-mist pb-3 text-xs font-medium tracking-[0.18em] text-moss uppercase hover:text-forest"
              >
                <Icon className="size-4" />
                {title}
                <span className="ms-auto rounded-full bg-sand px-2 py-0.5 tracking-normal text-muted tabular-nums">{items.length}</span>
              </Link>
              <ul className="mt-3 grid gap-x-4 gap-y-0.5" style={{ gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))` }}>
                {shown.map((product, i) => (
                  <li
                    key={product.slug}
                    className="animate-[rise_0.5s_cubic-bezier(0.2,0.7,0.2,1)_both]"
                    style={{ animationDelay: `${80 + (col * 4 + i) * 35}ms` }}
                  >
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={onNavigate}
                      className="group flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-sand"
                    >
                      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-mist">
                        <Image
                          src={product.image}
                          alt=""
                          fill
                          sizes="40px"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm leading-snug font-medium">{product.name}</span>
                        <span className="block truncate text-xs text-muted">{product.grade}</span>
                      </span>
                    </Link>
                  </li>
                ))}
                {shown.length < items.length && (
                  <li>
                    <Link
                      href={`/products?category=${category}`}
                      onClick={onNavigate}
                      className="group flex h-full items-center gap-3 rounded-xl p-1.5 text-sm font-medium text-leaf transition-colors hover:bg-sand hover:text-forest"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sand text-xs tabular-nums group-hover:bg-white">
                        +{items.length - shown.length}
                      </span>
                      {t.viewAll}
                    </Link>
                  </li>
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {featured && (
            <Link
              href={`/products/${featured.slug}`}
              onClick={onNavigate}
              className="group relative isolate flex aspect-[16/10] flex-col justify-end overflow-hidden rounded-2xl p-5 text-white"
            >
              <Image
                src={featured.image}
                alt=""
                fill
                sizes="288px"
                className="-z-10 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
              <span className="absolute start-4 top-4 rounded-full bg-lime px-3 py-1 text-xs font-medium text-forest">
                {t.featured}
              </span>
              <span className="text-xs text-white/70">{categories[featured.category]}</span>
              <span className="mt-1 text-lg font-medium">{featured.name}</span>
              <span className="mt-1.5 inline-flex items-center gap-1 text-sm text-lime">
                {t.viewSpecs} <ArrowUpRight className="size-4 rtl:-scale-x-100" />
              </span>
            </Link>
          )}
          <Link
            href="/contact"
            onClick={onNavigate}
            className="group flex items-start gap-3 rounded-2xl bg-sand p-4 transition-colors hover:bg-mist"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime">
              <PackageCheck className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{t.samplesTitle}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">{t.samplesBody}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-leaf group-hover:text-forest">
                {t.samplesCta} <ArrowUpRight className="size-3.5 rtl:-scale-x-100" />
              </span>
            </span>
          </Link>
          <Link
            href="/products"
            onClick={onNavigate}
            className="mt-auto inline-flex items-center justify-center gap-1 rounded-full border border-forest/15 py-2.5 text-sm font-medium transition-colors hover:bg-forest hover:text-white"
          >
            {t.viewAll} <ArrowUpRight className="size-4 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </div>
  );
}
