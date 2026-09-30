# Cao Gia — Website xuất khẩu cà phê & hạt điều

Next.js 16 (App Router, TypeScript, Tailwind CSS v4) · Supabase · Cloudinary · Cloudflare Workers (OpenNext).

## Chạy local

```bash
npm install
cp .env.example .env.local   # có thể để trống, site sẽ dùng dữ liệu mẫu
npm run dev                  # http://localhost:3000
```

Khi chưa cấu hình Supabase, danh mục sản phẩm lấy từ `src/data/products.ts`, và form liên hệ chỉ ghi log ra console (ở chế độ dev).

## Cấu trúc

| Đường dẫn | Nội dung |
| --- | --- |
| `src/app/[lang]/…` | Mọi trang, theo ngôn ngữ: `/en`, `/ru`, `/ar` |
| `src/i18n/dictionaries/{en,ru,ar}.ts` | **Toàn bộ chữ trên website** — `en.ts` là bản gốc, TypeScript báo lỗi nếu bản dịch thiếu |
| `src/data/product-translations.ts` | Bản dịch RU/AR của danh mục mẫu |
| `src/app/actions.ts` | Server action: lưu yêu cầu báo giá vào Supabase + gửi email |
| `src/lib/site.ts` | **Thông tin pháp lý, liên hệ, số liệu, ảnh** |
| `src/components/logo.tsx`, `public/brand/` | Logo (SVG gốc, PNG nền sáng/tối, icon app) |
| `src/lib/products.ts` | Đọc sản phẩm từ Supabase (hoặc dữ liệu mẫu) |
| `src/lib/cloudinary-loader.ts` | Loader cho `next/image` qua Cloudinary |
| `supabase/` | Migration schema + seed |

## Đa ngôn ngữ (EN / RU / AR)

- URL có tiền tố ngôn ngữ; `/` tự chuyển theo cookie `NEXT_LOCALE` (khi khách chọn trên navbar) rồi đến `Accept-Language` của trình duyệt. Link cũ không có ngôn ngữ (`/products`) chuyển về `/en/products`. Cấu hình trong `next.config.ts`.
- Tiếng Ả Rập hiển thị RTL (`dir="rtl"`), dùng font IBM Plex Sans Arabic + Amiri; tiếng Nga dùng PT Serif cho chữ nghiêng.
- Dùng `Link` từ `@/components/link` (không phải `next/link`) để link nội bộ tự giữ ngôn ngữ hiện tại.
- Sản phẩm trên Supabase: bản dịch nằm ở cột `translations` (jsonb) — xem `supabase/migrations/0002_i18n.sql`.

## Supabase

1. Tạo project trên supabase.com.
2. SQL Editor → chạy lần lượt `supabase/migrations/0001_init.sql`, `0002_i18n.sql`, rồi `supabase/seed.sql`.
3. Lấy `Project URL` và publishable key (hoặc anon key) điền vào `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (tên cũ `SUPABASE_URL`, `SUPABASE_ANON_KEY` vẫn được chấp nhận). **Không** dùng khoá `service_role`/`secret`. Nếu không khai báo, website dùng URL + publishable key của project production ghi sẵn trong `src/lib/supabase-env.ts` (hai giá trị này công khai theo thiết kế của Supabase). Đặt `SUPABASE_DISABLED=1` để chạy bằng nội dung mẫu.

RLS chỉ cho phép khách **đọc sản phẩm đã publish** và **gửi** (không đọc được) yêu cầu báo giá.
Quản lý sản phẩm và xem yêu cầu báo giá trong Table Editor của Supabase (cột `status`: new → contacted → quoted → won/lost).

Mỗi yêu cầu báo giá lưu kèm `locale` để đội sales trả lời đúng ngôn ngữ của khách.

## Email thông báo yêu cầu báo giá

Tạo tài khoản [Resend](https://resend.com), xác minh tên miền gửi, rồi đặt `RESEND_API_KEY`, `INQUIRY_FROM_EMAIL`, `INQUIRY_NOTIFY_TO` (xem `.env.example`). Yêu cầu được coi là gửi thành công nếu lưu được vào Supabase **hoặc** gửi được email. Lưu ý: không thể dùng địa chỉ Gmail làm người gửi — cần tên miền riêng.

Sửa dữ liệu mẫu trong `src/data/products.ts` thì chạy `npm run seed:generate` để sinh lại `seed.sql`.

## Cloudinary

Đặt `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`. Trường `image`/`gallery` của sản phẩm nhận:

- Public ID Cloudinary: `caogia/products/robusta-s18` (khuyến nghị)
- URL Cloudinary đầy đủ, hoặc bất kỳ URL ảnh nào (được proxy qua Cloudinary fetch nếu bật trong Settings → Security)

Ảnh hiện tại là ảnh minh hoạ từ Unsplash (`photos` trong `src/lib/site.ts`) — thay bằng ảnh thật của Cao Gia.

## Deploy lên Cloudflare Workers

```bash
npx wrangler login
npx wrangler r2 bucket create caogia-opennext-cache     # cache trang (chạy 1 lần)
npx wrangler d1 create caogia-tag-cache                 # chép "database_id" vào wrangler.jsonc (chạy 1 lần)
npx wrangler secret put SUPABASE_URL
npx wrangler secret put SUPABASE_ANON_KEY
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
npm run deploy
```

- Biến public (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`) nằm trong `vars` của `wrangler.jsonc` **và** phải có lúc build (trong `.env.local` hoặc biến môi trường CI), vì Next nhúng chúng vào bundle. Riêng `NEXT_PUBLIC_SITE_URL`: bản build production bỏ qua giá trị `localhost` và dùng tên miền chính thức `https://cafecaogia.com` (khai báo trong `src/lib/site.ts`).
- `npm run preview` để chạy thử bản build trên runtime Workers ở local (lệnh này nạp sẵn cache trang tĩnh; chạy `wrangler dev` trực tiếp sẽ báo 404 cho các trang tĩnh).
- Lưu trong CMS làm mới website ngay (R2 lưu trang, D1 lưu tag cache, Durable Object làm hàng đợi dựng lại trang). Ngoài ra trang tự làm mới mỗi 1 giờ.
- Gắn tên miền: Cloudflare Dashboard → Workers → `caogia` → Settings → Domains & Routes.

## CMS — trang quản trị `/admin`

Quản lý bằng tiếng Việt: **Sản phẩm, Đánh giá, Đối tác, Chứng nhận, Đội ngũ & CEO, Cài đặt công ty** (pháp nhân, liên hệ, WhatsApp, mạng xã hội, hiệp hội, số liệu) và **Yêu cầu báo giá** (lọc theo trạng thái, trả lời nhanh qua email/WhatsApp).

- Nội dung có 3 ngôn ngữ: nhập bản tiếng Anh, rồi chuyển tab Tiếng Nga / Tiếng Ả Rập để dịch; để trống thì website dùng bản tiếng Anh.
- Ảnh và PDF tải thẳng lên Cloudinary từ form (cần `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), hoặc dán đường dẫn.
- Bấm Lưu là website cập nhật ngay (không cần deploy lại).
- **Nội dung mẫu:** dữ liệu khởi tạo có đánh dấu "Nội dung mẫu" (tên người, công ty đều tự đặt). Trang Tổng quan liệt kê những mục còn là mẫu — thay bằng thông tin thật rồi bỏ đánh dấu. Tắt "Hiển thị trên website" để ẩn một mục mà không xoá.

### Cài đặt lần đầu

1. Supabase → SQL Editor: chạy lần lượt `supabase/migrations/0001_init.sql`, `0002_i18n.sql`, `0003_cms.sql`, rồi `supabase/seed.sql` (nội dung mẫu).
2. Supabase → Authentication → Users → **Add user** (email + mật khẩu, chọn Auto Confirm).
3. Cấp quyền quản trị cho email đó (SQL Editor):
   ```sql
   insert into public.admin_users (email) values ('email-cua-ban@example.com');
   ```
4. Mở `https://<tên-miền>/admin` và đăng nhập.

Chạy thử ở máy: `npx supabase start` (cần Docker) tạo database local với đủ migration + seed; dùng URL và `ANON_KEY` nó in ra cho `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.

Sửa nội dung mẫu trong code (`src/data/samples.ts`, `src/data/products.ts`) thì chạy `npm run seed:generate` để sinh lại `supabase/seed.sql`.

### Thông báo Telegram

CMS → **Thông báo**: gửi thông báo vào từng topic của một nhóm Telegram (bật Topics):

| Loại | Khi nào |
|---|---|
| Yêu cầu báo giá mới | Form liên hệ gửi thành công — có thể tách riêng topic cà phê / hạt điều |
| Tiến độ đơn hàng | Đổi trạng thái yêu cầu (đã liên hệ, đã báo giá, chốt đơn, không thành) |
| Nội dung CMS | Ai thêm / sửa / xoá nội dung |
| Hệ thống & cảnh báo | Lưu cài đặt, SEO, mã đo lường; yêu cầu báo giá không lưu được vào database |

Token bot (từ @BotFather) đặt ở biến môi trường `TELEGRAM_BOT_TOKEN` — Cloudflare: `npx wrangler secret put TELEGRAM_BOT_TOKEN`. **Không** nhập token vào CMS: bảng `site_settings` đọc công khai. Nhóm và topic chọn trong CMS (nút “Dò nhóm & topic”, hoặc dán link topic). Telegram là kênh nhận yêu cầu báo giá thứ ba: yêu cầu được coi là gửi thành công nếu lưu vào database, gửi email **hoặc** gửi Telegram được.

### SEO & phân tích

Cần chạy `supabase/migrations/0006_seo_analytics.sql` (thêm tiêu đề/mô tả SEO cho sản phẩm và lưu nguồn khách hàng kèm yêu cầu báo giá). Website vẫn chạy nếu chưa chạy migration, chỉ là hai tính năng đó chưa hoạt động.

- **CMS → SEO:** danh sách kiểm tra nhanh, bật/tắt lập chỉ mục (tắt = `noindex` + robots.txt chặn toàn bộ), mã xác minh Google / Bing / Yandex, ảnh chia sẻ mặc định, tiêu đề + mô tả từng trang theo từng ngôn ngữ (có xem trước kết quả Google). Tiêu đề/mô tả SEO của sản phẩm sửa trong từng sản phẩm.
- **CMS → Phân tích:** báo cáo yêu cầu báo giá theo kênh (tìm kiếm, quảng cáo, mạng xã hội, trợ lý AI…), nguồn, trang vào đầu tiên, sản phẩm, ngôn ngữ; và ô nhập mã GA4, Google Tag Manager, Meta Pixel, Yandex Metrica, Microsoft Clarity, Cloudflare Web Analytics. Script chỉ nạp ở bản production.
- Sự kiện chuyển đổi gửi tự động tới các công cụ đã kết nối: `generate_lead` (gửi form), `whatsapp_click`, `email_click`, `phone_click`.
- Nguồn truy cập (UTM, gclid/fbclid, trang giới thiệu) được lưu 90 ngày trên trình duyệt khách và gửi kèm yêu cầu báo giá — hiện ở CMS và trong email thông báo.

## Trước khi ra mắt

- [ ] Email tên miền (ví dụ `sales@cafecaogia.com`) — cập nhật trong CMS → Cài đặt công ty
- [ ] Thay toàn bộ **nội dung mẫu** (xem danh sách ở CMS → Tổng quan)
- [ ] CMS → SEO: xác minh Google Search Console (và Bing, Yandex), gửi `sitemap.xml`; CMS → Phân tích: điền mã GA4
- [ ] Nếu chạy quảng cáo nhắm EU: thêm banner đồng ý cookie (GDPR) trước khi bật Meta Pixel / Clarity
- [ ] Ảnh thật (kho, phân loại, đóng container, phòng QC) thay ảnh Unsplash
- [ ] Bổ sung ngành nghề bán buôn/xuất khẩu nông sản trong đăng ký doanh nghiệp
- [ ] Kiểm tra thông số sản phẩm, điều kiện giao dịch, lịch mùa vụ, nội dung EUDR với thực tế
- [ ] Nhờ người bản ngữ Nga / Ả Rập đọc lại bản dịch

### Tiêu chuẩn Robusta (09/2026)

Chạy `supabase/migrations/0007_robusta_standards.sql` để cập nhật database đang chạy theo tiêu chuẩn xuất khẩu mới: thông số Robusta loại 1 sàng 18 / sàng 16, loại 2 sàng 13, và thêm sản phẩm Robusta chế biến ướt special loại 1 (gắn nhãn “Mẫu” cho đến khi duyệt mô tả và ảnh). Chỉ ghi đè thông số và số lượng tối thiểu (kèm bản tiếng Nga, Ả Rập); các chỉnh sửa khác trong CMS được giữ. Chạy nhiều lần không sao.
