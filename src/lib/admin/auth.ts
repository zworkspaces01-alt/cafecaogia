import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { first } from "@/lib/db";

// CMS sessions are a signed cookie "<email b64url>.<expiry>.<HMAC-SHA256>", keyed by the AUTH_SECRET
// secret. Every admin request also re-checks admin_users, so deleting an account ends its sessions.

const COOKIE = "cg_admin";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

const encoder = new TextEncoder();
const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
const fromBase64Url = (text: string) =>
  Uint8Array.from(atob(text.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));

/** True when AUTH_SECRET is set (at least 32 characters). */
export function isAuthConfigured() {
  return (process.env.AUTH_SECRET?.length ?? 0) >= 32;
}

async function signingKey() {
  return crypto.subtle.importKey("raw", encoder.encode(process.env.AUTH_SECRET), { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

export async function startSession(email: string) {
  const payload = `${toBase64Url(encoder.encode(email.toLowerCase()))}.${Math.floor(Date.now() / 1000) + MAX_AGE}`;
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await signingKey(), encoder.encode(payload)));
  (await cookies()).set(COOKIE, `${payload}.${toBase64Url(signature)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function endSession() {
  (await cookies()).delete(COOKIE);
}

/** Email of the signed-in editor, or null when the cookie is missing, expired or forged. */
async function sessionEmail(): Promise<string | null> {
  if (!isAuthConfigured()) return null;
  const value = (await cookies()).get(COOKIE)?.value;
  const [email, expires, signature] = value?.split(".") ?? [];
  if (!email || !expires || !signature || Number(expires) < Date.now() / 1000) return null;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await signingKey(),
      fromBase64Url(signature),
      encoder.encode(`${email}.${expires}`),
    );
    return valid ? new TextDecoder().decode(fromBase64Url(email)) : null;
  } catch {
    return null;
  }
}

/** Returns the signed-in admin, or redirects to the login page. */
export async function requireAdmin(): Promise<{ user: { email: string } }> {
  if (!isAuthConfigured()) redirect("/admin/login?error=config");
  const email = await sessionEmail();
  if (!email) redirect("/admin/login");
  const admin = await first<{ email: string }>("select email from admin_users where email = ?", email);
  if (!admin) redirect("/admin/login?error=forbidden");
  return { user: { email: admin.email } };
}
