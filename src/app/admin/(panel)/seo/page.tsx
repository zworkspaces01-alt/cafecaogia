import Link from "next/link";
import { AlertTriangle, CheckCircle2, ExternalLink, Info } from "lucide-react";
import { SeoForm, type SeoDefaults } from "@/components/admin/seo-form";
import { PageTitle } from "@/components/admin/ui";
import { locales } from "@/i18n/config";
import { loadDictionary } from "@/i18n/dictionaries";
import { requireAdmin } from "@/lib/admin/auth";
import { DESCRIPTION_LIMIT, seoPages, TITLE_LIMIT } from "@/lib/admin/seo-pages";
import { mergeSettings } from "@/lib/settings";
import { site } from "@/lib/site";
import type { ProductTranslations, SiteSettings } from "@/lib/types";

export const metadata = { title: "SEO" };

type Check = { tone: "error" | "warn" | "info" | "ok"; text: string; href?: string; items?: { label: string; href: string }[] };

type ProductRow = {
  id: string;
  name: string;
  summary: string;
  seo_title?: string;
  seo_description?: string;
  translations: ProductTranslations | null;
};

async function metaDefaults(): Promise<SeoDefaults> {
  const dictionaries = await Promise.all(locales.map((l) => loadDictionary(l)));
  return Object.fromEntries(
    seoPages.map((page) => [
      page.key,
      Object.fromEntries(
        locales.map((l, i) => {
          const section = (dictionaries[i] as unknown as Record<string, Record<string, string>>)[page.dictKey];
          return page.key === "home"
            ? [l, { title: section.title, description: section.description }]
            : [l, { title: section.metaTitle, description: section.metaDescription }];
        }),
      ),
    ]),
  ) as SeoDefaults;
}

function productChecks(products: ProductRow[]): Check[] {
  if (products.length > 0 && !("seo_title" in products[0])) {
    return [{ tone: "error", text: "Chưa chạy migration supabase/migrations/0006_seo_analytics.sql — chưa thể nhập tiêu đề/mô tả SEO cho sản phẩm và chưa lưu được nguồn khách hàng." }];
  }
  const link = (p: ProductRow) => ({ label: p.name, href: `/admin/products/${p.id}` });
  const longDescription = products.filter((p) => !p.seo_description && p.summary.length > DESCRIPTION_LIMIT);
  const shortDescription = products.filter((p) => !p.seo_description && p.summary.length < 70);
  const untranslated = products.filter((p) => !p.translations?.ru?.name || !p.translations?.ar?.name);
  const checks: Check[] = [];
  if (longDescription.length)
    checks.push({
      tone: "warn",
      text: `${longDescription.length} sản phẩm có tóm tắt dài hơn ${DESCRIPTION_LIMIT} ký tự và chưa có “Mô tả SEO” — Google sẽ cắt ngang câu.`,
      items: longDescription.map(link),
    });
  if (shortDescription.length)
    checks.push({
      tone: "warn",
      text: `${shortDescription.length} sản phẩm có mô tả quá ngắn (< 70 ký tự) — nên viết “Mô tả SEO” nêu quy cách, xuất xứ, MOQ.`,
      items: shortDescription.map(link),
    });
  if (untranslated.length)
    checks.push({
      tone: "info",
      text: `${untranslated.length} sản phẩm chưa có tên tiếng Nga hoặc Ả Rập — trang ru/ar sẽ hiện tên tiếng Anh.`,
      items: untranslated.map(link),
    });
  if (!checks.length && products.length) checks.push({ tone: "ok", text: "Tất cả sản phẩm có mô tả độ dài phù hợp và đủ bản dịch." });
  return checks;
}

const icons = { error: AlertTriangle, warn: AlertTriangle, info: Info, ok: CheckCircle2 };
const colors = { error: "text-red-600", warn: "text-amber-600", info: "text-sky-600", ok: "text-leaf" };

export default async function SeoPage() {
  const { supabase } = await requireAdmin();
  const [{ data }, { data: products }, { count: samples }, defaults] = await Promise.all([
    supabase.from("site_settings").select("data").eq("id", 1).maybeSingle(),
    // "*" so the page still loads before migration 0006 adds the SEO columns.
    supabase.from("products").select("*").eq("published", true).order("sort_order"),
    supabase.from("testimonials").select("id", { count: "exact", head: true }).eq("is_sample", true),
    metaDefaults(),
  ]);
  const settings: SiteSettings = mergeSettings((data?.data ?? {}) as Partial<SiteSettings>);
  const { seo, analytics, socials } = settings;

  const overLimit = seoPages.flatMap((page) =>
    locales.flatMap((l) => {
      const text = seo.pages[page.key]?.[l];
      const title = text?.title || defaults[page.key][l].title;
      const full = page.key === "home" ? title : `${title} | ${site.name}`;
      return full.length > TITLE_LIMIT ? [`${page.label} (${l.toUpperCase()})`] : [];
    }),
  );

  const checks: Check[] = [
    /localhost|127\.0\.0\.1/.test(site.url)
      ? { tone: "error", text: `Địa chỉ website đang là ${site.url}. Đặt NEXT_PUBLIC_SITE_URL thành tên miền thật khi build, nếu không canonical, sitemap và hreflang sẽ sai.` }
      : { tone: "ok", text: `Địa chỉ chuẩn (canonical): ${site.url}` },
    seo.indexing
      ? { tone: "ok", text: "Website cho phép công cụ tìm kiếm lập chỉ mục." }
      : { tone: "error", text: "Website đang TẮT lập chỉ mục — sẽ không xuất hiện trên Google." },
    seo.verification.google
      ? { tone: "ok", text: "Đã có mã xác minh Google Search Console." }
      : { tone: "warn", text: "Chưa xác minh Google Search Console — chưa theo dõi được từ khoá, lượt hiển thị và lỗi lập chỉ mục." },
    !seo.verification.bing && { tone: "info", text: "Chưa xác minh Bing Webmaster (nguồn dữ liệu của ChatGPT Search, Copilot)." },
    !seo.verification.yandex && { tone: "info", text: "Chưa xác minh Yandex Webmaster (thị trường Nga)." },
    analytics.ga4 || analytics.gtm
      ? { tone: "ok", text: "Đã kết nối Google Analytics." }
      : { tone: "warn", text: "Chưa có công cụ đo lường truy cập.", href: "/admin/analytics" },
    !Object.values(socials).some(Boolean) && {
      tone: "info",
      text: "Chưa có link mạng xã hội — Google dùng chúng (sameAs) để nhận diện thương hiệu.",
      href: "/admin/settings",
    },
    (samples ?? 0) > 0 && {
      tone: "warn",
      text: "Còn đánh giá khách hàng mẫu — nội dung giả làm giảm độ tin cậy (E-E-A-T).",
      href: "/admin/testimonials?filter=sample",
    },
    overLimit.length > 0 && { tone: "info", text: `Tiêu đề quá ${TITLE_LIMIT} ký tự: ${overLimit.join(", ")}.` },
    ...productChecks((products ?? []) as ProductRow[]),
  ].filter(Boolean) as Check[];

  const order = { error: 0, warn: 1, info: 2, ok: 3 };
  checks.sort((a, b) => order[a.tone] - order[b.tone]);

  const tools = [
    { label: "sitemap.xml", href: `${site.url}/sitemap.xml` },
    { label: "robots.txt", href: `${site.url}/robots.txt` },
    { label: "Google Search Console", href: "https://search.google.com/search-console" },
    { label: "Kiểm tra dữ liệu có cấu trúc", href: `https://search.google.com/test/rich-results?url=${encodeURIComponent(`${site.url}/en`)}` },
    { label: "PageSpeed Insights", href: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(`${site.url}/en`)}` },
  ];

  return (
    <div className="space-y-6">
      <PageTitle title="SEO" description="Cách website hiển thị trên Google, Bing, Yandex, trợ lý AI và khi chia sẻ link." />

      <section className="rounded-3xl bg-white p-6 md:p-8">
        <h2 className="text-lg font-semibold text-forest">Kiểm tra nhanh</h2>
        <ul className="mt-4 space-y-3">
          {checks.map((check, i) => {
            const Icon = icons[check.tone];
            return (
              <li key={i} className="flex gap-3 text-sm">
                <Icon className={`mt-0.5 size-4 shrink-0 ${colors[check.tone]}`} />
                <div className="min-w-0">
                  <p className="text-forest">
                    {check.text}{" "}
                    {check.href && (
                      <Link href={check.href} className="text-leaf hover:underline">
                        Sửa →
                      </Link>
                    )}
                  </p>
                  {check.items && (
                    <p className="mt-1 text-xs text-muted">
                      {check.items.slice(0, 8).map((item, j) => (
                        <span key={item.href}>
                          {j > 0 && " · "}
                          <Link href={item.href} className="text-leaf hover:underline">
                            {item.label}
                          </Link>
                        </span>
                      ))}
                      {check.items.length > 8 && ` · và ${check.items.length - 8} sản phẩm khác`}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-mist pt-5">
          {tools.map((tool) => (
            <a
              key={tool.href}
              href={tool.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-mist px-3 py-1.5 text-xs text-forest hover:bg-sand"
            >
              {tool.label} <ExternalLink className="size-3" />
            </a>
          ))}
        </div>
      </section>

      <SeoForm initial={seo} defaults={defaults} siteName={site.name} siteUrl={site.url} />
    </div>
  );
}
