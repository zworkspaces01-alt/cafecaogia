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
3. Lấy `Project URL` và publishable key (hoặc anon key) điền vào `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (tên cũ `SUPABASE_URL`, `SUPABASE_ANON_KEY` vẫn được chấp nhận). **Không** dùng khoá `service_role`/`secret`.

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

- Biến public (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`) nằm trong `vars` của `wrangler.jsonc` **và** phải có lúc build (trong `.env.local` hoặc biến môi trường CI), vì Next nhúng chúng vào bundle.
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

## Trước khi ra mắt

- [ ] Tên miền + email tên miền (ví dụ `sales@caogia.vn`) — cập nhật trong CMS → Cài đặt công ty và `NEXT_PUBLIC_SITE_URL`
- [ ] Thay toàn bộ **nội dung mẫu** (xem danh sách ở CMS → Tổng quan)
- [ ] Ảnh thật (kho, phân loại, đóng container, phòng QC) thay ảnh Unsplash
- [ ] Bổ sung ngành nghề bán buôn/xuất khẩu nông sản trong đăng ký doanh nghiệp
- [ ] Kiểm tra thông số sản phẩm, điều kiện giao dịch, lịch mùa vụ, nội dung EUDR với thực tế
- [ ] Nhờ người bản ngữ Nga / Ả Rập đọc lại bản dịch
