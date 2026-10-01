"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { LOCALE_COOKIE, localeNames, locales, switchLocalePath, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const rememberLocale = (locale: Locale) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`;
};

/** Language dropdown in the site header, on every screen size. */
export function LanguageSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={`${label}: ${localeNames[locale].native}`}
        className="flex h-11 items-center gap-1.5 rounded-full border border-white/25 px-3 text-sm text-white transition-colors hover:bg-white/10"
      >
        <Globe className="size-4" />
        {localeNames[locale].short}
        <ChevronDown className={cn("hidden size-3.5 transition-transform sm:block lg:hidden xl:block", open && "rotate-180")} />
      </button>

      {open && (
        <ul className="absolute end-0 top-full mt-2 w-44 animate-rise overflow-hidden rounded-2xl bg-white p-1.5 shadow-xl shadow-black/15">
          {locales.map((l) => (
            <li key={l}>
              <NextLink
                href={switchLocalePath(pathname, l)}
                hrefLang={l}
                lang={l}
                aria-current={l === locale ? "true" : undefined}
                onClick={() => {
                  rememberLocale(l);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-colors",
                  l === locale ? "bg-sand font-medium text-forest" : "text-forest/80 hover:bg-sand",
                )}
              >
                <span>{localeNames[l].native}</span>
                {l === locale ? <Check className="size-4 text-leaf" /> : <span className="text-xs text-muted">{localeNames[l].short}</span>}
              </NextLink>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

