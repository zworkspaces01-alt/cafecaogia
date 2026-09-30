import "server-only";

import { site } from "@/lib/site";

export type Inquiry = {
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  country: string;
  product_slug: string | null;
  quantity: string | null;
  incoterm: string | null;
  message: string;
  locale: string;
};

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY && process.env.INQUIRY_NOTIFY_TO && process.env.INQUIRY_FROM_EMAIL);
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * Emails the sales team about a new inquiry via Resend (https://resend.com), with Reply-To set
 * to the buyer so the team can answer straight from their inbox.
 * Returns true only when the email was accepted.
 */
export async function notifyInquiry(inquiry: Inquiry): Promise<boolean> {
  if (!isEmailConfigured()) return false;

  const rows: [string, string | null][] = [
    ["Name", inquiry.name],
    ["Company", inquiry.company],
    ["Email", inquiry.email],
    ["Phone / WhatsApp", inquiry.phone],
    ["Country", inquiry.country],
    ["Site language", inquiry.locale.toUpperCase()],
    ["Product", inquiry.product_slug ? `${site.url}/en/products/${inquiry.product_slug}` : null],
    ["Quantity", inquiry.quantity],
    ["Incoterm", inquiry.incoterm],
  ];
  const filled = rows.filter((row): row is [string, string] => Boolean(row[1]));

  const html = `
    <h2 style="font-family:sans-serif;color:#1d3518">New inquiry from ${escapeHtml(inquiry.name)}</h2>
    <table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">
      ${filled
        .map(
          ([label, value]) =>
            `<tr><td style="padding:4px 16px 4px 0;color:#6b7465">${label}</td><td style="padding:4px 0">${escapeHtml(value)}</td></tr>`,
        )
        .join("")}
    </table>
    <p style="font-family:sans-serif;font-size:14px;white-space:pre-wrap;border-left:3px solid #d5f26b;padding-left:12px">${escapeHtml(inquiry.message)}</p>
  `;
  const text = `${filled.map(([label, value]) => `${label}: ${value}`).join("\n")}\n\n${inquiry.message}`;

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.INQUIRY_FROM_EMAIL,
        to: process.env.INQUIRY_NOTIFY_TO!.split(",").map((s) => s.trim()),
        reply_to: inquiry.email,
        subject: `New inquiry: ${inquiry.product_slug ?? "general"} — ${inquiry.name} (${inquiry.country})`,
        html,
        text,
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error("Resend rejected inquiry email", res.status, await res.text());
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to send inquiry email", error);
    return false;
  }
}
