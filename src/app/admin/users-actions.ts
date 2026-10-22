"use server";

import { revalidatePath } from "next/cache";
import { allowed, requireAdmin, startSession } from "@/lib/admin/auth";
import { audit } from "@/lib/admin/audit";
import { hashPassword, verifyPassword } from "@/lib/admin/password";
import { MIN_PASSWORD, isRole, roleInfo, type Role } from "@/lib/admin/roles";
import { count, first, isUniqueViolation, now, run } from "@/lib/db";

// Studio › Tài khoản: accounts with roles (admins only), and everyone's own password.

type Result = { ok: true } | { ok: false; error: string };

const emailPattern = /^[^\s@']+@[^\s@']+\.[^\s@']+$/;
const tooShort = `Mật khẩu cần ít nhất ${MIN_PASSWORD} ký tự.`;

/** At least one admin must keep access, so nobody locks the Studio for good. */
async function lastAdmin(email: string) {
  const others = await count("select count(*) as n from admin_users where role = 'admin' and disabled = 0 and email != ?", email);
  return others === 0;
}

export async function createUser(input: { email: string; name: string; role: string; password: string }): Promise<Result> {
  const auth = await allowed("users");
  if (!auth.ok) return auth;
  const { user } = auth;
  const email = String(input.email).trim().toLowerCase();
  if (!emailPattern.test(email)) return { ok: false, error: "Email không hợp lệ." };
  if (!isRole(input.role)) return { ok: false, error: "Vai trò không hợp lệ." };
  if (String(input.password).length < MIN_PASSWORD) return { ok: false, error: tooShort };
  try {
    await run(
      "insert into admin_users (email, password_hash, name, role) values (?, ?, ?, ?)",
      email,
      await hashPassword(input.password),
      String(input.name).trim().slice(0, 80),
      input.role,
    );
  } catch (e) {
    return { ok: false, error: isUniqueViolation(e) ? "Email này đã có tài khoản." : (e as Error).message };
  }
  await audit(user.email, "user.create", email, roleInfo[input.role].label);
  revalidatePath("/admin/users");
  return { ok: true };
}

/** Name, role and access. A role or access change signs the person out everywhere. */
export async function updateUser(email: string, changes: { name: string; role: string; disabled: boolean }): Promise<Result> {
  const auth = await allowed("users");
  if (!auth.ok) return auth;
  const { user } = auth;
  const account = await first<{ email: string; role: Role; disabled: boolean }>("select email, role, disabled from admin_users where email = ?", email);
  if (!account) return { ok: false, error: "Không tìm thấy tài khoản." };
  if (!isRole(changes.role)) return { ok: false, error: "Vai trò không hợp lệ." };
  const disabled = Boolean(changes.disabled);
  const access = changes.role !== account.role || disabled !== account.disabled;
  if (access && account.email === user.email) return { ok: false, error: "Không thể tự đổi vai trò hoặc khoá tài khoản của chính mình." };
  if (access && account.role === "admin" && (changes.role !== "admin" || disabled) && (await lastAdmin(account.email))) {
    return { ok: false, error: "Phải còn ít nhất một tài khoản Quản trị đang hoạt động." };
  }
  await run(
    `update admin_users set name = ?, role = ?, disabled = ?${access ? ", sessions_from = ?" : ""} where email = ?`,
    String(changes.name).trim().slice(0, 80),
    changes.role,
    disabled ? 1 : 0,
    ...(access ? [now()] : []),
    account.email,
  );
  const detail = [
    changes.role !== account.role && `${roleInfo[account.role]?.label ?? account.role} → ${roleInfo[changes.role].label}`,
    disabled !== account.disabled && (disabled ? "khoá" : "mở khoá"),
  ].filter(Boolean);
  await audit(user.email, "user.update", account.email, detail.join(", "));
  revalidatePath("/admin/users");
  return { ok: true };
}

/** Sets a new password for someone else; their sessions end. */
export async function resetPassword(email: string, password: string): Promise<Result> {
  const auth = await allowed("users");
  if (!auth.ok) return auth;
  const { user } = auth;
  if (String(password).length < MIN_PASSWORD) return { ok: false, error: tooShort };
  const result = await first<{ email: string }>(
    "update admin_users set password_hash = ?, sessions_from = ? where email = ? returning email",
    await hashPassword(password),
    now(),
    email,
  );
  if (!result) return { ok: false, error: "Không tìm thấy tài khoản." };
  await audit(user.email, "user.password", result.email);
  // Resetting your own password keeps this browser signed in.
  if (result.email === user.email) await startSession(user.email);
  return { ok: true };
}

/** Anyone signed in: change your own password (other browsers are signed out). */
export async function changeOwnPassword(current: string, next: string): Promise<Result> {
  const { user } = await requireAdmin();
  if (String(next).length < MIN_PASSWORD) return { ok: false, error: tooShort };
  const account = await first<{ password_hash: string }>("select password_hash from admin_users where email = ?", user.email);
  if (!account || !(await verifyPassword(String(current), account.password_hash))) return { ok: false, error: "Mật khẩu hiện tại không đúng." };
  await run("update admin_users set password_hash = ?, sessions_from = ? where email = ?", await hashPassword(next), now(), user.email);
  await startSession(user.email);
  await audit(user.email, "user.own-password", user.email);
  return { ok: true };
}
