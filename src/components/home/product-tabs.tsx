"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Filter pills over one server-rendered product list. Each card is in the HTML once (so crawlers see
 * one heading and one link per product) and lists the tabs it belongs to; the pills only hide the
 * cards outside the active tab. Without JS the first tab's cards show.
 */
export function ProductTabs({
  label,
  tabs,
  items,
  listClassName,
  itemClassName,
}: {
  label: string;
  tabs: { key: string; label: string }[];
  items: { key: string; tabs: string[]; node: ReactNode }[];
  listClassName: string;
  itemClassName: string;
}) {
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
              aria-controls="featured-products"
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
      <ul id="featured-products" data-reveal-stagger className={cn("mt-8", listClassName)}>
        {items.map((item) => (
          <li key={item.key} hidden={!item.tabs.includes(active ?? "")} className={itemClassName}>
            {item.node}
          </li>
        ))}
      </ul>
    </>
  );
}
