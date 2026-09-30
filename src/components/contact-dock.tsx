"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { WhatsAppIcon } from "@/components/icons/whatsapp";
import Link from "@/components/link";
import { cn } from "@/lib/utils";

const NUDGE_KEY = "cg-whatsapp-nudge-dismissed";
const NUDGE_DELAY_MS = 4000;

type Labels = {
  requestQuote: string;
  chat: string;
  greeting: string;
  nudge: string;
  online: string;
  dismiss: string;
};

function readDismissed() {
  try {
    return sessionStorage.getItem(NUDGE_KEY) === "1";
  } catch {
    return false;
  }
}

/** Pulsing rings behind a round WhatsApp button. */
function Pulse() {
  return (
    <>
      <span aria-hidden className="absolute inset-0 animate-wa-ping rounded-full bg-[#25d366]" />
      <span aria-hidden className="absolute inset-0 animate-wa-ping rounded-full bg-[#25d366] [animation-delay:1.3s]" />
    </>
  );
}

/**
 * Always-reachable contact: a floating WhatsApp button on desktop and a bottom action bar on
 * mobile (where the header's quote button is hidden). Appears once the visitor scrolls past the
 * hero; the button pulses, wiggles now and then, and offers a one-time greeting bubble.
 */
export function ContactDock({
  labels,
  whatsapp,
  contactName,
}: {
  labels: Labels;
  whatsapp: string;
  /** Shown in the greeting bubble, e.g. the export contact's name. */
  contactName: string;
}) {
  const whatsappHref = `https://wa.me/${whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(labels.greeting)}`;
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [nudge, setNudge] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 480);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Show the greeting a few seconds after the button first appears, unless dismissed this session.
  useEffect(() => {
    if (!visible || readDismissed()) return;
    const timer = window.setTimeout(() => setNudge(true), NUDGE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [visible]);

  const dismissNudge = () => {
    setNudge(false);
    try {
      sessionStorage.setItem(NUDGE_KEY, "1");
    } catch {
      // Storage can be unavailable (private mode); the bubble just may reappear next page.
    }
  };

  const onContactPage = /^\/[a-z]{2}\/contact/.test(pathname);
  const showNudge = nudge && visible;

  return (
    <>
      <div
        className={cn(
          "fixed end-6 bottom-6 z-40 hidden flex-col print:!hidden items-end gap-3 transition-all duration-500 lg:flex",
          visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0",
        )}
      >
        {showNudge && (
          <div
            role="status"
            className="relative w-72 origin-bottom-right animate-[pop_0.6s_cubic-bezier(0.3,1.4,0.5,1)_both] rounded-2xl bg-white p-4 pe-9 text-sm shadow-xl shadow-black/15 rtl:origin-bottom-left"
          >
            <button
              type="button"
              onClick={dismissNudge}
              aria-label={labels.dismiss}
              className="absolute end-2 top-2 grid size-7 place-items-center rounded-full text-muted hover:bg-sand hover:text-forest"
            >
              <X className="size-4" />
            </button>
            <div className="flex items-center gap-2">
              <span className="relative flex size-2.5">
                <span className="absolute inset-0 animate-ping rounded-full bg-[#25d366] opacity-75" />
                <span className="relative size-2.5 rounded-full bg-[#25d366]" />
              </span>
              <span className="text-xs font-medium text-forest">
                {contactName} · {labels.online}
              </span>
            </div>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              onClick={dismissNudge}
              className="mt-2 block leading-snug text-forest/80 hover:text-forest"
            >
              {labels.nudge}
            </a>
            {/* speech-bubble tail */}
            <span aria-hidden className="absolute end-6 -bottom-1.5 size-3 rotate-45 bg-white" />
          </div>
        )}

        <a
          href={whatsappHref}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={labels.chat}
          onClick={dismissNudge}
          className="group relative flex items-center gap-0 rounded-full bg-[#25d366] p-3.5 text-white shadow-lg shadow-[#25d366]/40 transition-all duration-300 hover:scale-105 hover:gap-2 hover:pe-5"
        >
          <Pulse />
          <WhatsAppIcon className="relative size-7 animate-wa-wiggle group-hover:animate-none" />
          <span className="relative max-w-0 overflow-hidden text-sm font-medium whitespace-nowrap transition-all duration-300 group-hover:max-w-40">
            {labels.chat}
          </span>
        </a>
      </div>

      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t print:hidden border-white/10 bg-forest/95 px-4 py-3 backdrop-blur-md transition-transform duration-500 lg:hidden",
          visible ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="flex items-center gap-3">
          {!onContactPage && (
            <Link
              href="/contact"
              className="flex h-12 flex-1 items-center justify-center rounded-full bg-lime text-sm font-medium text-forest"
            >
              {labels.requestQuote}
            </Link>
          )}
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={labels.chat}
            className={cn(
              "relative flex h-12 items-center justify-center gap-2 rounded-full bg-[#25d366] text-sm font-medium text-white",
              onContactPage ? "flex-1" : "w-12",
            )}
          >
            {!onContactPage && <Pulse />}
            <WhatsAppIcon className="relative size-6 animate-wa-wiggle" />
            {onContactPage && <span className="relative">{labels.chat}</span>}
          </a>
        </div>
      </div>
    </>
  );
}
