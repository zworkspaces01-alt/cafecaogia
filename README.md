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
- D1 không có RLS: mọi trang/actions công khai chỉ đọc bản ghi `published = 1`; mọi thao tác ghi của CMS đi qua `requireAdmin()` / `allowed()` (theo vai trò).
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
- Xuất bản (hoặc lưu cài đặt) trong CMS làm mới website ngay (KV lưu trang đã dựng, D1 lưu tag cache, Durable Object làm hàng đợi dựng lại trang). Ngoài ra trang tự làm mới mỗi ngày — không để ngắn hơn khi còn ở gói Workers Free, vì mỗi lần dựng lại là một lượt ghi KV (giới hạn 1.000 lượt/ngày).
- Ảnh vẫn ở Cloudinary nên website không cần R2.

## CMS — Cao Gia Studio (`/admin`)

Dựng theo mô hình VSAP Studio: một khung chung gồm **thanh trên** (trạng thái lưu, hoàn tác/làm lại, nút **Xuất bản**, tài khoản) và **cột biểu tượng** bên trái để chuyển mục. Quản lý bằng tiếng Việt, nội dung 3 ngôn ngữ.

| Mục | Nội dung |
| --- | --- |
| Tổng quan | Số liệu, nội dung mẫu cần thay, yêu cầu báo giá gần đây |
| Trang | Page builder 3 cột (xem bên dưới) |
| Sản phẩm, Bài viết, Đánh giá, Đối tác, Chứng nhận, Đội ngũ | 3 cột: danh sách (kéo thả để sắp xếp, tìm kiếm) · form của mục đang chọn (EN/RU/AR) · xem trước trang thật có bản nháp |
| Thư viện ảnh | Ảnh/PDF tải lên Cloudinary (thư mục `caogia/`): kéo thả để tải, chép link, xoá. Mọi ô ảnh có nút “Thư viện” để chọn ảnh có sẵn |
| Lịch sử | 50 lần xuất bản gần nhất; **Hoàn tác** nạp lại trạng thái trước lần đó vào bản nháp |
| Báo giá | Hộp thư 2 cột: lọc theo trạng thái, tìm kiếm, ghi chú nội bộ, trả lời email/WhatsApp, xuất CSV (mở bằng Excel). Huy hiệu đỏ = số yêu cầu mới |
| Công ty, SEO, Phân tích | Cài đặt — lưu là áp dụng ngay (không qua bản nháp) |
| Tài khoản, Nhật ký, Thông báo | Chỉ Quản trị |

- **Bản nháp → Xuất bản.** Mọi chỉnh sửa trang và bản ghi tự lưu thành bản nháp (⌘S lưu ngay; ⌘Z / ⇧⌘Z hoàn tác / làm lại), khách vẫn thấy bản đang chạy. Nút **Xuất bản** ở thanh trên hiện số thay đổi đang chờ; bấm vào để xem danh sách, bỏ chọn mục chưa muốn đưa lên, ghi chú, rồi xuất bản (hoặc bỏ các thay đổi đã chọn). Lần xuất bản đó được lưu vào Lịch sử, báo vào Telegram (topic Nội dung) và gửi IndexNow cho sản phẩm/bài viết.
- Mục mới chỉ có trong bản nháp cho tới lần xuất bản đầu; xoá một mục = đánh dấu “Sẽ xoá”, website chỉ xoá khi xuất bản. Thiếu trường bắt buộc hay trùng đường dẫn (slug) thì form báo trước và Xuất bản từ chối mục đó.
- Khung xem trước là `/{lang}/preview/{trang}` (chỉ người đăng nhập mở được, không lập chỉ mục): trang thật với **mọi** bản nháp cùng lúc — trang, sản phẩm, bài viết, đánh giá… (`src/lib/preview.ts`). Có chế độ máy tính 1440px / máy tính bảng 820px / điện thoại 390px.
- Studio cần màn hình ≥ 1024px cho các trình sửa 3 cột; hộp thư Báo giá dùng được trên điện thoại.
- Nội dung có 3 ngôn ngữ: nhập bản tiếng Anh, rồi chuyển EN / RU / AR để dịch; để trống thì website dùng bản tiếng Anh.
- **Nội dung mẫu:** dữ liệu khởi tạo có đánh dấu "Nội dung mẫu". Trang Tổng quan liệt kê những mục còn là mẫu — thay bằng thông tin thật rồi bỏ đánh dấu. Tắt "Hiển thị trên website" để ẩn một mục mà không xoá.
- Bảng D1: `record_drafts` (nháp của bản ghi), `releases` (lịch sử xuất bản), `audit_log`, cột `role`/`name`/`disabled`/`sessions_from` của `admin_users`, cột `note` của `inquiries` — `migrations/0005_studio.sql`.

### Trang (page builder)

Mỗi trang là danh sách khối (hero, thẻ, FAQ, bảng số liệu, nút báo giá…) có nội dung EN/RU/AR.

- **Trang hệ thống** (Trang chủ, Giới thiệu, Quy trình, …, mẫu trang sản phẩm/bài viết, header & footer): chưa sửa thì hiển thị bố cục mặc định lấy từ `src/i18n/dictionaries`.
- **Trang tự tạo** (Trang › Tất cả trang): nằm ở `/{lang}/{slug}`, ẩn cho tới lần xuất bản đầu tiên; không được trùng các đường dẫn đã có (`reservedSlugs` trong `src/lib/blocks/types.ts`).
- 3 cột: **danh sách khối** (ô “Trang đang sửa” để chuyển trang; kéo thả để sắp xếp, ẩn/hiện) · **nội dung khối đang chọn** theo từng ngôn ngữ, hoặc *Cài đặt trang & SEO* · **xem trước**. Bấm vào một khối trong khung xem trước để chọn nó; chọn khối trong danh sách thì khung xem trước cuộn tới.
- Nút **Phiên bản** trên thanh trên: nạp một lần xuất bản cũ của trang (hoặc bố cục mặc định) vào bản nháp. *Bỏ thay đổi trang này* quay về bản đang chạy.
- Bảng D1: `pages`, `page_drafts`, `page_versions` (`migrations/0003_page_builder.sql`, ghi chú xuất bản: `0004`).

### Tài khoản & phân quyền

Đăng nhập bằng email + mật khẩu. Mật khẩu lưu dạng băm PBKDF2 trong bảng `admin_users`, phiên đăng nhập là cookie ký bằng `AUTH_SECRET` (14 ngày).

| Vai trò | Được làm |
| --- | --- |
| Quản trị | Mọi thứ, kể cả tài khoản, thông báo Telegram, nhật ký |
| Biên tập chính | Sửa và xuất bản nội dung, hoàn tác/khôi phục, xoá ảnh, cài đặt Công ty / SEO / Phân tích, xử lý báo giá |
| Biên tập viên | Sửa bản nháp, tải ảnh; không xuất bản |
| Kinh doanh | Chỉ hộp thư Báo giá |

Quyền được kiểm tra ở từng server action (`src/lib/admin/roles.ts`, `allowed()` trong `src/lib/admin/auth.ts`); giao diện chỉ ẩn những nút không dùng được.

1. Đặt secret một lần: `openssl rand -base64 48 | npx wrangler secret put AUTH_SECRET` (đổi secret này = đăng xuất mọi người).
2. Tài khoản đầu tiên (vai trò Quản trị) hoặc đặt lại mật khẩu khi bị khoá ngoài: `npm run admin:add -- email-cua-ban@example.com` (hỏi mật khẩu, ghi vào D1 production; thêm `--local` cho database local).
3. Các tài khoản khác tạo trong Studio › **Tài khoản**: chọn vai trò, khoá/mở khoá, đặt lại mật khẩu. Đổi vai trò, khoá hay đổi mật khẩu sẽ đăng xuất người đó ngay. Luôn phải còn ít nhất một Quản trị đang hoạt động; không tự đổi vai trò hay tự khoá được. Ai cũng tự đổi mật khẩu được (menu tài khoản góc phải).
4. Studio › **Nhật ký** ghi đăng nhập (cả sai mật khẩu), xuất bản, bỏ nháp, hoàn tác, cài đặt, tài khoản, xử lý báo giá. Sai mật khẩu 8 lần trong 15 phút sẽ khoá tạm email đó.

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
