import Link from "@/components/link";
import { cn } from "@/lib/utils";

/**
 * Cao Gia mark: a cashew kernel shaped as the "C" of Cao, cradling a coffee bean — both
 * products and the initial in one symbol. Drawn on a 64-unit grid; the bean's crease uses
 * the cashew color, so the mark needs no masks and works on any background.
 */
export const logoPaths = {
  cashew:
    "M50.6 18.2A23 23 0 1 0 49.3 49.3A5.5 5.5 0 0 0 43.8 39.8A11 11 0 1 1 44.4 24.9A4.56 4.56 0 0 0 50.6 18.2Z",
  bean: { cx: 37, cy: 32, rx: 5.8, ry: 8, rotate: 28 },
  crease: "M.9 -7.6C-2.6 -3.2 2.6 3.2 -.9 7.6",
};

export const logoColors = {
  onDark: { cashew: "#d5f26b", bean: "#f3ead8" },
  onLight: { cashew: "#2e5a23", bean: "#6a4428" },
};

export function LogoMark({
  className,
  tone = "onDark",
}: {
  className?: string;
  tone?: keyof typeof logoColors;
}) {
  const { cashew, bean } = logoColors[tone];
  const b = logoPaths.bean;
  return (
    <svg viewBox="0 0 64 64" className={cn("size-10 shrink-0", className)} aria-hidden>
      <path d={logoPaths.cashew} fill={cashew} />
      <g transform={`translate(${b.cx} ${b.cy}) rotate(${b.rotate})`}>
        <ellipse rx={b.rx} ry={b.ry} fill={bean} />
        <path d={logoPaths.crease} fill="none" stroke={cashew} strokeWidth="1.9" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Wordmark: sans "Cao" + serif italic "Gia", echoing the site's two-voice headings. Always Latin. */
export function Wordmark({ className, tone = "onDark" }: { className?: string; tone?: keyof typeof logoColors }) {
  return (
    <span
      dir="ltr"
      className={cn(
        "flex items-baseline text-[1.35rem] leading-none tracking-tight",
        tone === "onDark" ? "text-white" : "text-ink",
        className,
      )}
    >
      <span className="font-[family-name:var(--font-geist-sans)] font-semibold">Cao</span>
      <span className="ms-[0.12em] font-[family-name:var(--font-instrument-serif)] text-[1.18em] italic">Gia</span>
    </span>
  );
}

export function Logo({
  label,
  tone = "onDark",
  tagline,
}: {
  label: string;
  tone?: keyof typeof logoColors;
  /** Small caps line under the wordmark (footer lockup). */
  tagline?: string;
}) {
  return (
    <Link href="/" className="flex items-center gap-2.5" aria-label={label}>
      <LogoMark tone={tone} className={tagline ? "size-12" : undefined} />
      <span className="flex flex-col">
        <Wordmark tone={tone} className={tagline ? "text-2xl" : undefined} />
        {tagline && (
          <span
            dir="ltr"
            className={cn(
              "mt-1.5 text-[8.5px] font-medium tracking-[0.32em] uppercase whitespace-nowrap",
              tone === "onDark" ? "text-white/55" : "text-muted",
            )}
          >
            {tagline}
          </span>
        )}
      </span>
    </Link>
  );
}
