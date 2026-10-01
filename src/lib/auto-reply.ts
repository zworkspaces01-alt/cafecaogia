import "server-only";

import { defaultSettings } from "@/data/samples";
import { isLocale } from "@/i18n/config";
import { loadDictionary } from "@/i18n/dictionaries";
import { format } from "@/i18n/format";
import { getSettings, whatsappLink } from "@/lib/content";
import { sendGmail } from "@/lib/gmail";
import type { Inquiry } from "@/lib/notify";
import { getProductSummary } from "@/lib/products";
import { site } from "@/lib/site";

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Thanks the buyer from the Gmail sender, in the language they used on the site, and promises a reply.
 * It never repeats their message: anyone can type any address into the form, so the reply must not
 * become a way to mail arbitrary text to strangers.
 * Returns true only when Gmail accepted it.
 */
export async function sendInquiryAutoReply(inquiry: Inquiry): Promise<boolean> {
  const locale = isLocale(inquiry.locale) ? inquiry.locale : "en";
  const [{ autoReply: t }, settings, product] = await Promise.all([
    loadDictionary(locale),
    getSettings().catch(() => defaultSettings),
    inquiry.product_slug ? getProductSummary(inquiry.product_slug, locale).catch(() => null) : null,
  ]);

  const rtl = locale === "ar";
  const side = rtl ? "right" : "left";
  const host = new URL(site.url).host;
  const { whatsapp } = settings.contact;
  const { address } = settings.contact;
  const footerLine = [settings.company.legalName, [address.street, address.locality, address.country].filter(Boolean).join(", ")]
    .filter(Boolean)
    .join(" · ");

  // Dictionary strings are ours; escape them anyway, then drop in values that are already safe HTML.
  const html = (template: string, values: Record<string, string>) => format(escapeHtml(template), values);
  const name = escapeHtml(inquiry.name);
  const phone = whatsapp
    ? `<a href="${escapeHtml(whatsappLink(whatsapp))}" dir="ltr" style="color:#2e5a23;white-space:nowrap">${escapeHtml(whatsapp)}</a>`
    : "";
  const siteLink = `<a href="${escapeHtml(site.url)}" style="color:#6b7465">${escapeHtml(host)}</a>`;
  const p = (content: string, extra = "") => `<p style="margin:0 0 16px;${extra}">${content}</p>`;

  const body = `<!doctype html>
<html lang="${locale}" dir="${rtl ? "rtl" : "ltr"}">
<body style="margin:0;padding:0;background:#f5f1e8">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f1e8;padding:24px 12px">
<tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;color:#1d3518;text-align:${side}">
<tr><td style="padding:24px 28px 8px;text-align:${side}">
<img src="${escapeHtml(`${site.url}/brand/cao-gia-logo.png`)}" width="110" height="90" alt="Cao Gia" style="display:inline-block;border:0;font-size:22px;font-weight:bold;color:#4a2410">
</td></tr>
<tr><td style="padding:28px 28px 12px;font-size:15px;line-height:1.6">
${p(html(t.greeting, { name }))}
${p(escapeHtml(t.body))}
${product ? p(html(t.product, { product: `<strong>${escapeHtml(product.name)}</strong>` }), `border-${side}:3px solid #d5f26b;padding-${side}:12px`) : ""}
${whatsapp ? p(html(t.urgent, { whatsapp: phone })) : ""}
${p(`${escapeHtml(t.signoff)}<br><strong>${escapeHtml(t.team)}</strong>`)}
</td></tr>
<tr><td style="padding:16px 28px 24px;border-top:1px solid #ece6d8;font-size:12px;line-height:1.5;color:#6b7465">
${footerLine ? `${escapeHtml(footerLine)}<br>` : ""}${html(t.footer, { site: siteLink })}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const text = [
    format(t.greeting, { name: inquiry.name }),
    t.body,
    product ? format(t.product, { product: product.name }) : "",
    whatsapp ? format(t.urgent, { whatsapp }) : "",
    `${t.signoff}\n${t.team}`,
    "--",
    [footerLine, format(t.footer, { site: site.url })].filter(Boolean).join("\n"),
  ]
    .filter(Boolean)
    .join("\n\n");

  return sendGmail({
    to: inquiry.email,
    subject: t.subject,
    html: body,
    text,
    // RFC 3834: marks it as automatic so the buyer's own auto-responders don't answer it.
    headers: { "Auto-Submitted": "auto-replied", "X-Auto-Response-Suppress": "All" },
  });
}
