// Sends email through the Gmail API as the Google account that granted the refresh token
// (https://developers.google.com/gmail/api/guides/sending). HTTPS only, so it behaves the same on
// Cloudflare Workers and in Node. Get the refresh token with `npm run gmail:auth`.
// No "server-only" import so that script can reuse it; credentials still come only from the environment.

export type GmailCredentials = { clientId: string; clientSecret: string; refreshToken: string; sender: string };
export type GmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Extra plain-ASCII headers, e.g. Auto-Submitted. */
  headers?: Record<string, string>;
};

export function gmailCredentials(): GmailCredentials | null {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim() ?? "";
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim() ?? "";
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim() ?? "";
  const sender = process.env.GMAIL_SENDER?.trim() ?? "";
  return clientId && clientSecret && refreshToken && sender ? { clientId, clientSecret, refreshToken, sender } : null;
}

export const isGmailConfigured = () => gmailCredentials() !== null;

// Access tokens last an hour; reuse one while the isolate lives instead of refreshing per email.
let cached: { refreshToken: string; token: string; expiresAt: number } | null = null;

async function accessToken(c: GmailCredentials): Promise<string> {
  if (cached?.refreshToken === c.refreshToken && cached.expiresAt > Date.now() + 60_000) return cached.token;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: c.clientId,
      client_secret: c.clientSecret,
      refresh_token: c.refreshToken,
      grant_type: "refresh_token",
    }),
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  });
  const json = (await res.json().catch(() => ({}))) as {
    access_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !json.access_token) {
    // invalid_grant: the refresh token was revoked or expired — run `npm run gmail:auth` again.
    throw new Error(`Google token refresh failed: ${json.error ?? `HTTP ${res.status}`} ${json.error_description ?? ""}`.trim());
  }
  cached = { refreshToken: c.refreshToken, token: json.access_token, expiresAt: Date.now() + (json.expires_in ?? 3600) * 1000 };
  return json.access_token;
}

// Stricter than the form's check: anything that could smuggle a second recipient or header is refused.
const ADDRESS_RE = /^[^\s@<>,;:"()[\]\\]+@[^\s@<>,;:"()[\]\\]+\.[^\s@<>,;:"()[\]\\]+$/;

const utf8 = (s: string) => new TextEncoder().encode(s);
const base64 = (bytes: Uint8Array) => btoa(Array.from(bytes, (b) => String.fromCharCode(b)).join(""));
const wrap76 = (s: string) => s.replace(/.{1,76}/g, "$&\r\n");
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ");

/** RFC 2047 encoded words, split on character boundaries so each stays under 75 characters. */
function encodeHeader(value: string) {
  if (/^[\x20-\x7e]*$/.test(value)) return value;
  const words: string[] = [];
  let word = "";
  for (const ch of value) {
    if (word && utf8(word + ch).length > 39) {
      words.push(word);
      word = "";
    }
    word += ch;
  }
  if (word) words.push(word);
  return words.map((w) => `=?UTF-8?B?${base64(utf8(w))}?=`).join("\r\n ");
}

/** "Cao Gia <sales@example.com>" → a From header with the display name encoded or quoted. */
function fromHeader(sender: string) {
  const match = /^(.*)<([^>]+)>\s*$/.exec(sender);
  if (!match) return sender;
  const name = oneLine(match[1].trim());
  if (!name) return `<${match[2]}>`;
  const display = /^[\x20-\x7e]*$/.test(name) ? `"${name.replace(/["\\]/g, "\\$&")}"` : encodeHeader(name);
  return `${display} <${match[2].trim()}>`;
}

function mime(sender: string, m: GmailMessage) {
  const boundary = `=_caogia_${crypto.randomUUID()}`;
  const part = (type: string, body: string) =>
    [`--${boundary}`, `Content-Type: ${type}; charset=UTF-8`, "Content-Transfer-Encoding: base64", "", wrap76(base64(utf8(body)))];
  return [
    `From: ${fromHeader(sender)}`,
    `To: ${m.to}`,
    `Subject: ${encodeHeader(oneLine(m.subject))}`,
    "MIME-Version: 1.0",
    ...Object.entries(m.headers ?? {}).map(([k, v]) => `${k}: ${oneLine(v)}`),
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    ...part("text/plain", m.text),
    ...part("text/html", m.html),
    `--${boundary}--`,
    "",
  ].join("\r\n");
}

/** Returns true only when Gmail accepted the message. */
export async function sendGmail(message: GmailMessage, credentials = gmailCredentials()): Promise<boolean> {
  if (!credentials) return false;
  if (!ADDRESS_RE.test(message.to)) {
    console.warn("[gmail] refusing to send to a malformed address");
    return false;
  }
  try {
    const raw = base64(utf8(mime(credentials.sender, message))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${await accessToken(credentials)}`, "Content-Type": "application/json" },
      body: JSON.stringify({ raw }),
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error("[gmail] send rejected", res.status, (await res.text()).slice(0, 500));
      return false;
    }
    return true;
  } catch (error) {
    console.error("[gmail] send failed", error);
    return false;
  }
}
