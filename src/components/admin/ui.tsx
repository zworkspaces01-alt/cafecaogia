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

export function Panel({ title, description, children }: { title: string; description?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-3xl bg-white p-6 md:p-8">
      <h2 className="text-lg font-semibold text-forest">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

/** Sticky save button with the result of the last save, for the settings-style forms. */
export function SaveBar({
  label,
  saving,
  onSave,
  status,
}: {
  label: string;
  saving: boolean;
  onSave: () => void;
  status: { tone: "ok" | "error"; text: string } | null;
}) {
  return (
    <div className="sticky bottom-4 flex flex-wrap items-center gap-3 rounded-3xl bg-forest p-4 shadow-xl">
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-lime px-6 text-sm font-medium text-forest hover:bg-lime-deep disabled:opacity-60"
      >
        {saving && <span className="size-4 animate-spin rounded-full border-2 border-forest border-t-transparent" />}
        {label}
      </button>
      {status && (
        <span role="status" className={cn("text-sm", status.tone === "ok" ? "text-lime" : "text-red-300")}>
          {status.text}
        </span>
      )}
    </div>
  );
}
