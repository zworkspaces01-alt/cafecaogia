import Image from "next/image";
import Link from "@/components/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * `compact` lays the card out as a row (thumbnail beside the text) on phones, so long product
 * lists stay scannable; from the `sm` breakpoint up it is the regular stacked card.
 */
export function ProductCard({
  product,
  categoryLabel,
  compact = false,
  className,
}: {
  product: Product;
  categoryLabel: string;
  compact?: boolean;
  className?: string;
}) {
  return (
    <Link href={`/products/${product.slug}`} className={cn("group block", compact && "flex gap-4 sm:block", className)}>
      <div
        className={cn(
          "relative aspect-square overflow-hidden rounded-3xl bg-mist",
          compact && "w-28 shrink-0 rounded-2xl sm:w-auto sm:rounded-3xl",
        )}
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes={compact ? "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 112px" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 85vw"}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span
          className={cn(
            "absolute start-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-forest backdrop-blur",
            compact && "start-2 top-2 px-2 py-0.5 sm:start-4 sm:top-4 sm:px-3 sm:py-1",
          )}
        >
          {categoryLabel}
        </span>
        <span
          className={cn(
            "absolute end-4 bottom-4 grid size-11 translate-y-2 place-items-center rounded-full bg-lime text-forest opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100",
            compact && "hidden sm:grid",
          )}
        >
          <ArrowUpRight className="size-5 rtl:-scale-x-100" />
        </span>
      </div>
      <div className={cn("mt-4 px-1", compact && "mt-0 min-w-0 flex-1 px-0 py-1 sm:mt-4 sm:px-1 sm:py-0")}>
        <p className="text-xs tracking-wide text-moss uppercase">{product.grade}</p>
        <h3 className={cn("mt-1 text-lg font-medium text-forest", compact && "text-base leading-snug sm:text-lg")}>{product.name}</h3>
        <p className={cn("mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted", compact && "line-clamp-3 sm:line-clamp-2")}>
          {product.summary}
        </p>
      </div>
    </Link>
  );
}
