"use client";

import { useEffect } from "react";

/**
 * Runs inside the page builder's preview iframe (src/app/[lang]/preview/[ref]). Clicking a block selects
 * it in the editor instead of following links; the editor can ask for a block to be highlighted and
 * scrolled to. The scroll position survives the reload that follows every autosave.
 *
 * Messages (same origin only):
 *   preview → editor  { source: "cg-preview", type: "ready" } | { source: "cg-preview", type: "select", id }
 *   editor → preview  { source: "cg-editor", type: "focus", id, scroll }
 */
export function PreviewBridge() {
  useEffect(() => {
    const scrollKey = `cg-preview-scroll:${location.pathname}`;
    try {
      const saved = Number(sessionStorage.getItem(scrollKey));
      if (saved) window.scrollTo(0, saved);
    } catch {}
    const remember = () => {
      try {
        sessionStorage.setItem(scrollKey, String(window.scrollY));
      } catch {}
    };

    const toEditor = (message: Record<string, unknown>) => {
      if (window.parent !== window) window.parent.postMessage({ source: "cg-preview", ...message }, location.origin);
    };

    const onClick = (event: MouseEvent) => {
      const block = (event.target as Element | null)?.closest<HTMLElement>("[data-cms-block]");
      if (!block) return;
      // Inside the editor a click picks the block; links and buttons in the preview don't navigate.
      event.preventDefault();
      event.stopPropagation();
      highlight(block.dataset.cmsBlock!, false);
      toEditor({ type: "select", id: block.dataset.cmsBlock });
    };

    const highlight = (id: string, scroll: boolean) => {
      document.querySelectorAll("[data-cms-active]").forEach((el) => el.removeAttribute("data-cms-active"));
      const block = document.querySelector<HTMLElement>(`[data-cms-block="${CSS.escape(id)}"]`);
      if (!block) return;
      block.setAttribute("data-cms-active", "");
      if (scroll) block.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.data?.source !== "cg-editor") return;
      if (event.data.type === "focus" && typeof event.data.id === "string") highlight(event.data.id, Boolean(event.data.scroll));
    };

    document.addEventListener("click", onClick, true);
    window.addEventListener("message", onMessage);
    window.addEventListener("scroll", remember, { passive: true });
    toEditor({ type: "ready" });
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("message", onMessage);
      window.removeEventListener("scroll", remember);
    };
  }, []);

  return (
    <style>{`
      /* scroll-margin keeps a focused block clear of the fixed site header. */
      [data-cms-block] { position: relative; cursor: pointer; scroll-margin-top: 88px; }
      [data-cms-block]::after { content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 40; transition: box-shadow .15s; }
      [data-cms-block]:hover::after { box-shadow: inset 0 0 0 2px rgb(132 204 22 / .7); }
      [data-cms-block][data-cms-active]::after { box-shadow: inset 0 0 0 3px rgb(132 204 22); }
    `}</style>
  );
}
