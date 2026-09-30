# Audit SEO & hiệu năng — Cao Gia (cafecaogia.com)

_Ngày: 30/09/2026 · Đối tượng audit: bản đang chạy tại **https://cafecaogia.vercel.app** (commit `0bccd49`). Tên miền chính thức `cafecaogia.com` đã đăng ký (DNS ở Tenten) nhưng **chưa trỏ về website**._

Commit `7f8114c` (chưa deploy) đã sửa một phần các lỗi dưới đây — đánh dấu **✅ đã sửa trong code**.

Phạm vi: 8 mảng (kỹ thuật + sitemap, nội dung, on-page, schema, hiệu năng, giao diện/ảnh, GEO/AI search, khả năng dùng bởi AI agent, trải nghiệm tìm kiếm). Không có dữ liệu Google Search Console / CrUX / Moz (chưa kết nối), nên hiệu năng là số đo **lab** (Lighthouse 12 trên máy, mô phỏng mobile 4G + CPU chậm 4×).

---

## 1. Tóm tắt

### Điểm SEO tổng: **60 / 100**

| Hạng mục | Trọng số | Điểm |
|---|---|---|
| Kỹ thuật | 22% | 72 |
| Chất lượng nội dung (E-E-A-T) | 23% | 46 |
| On-page (tiêu đề, mô tả, heading, liên kết nội bộ) | 20% | 68 |
| Dữ liệu có cấu trúc (schema) | 10% | 48 |
| Hiệu năng (Core Web Vitals) | 10% | 62 |
| Sẵn sàng cho tìm kiếm AI (GEO 55, agent 72) | 10% | 60 |
| Hình ảnh | 5% | 62 |

**Loại hình:** nhà xuất khẩu B2B (cà phê nhân, hạt điều), danh mục sản phẩm không có giá/giỏ hàng, 3 ngôn ngữ (EN/RU/AR). Không phải doanh nghiệp địa phương.

**Nhận định chung:** nền tảng kỹ thuật tốt (render sẵn trên server, hreflang/canonical/sitemap chuẩn, không lỗi 404). Điểm bị kéo xuống bởi **uy tín**: nội dung mẫu đang hiển thị công khai như thật, thông tin công ty chưa nhất quán, ảnh 100% stock, và website **chưa được Google/Bing lập chỉ mục**.

### 5 vấn đề nghiêm trọng nhất
1. **Nội dung mẫu hiển thị như thật** — 8 logo đối tác, 4 đánh giá có tên người/công ty tự đặt, 8 chứng nhận (HACCP, ISO 22000, FDA, Halal, Rainforest Alliance…) ghi "2024" không có số chứng nhận. Người mua tra cứu được FDA/Halal/RA → rủi ro uy tín và pháp lý.
2. **Website chưa được lập chỉ mục** và đang ở tên miền tạm `vercel.app`; chưa xác minh Search Console/Bing.
3. **Thông tin doanh nghiệp không khớp nguồn bên ngoài** — tratencongty.com ghi mã số 0108270629 với địa chỉ (Số 7 ngõ 1170 Quang Trung, Hà Đông) và người đại diện khác website; tên pháp lý "Advisory & Construction" không ăn khớp ngành cà phê; email Gmail. Trang About lại mời khách tự tra cứu.
4. **Thông số sản phẩm mâu thuẫn** — `robusta-s13-14` và `robusta-g2-s13-14` cùng cấp G2 nhưng khác độ ẩm (12,5% vs 13%), tạp chất (0,1% vs 1%), hạt đen vỡ; LP và LWP có bảng thông số giống hệt; "Small Pieces (SP)" lệch chuẩn AFI (SWP).
5. **Thiếu loại trang Google đang xếp hạng** — không có trang so sánh/hướng dẫn cấp hạng (WW240 vs WW320, S16 vs S18) và trang danh mục riêng cho hạt điều / Robusta.

### 5 việc nhanh, hiệu quả cao
1. Ẩn toàn bộ nội dung mẫu trong CMS (tắt "Hiển thị trên website") — 1–2 giờ.
2. Không ẩn tiêu đề + ảnh hero khi chờ hiệu ứng → LCP mobile trang chủ/ar dự kiến giảm 1,5–3 giây — 1 giờ code.
3. Sửa chữ dính liền trong heading ("Farmsto", "AboutOur CEO"…) — 30–60 phút code.
4. Deploy commit `7f8114c` + trỏ tên miền + xác minh Search Console/Bing + gửi sitemap — nửa ngày.
5. Thêm security headers (CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors) — 1 giờ code.

---

## 2. Kỹ thuật — 72/100

**Tốt**
- Sitemap 132 URL (44 trang × 3 ngôn ngữ), tất cả trả 200, không chuyển hướng; hreflang en/ru/ar đối ứng đúng, khớp với thẻ trên trang.
- Canonical tự tham chiếu đúng ở mọi loại trang; `html lang` đúng, tiếng Ả Rập có `dir="rtl"`.
- HTTPS + HSTS (preload). `/` chuyển hướng 307 theo Accept-Language/cookie; đường dẫn thiếu ngôn ngữ → 308 một bước.
- 404 thật (status 404 + noindex), không soft-404. Nội dung, JSON-LD, OG đều có trong HTML server (tắt JS vẫn đủ ~1.900 từ).
- `/admin` → `/admin/login` có noindex.

**Vấn đề**
| Mức | Vấn đề | Trạng thái |
|---|---|---|
| Cao | Canonical, hreflang, sitemap, robots đều trỏ `vercel.app`. **Không deploy commit mới lên Vercel trước khi tên miền chạy**, nếu không canonical sẽ trỏ về tên miền chưa phân giải — hoặc đặt `NEXT_PUBLIC_SITE_URL` bằng địa chỉ vercel.app cho tới lúc chuyển. | ✅ code đã dùng cafecaogia.com; cần làm đúng thứ tự |
| Cao | Chỉ có HSTS; thiếu CSP, X-Content-Type-Options, X-Frame-Options/frame-ancestors, Referrer-Policy, Permissions-Policy (`next.config.ts` không có `headers()`). | Chưa sửa |
| TB | robots.txt không chặn `/admin`. | ✅ |
| TB | Sitemap không có `lastmod` (0/132) và không có `x-default`. | Một phần (Insights có lastmod) |
| TB | Trang chủ HTML 338–366 KB. | Chưa sửa |
| Thấp | `/favicon.ico` 404; không có `llms.txt`; chưa có IndexNow. | Chưa sửa |

**Khi chuyển tên miền:** trỏ bản ghi A/CNAME (apex + www) về nơi host, `www` → apex 301/308, `vercel.app` → `cafecaogia.com` 308, chặn index các bản preview, tạo tài sản Search Console + Bing mới, gửi sitemap, bật IndexNow.

---

## 3. Nội dung & E-E-A-T — 46/100 · On-page — 68/100

E-E-A-T (thang tham khảo): Kinh nghiệm 25 · Chuyên môn 50 · Thẩm quyền 20 · Tin cậy 35.

**Tốt**
- `/en/company-profile` là trang mạnh nhất: pháp nhân, mã số DN, bảng 37 cấp hạng kèm MOQ/đóng gói, điều kiện giao dịch, danh sách chứng từ, "Prepared September 2026".
- FAQ trang chủ trả lời đúng câu hỏi người mua (MOQ, thời gian giao, tuyến vận chuyển, thanh toán, EUDR) bằng số liệu cụ thể. Lịch mùa vụ là nội dung riêng, hữu ích.
- About có link "Verify our company" tới cổng đăng ký kinh doanh quốc gia.
- Bản tiếng Nga và Ả Rập được dịch đầy đủ, tự nhiên (không phải máy dịch).

**Vấn đề**
| Mức | Vấn đề |
|---|---|
| Nghiêm trọng | Nội dung mẫu hiển thị như thật (xem mục 1). Ẩn mọi mục `is_sample` cho tới khi có bằng chứng thật. |
| Nghiêm trọng | Thông số mâu thuẫn giữa các cấp hạng (xem mục 1) và với chính bài hướng dẫn của site (G1 ~2%, G2 ~5% hạt đen vỡ). |
| Cao | Trang sản phẩm mỏng và lặp khuôn: 190–222 từ; 19/21 trang điều nhân dùng chung 5 đoạn chỉ đổi tên; LP vs LWP trùng 69%. |
| Cao | Điều khoản lệch nhau giữa các trang: MOQ điều rang "5 MT" (FAQ) vs "1,000 kg" (trang SP); EXW chỉ có ở trang Liên hệ; "4 bước" (trang chủ) vs 6 bước (Quy trình); "3 vùng nguyên liệu" nhưng trang SP liệt kê 5 vùng; nhắc "private-label roasted coffee" nhưng danh mục không có cà phê rang. |
| Cao | Không có chính sách quyền riêng tư (`/en/privacy` 404) dù form thu thập dữ liệu cá nhân. |
| Cao | Trang CEO không có ảnh, quá trình công tác, LinkedIn; văn phong khẩu hiệu. Seed đánh dấu CEO là mẫu; Company Profile lại ghi người liên hệ là "David Cao, Director of Marketing". |
| TB | Không có ngày cập nhật; trang cà phê không có niên vụ; FAQ vận chuyển thiếu Nga và Úc; `/process`, `/about` không link tới sản phẩm; bản nháp Insights ~350–450 từ, không tác giả, lệch danh mục (W180 vs WW160, SWP vs SP). |
| TB | Bản RU/AR còn sót tiếng Anh (phụ đề chứng nhận, "L/C at sight"); tiếng Ả Rập viết tên thương hiệu 2 kiểu; chữ dính liền trong cả thân bài; mô tả meta RU trang chủ 183 ký tự. |
| Thấp (on-page) | Mô tả meta sản phẩm 55–117 ký tự, không nêu quy cách/MOQ; tiêu đề SP lặp "Cashew … — Cashew from Vietnam", thiếu chữ supplier/exporter; "About Us \| Cao Gia" chung chung; `/en/products` nhảy từ H1 sang H3. ✅ CMS giờ cho sửa tiêu đề/mô tả từng trang và từng SP. |

---

## 4. Dữ liệu có cấu trúc — 48/100

**Tốt:** JSON-LD render trên server, escape đúng; trang chủ có Organization + FAQPage; trang SP có Product; bản RU/AR được bản địa hoá.

| Mức | Vấn đề |
|---|---|
| Cao | Organization thiếu `logo`, `contactPoint`, `sameAs`, `@id`; `name` là tên pháp lý "Advisory & Construction" → nên `name: "Cao Gia"` + `legalName` riêng. (`sameAs` ✅ đã có trong code, chỉ xuất hiện khi có link MXH.) |
| Cao | Product không có `offers`/`review`/`aggregateRating` → không đủ điều kiện rich result. B2B không công khai giá: **không** bịa giá/đánh giá; bổ sung `additionalProperty` (cỡ sàng, độ ẩm, cấp AFI, hạt/lb, đóng gói), `sku`, `url`, `manufacturer`; chỉ thêm `offers` nếu công bố giá FOB tham khảo (có thể dùng `eligibleQuantity` cho MOQ). |
| Cao | Không có đồ thị `@id` nối Organization – WebSite – WebPage – Product. |
| TB | Thiếu WebSite và BreadcrumbList toàn site; thiếu ProfilePage + Person cho CEO; thiếu ContactPage/AboutPage; `/products` nên có CollectionPage/ItemList. Các trang About, CEO, Quy trình, Liên hệ, Hồ sơ công ty không có JSON-LD nào. |
| Thấp | `addressLocality` gộp phường + thành phố, không có mã bưu chính; không có `inLanguage`. FAQPage không còn hiện rich result trên Google — giữ lại được, không cần thêm ở trang khác. |

---

## 5. Hiệu năng — 62/100

Lighthouse 12, trang thật trên Vercel (Hồng Kông). Mobile = mô phỏng 4G chậm + CPU chậm 4×.

| Trang | Thiết bị | Perf | FCP | LCP | TBT | CLS | Dung lượng |
|---|---|---|---|---|---|---|---|
| `/en` | mobile | **65** | 1,2 s | **5,0 s** | **520 ms** | 0 | 865 KB |
| `/ar` | mobile | **64** | **3,0 s** | **6,2 s** | 190 ms | 0 | 1.094 KB |
| `/en/contact` | mobile | 85 | 1,0 s | 4,2 s | 50 ms | 0 | 435 KB |
| `/en/products` | mobile | 91 | 1,1 s | 3,5 s | 40 ms | 0 | 805 KB |
| `/en/products/robusta-s18-clean` | mobile | 91 | 1,0 s | 3,3 s | 40 ms | 0 | 561 KB |
| `/en` | desktop | 94 | 0,3 s | 1,6 s | 80 ms | 0 | 1.521 KB |

Accessibility 94–97, Best Practices 100, SEO 100 ở mọi trang. Server phản hồi nhanh (TTFB 30–50 ms). CLS = 0 trên mọi trang.

**Nguyên nhân chính & cách sửa**
1. **Nội dung chính bị ẩn chờ hiệu ứng (Cao).** Script `motion-pending` (`src/app/[lang]/layout.tsx`) + CSS (`src/app/globals.css`, `visibility: hidden` cho `[data-hero-line]`, `[data-hero-fade]`, `[data-reveal]`…) ẩn tiêu đề và ảnh hero cho tới khi JS + GSAP chạy (dự phòng 3 giây). LCP trang chủ: ảnh tải xong sau ~0,6 s nhưng **trễ hiển thị 1,6 s**; trang `/ar` FCP đúng 3,0 s = mốc dự phòng. → Không ẩn phần trong màn hình đầu (hero H1, mô tả, ảnh hero); chỉ hiệu ứng từ trạng thái đã hiển thị (transform), giữ ẩn cho phần bên dưới; giảm mốc dự phòng xuống ~1 s.
2. **Main thread nặng ở trang chủ (TB).** 2,9 s xử lý, TBT 520 ms: GSAP + ScrollTrigger cho nhiều phần, slider hero, DOM lớn. → Tải ScrollTrigger/hiệu ứng phần dưới khi rảnh (`requestIdleCallback`) hoặc bằng `IntersectionObserver`, giảm số phần tử được theo dõi.
3. **Ảnh lớn hơn cần thiết (TB).** Lưới sản phẩm tải ảnh rộng 1.200–1.920 px cho ô ~475 px (tiết kiệm ~60–70 KB/trang); ảnh hero `sizes="100vw"`. → Khai báo `sizes` đúng theo lưới, `fetchpriority="high"` cho ảnh hero.
4. **Font tiếng Ả Rập (TB)** góp phần FCP chậm ở `/ar`. → Preload đúng font dùng ở hero của trang `ar`.
5. **Khác (Thấp):** 27 KB JS không dùng, 14 KB polyfill cũ, trang chặn back/forward cache. Script đo lường mới (GA4/Meta/Clarity, commit `7f8114c`) nạp `afterInteractive`/`lazyOnload` — dự kiến thêm ~50–150 ms TBT khi bật cả ba; chỉ bật công cụ thực sự dùng.

Số đo thô: `cafecaogia-audit/performance/*.json` (mở bằng https://googlechrome.github.io/lighthouse/viewer/).

---

## 6. Giao diện, mobile & hình ảnh — ảnh 62/100

**Tốt:** không tràn ngang ở mọi trang/kích thước; RTL tiếng Ả Rập đảo chiều đúng (logo, menu, mũi tên, slider, dock); màn hình đầu nói rõ bán gì cho ai, có "Request a Quote" + WhatsApp; tắt JS vẫn thấy đủ nội dung.

| Mức | Vấn đề |
|---|---|
| TB | 100% ảnh stock Unsplash, dùng lặp giữa các SKU (WW/SW/DW/SK1 cùng ảnh; ảnh Robusta S18 dùng lại ở mục Kiểm soát chất lượng); `og:image` cũng là ảnh stock. |
| TB | Dải "Trusted by" là logo chữ giống placeholder (Kestrel, Brightwater…). |
| TB | 17/28 ảnh trang chủ `alt=""` (slide 2–4, gallery, thumbnail); alt ảnh SP chỉ lặp tên. |
| Thấp | Vùng chạm 40×40 px (WhatsApp, menu, slider) dưới mức 44 px; link footer/breadcrumb cao 18–20 px; ~12 phần tử chữ < 14 px/trang. Dock mobile cao 73 px có thể che cuối trang. Nút ngôn ngữ hiện "AR" thay vì "العربية". Header mobile không có nút Request a Quote. |

---

## 7. Sẵn sàng cho tìm kiếm AI — 60/100 (GEO 55, agent 72)

| Thành phần GEO | Điểm |
|---|---|
| Khả năng trích dẫn | 62 |
| Cấu trúc dễ đọc | 62 |
| Đa phương tiện | 45 |
| Uy tín & thương hiệu | 22 |
| Truy cập kỹ thuật | 80 |

Ước tính mức sẵn sàng: Google AI Overviews 35 · ChatGPT Search 15 · Perplexity 15 · Bing Copilot 10 (chưa có trong chỉ mục Bing).

- Mọi bot AI (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended…) đều truy cập được, nhận đúng nội dung.
- **Không có dấu vết thương hiệu bên ngoài** (Bing, Wikipedia, Wikidata, YouTube, MXH); Bing còn nhầm "Cao Gia" với "Cao"/"Cáo".
- Chữ dính liền trong heading ở cả 3 ngôn ngữ khi máy đọc ("Farmsto", "sourcefrom", "AboutOur CEO"); tiêu đề slider đứng đầu dàn ý trang.
- Chưa có đoạn định nghĩa "Cao Gia là…" ~60 từ có số liệu; trang SP chưa có câu trả lời kiểu "Robusta S18 là gì?"; FAQ EUDR 35 từ, không dẫn Quy định (EU) 2023/1115.
- **AI agent:** form và nút đều có nhãn đúng (0 phần tử thiếu tên), không captcha. Nên: thêm `Content-Signal` + tách nhóm bot huấn luyện/bot tìm kiếm trong robots.txt; hiện sản phẩm đang hỏi giá thành trường nhìn thấy (hiện chỉ là input ẩn); dùng `hidden`/`inert` cho trường honeypot; cân nhắc `llms.txt`.
- Đã cải thiện so với lần phân tích trước: CEO có tên thật, About có link tra cứu đăng ký, trang Quy trình 6 bước có ngưỡng cụ thể, 37 SP có trang thông số `<dl>`, trang điều có "Crop 2026".

---

## 8. Trải nghiệm tìm kiếm (SXO)

Điểm khoảng cách: trang cấp hạng **39/100**, trang chủ **50/100** (yếu nhất: Uy tín 2/15, Hình ảnh 3/15, Độ sâu 5/15).

| Truy vấn | Loại trang đang xếp hạng | Trang Cao Gia | Khoảng cách |
|---|---|---|---|
| WW240 vs WW320 | 10/10 bài so sánh của nhà xuất khẩu VN | Không có | Thiếu loại trang |
| S16 vs S18 | ~8/10 hướng dẫn (TCVN 4193:2014, bảng sàng) | Không có | Thiếu loại trang |
| vietnamese cashew exporter | 5/9 trang chủ/danh mục chuyên hạt điều (~3.500 từ) | Trang chủ gộp cà phê + điều | Thiếu trang danh mục |
| robusta s18 supplier vietnam; cashew ww320 supplier | ~90% trang sản phẩm (~1.800 từ, bảng thông số, có giá) | Trang SP ~220 từ | Đúng loại, quá mỏng |
| поставщик кешью вьетнам | Sàn B2B Nga có giá (750–770 ₽/kg) | `/ru` dịch 1:1 | Thiếu nội dung riêng thị trường |

Điểm theo chân dung người mua (/100): quản lý thu mua rang xay 59 · nhà nhập khẩu hạt 57 · thương nhân Trung Đông 48 · nhà buôn Nga 44. "Tin cậy" thấp nhất ở cả bốn (6–7/25).

**Trang nên có (theo thứ tự):** hướng dẫn cấp hạng điều và Robusta · trang danh mục `/en/cashew-kernels`, `/en/green-coffee/robusta` (1.500–2.500 từ) · file PDF thông số/COA mỗi cấp · trang thị trường Nga (yêu cầu EAEU, tuyến Vladivostok/Novorossiysk, giá FOB tham khảo), Trung Đông (tổ chức cấp Halal, Jebel Ali), EUDR · báo cáo giá/thị trường trong Insights. Form báo giá nên thêm công ty, số lượng, cảng đến, Incoterm; tin WhatsApp nên ghi sẵn cấp hạng.

---

## 9. Giới hạn của audit
- Không có dữ liệu thật từ Google (Search Console, CrUX, GA4) hay backlink (Moz) — chưa kết nối API. Hiệu năng là số đo lab.
- Website chưa được lập chỉ mục nên chưa đo được thứ hạng thật; phân tích SERP dùng công cụ tìm kiếm tổng hợp (không thấy People Also Ask, AI Overview, quảng cáo), chưa phân tích Yandex.
- Số liệu nội dung và schema đo trên bản đang chạy (commit `0bccd49`); commit `7f8114c` chưa deploy.
- File chi tiết từng mảng và ảnh chụp màn hình của lần chạy đầu đã mất khi thư mục dự án bị xoá; nội dung chính được tổng hợp lại trong báo cáo này. Kế hoạch hành động: `ACTION-PLAN.md`.
