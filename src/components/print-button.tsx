"use client";

import { Download } from "lucide-react";

export function PrintButton({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex flex-col items-start gap-1 print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="inline-flex h-11 items-center gap-2 rounded-full bg-forest px-6 text-sm font-medium text-white transition-colors hover:bg-leaf"
      >
        <Download className="size-4" /> {label}
      </button>
      <span className="text-xs text-muted">{hint}</span>
    </div>
  );
}
