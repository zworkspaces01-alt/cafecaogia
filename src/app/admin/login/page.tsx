import { LogoMark } from "@/components/logo";
import { LoginForm } from "@/components/admin/login-form";
import { isAuthConfigured } from "@/lib/admin/auth";

const notices: Record<string, string> = {
  config: "Chưa cấu hình AUTH_SECRET (chuỗi ngẫu nhiên ≥ 32 ký tự). Xem README → Tài khoản quản trị.",
  forbidden: "Tài khoản này chưa được cấp quyền quản trị.",
};

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { error } = await searchParams;
  // The config notice is a live check, so it also shows when the link has no ?error.
  const notice = !isAuthConfigured() ? notices.config : typeof error === "string" ? notices[error] : undefined;

  return (
    <main className="grid min-h-svh place-items-center bg-forest p-5">
      <div className="w-full max-w-sm rounded-3xl bg-white p-8 shadow-2xl">
        <div className="flex items-center gap-3">
          <LogoMark className="size-11" />
          <div>
            <p className="text-lg font-semibold text-forest">Cao Gia CMS</p>
            <p className="text-xs text-muted">Đăng nhập để quản lý nội dung website</p>
          </div>
        </div>
        {notice && <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{notice}</p>}
        <LoginForm />
      </div>
    </main>
  );
}
