import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * A certification's logo from the CMS, or — until one is uploaded — a neutral seal with the
 * certification's name. The seal is deliberately generic: it never imitates an issuer's logo.
 */
export function CertBadge({ name, logo, className }: { name: string; logo: string | null; className?: string }) {
  if (logo) {
    return (
      <span className={cn("relative block size-20 overflow-hidden rounded-2xl bg-white", className)}>
        <Image src={logo} alt={name} fill sizes="80px" className="object-contain p-2" />
      </span>
    );
  }

  // Up to two lines, sized to fit the 46-unit inner disc (Geist averages ~0.6em per character).
  const words = name.trim().split(/\s+/);
  const lines = words.length > 1 && name.length > 8 ? [words[0], words.slice(1).join(" ")] : [name];
  const longest = Math.max(...lines.map((l) => l.length));
  const fontSize = Math.min(13, 44 / (longest * 0.6));
  const lineHeight = fontSize * 1.15;
  const firstBaseline = 45 - ((lines.length - 1) * lineHeight) / 2;

  return (
    <svg viewBox="0 0 80 80" className={cn("size-20", className)} aria-hidden>
      <circle cx="40" cy="40" r="38" fill="#f3ead8" />
      <circle cx="40" cy="40" r="33" fill="none" stroke="#2e5a23" strokeWidth="1.5" strokeDasharray="2 2.5" />
      <circle cx="40" cy="40" r="27" fill="#2e5a23" />
      {[0, 60, 120, 180, 240, 300].map((deg) => (
        <circle key={deg} cx={40 + 30.5 * Math.cos((deg * Math.PI) / 180)} cy={40 + 30.5 * Math.sin((deg * Math.PI) / 180)} r="1.2" fill="#b9dc45" />
      ))}
      <path d="M31 30.5l2.4 2.4 5-5" fill="none" stroke="#d5f26b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" transform="translate(4.6 -6)" />
      <text
        textAnchor="middle"
        fill="#fff"
        fontSize={fontSize}
        fontWeight="600"
        fontFamily="var(--font-geist-sans), sans-serif"
      >
        {lines.map((line, i) => (
          <tspan key={i} x="40" y={firstBaseline + i * lineHeight}>
            {line}
          </tspan>
        ))}
      </text>
    </svg>
  );
}
