"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Award, Handshake, Inbox, LayoutDashboard, MessageSquareQuote, Package, Settings, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/inquiries", label: "Yêu cầu báo giá", icon: Inbox },
  { href: "/admin/products", label: "Sản phẩm", icon: Package },
  { href: "/admin/testimonials", label: "Đánh giá", icon: MessageSquareQuote },
  { href: "/admin/partners", label: "Đối tác", icon: Handshake },
  { href: "/admin/certifications", label: "Chứng nhận", icon: Award },
  { href: "/admin/team", label: "Đội ngũ & CEO", icon: Users },
  { href: "/admin/settings", label: "Cài đặt công ty", icon: Settings },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
      {items.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition-colors",
              active ? "bg-white text-forest" : "text-white/80 hover:bg-white/10 hover:text-white",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
