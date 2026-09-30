import Link from "next/link";
import { ExternalLink, LogOut } from "lucide-react";
import { signOut } from "@/app/admin/actions";
import { AdminNav } from "@/components/admin/nav";
import { LogoMark } from "@/components/logo";
import { requireAdmin } from "@/lib/admin/auth";

export default async function PanelLayout({ children }: LayoutProps<"/admin">) {
  const { user } = await requireAdmin();

  return (
    <div className="lg:grid lg:min-h-svh lg:grid-cols-[250px_1fr]">
      <aside className="flex flex-col gap-6 bg-forest p-5 text-white lg:sticky lg:top-0 lg:h-svh">
        <Link href="/admin" className="flex items-center gap-2.5">
          <LogoMark className="size-9" />
          <span className="font-semibold">Cao Gia CMS</span>
        </Link>
        <AdminNav />
        <div className="mt-auto hidden space-y-3 border-t border-white/10 pt-4 text-sm lg:block">
          <a href="/en" target="_blank" className="flex items-center gap-2 text-white/75 hover:text-white">
            <ExternalLink className="size-4" /> Xem website
          </a>
          <p className="truncate text-xs text-white/50">{user.email}</p>
          <form action={signOut}>
            <button className="flex items-center gap-2 text-white/75 hover:text-white">
              <LogOut className="size-4" /> Đăng xuất
            </button>
          </form>
        </div>
      </aside>
      <main className="min-w-0 p-5 md:p-8 lg:p-10">{children}</main>
    </div>
  );
}
