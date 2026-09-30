import type { SeoPageKey } from "@/lib/types";

/** Pages listed on CMS → SEO, with the dictionary section holding each one's built-in meta copy. */
export const seoPages: { key: SeoPageKey; label: string; path: string; dictKey: string }[] = [
  { key: "home", label: "Trang chủ (và mặc định toàn site)", path: "", dictKey: "meta" },
  { key: "products", label: "Danh sách sản phẩm", path: "/products", dictKey: "productsPage" },
  { key: "about", label: "Giới thiệu", path: "/about", dictKey: "about" },
  { key: "process", label: "Quy trình", path: "/process", dictKey: "processPage" },
  { key: "contact", label: "Liên hệ", path: "/contact", dictKey: "contact" },
  { key: "company-profile", label: "Hồ sơ công ty", path: "/company-profile", dictKey: "profile" },
  { key: "about-ceo", label: "Về CEO", path: "/about-ceo", dictKey: "ceo" },
];

/** Google shows roughly this many characters before cutting a title or description off. */
export const TITLE_LIMIT = 60;
export const DESCRIPTION_LIMIT = 160;
