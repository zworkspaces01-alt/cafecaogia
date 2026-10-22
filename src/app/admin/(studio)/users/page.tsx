import { UsersView, type Account } from "@/components/admin/users-view";
import { requirePermission } from "@/lib/admin/auth";
import { all } from "@/lib/db";

export const metadata = { title: "Tài khoản" };

export default async function UsersPage() {
  const { user } = await requirePermission("users");
  const accounts = await all<Account>(
    `select u.email, u.name, u.role, u.disabled, u.created_at,
       (select max(at) from audit_log where actor = u.email and action = 'login') as last_login
     from admin_users u order by u.created_at`,
  );
  return <UsersView accounts={accounts} me={user.email} />;
}
