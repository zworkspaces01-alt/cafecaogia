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

export function MegaMenuPanel({
  products,
  t,
  categories,
  onNavigate,
}: {
  products: MenuProduct[];
  t: Dictionary["megaMenu"];
  categories: Dictionary["categories"];
  onNavigate: () => void;
}) {
  const columns: { category: Category; title: string; icon: typeof Bean }[] = [
    { category: "coffee", title: t.coffeeTitle, icon: Bean },
    { category: "cashew", title: t.cashewTitle, icon: Nut },
  ];
  const featured = products.find((p) => p.featured) ?? products[0];

  return (
    <div id="products-mega-menu" className="container-page mt-3 hidden lg:block">
      <div className="grid animate-[rise_0.5s_cubic-bezier(0.2,0.7,0.2,1)_both] grid-cols-[1fr_1fr_1.1fr] gap-8 rounded-3xl bg-white p-8 text-forest shadow-2xl shadow-black/20">
        {columns.map(({ category, title, icon: Icon }, col) => (
          <div key={category}>
            <Link
              href={`/products?category=${category}`}
              onClick={onNavigate}
              className="flex items-center gap-2 text-xs font-medium tracking-[0.18em] text-moss uppercase hover:text-forest"
            >
              <Icon className="size-4" />
              {title}
            </Link>
            <ul className="mt-4 space-y-1">
              {products
                .filter((p) => p.category === category)
                .map((product, i) => (
                  <li
                    key={product.slug}
                    className="animate-[rise_0.5s_cubic-bezier(0.2,0.7,0.2,1)_both]"
                    style={{ animationDelay: `${80 + (col * 4 + i) * 45}ms` }}
                  >
                    <Link
                      href={`/products/${product.slug}`}
                      onClick={onNavigate}
                      className="group flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-sand"
                    >
                      <span className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-mist">
                        <Image
                          src={product.image}
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium">{product.name}</span>
                        <span className="block truncate text-xs text-muted">{product.grade}</span>
                      </span>
                      <ArrowUpRight className="size-4 shrink-0 text-muted opacity-0 transition-all group-hover:opacity-100 rtl:-scale-x-100" />
                    </Link>
                  </li>
                ))}
            </ul>
          </div>
        ))}

        <div className="flex flex-col gap-3">
          {featured && (
            <Link
              href={`/products/${featured.slug}`}
              onClick={onNavigate}
              className="group relative isolate flex min-h-52 flex-1 flex-col justify-end overflow-hidden rounded-2xl p-5 text-white"
            >
              <Image
                src={featured.image}
                alt=""
                fill
                sizes="400px"
                className="-z-10 object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <span className="absolute inset-0 -z-10 bg-gradient-to-t from-ink/85 via-ink/30 to-transparent" />
              <span className="absolute start-4 top-4 rounded-full bg-lime px-3 py-1 text-xs font-medium text-forest">
                {t.featured}
              </span>
              <span className="text-xs text-white/70">{categories[featured.category]}</span>
              <span className="mt-1 text-xl font-medium">{featured.name}</span>
              <span className="mt-2 inline-flex items-center gap-1 text-sm text-lime">
                {t.viewSpecs} <ArrowUpRight className="size-4 rtl:-scale-x-100" />
              </span>
            </Link>
          )}
          <Link
            href="/contact"
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-2xl bg-sand p-4 transition-colors hover:bg-mist"
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-lime">
              <PackageCheck className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-medium">{t.samplesTitle}</span>
              <span className="block text-xs text-muted">{t.samplesBody}</span>
            </span>
            <span className="text-xs font-medium whitespace-nowrap text-leaf group-hover:text-forest">{t.samplesCta}</span>
          </Link>
          <Link
            href="/products"
            onClick={onNavigate}
            className="inline-flex items-center justify-center gap-1 rounded-full border border-forest/15 py-2.5 text-sm font-medium transition-colors hover:bg-forest hover:text-white"
          >
            {t.viewAll} <ArrowUpRight className="size-4 rtl:-scale-x-100" />
          </Link>
        </div>
      </div>
    </div>
  );
}
