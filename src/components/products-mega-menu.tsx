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
        "flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[13px] whitespace-nowrap transition-colors xl:px-4 xl:text-sm",
        active || open ? "bg-white text-forest" : "text-white/85 hover:bg-white/15 hover:text-white",
      )}
    >
      {label}
      <ChevronDown className={cn("size-3.5 transition-transform duration-300", open && "rotate-180")} />
    </button>
  );
}

/** Rows per sub-column before a list wraps into another sub-column or ends in "view all". */
const ROWS = 8;
const MAX_SUBCOLUMNS = 2;

/** One sub-column: `more` is how many products it hides behind its "view all" row. */
type Group = { label?: string; count: number; shown: MenuProduct[]; more: number; below?: Group };

/** Keep the panel a fixed height: a long list ends in a "view all" row instead of growing. */
const fit = (items: MenuProduct[], rows: number) => (items.length > rows ? items.slice(0, rows - 1) : items);

/** Coffee splits into one column per variety, read from the slug: "robusta-…", "arabica-…", "roasted-…". */
function coffeeGroups(items: MenuProduct[], t: Dictionary["megaMenu"]): Group[] {
  const arabica = items.filter((p) => p.slug.startsWith("arabica"));
  const roasted = items.filter((p) => p.slug.startsWith("roasted"));
  const robusta = items.filter((p) => !arabica.includes(p) && !roasted.includes(p));
  const group = (label: string, list: MenuProduct[], rows = ROWS): Group => {
    const shown = fit(list, rows);
    return { label, count: list.length, shown, more: list.length - shown.length };
  };
  // Roasted blends sit under Arabica (the shorter list) instead of taking a third column.
  const short = arabica.length > 0 ? group(t.arabica, arabica, ROWS - Math.min(roasted.length, 3) - 1) : null;
  const roastedGroup = roasted.length > 0 ? group(t.roasted, roasted, 3) : undefined;
  return [
    ...(robusta.length > 0 ? [group(t.robusta, robusta)] : []),
    ...(short ? [{ ...short, below: roastedGroup }] : roastedGroup ? [roastedGroup] : []),
  ];
}

/** Other categories fill up to MAX_SUBCOLUMNS columns of ROWS, top to bottom, with one "view all" at the end. */
function chunkGroups(items: MenuProduct[]): Group[] {
  const columns = Math.min(MAX_SUBCOLUMNS, Math.max(1, Math.ceil(items.length / ROWS)));
  const shown = fit(items, columns * ROWS);
  const perColumn = Math.ceil((shown.length + (shown.length < items.length ? 1 : 0)) / columns);
  return Array.from({ length: columns }, (_, i) => {
    const last = i === columns - 1;
    return {
      count: items.length,
      shown: shown.slice(i * perColumn, (i + 1) * perColumn),
      more: last ? items.length - shown.length : 0,
    };
  });
}

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
      const groups = column.category === "coffee" ? coffeeGroups(items, t) : chunkGroups(items);
      return { ...column, items, groups, span: groups.length };
    })
    .filter((column) => column.items.length > 0);
  /** One labelled product list inside a category column. */
  const renderGroup = (group: Group, g: number, category: string, col: number) => (
    <>
      {group.label && (
        <p className="px-1.5 pb-1 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
          {group.label} <span className="tabular-nums">· {group.count}</span>
        </p>
      )}
      <ul className="grid grid-cols-1 gap-y-0.5">
        {group.shown.map((product, i) => (
          <li
            key={product.slug}
            className="animate-[rise_0.5s_cubic-bezier(0.2,0.7,0.2,1)_both]"
            style={{ animationDelay: `${80 + ((col * 2 + g) * 3 + i) * 35}ms` }}
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
        {group.more > 0 && (
          <li>
            <Link
              href={`/products?category=${category}`}
              onClick={onNavigate}
              className="group flex h-full items-center gap-3 rounded-xl p-1.5 text-sm font-medium text-leaf transition-colors hover:bg-sand hover:text-forest"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-sand text-xs tabular-nums group-hover:bg-white">
                +{group.more}
              </span>
              {t.viewAll}
            </Link>
          </li>
        )}
      </ul>
    </>
  );

  const totalSpan = columns.reduce((sum, c) => sum + c.span, 0);
  const featured = products.find((p) => p.featured) ?? products[0];

  return (
    <div id="products-mega-menu" className="container-page mt-3 hidden lg:block">
      <div
        {...hoverProps}
        className="grid max-h-[calc(100dvh-6rem)] animate-[rise_0.5s_cubic-bezier(0.2,0.7,0.2,1)_both] grid-cols-[minmax(0,1fr)_15rem] gap-6 overflow-y-auto rounded-3xl bg-white p-6 text-forest shadow-2xl shadow-black/20 xl:grid-cols-[minmax(0,1fr)_18rem] xl:gap-8 xl:p-8">
        <div className="grid content-start gap-x-6 xl:gap-x-8" style={{ gridTemplateColumns: `repeat(${totalSpan}, minmax(0, 1fr))` }}>
          {columns.map(({ category, title, icon: Icon, items, groups, span }, col) => (
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
              <div className="mt-3 grid gap-x-4" style={{ gridTemplateColumns: `repeat(${span}, minmax(0, 1fr))` }}>
                {groups.map((group, g) => (
                  <div key={group.label ?? g} className="min-w-0">
                    {renderGroup(group, g, category, col)}
                    {group.below && <div className="mt-4">{renderGroup(group.below, g + 1, category, col)}</div>}
                  </div>
                ))}
              </div>
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
