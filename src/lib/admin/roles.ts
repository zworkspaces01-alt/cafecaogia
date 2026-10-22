// Who may do what in the Studio. Pure data, shared by the server actions (which enforce it) and the
// admin UI (which only hides what can't be used).

export const roles = ["admin", "publisher", "editor", "sales"] as const;
export type Role = (typeof roles)[number];

export type Permission =
  /** Open the content editors and read the drafts. */
  | "content.read"
  /** Change drafts, upload images. */
  | "content.write"
  /** Put changes live: publish, discard drafts, restore versions, undo a release. */
  | "content.publish"
  | "media.delete"
  /** Company details, SEO and analytics settings (saved straight to the website). */
  | "settings"
  /** Read and handle quote requests. */
  | "inquiries"
  /** Accounts and the Telegram connection. */
  | "users"
  | "audit";

const grants: Record<Role, Permission[]> = {
  admin: ["content.read", "content.write", "content.publish", "media.delete", "settings", "inquiries", "users", "audit"],
  publisher: ["content.read", "content.write", "content.publish", "media.delete", "settings", "inquiries"],
  editor: ["content.read", "content.write"],
  sales: ["inquiries"],
};

export const roleInfo: Record<Role, { label: string; description: string }> = {
  admin: { label: "Quản trị", description: "Toàn quyền, kể cả tài khoản, thông báo Telegram và nhật ký." },
  publisher: { label: "Biên tập chính", description: "Sửa và xuất bản nội dung, cài đặt công ty / SEO; xử lý báo giá." },
  editor: { label: "Biên tập viên", description: "Sửa bản nháp, tải ảnh. Không xuất bản được." },
  sales: { label: "Kinh doanh", description: "Chỉ hộp thư yêu cầu báo giá." },
};

export const isRole = (value: unknown): value is Role => typeof value === "string" && (roles as readonly string[]).includes(value);

export const permissionsOf = (role: Role): Permission[] => [...(grants[role] ?? [])];

export const can = (role: Role | null | undefined, permission: Permission) => Boolean(role && grants[role]?.includes(permission));

export const MIN_PASSWORD = 10;
