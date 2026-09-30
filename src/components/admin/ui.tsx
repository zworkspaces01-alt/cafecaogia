import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-xl border border-mist bg-white px-3.5 py-2.5 text-sm text-forest outline-none transition placeholder:text-muted/60 focus:border-leaf focus:ring-2 focus:ring-lime/60";

export function Badge({ tone, children }: { tone: "sample" | "hidden" | "ok" | "info"; children: React.ReactNode }) {
  const tones = {
    sample: "bg-amber-100 text-amber-900",
    hidden: "bg-mist text-muted",
    ok: "bg-lime/60 text-forest",
    info: "bg-sky-100 text-sky-900",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium", tones[tone])}>{children}</span>
  );
}

export function PageTitle({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-forest">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}
