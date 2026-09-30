# Kế hoạch hành động — Cao Gia (cafecaogia.com)

_Từ audit ngày 30/09/2026 (xem `FULL-AUDIT-REPORT.md`). Điểm SEO hiện tại: **60/100**._

Ký hiệu người làm: **KD** = kinh doanh/nội dung (làm trong CMS hoặc cung cấp thông tin) · **Dev** = sửa code · **Hạ tầng** = DNS, Vercel/Cloudflare, tài khoản công cụ.

## Giai đoạn 1 — Việc gấp (tuần 1)

| # | Việc | Ai | Thời gian |
|---|---|---|---|
| 1 | Ẩn toàn bộ nội dung mẫu: đối tác, đánh giá, chứng nhận chưa có giấy tờ (tắt "Hiển thị trên website"). Chỉ bật lại chứng nhận khi có số chứng nhận + PDF. | KD | 1–2 giờ |
| 2 | Chạy migration `0005_posts.sql` và `0006_seo_analytics.sql` trong Supabase SQL Editor. | Hạ tầng | 10 phút |
| 3 | Chuyển tên miền **theo đúng thứ tự**: (a) trỏ DNS `cafecaogia.com` + `www` về nơi host → (b) gắn tên miền trong Vercel/Cloudflare, `www` → apex, `vercel.app` → `cafecaogia.com` (308) → (c) deploy commit `7f8114c` → (d) kiểm tra CMS → SEO: "cho phép lập chỉ mục" đang bật. Nếu cần deploy trước khi DNS chạy: đặt `NEXT_PUBLIC_SITE_URL` = địa chỉ vercel.app. | Hạ tầng | 0,5 ngày |
| 4 | Xác minh Google Search Console, Bing Webmaster, Yandex Webmaster (dán mã vào CMS → SEO), gửi `sitemap.xml`; tạo GA4 và dán mã vào CMS → Phân tích. | Hạ tầng | 1 giờ |
| 5 | Sửa thông số mâu thuẫn: gộp hoặc phân biệt rõ `robusta-s13-14` / `robusta-g2-s13-14`; tách thông số LP vs LWP; thống nhất tên theo AFI (SWP thay SP; ghi rõ SL, SK1 là quy cách thương mại VN). | KD | 2–3 giờ |
| 6 | Không ẩn hero khi chờ hiệu ứng (`globals.css` / `layout.tsx` / `motion.tsx`), giảm mốc dự phòng 3 s → ~1 s → LCP mobile trang chủ và `/ar`. | Dev | 1–2 giờ |
| 7 | Sửa chữ dính liền trong heading và thân bài (thêm khoảng trắng giữa các dòng tách), biến tiêu đề slide 2–4 thành đoạn văn, thêm H2 cho `/products`. | Dev | 1 giờ |

## Giai đoạn 2 — Tác động cao (tuần 2–3)

| # | Việc | Ai | Thời gian |
|---|---|---|---|
| 8 | Làm cho thông tin doanh nghiệp nhất quán: cập nhật địa chỉ/người đại diện trên cổng đăng ký hoặc giải thích trên About; email tên miền (`sales@cafecaogia.com`); giải thích tên pháp lý ("Cao Gia là thương hiệu xuất khẩu của…"). | KD | 1 ngày + thủ tục |
| 9 | Thống nhất điều khoản giữa các trang: MOQ điều rang, Incoterms (EXW?), số bước quy trình, số vùng nguyên liệu, bỏ "private-label roasted coffee" nếu không bán. | KD | 2 giờ |
| 10 | Trang chính sách quyền riêng tư (EN/RU/AR) + link ở form và footer. | KD + Dev | 0,5 ngày |
| 11 | Security headers trong `next.config.ts` (`headers()`): CSP (cho phép GA4/Meta/Clarity/Yandex nếu dùng), X-Content-Type-Options, frame-ancestors, Referrer-Policy, Permissions-Policy. | Dev | 1–2 giờ |
| 12 | Schema: Organization (`name: "Cao Gia"` + `legalName`, `logo`, `contactPoint`, `@id`), WebSite, BreadcrumbList; Product thêm `additionalProperty`, `sku`, `url`, `manufacturer`; ProfilePage + Person cho CEO; ContactPage. | Dev | 0,5 ngày |
| 13 | Sitemap thêm `lastmod` cho mọi trang và `x-default`; thêm `favicon.ico`; robots.txt: `Content-Signal` + tách bot huấn luyện/bot tìm kiếm. | Dev | 1–2 giờ |
| 14 | Ảnh: `sizes` đúng cho lưới sản phẩm, `fetchpriority="high"` cho ảnh hero, alt mô tả cho mọi ảnh có nội dung; tăng vùng chạm lên 44 px. | Dev | 2–3 giờ |
| 15 | Viết "Tiêu đề SEO" + "Mô tả SEO" cho 37 sản phẩm (nêu quy cách, MOQ, "supplier/exporter Vietnam") trong CMS, cả EN/RU/AR. | KD | 1 ngày |
| 16 | Trang CEO: ảnh thật, quá trình công tác, LinkedIn; thống nhất người liên hệ (CEO vs "David Cao"). | KD | 2 giờ |

## Giai đoạn 3 — Nội dung & uy tín (tháng 2)

| # | Việc | Ai |
|---|---|---|
| 17 | Chụp ảnh thật: kho, phân loại, đóng bao/container, phòng QC, từng cấp hạng; 1–3 video ngắn (YouTube). Thay ảnh Unsplash, dùng ảnh thật cho `og:image`. | KD |
| 18 | Hướng dẫn cấp hạng: `cashew-grades` (WW160–WW450, SW/LBW/DW, mảnh) và `robusta-grades-s13-s16-s18` (TCVN 4193:2014, bảng sàng). | KD + Dev |
| 19 | Trang danh mục `/en/cashew-kernels`, `/en/green-coffee/robusta` (1.500–2.500 từ: vùng trồng, mùa vụ, cấp hạng, cách nhập khẩu, HS code). | KD + Dev |
| 20 | Làm dày trang sản phẩm: bảng thông số, niên vụ, đóng gói/xếp container, file PDF spec sheet/COA, đoạn trả lời "X là gì?". | KD |
| 21 | Trang thị trường: Nga (EAEU, Vladivostok/Novorossiysk, giá FOB tham khảo, Telegram), Trung Đông (tổ chức cấp Halal + số, Jebel Ali), EUDR (dẫn Quy định (EU) 2023/1115). | KD + Dev |
| 22 | Dấu vết thương hiệu bên ngoài: LinkedIn công ty, Google Business Profile, hồ sơ VICOFA/VINACAS, Kompass, Yellow Pages, VietnamExport; điền link vào CMS → Cài đặt công ty (tự vào `sameAs`). | KD |
| 23 | 2–3 bài Insights trả lời câu hỏi thật (EUDR cho cà phê VN, niên vụ Robusta 2026/27, WW240 vs WW320), có tác giả, khớp danh mục. | KD |
| 24 | Form báo giá thêm công ty, số lượng, cảng đến, Incoterm; tin WhatsApp ghi sẵn cấp hạng; header mobile có nút Request a Quote. | Dev |
| 25 | Sửa bản RU/AR: phụ đề chứng nhận, "L/C at sight", thống nhất tên thương hiệu tiếng Ả Rập, rút mô tả meta RU trang chủ. | KD |

## Giai đoạn 4 — Theo dõi (liên tục)

- Hằng tuần: Search Console (lập chỉ mục, lỗi, truy vấn), CMS → Phân tích (nguồn khách hàng), CMS → SEO (kiểm tra nhanh).
- Hằng tháng: chạy lại Lighthouse cho 5 trang ở mục 5 báo cáo (mục tiêu: mobile ≥ 85, LCP < 2,5 s); khi có đủ lượt truy cập, xem dữ liệu CrUX thật.
- Sau 3 tháng: tìm "Cao Gia coffee exporter" / "Cao Gia cashew" — phải thấy ít nhất vài trang bên thứ ba; chạy lại audit để so sánh.
- Bật IndexNow sau khi chuyển tên miền để Bing/Yandex cập nhật nhanh.

## Mục tiêu sau khi xong giai đoạn 1–2
Điểm SEO dự kiến **~72–75/100** (uy tín và nội dung vẫn cần giai đoạn 3 để vượt 80).

## Đã làm trong code (30/09/2026)

| # | Việc | Kết quả |
|---|---|---|
| 6 | Ảnh LCP được ưu tiên tải: thay `priority` (Next 16 đã bỏ) bằng `loading="eager"` + `fetchPriority="high"` ở hero trang chủ, hero các trang, ảnh sản phẩm, ảnh bài viết | Lighthouse xác nhận `fetchpriority=high`. Đo trên máy: FCP `/ar` 2,8 s → 1,1 s; LCP quan sát trang chủ 1,2 s → 0,75 s. LCP **mô phỏng** mobile trang chủ vẫn ~4,7 s do JavaScript hiệu ứng (GSAP) — bước tiếp theo: hoãn tải ScrollTrigger/hiệu ứng phần dưới. Lưu ý: slider tự chuyển slide ở giây thứ 8 có thể tạo LCP muộn nếu người xem không cuộn — cân nhắc tắt tự chạy trên mobile. |
| 7 | Khoảng trắng giữa các dòng heading (page hero, heading các mục, slider); slide 2–4 không còn là H2; logo đọc được là "Cao Gia"; `/products` có H2 | Hết "Farmsto", "AboutOur CEO", "CaoGia" khi đọc HTML thô. |
| 11 | Security headers: X-Content-Type-Options, Referrer-Policy, X-Frame-Options, CSP (frame-ancestors, base-uri, object-src), Permissions-Policy, HSTS | Có trên mọi trang. CSP cho script chưa bật (cần nonce). |
| 12 | Schema: Organization (`name` = Cao Gia, `legalName`, logo, contactPoint, `@id`) + WebSite; Product (`url`, `sku`, `manufacturer`, `additionalProperty` từ thông số, xuất xứ, đóng gói, MOQ) + BreadcrumbList; ProfilePage + Person cho CEO | JSON-LD hợp lệ trên EN/RU. |
| 13 | Sitemap: `x-default` cho mọi URL, `lastmod` sản phẩm từ `updated_at`; `favicon.ico` | 144 URL có x-default; favicon 200. |
| 14 | Vùng chạm: nút ngôn ngữ 44 px (các nút header/slider đã 44 px) | — |
| 3 | Tên miền chuẩn trên Vercel lấy theo tên miền production của project (vercel.app → tự chuyển sang cafecaogia.com khi gắn tên miền) | Deploy trước khi trỏ DNS không làm hỏng canonical. |
