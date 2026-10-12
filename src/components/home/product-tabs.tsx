"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Filter pills over server-rendered product lists: every list stays in the HTML (for crawlers and
 * no-JS visitors the first one shows), the pills only switch which one is visible.
 */
export function ProductTabs({ label, tabs }: { label: string; tabs: { key: string; label: string; panel: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <>
      {tabs.length > 1 && (
        <div data-reveal role="group" aria-label={label} className="flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              aria-pressed={tab.key === active}
              aria-controls={`products-${tab.key}`}
              onClick={() => setActive(tab.key)}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-5 text-sm transition-colors",
                tab.key === active ? "bg-forest text-white" : "bg-sand text-forest hover:bg-mist",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}
      {tabs.map((tab) => (
        <div key={tab.key} id={`products-${tab.key}`} hidden={tab.key !== active} className="mt-8">
          {tab.panel}
        </div>
      ))}
    </>
  );
}
