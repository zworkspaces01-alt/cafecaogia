import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin", "latin-ext", "vietnamese"] });

export const metadata: Metadata = {
  title: { default: "Quản trị — Cao Gia", template: "%s — Quản trị Cao Gia" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="vi" className={geistSans.variable}>
      <body className="min-h-svh bg-sand text-ink">{children}</body>
    </html>
  );
}
