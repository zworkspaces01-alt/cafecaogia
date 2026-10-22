"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { KeyRound, Loader2, Plus, X } from "lucide-react";
import { createUser, resetPassword, updateUser } from "@/app/admin/users-actions";
import { RoleBadge } from "@/components/admin/studio";
import { PageTitle, inputClass } from "@/components/admin/ui";
import { MIN_PASSWORD, roleInfo, roles, type Role } from "@/lib/admin/roles";
import { formatTime } from "@/lib/admin/format";
import { cn } from "@/lib/utils";

// Studio › Tài khoản (admins only): one account per person, each with a role.

export type Account = { email: string; name: string; role: Role; disabled: boolean; created_at: string; last_login: string | null };

export function UsersView({ accounts, me }: { accounts: Account[]; me: string }) {
  const [adding, setAdding] = useState(false);
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-5 md:p-8">
      <PageTitle title="Tài khoản" description="Mỗi người một tài khoản đăng nhập bằng email. Đổi vai trò, khoá hay đặt lại mật khẩu sẽ đăng xuất người đó ngay.">
        <button type="button" onClick={() => setAdding(true)} className="inline-flex h-10 items-center gap-2 rounded-full bg-forest px-5 text-sm font-medium text-white hover:bg-leaf">
          <Plus className="size-4" /> Thêm tài khoản
        </button>
      </PageTitle>

      <ul className="divide-y divide-mist overflow-hidden rounded-3xl bg-white">
        {accounts.map((a) => (
          <AccountRow key={a.email} account={a} self={a.email === me} />
        ))}
      </ul>

      <section className="rounded-3xl bg-white p-6">
        <h2 className="font-semibold text-forest">Vai trò</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          {roles.map((r) => (
            <div key={r} className="rounded-2xl bg-sand p-4">
              <dt>
                <RoleBadge role={r} />
              </dt>
              <dd className="mt-2 text-sm text-muted">{roleInfo[r].description}</dd>
            </div>
          ))}
        </dl>
      </section>

      {adding && <NewAccount onClose={() => setAdding(false)} />}
    </div>
  );
}

function AccountRow({ account, self }: { account: Account; self: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(account.name);
  const [role, setRole] = useState<Role>(account.role);
  const [disabled, setDisabled] = useState(account.disabled);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, startTransition] = useTransition();
  const changed = name !== account.name || role !== account.role || disabled !== account.disabled;

  const save = () =>
    startTransition(async () => {
      const result = await updateUser(account.email, { name, role, disabled });
      setMessage(result.ok ? { ok: true, text: "Đã lưu." } : { ok: false, text: result.error });
      if (result.ok) router.refresh();
    });
  const reset = () => {
    const password = prompt(`Mật khẩu mới cho ${account.email} (ít nhất ${MIN_PASSWORD} ký tự):`);
    if (!password) return;
    startTransition(async () => {
      const result = await resetPassword(account.email, password);
      setMessage(result.ok ? { ok: true, text: "Đã đặt mật khẩu mới — báo cho người đó." } : { ok: false, text: result.error });
    });
  };

  return (
    <li className={cn("grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto] md:items-center", disabled && "bg-sand/60")}>
      <div className="grid gap-2 sm:grid-cols-[1fr_11rem] sm:items-center">
        <div className="min-w-0">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên hiển thị" className="w-full rounded-lg bg-transparent px-1 py-0.5 font-medium text-forest outline-none hover:bg-sand focus:bg-sand" />
          <p className="truncate px-1 text-xs text-muted">
            {account.email}
            {self && " · bạn"} · đăng nhập lần cuối: {formatTime(account.last_login)}
          </p>
        </div>
        <select value={role} disabled={self} onChange={(e) => setRole(e.target.value as Role)} className={cn(inputClass, "py-2")} aria-label="Vai trò">
          {roles.map((r) => (
            <option key={r} value={r}>
              {roleInfo[r].label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className={cn("flex items-center gap-1.5 text-xs", self ? "text-muted/60" : "text-muted")}>
          <input type="checkbox" checked={disabled} disabled={self} onChange={(e) => setDisabled(e.target.checked)} /> Khoá
        </label>
        <button type="button" onClick={reset} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-mist px-3 text-xs text-forest hover:bg-sand">
          <KeyRound className="size-3.5" /> Đặt lại mật khẩu
        </button>
        <button type="button" onClick={save} disabled={busy || !changed} className="inline-flex h-9 items-center gap-1.5 rounded-full bg-forest px-4 text-xs font-medium text-white disabled:opacity-40">
          {busy && <Loader2 className="size-3.5 animate-spin" />} Lưu
        </button>
      </div>
      {message && <p className={cn("text-xs md:col-span-2", message.ok ? "text-leaf" : "text-red-600")}>{message.text}</p>}
    </li>
  );
}

function NewAccount({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [values, setValues] = useState({ email: "", name: "", role: "editor" as Role, password: "" });
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setValues((v) => ({ ...v, [key]: e.target.value }));

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-ink/40 p-4 backdrop-blur-sm" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <form
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
        onSubmit={(e) => {
          e.preventDefault();
          startTransition(async () => {
            const result = await createUser(values);
            if (!result.ok) return setError(result.error);
            router.refresh();
            onClose();
          });
        }}
      >
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-semibold text-forest">Thêm tài khoản</h2>
          <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-1 text-muted hover:bg-sand">
            <X className="size-5" />
          </button>
        </div>
        <div className="mt-4 grid gap-3">
          <label className="grid gap-1 text-xs font-medium text-forest">
            Email đăng nhập
            <input type="email" required value={values.email} onChange={set("email")} className={inputClass} />
          </label>
          <label className="grid gap-1 text-xs font-medium text-forest">
            Tên hiển thị
            <input value={values.name} onChange={set("name")} placeholder="VD: Lan — Kinh doanh" className={inputClass} />
          </label>
          <label className="grid gap-1 text-xs font-medium text-forest">
            Vai trò
            <select value={values.role} onChange={set("role")} className={inputClass}>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {roleInfo[r].label} — {roleInfo[r].description}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-xs font-medium text-forest">
            Mật khẩu (ít nhất {MIN_PASSWORD} ký tự)
            <input type="text" required minLength={MIN_PASSWORD} autoComplete="off" value={values.password} onChange={set("password")} className={cn(inputClass, "font-mono")} />
          </label>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-sm text-muted hover:bg-sand">
            Huỷ
          </button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg bg-forest px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
            {busy && <Loader2 className="size-4 animate-spin" />} Tạo tài khoản
          </button>
        </div>
      </form>
    </div>
  );
}
