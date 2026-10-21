# Cao Gia — Website xuất khẩu cà phê & hạt điều

Next.js 16 (App Router, TypeScript, Tailwind CSS v4) · Cloudflare Workers (OpenNext) + D1 · Cloudinary.

## Chạy local

```bash
npm install
cp .env.example .env.local      # điền AUTH_SECRET (chuỗi ngẫu nhiên ≥ 32 ký tự) để đăng nhập CMS
npm run db:migrate:local        # tạo database D1 local (schema + nội dung khởi tạo)
npm run admin:add -- ban@example.com --local   # tài khoản CMS local
npm run dev                     # http://localhost:3000
```

`next dev` dùng database D1 local trong `.wrangler/state` (không đụng database production). Chưa cấu hình email thì form liên hệ vẫn lưu vào D1 local và ghi log ra console.

## Cấu trúc

| Đường dẫn | Nội dung |
| --- | --- |
| `src/app/[lang]/…` | Mọi trang, theo ngôn ngữ: `/en`, `/ru`, `/ar` |
| `src/i18n/dictionaries/{en,ru,ar}.ts` | **Toàn bộ chữ trên website** — `en.ts` là bản gốc, TypeScript báo lỗi nếu bản dịch thiếu |
| `src/app/actions.ts` | Server action: lưu yêu cầu báo giá vào D1 + gửi email/Telegram |
| `src/lib/site.ts` | **Thông tin pháp lý, liên hệ, số liệu, ảnh** |
| `src/components/logo.tsx`, `public/brand/` | Logo (SVG gốc, PNG nền sáng/tối, icon app) |
| `src/lib/db.ts`, `src/lib/content.ts`, `src/lib/products.ts` | Truy vấn D1 (binding `DB`) |
| `src/lib/cloudinary-loader.ts` | Loader cho `next/image` qua Cloudinary |
| `migrations/` | Schema D1 + nội dung khởi tạo (`wrangler d1 migrations`) |

## Đa ngôn ngữ (EN / RU / AR)

- URL có tiền tố ngôn ngữ; `/` tự chuyển theo cookie `NEXT_LOCALE` (khi khách chọn trên navbar) rồi đến `Accept-Language` của trình duyệt. Link cũ không có ngôn ngữ (`/products`) chuyển về `/en/products`. Cấu hình trong `next.config.ts`.
- Tiếng Ả Rập hiển thị RTL (`dir="rtl"`), dùng font IBM Plex Sans Arabic + Amiri; tiếng Nga dùng PT Serif cho chữ nghiêng.
- Dùng `Link` từ `@/components/link` (không phải `next/link`) để link nội bộ tự giữ ngôn ngữ hiện tại.
- Nội dung CMS: bản dịch RU/AR nằm ở cột `translations` (JSON) của từng bảng — xem `migrations/0001_init.sql`.

## Database (Cloudflare D1)

Toàn bộ nội dung CMS, yêu cầu báo giá và tài khoản quản trị nằm trong D1 `caogia-db` (binding `DB`). Trước 10/2026 website dùng Supabase; dữ liệu khởi tạo trong `migrations/0002_seed.sql` được dựng lại từ các migration Supabase cũ (lịch sử git có đủ), nên **các chỉnh sửa làm trực tiếp trên CMS cũ và yêu cầu báo giá cũ không được chuyển sang**.

- Thay đổi schema: thêm file `migrations/000N_ten.sql` (SQLite), chạy `npm run db:migrate:local` để thử, `npm run deploy` (hoặc Workers Builds) tự áp lên production.
- Truy vấn nhanh production: `npx wrangler d1 execute DB --remote --command "select status, count(*) from inquiries group by status"`.
- D1 không có RLS: mọi trang/actions công khai chỉ đọc bản ghi `published = 1`; mọi thao tác ghi của CMS đi qua `requireAdmin()`.
- Sao lưu: D1 có Time Travel (khôi phục về thời điểm bất kỳ trong 7 ngày với gói Free, 30 ngày với gói Paid): `npx wrangler d1 time-travel restore caogia-db --timestamp=…`.

Mỗi yêu cầu báo giá lưu kèm `locale` để đội sales trả lời đúng ngôn ngữ của khách.

## Email thông báo yêu cầu báo giá

Tạo tài khoản [Resend](https://resend.com), xác minh tên miền gửi, rồi đặt `RESEND_API_KEY`, `INQUIRY_FROM_EMAIL`, `INQUIRY_NOTIFY_TO` (xem `.env.example`). Yêu cầu được coi là gửi thành công nếu lưu được vào database **hoặc** gửi được email. Lưu ý: không thể dùng địa chỉ Gmail làm người gửi — cần tên miền riêng.

## Email tự động cho khách

Khách gửi form báo giá thành công sẽ nhận email xác nhận từ `davidcao.cg@gmail.com` (gửi qua Gmail API), theo ngôn ngữ khách đang xem: Anh, Nga hoặc Ả Rập. Thư cảm ơn, nhắc tên sản phẩm, hẹn trả lời trong 1 ngày làm việc và ghi số WhatsApp — không chép lại nội dung khách viết. Khách trả lời thư thì thư về hộp `davidcao.cg@gmail.com`. Gửi lỗi thì báo vào topic “Hệ thống” trên Telegram; yêu cầu báo giá vẫn được ghi nhận. Chưa cài đặt thì website chỉ bỏ qua bước này.

Cài đặt một lần, đăng nhập Google bằng `davidcao.cg@gmail.com`:

1. [Google Cloud Console](https://console.cloud.google.com) → tạo project mới (ví dụ “Cao Gia Website”).
2. **APIs & Services → Library** → tìm **Gmail API** → Enable.
3. **Google Auth Platform** (OAuth consent screen) → Get started: tên ứng dụng “Cao Gia Website”, email hỗ trợ, Audience **External**. Sau đó vào **Audience → Publish app** để chuyển sang *In production* — nếu để *Testing*, token hết hạn sau 7 ngày.
4. **Clients → Create client** → Application type **Desktop app** → lưu lại Client ID và Client secret.
5. Trên máy: `npm run gmail:auth` → dán Client ID và secret → trình duyệt mở ra, đăng nhập `davidcao.cg@gmail.com`. Google báo *“Google hasn’t verified this app”* → **Advanced → Go to Cao Gia Website** → cho phép quyền gửi email. Script in ra refresh token và hỏi có gửi thư thử không.
6. Lưu 3 secret lên Cloudflare: `npx wrangler secret put GMAIL_CLIENT_ID`, `npx wrangler secret put GMAIL_CLIENT_SECRET`, `npx wrangler secret put GMAIL_REFRESH_TOKEN`. Địa chỉ gửi `GMAIL_SENDER` đã có trong `wrangler.jsonc`.

Quyền cấp chỉ cho phép **gửi** thư, không đọc được hộp thư. Gmail cá nhân gửi tối đa khoảng 500 thư/ngày. Token mất hiệu lực khi đổi mật khẩu Google, thu hồi quyền ở [myaccount.google.com/permissions](https://myaccount.google.com/permissions), hoặc 6 tháng không gửi thư nào — Telegram sẽ báo lỗi `invalid_grant`, khi đó làm lại bước 5–6.

## Cloudinary

Đặt `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`. Trường `image`/`gallery` của sản phẩm nhận:

- Public ID Cloudinary: `caogia/products/robusta-s18` (khuyến nghị)
- URL Cloudinary đầy đủ, hoặc bất kỳ URL ảnh nào (được proxy qua Cloudinary fetch nếu bật trong Settings → Security)

Ảnh hiện tại là ảnh minh hoạ từ Unsplash (`photos` trong `src/lib/site.ts`) — thay bằng ảnh thật của Cao Gia.

## Deploy lên Cloudflare Workers

Website chạy trên Worker `cafecaogia` (OpenNext). Mỗi lần push lên `main`, Cloudflare Workers Builds (Git integration của Cloudflare) tự build và deploy.

### Thiết lập một lần

```bash
npx wrangler login
npx wrangler kv namespace create caogia-opennext-cache  # cache trang — chép "id" vào kv_namespaces trong wrangler.jsonc
npx wrangler d1 create caogia-db                        # nội dung CMS — chép "database_id" vào wrangler.jsonc
npx wrangler d1 create caogia-tag-cache                 # cache tag của Next — chép "database_id" vào wrangler.jsonc, rồi commit
openssl rand -base64 48 | npx wrangler secret put AUTH_SECRET   # ký cookie đăng nhập CMS
# Secret của Worker (giá trị lấy từ .env.local / Vercel → Settings → Environment Variables cũ)
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put INQUIRY_FROM_EMAIL
npx wrangler secret put INQUIRY_NOTIFY_TO
npx wrangler secret put CLOUDINARY_API_KEY
npx wrangler secret put CLOUDINARY_API_SECRET
npx wrangler secret put GMAIL_CLIENT_ID
npx wrangler secret put GMAIL_CLIENT_SECRET
npx wrangler secret put GMAIL_REFRESH_TOKEN
npx wrangler secret put TELEGRAM_BOT_TOKEN
npm run deploy                                          # lần deploy đầu, từ máy (áp migration D1 rồi deploy)
npm run admin:add -- email-cua-ban@example.com          # tài khoản CMS đầu tiên
```

Cài đặt Workers Builds (Workers & Pages → `cafecaogia` → Settings → Build):

- **Build command:** `npx opennextjs-cloudflare build` — không dùng `npm run build` (chỉ ra bản Next thường, không có `.open-next/worker.js`).
- **Deploy command:** `npx wrangler d1 migrations apply DB --remote && npx opennextjs-cloudflare deploy` (áp migration mới trong `migrations/` trước khi deploy)
- **Build variables:** `NEXT_PUBLIC_SITE_URL=https://www.cafecaogia.com`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=dq6mmebqr` (Next nhúng lúc build).
- Tên Worker phải là `cafecaogia`, trùng `name` trong `wrangler.jsonc`.

### Chuyển tên miền từ Vercel

1. Cloudflare Dashboard → **Add a domain** → `cafecaogia.com` (gói Free). Kiểm tra các bản ghi DNS được quét về, nhất là bản ghi **MX/TXT của email** — phải giữ nguyên.
2. Tại Tenten (nhà đăng ký tên miền), đổi nameserver sang 2 nameserver Cloudflare đưa ra. Chờ Cloudflare báo **Active**.
3. Workers & Pages → `cafecaogia` → Settings → **Domains & Routes** → Add → Custom domain: thêm `www.cafecaogia.com` và `cafecaogia.com` (Cloudflare tự thay bản ghi A/CNAME cũ trỏ về Vercel).
4. Mở https://www.cafecaogia.com, kiểm tra trang, CMS và form báo giá. Ổn rồi thì tắt Git integration của project trên Vercel để không còn deploy song song.

### Ghi chú

- Tên miền chính là `https://www.cafecaogia.com` (giữ như trên Vercel để không đổi canonical); `cafecaogia.com` chuyển hướng 308 sang `www` (trong `next.config.ts`).
- Biến public (`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`) nằm trong `vars` của `wrangler.jsonc` **và** phải có lúc build (trong `.env.local` hoặc Build variables của Workers Builds), vì Next nhúng chúng vào bundle. Riêng `NEXT_PUBLIC_SITE_URL`: bản build production bỏ qua giá trị `localhost` và dùng tên miền chính thức (khai báo trong `src/lib/site.ts`).
- Build không đọc database: D1 chỉ truy cập được trong Worker, nên các trang được dựng ở lượt xem đầu tiên rồi lưu cache (ISR) — `generateStaticParams` trả về `[]`. `sitemap.xml` và `robots.txt` tạo theo từng request.
- `npm run preview` để chạy thử bản build trên runtime Workers ở local (lệnh này nạp sẵn cache trang tĩnh; chạy `wrangler dev` trực tiếp sẽ báo 404 cho các trang tĩnh).
- Lưu trong CMS làm mới website ngay (KV lưu trang đã dựng, D1 lưu tag cache, Durable Object làm hàng đợi dựng lại trang). Ngoài ra trang tự làm mới mỗi ngày — không để ngắn hơn khi còn ở gói Workers Free, vì mỗi lần dựng lại là một lượt ghi KV (giới hạn 1.000 lượt/ngày).
- Ảnh vẫn ở Cloudinary nên website không cần R2.

## CMS — trang quản trị `/admin`

Quản lý bằng tiếng Việt: **Sản phẩm, Đánh giá, Đối tác, Chứng nhận, Đội ngũ & CEO, Cài đặt công ty** (pháp nhân, liên hệ, WhatsApp, mạng xã hội, hiệp hội, số liệu) và **Yêu cầu báo giá** (lọc theo trạng thái, trả lời nhanh qua email/WhatsApp).

- Nội dung có 3 ngôn ngữ: nhập bản tiếng Anh, rồi chuyển tab Tiếng Nga / Tiếng Ả Rập để dịch; để trống thì website dùng bản tiếng Anh.
- Ảnh và PDF tải thẳng lên Cloudinary từ form (cần `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`), hoặc dán đường dẫn.
- Bấm Lưu là website cập nhật ngay (không cần deploy lại).
- **Nội dung mẫu:** dữ liệu khởi tạo có đánh dấu "Nội dung mẫu" (tên người, công ty đều tự đặt). Trang Tổng quan liệt kê những mục còn là mẫu — thay bằng thông tin thật rồi bỏ đánh dấu. Tắt "Hiển thị trên website" để ẩn một mục mà không xoá.

### Tài khoản quản trị

Đăng nhập bằng email + mật khẩu. Mật khẩu lưu dạng băm PBKDF2 trong bảng `admin_users`, phiên đăng nhập là cookie ký bằng `AUTH_SECRET` (14 ngày).

1. Đặt secret một lần: `openssl rand -base64 48 | npx wrangler secret put AUTH_SECRET` (đổi secret này = đăng xuất mọi người).
2. Tạo tài khoản hoặc đặt lại mật khẩu: `npm run admin:add -- email-cua-ban@example.com` (hỏi mật khẩu, ghi vào D1 production; thêm `--local` cho database local).
3. Mở `https://www.cafecaogia.com/admin` và đăng nhập.

Xoá quyền: `npx wrangler d1 execute DB --remote --command "delete from admin_users where email = 'x@example.com'"` — phiên của người đó hết hiệu lực ngay.

### Thông báo Telegram

CMS → **Thông báo**: gửi thông báo vào từng topic của một nhóm Telegram (bật Topics):

| Loại | Khi nào |
|---|---|
| Yêu cầu báo giá mới | Form liên hệ gửi thành công — có thể tách riêng topic cà phê / hạt điều |
| Tiến độ đơn hàng | Đổi trạng thái yêu cầu (đã liên hệ, đã báo giá, chốt đơn, không thành) |
| Nội dung CMS | Ai thêm / sửa / xoá nội dung |
| Hệ thống & cảnh báo | Lưu cài đặt, SEO, mã đo lường; yêu cầu báo giá không lưu được vào database |

Token bot (từ @BotFather) đặt ở biến môi trường `TELEGRAM_BOT_TOKEN` — Cloudflare: `npx wrangler secret put TELEGRAM_BOT_TOKEN`. **Không** nhập token vào CMS: cài đặt CMS được đọc khi dựng trang công khai. Nhóm và topic chọn trong CMS (nút “Dò nhóm & topic”, hoặc dán link topic). Telegram là kênh nhận yêu cầu báo giá thứ ba: yêu cầu được coi là gửi thành công nếu lưu vào database, gửi email **hoặc** gửi Telegram được.

### SEO & phân tích

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
