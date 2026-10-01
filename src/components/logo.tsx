import Image from "next/image";
import Link from "@/components/link";
import { cn } from "@/lib/utils";

/**
 * The official Cao Gia logo: a "CG" emblem cradling a cashew, coffee beans and leaves, over the
 * "CAO GIA" lettering. Its browns vanish on the site's dark greens, so on dark backgrounds it sits on
 * white rather than being recoloured. The files are cut from public/brand/logo.png by
 * scripts/brand-assets.py.
 */
export const brandAssets = {
  /** Full stacked logo, 512 × 420 (schema.org, print, email). */
  logo: { src: "/brand/cao-gia-logo.png", width: 512, height: 420 },
  mark: { src: "/brand/cao-gia-mark.webp", width: 351, height: 256 },
  wordmark: { src: "/brand/cao-gia-wordmark.webp", width: 540, height: 96 },
};

/** The "CG" emblem alone. `onDark` puts it on a white tile (pass its size, radius and padding) so the browns stay visible. */
export function LogoMark({ className, onDark = false }: { className?: string; onDark?: boolean }) {
  const { src, width, height } = brandAssets.mark;
  const img = (
    <Image src={src} width={width} height={height} alt="" aria-hidden className={cn("object-contain", onDark ? "size-full" : className)} />
  );
  if (!onDark) return img;
  return <span className={cn("grid shrink-0 place-items-center bg-white", className)}>{img}</span>;
}

/** The "CAO GIA" lettering alone; size it by height. */
export function Wordmark({ className }: { className?: string }) {
  const { src, width, height } = brandAssets.wordmark;
  return <Image src={src} width={width} height={height} alt="Cao Gia" className={cn("w-auto", className)} />;
}

/**
 * Header and footer lockup: emblem and lettering side by side on a white pill, the height of the
 * header's other controls. Phones show the emblem only, to leave room in the header.
 */
export function Logo({ label, tagline }: { label: string; tagline?: string }) {
  const { src, width, height } = brandAssets.mark;
  const lockup = (
    <Link
      href="/"
      aria-label={label}
      dir="ltr"
      className="flex h-11 shrink-0 items-center gap-2 self-start rounded-full bg-white px-2 shadow-md shadow-black/10 sm:ps-2 sm:pe-4"
    >
      <Image src={src} width={width} height={height} alt="" aria-hidden priority className="h-8 w-auto" />
      <Wordmark className={cn("h-3.5", !tagline && "hidden sm:block")} />
    </Link>
  );
  if (!tagline) return lockup;
  return (
    <div className="flex flex-col gap-3">
      {lockup}
      <span dir="ltr" className="text-[10px] font-medium tracking-[0.32em] whitespace-nowrap text-white/55 uppercase">
        {tagline}
      </span>
    </div>
  );
}
