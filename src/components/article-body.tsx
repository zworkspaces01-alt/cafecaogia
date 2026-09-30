import type { ReactNode } from "react";
import Link from "@/components/link";
import { ButtonLink } from "@/components/ui";

// Renders the light Markdown used for Insights articles straight to React elements (no raw HTML),
// so text typed in the CMS can never inject markup:
//   ## Heading / ### Subheading, "- " or "1. " lists, "> " callouts, blank line between paragraphs,
//   **bold**, *italic*, [link](/contact). A paragraph that is only a link becomes a button.

type Block =
  | { type: "h2" | "h3" | "p" | "quote"; lines: string[] }
  | { type: "ul" | "ol"; items: string[] };

function parse(source: string): Block[] {
  const blocks: Block[] = [];
  let current = null as Block | null;
  const flush = () => {
    if (current) blocks.push(current);
    current = null;
  };

  for (const raw of source.replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    let match: RegExpExecArray | null;
    if (!line) {
      flush();
    } else if ((match = /^(#{1,3})\s+(.+)$/.exec(line))) {
      flush();
      blocks.push({ type: match[1].length === 3 ? "h3" : "h2", lines: [match[2]] });
    } else if ((match = /^[-*•]\s+(.+)$/.exec(line)) || (match = /^\d+[.)]\s+(.+)$/.exec(line))) {
      const type = /^\d/.test(line) ? "ol" : "ul";
      if (current?.type !== type) {
        flush();
        current = { type, items: [] };
      }
      (current as { items: string[] }).items.push(match[1]);
    } else if ((match = /^>\s?(.*)$/.exec(line))) {
      if (current?.type !== "quote") {
        flush();
        current = { type: "quote", lines: [] };
      }
      current.lines.push(match[1]);
    } else {
      if (current?.type !== "p") {
        flush();
        current = { type: "p", lines: [] };
      }
      current.lines.push(line);
    }
  }
  flush();
  return blocks;
}

const INLINE = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)\s]+)\)/g;
const SINGLE_LINK = /^\[([^\]]+)\]\(([^)\s]+)\)$/;

function inline(text: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(INLINE)) {
    const [whole, bold, italic, label, href] = match;
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const key = match.index;
    if (bold) {
      nodes.push(
        <strong key={key} className="font-medium text-forest">
          {inline(bold)}
        </strong>,
      );
    } else if (italic) {
      nodes.push(<em key={key}>{inline(italic)}</em>);
    } else if (href.startsWith("/") && !href.startsWith("//")) {
      nodes.push(
        <Link key={key} href={href} className="text-forest underline decoration-lime-deep decoration-2 underline-offset-4 hover:text-leaf">
          {label}
        </Link>,
      );
    } else if (/^(https?:|mailto:)/i.test(href)) {
      nodes.push(
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-forest underline decoration-lime-deep decoration-2 underline-offset-4 hover:text-leaf"
        >
          {label}
        </a>,
      );
    } else {
      // Anything else (e.g. "javascript:") is shown as plain text.
      nodes.push(label);
    }
    last = match.index + whole.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function ArticleBody({ source }: { source: string }) {
  return (
    <div className="text-[17px] leading-[1.8] text-forest/80 [&>*:first-child]:mt-0">
      {parse(source).map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2 key={i} className="mt-12 text-2xl leading-snug font-medium tracking-tight text-forest md:text-[1.75rem]">
                {inline(block.lines[0])}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mt-8 text-xl leading-snug font-medium text-forest">
                {inline(block.lines[0])}
              </h3>
            );
          case "ul":
          case "ol": {
            const List = block.type;
            return (
              <List
                key={i}
                className={`mt-5 space-y-2.5 ps-6 marker:text-leaf ${block.type === "ul" ? "list-disc" : "list-decimal"}`}
              >
                {block.items.map((item, j) => (
                  <li key={j} className="ps-1">
                    {inline(item)}
                  </li>
                ))}
              </List>
            );
          }
          case "quote":
            return (
              <blockquote key={i} className="mt-8 rounded-2xl border-s-4 border-lime bg-white px-6 py-5 text-forest">
                {inline(block.lines.join(" "))}
              </blockquote>
            );
          default: {
            const text = block.lines.join(" ");
            const cta = SINGLE_LINK.exec(text);
            if (cta && cta[2].startsWith("/")) {
              return (
                <p key={i} className="mt-8">
                  <ButtonLink href={cta[2]} variant="dark" arrow>
                    {cta[1]}
                  </ButtonLink>
                </p>
              );
            }
            return (
              <p key={i} className="mt-5">
                {inline(text)}
              </p>
            );
          }
        }
      })}
    </div>
  );
}

/** Rough reading time at ~200 words a minute. */
export const readingMinutes = (source: string) => Math.max(1, Math.round(source.split(/\s+/).filter(Boolean).length / 200));
