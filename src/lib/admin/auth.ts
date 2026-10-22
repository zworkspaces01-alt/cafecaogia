import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { first } from "@/lib/db";
import { can, isRole, permissionsOf, type Permission, type Role } from "@/lib/admin/roles";

// CMS sessions are a signed cookie "<email b64url>.<expiry>.<HMAC-SHA256>", keyed by the AUTH_SECRET
// secret. Every admin request also re-checks admin_users, so deleting or locking an account ends its
// sessions, and so does a later `sessions_from` (password, role or access changed).

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

/** Email and start time (unix seconds) of the session in the cookie, or null when missing, expired or forged. */
async function readSession(): Promise<{ email: string; issued: number } | null> {
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
    return valid ? { email: new TextDecoder().decode(fromBase64Url(email)), issued: Number(expires) - MAX_AGE } : null;
  } catch {
    return null;
  }
}

export type AdminUser = { email: string; name: string; role: Role; permissions: Permission[] };

type Account = { email: string; name: string; role: string; disabled: boolean; sessions_from: string | null };

/** The account behind the session, if it still exists, isn't locked and the session isn't revoked. */
async function sessionAccount(): Promise<AdminUser | "forbidden" | null> {
  const session = await readSession();
  if (!session) return null;
  const account = await first<Account>("select email, name, role, disabled, sessions_from from admin_users where email = ?", session.email);
  if (!account || account.disabled) return "forbidden";
  // Changing a password, role or access sets sessions_from; older sessions end there.
  if (account.sessions_from && session.issued < Math.floor(Date.parse(account.sessions_from) / 1000)) return null;
  const role: Role = isRole(account.role) ? account.role : "editor";
  return { email: account.email, name: account.name || account.email.split("@")[0], role, permissions: permissionsOf(role) };
}

/** The signed-in admin, or null — for code that must not redirect (Draft Mode previews). */
export async function currentAdmin(): Promise<AdminUser | null> {
  const account = await sessionAccount();
  return typeof account === "object" ? account : null;
}

/** Returns the signed-in admin, or redirects to the login page. */
export async function requireAdmin(): Promise<{ user: AdminUser }> {
  if (!isAuthConfigured()) redirect("/admin/login?error=config");
  const account = await sessionAccount();
  if (!account) redirect("/admin/login");
  if (account === "forbidden") redirect("/admin/login?error=forbidden");
  return { user: account };
}

/** For Studio screens: the signed-in admin if their role allows `permission`, else back to the Studio home. */
export async function requirePermission(permission: Permission): Promise<{ user: AdminUser }> {
  const session = await requireAdmin();
  if (!can(session.user.role, permission)) redirect(session.user.permissions.includes("content.read") ? "/admin" : "/admin/inquiries");
  return session;
}

/** For server actions: the signed-in admin if allowed, else a failed result to return as is. */
export async function allowed(permission: Permission): Promise<{ ok: true; user: AdminUser } | { ok: false; error: string }> {
  const { user } = await requireAdmin();
  return can(user.role, permission) ? { ok: true, user } : { ok: false, error: "Tài khoản của bạn không có quyền làm việc này." };
}
