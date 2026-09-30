import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { readingMinutes } from "@/components/article-body";
import Link from "@/components/link";
import { format, formatDate } from "@/i18n/format";
import type { Post } from "@/lib/content";
import { photos } from "@/lib/site";
import { cn } from "@/lib/utils";

export function PostCard({
  post,
  categoryLabel,
  minRead,
  localeTag,
  featured = false,
  className,
}: {
  post: Post;
  categoryLabel: string;
  /** "{n} min read" */
  minRead: string;
  localeTag: string;
  /** Wide layout for the newest article at the top of the list. */
  featured?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={`/insights/${post.slug}`}
      className={cn("group block", featured && "grid gap-6 md:grid-cols-[1.25fr_1fr] md:items-center md:gap-10", className)}
    >
      <div className={cn("relative overflow-hidden rounded-3xl bg-mist", featured ? "aspect-[16/10]" : "aspect-[3/2]")}>
        <Image
          src={post.cover ?? photos.hillside}
          alt=""
          fill
          sizes={featured ? "(min-width: 768px) 55vw, 100vw" : "(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span className="absolute start-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-forest backdrop-blur">
          {categoryLabel}
        </span>
      </div>
      <div className={cn(featured ? "md:py-4" : "mt-4 px-1")}>
        <p className="text-xs text-muted">
          <time dateTime={post.published_at}>{formatDate(post.published_at, localeTag)}</time>
          <span aria-hidden> · </span>
          {format(minRead, { n: readingMinutes(post.body) })}
        </p>
        <h3
          className={cn(
            "mt-2 font-medium tracking-tight text-balance text-forest transition-colors group-hover:text-leaf",
            featured ? "text-2xl leading-tight md:text-4xl" : "text-lg leading-snug",
          )}
        >
          {post.title}
        </h3>
        <p className={cn("mt-2 leading-relaxed text-muted", featured ? "md:text-lg" : "line-clamp-2 text-sm")}>{post.excerpt}</p>
        {featured && (
          <span className="mt-6 inline-flex size-11 items-center justify-center rounded-full bg-lime text-forest transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
            <ArrowUpRight className="size-5 rtl:-scale-x-100" />
          </span>
        )}
      </div>
    </Link>
  );
}
