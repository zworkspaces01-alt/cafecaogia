import Link from "@/components/link";
import { ArrowUpRight } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "lime" | "outline-light" | "outline-dark" | "dark" | "white";

const variants: Record<ButtonVariant, string> = {
  lime: "bg-lime text-forest hover:bg-lime-deep",
  "outline-light": "border border-white/70 text-white hover:bg-white hover:text-forest",
  "outline-dark": "border border-forest/20 text-forest hover:border-forest hover:bg-forest hover:text-white",
  dark: "bg-forest text-white hover:bg-leaf",
  white: "bg-white text-forest hover:bg-lime",
};

export function ButtonLink({
  variant = "lime",
  arrow = false,
  className,
  children,
  ...props
}: ComponentProps<typeof Link> & { variant?: ButtonVariant; arrow?: boolean }) {
  return (
    <Link
      className={cn(
        "group inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
      {arrow && (
        <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
      )}
    </Link>
  );
}

export function Eyebrow({ children, tone = "dark" }: { children: ReactNode; tone?: "dark" | "light" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
        tone === "dark" ? "border-mist bg-white text-muted" : "border-white/25 bg-white/10 text-white/85",
      )}
    >
      <span className="size-1.5 rounded-full bg-leaf" />
      {children}
    </span>
  );
}

/** Two-line heading: sans first line, italic serif second line — the site's signature. */
export function SectionHeading({
  eyebrow,
  title,
  accent,
  description,
  tone = "dark",
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  accent?: ReactNode;
  description?: ReactNode;
  tone?: "dark" | "light";
  className?: string;
}) {
  return (
    <div className={cn("grid gap-6 md:items-end", description && "md:grid-cols-[1.2fr_1fr]", className)}>
      <div>
        {eyebrow && (
          <div data-reveal>
            <Eyebrow tone={tone}>{eyebrow}</Eyebrow>
          </div>
        )}
        {/* Each line rises out of its own mask when the heading scrolls into view. */}
        <h2
          data-heading
          className={cn(
            "mt-5 text-4xl leading-[1.1] font-medium tracking-tight text-balance md:text-5xl",
            tone === "dark" ? "text-forest" : "text-white",
          )}
        >
          <span className="block overflow-hidden pb-[0.1em]">
            <span data-heading-line className="block">
              {title}
            </span>
          </span>
          {accent && (
            <span className="block overflow-hidden pb-[0.1em]">
              <em data-heading-line className="block font-serif text-[1.08em] font-normal">
                {accent}
              </em>
            </span>
          )}
        </h2>
      </div>
      {description && (
        <p
          data-reveal
          className={cn(
            "max-w-md text-[15px] leading-relaxed md:justify-self-end",
            tone === "dark" ? "text-muted" : "text-white/75",
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
