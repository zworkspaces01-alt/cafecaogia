import Image from "next/image";
import Link from "@/components/link";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export function ProductCard({
  product,
  categoryLabel,
  className,
}: {
  product: Product;
  categoryLabel: string;
  className?: string;
}) {
  return (
    <Link href={`/products/${product.slug}`} className={cn("group block", className)}>
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-mist">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 85vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute start-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-forest backdrop-blur">
          {categoryLabel}
        </span>
        <span className="absolute end-4 bottom-4 grid size-11 translate-y-2 place-items-center rounded-full bg-lime text-forest opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="size-5 rtl:-scale-x-100" />
        </span>
      </div>
      <div className="mt-4 px-1">
        <p className="text-xs tracking-wide text-moss uppercase">{product.grade}</p>
        <h3 className="mt-1 text-lg font-medium text-forest">{product.name}</h3>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-muted">{product.summary}</p>
      </div>
    </Link>
  );
}
