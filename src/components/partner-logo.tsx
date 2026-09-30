import Image from "next/image";
import type { PartnerRow } from "@/lib/types";
import { cn } from "@/lib/utils";

const wordmarkStyles: Record<PartnerRow["style"], string> = {
  serif: "font-[family-name:var(--font-instrument-serif)] text-[1.55rem] tracking-tight",
  sans: "font-[family-name:var(--font-geist-sans)] text-sm font-bold tracking-[0.22em]",
  mono: "font-mono text-base font-medium tracking-tight lowercase",
  script: "font-[family-name:var(--font-instrument-serif)] text-[1.6rem] italic",
};

/** A partner's logo file, or a typographic wordmark when no file is available yet. */
export function PartnerMark({
  partner,
  className,
}: {
  partner: Pick<PartnerRow, "name" | "logo" | "style">;
  className?: string;
}) {
  if (partner.logo) {
    return (
      <span className={cn("relative block h-10 w-36", className)}>
        <Image src={partner.logo} alt={partner.name} fill sizes="144px" className="object-contain" />
      </span>
    );
  }
  return (
    <span dir="ltr" className={cn("whitespace-nowrap", wordmarkStyles[partner.style], className)}>
      {partner.name}
    </span>
  );
}
