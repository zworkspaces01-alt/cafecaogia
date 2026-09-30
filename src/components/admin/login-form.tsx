"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { signIn } from "@/app/admin/actions";
import { inputClass } from "@/components/admin/ui";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, {});
  return (
    <form action={action} className="mt-8 grid gap-4">
      <label className="grid gap-1.5 text-sm font-medium text-forest">
        Email
        <input
          key={state.email}
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={state.email}
          className={inputClass}
        />
      </label>
      <label className="grid gap-1.5 text-sm font-medium text-forest">
        Mật khẩu
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      {state.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-full bg-forest text-sm font-medium text-white hover:bg-leaf disabled:opacity-60"
      >
        {pending && <Loader2 className="size-4 animate-spin" />}
        Đăng nhập
      </button>
    </form>
  );
}
