import "server-only";

// Header, footer and floating contact buttons from the page builder's "layout" page. The site layout
// uses the published version; the layout preview uses the draft. Anything left empty falls back to
// the dictionary, so the site looks as before until these blocks are edited.

import type { FooterText } from "@/components/site-footer";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/en";
import { resolveContent } from "@/lib/blocks/resolve";
import type { Block } from "@/lib/blocks/types";

type HeaderContent = { nav?: Partial<Dictionary["nav"]>; requestQuote?: string };
type DockContent = { chat?: string; requestQuote?: string; nudge?: string; greeting?: string; online?: string };

/** Non-empty values of `override` over `base`. */
const merge = <T extends object>(base: T, override?: Partial<T>): T => ({
  ...base,
  ...Object.fromEntries(Object.entries(override ?? {}).filter(([, v]) => typeof v === "string" && v.trim())),
});

export type Chrome = {
  nav: Dictionary["nav"];
  common: Dictionary["common"];
  footer?: FooterText;
  dock: { requestQuote: string; chat: string; greeting: string; nudge: string; online: string; dismiss: string };
  /** Block ids, so the preview can make each part clickable. */
  ids: { header?: string; footer?: string; dock?: string };
};

export function chromeFromBlocks(blocks: Block[], locale: Locale, dict: Dictionary): Chrome {
  const find = (type: string) => blocks.find((block) => block.type === type && !block.hidden);
  const header = find("siteHeader");
  const footer = find("siteFooter");
  const dock = find("contactDock");

  const h = header ? resolveContent<HeaderContent>(header, locale) : {};
  const d = dock ? resolveContent<DockContent>(dock, locale) : {};
  const common = merge(dict.common, {
    requestQuote: h.requestQuote,
    chatWhatsApp: d.chat,
    whatsappGreeting: d.greeting,
    whatsappNudge: d.nudge,
    online: d.online,
  });

  return {
    nav: merge(dict.nav, h.nav),
    common,
    footer: footer ? resolveContent<FooterText>(footer, locale) : undefined,
    dock: {
      requestQuote: d.requestQuote?.trim() || common.requestQuote,
      chat: common.chatWhatsApp,
      greeting: common.whatsappGreeting,
      nudge: common.whatsappNudge,
      online: common.online,
      dismiss: common.dismiss,
    },
    ids: { header: header?.id, footer: footer?.id, dock: dock?.id },
  };
}
