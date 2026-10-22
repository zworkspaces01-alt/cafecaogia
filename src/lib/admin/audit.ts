import "server-only";

import { count, run } from "@/lib/db";

// The Studio's audit log (table audit_log): sign-ins (failed ones too), publishes, account changes,
// settings saves and quote-request handling. Writing it never fails the action that triggered it.

export const auditActions = {
  login: "Đăng nhập",
  "login.failed": "Đăng nhập sai",
  "login.locked": "Đăng nhập bị khoá tạm",
  publish: "Xuất bản",
  discard: "Bỏ bản nháp",
  "release.undo": "Hoàn tác lần xuất bản",
  "page.create": "Tạo trang",
  "page.settings": "Sửa cài đặt trang",
  "page.delete": "Xoá trang",
  "page.restore": "Khôi phục phiên bản trang",
  settings: "Lưu cài đặt",
  "inquiry.status": "Đổi trạng thái báo giá",
  "inquiry.note": "Ghi chú báo giá",
  "inquiry.export": "Xuất CSV báo giá",
  "media.upload": "Tải ảnh lên",
  "media.delete": "Xoá ảnh",
  "user.create": "Tạo tài khoản",
  "user.update": "Sửa tài khoản",
  "user.password": "Đặt lại mật khẩu",
  "user.own-password": "Đổi mật khẩu",
} as const;

export type AuditAction = keyof typeof auditActions;

export async function audit(actor: string, action: AuditAction, target = "", detail = "") {
  try {
    await run(
      "insert into audit_log (actor, action, target, detail) values (?, ?, ?, ?)",
      actor,
      action,
      target.slice(0, 300),
      detail.slice(0, 1000),
    );
  } catch (error) {
    console.error("audit log", error);
  }
}

/** Failed sign-ins for this email in the last `minutes`, for the temporary lockout. */
export function recentFailures(email: string, minutes: number) {
  const since = new Date(Date.now() - minutes * 60_000).toISOString();
  return count("select count(*) as n from audit_log where action = 'login.failed' and target = ? and at > ?", email.toLowerCase(), since);
}
