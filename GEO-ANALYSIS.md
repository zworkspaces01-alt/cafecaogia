# GEO-ANALYSIS — Cao Gia (caogia.com)

_Ngày phân tích: 30/09/2026 · Bản phân tích: production build chạy local (`next start`, dữ liệu từ Supabase local), vì website chưa lên mạng. Các trang đã đọc bằng user-agent `OAI-SearchBot`, **không chạy JavaScript**: `/en`, `/ru`, `/ar`, `/en/about`, `/en/process`, `/en/about-ceo`, `/en/company-profile`, `/en/products/robusta-grade-1-screen-18`._

> Theo hướng dẫn chính thức của Google, tối ưu cho tìm kiếm AI **vẫn là SEO**: AI Overviews và AI Mode lấy nguồn từ chỉ mục Googlebot. Báo cáo này vì vậy xoay quanh nền tảng SEO áp dụng cho các bề mặt AI, không phải một "chiêu" riêng.

---

## 1. Điểm GEO: **58/100**

| Tiêu chí | Trọng số | Điểm | Ghi chú |
|---|---|---|---|
| Khả năng trích dẫn (citability) | 25% | 60 | FAQ và bảng thông số rõ ràng; thiếu câu định nghĩa "Cao Gia là…" có số liệu cụ thể |
| Cấu trúc dễ đọc | 20% | 65 | 1 H1/trang, tiêu đề rõ, nhưng chữ trong tiêu đề bị **dính liền** khi đọc bằng máy; tiêu đề slider làm nhiễu dàn ý |
| Đa phương tiện | 15% | 50 | Nhiều ảnh (đang là ảnh stock), chưa có video, chưa có bảng so sánh |
| Uy tín & thương hiệu | 20% | 25 | Chưa có nhắc đến thương hiệu ở bất kỳ đâu trên web; nội dung mẫu (đánh giá, đối tác, chứng nhận) chưa phải thật; không có ngày cập nhật |
| Khả năng truy cập kỹ thuật | 20% | 90 | Toàn bộ nội dung render sẵn trên server; robots.txt mở; hreflang + sitemap đầy đủ |

**Cách tính:** 0,25×60 + 0,20×65 + 0,15×50 + 0,20×25 + 0,20×90 ≈ **58**. Kỹ thuật đã tốt; điểm bị kéo xuống chủ yếu vì **thương hiệu chưa có dấu vết bên ngoài website** và **nội dung chứng minh còn là mẫu**.

## 2. Theo từng nền tảng (định tính — chưa đo bằng công cụ)

Chưa có công cụ đo (DataForSEO / SE Ranking), và website chưa công khai, nên **không chấm điểm** từng nền tảng. Đánh giá mức sẵn sàng:

| Nền tảng | Sẵn sàng | Lý do |
|---|---|---|
| Google AI Overviews / AI Mode | Trung bình | Phụ thuộc thứ hạng Google thông thường; kỹ thuật tốt nhưng tên miền mới, chưa có backlink/nhắc tên |
| ChatGPT Search | Thấp | ChatGPT hay trích Wikipedia, Reddit và nguồn uy tín; Cao Gia chưa có mặt ở đâu |
| Perplexity | Thấp | Ưu tiên thảo luận cộng đồng (Reddit) và nguồn đã được xác thực |
| Bing Copilot | Trung bình | Cần gửi sitemap lên Bing Webmaster + IndexNow sau khi lên mạng |

## 3. Truy cập của crawler AI

`robots.txt` hiện tại:

```
User-Agent: *
Allow: /
Sitemap: https://caogia.com/sitemap.xml
```

Không có quy tắc riêng cho bot nào, tức là **tất cả đều được phép**. Từng bot tương ứng với khả năng khác nhau:

| Bot | Chi phối | Trạng thái |
|---|---|---|
| Googlebot | Google Search, AI Overviews, AI Mode | ✅ Cho phép |
| OAI-SearchBot | Được trích dẫn trong **ChatGPT Search** | ✅ Cho phép |
| Claude-SearchBot | Được trích dẫn trong tìm kiếm của Claude | ✅ Cho phép |
| PerplexityBot | Tìm kiếm Perplexity | ✅ Cho phép |
| Applebot | Siri / Spotlight / Safari | ✅ Cho phép |
| GPTBot | *Chỉ huấn luyện* mô hình OpenAI | ✅ Cho phép (tuỳ chính sách bản quyền) |
| ClaudeBot | *Chỉ huấn luyện* mô hình Anthropic | ✅ Cho phép (tuỳ chọn) |
| Google-Extended | *Chỉ* Gemini/Vertex huấn luyện & grounding — **không** ảnh hưởng Google Search | ✅ Cho phép (tuỳ chọn) |
| CCBot, Applebot-Extended | *Chỉ huấn luyện* | ✅ Cho phép (tuỳ chọn) |

**Khuyến nghị:** giữ nguyên quyền cho các bot tìm kiếm. Với một nhà xuất khẩu muốn được biết tới, để mở cả bot huấn luyện cũng hợp lý. Nên thêm `Disallow: /admin` (CMS đã có `noindex`, nhưng chặn trong robots.txt giúp tiết kiệm lượt crawl).

## 4. llms.txt

**Chưa có** (`/llms.txt` → 404). Google đã xác nhận `llms.txt` **không giúp và không hại** thứ hạng hay khả năng xuất hiện trên Google Search. Chưa nhà cung cấp AI lớn nào xác nhận có dùng file này. Có thể thêm cho đủ bộ, nhưng **không nên kỳ vọng** tác động, và nó không được tính vào điểm ở trên.

## 5. Nhắc đến thương hiệu ngoài website

Tìm "Cao Gia" + coffee/cashew exporter Vietnam: **không có kết quả nào** về Cao Gia. Các kết quả trả về là đối thủ và danh sách ngành, ví dụ [efex.vn](https://efex.vn/en/blog/vietnam-coffee-production), [visimex.com](https://visimex.com/top-6-companies-exporting-high-quality-cashews-in-vietnam/), [3w-logistics.com](https://3w-logistics.com/trusted-cashew-nut-suppliers-in-vietnam/), [hello5coffee.com](https://hello5coffee.com/top-vietnamese-coffee-export-companies/), [yellowpages.com.vn](https://www.yellowpages.com.vn/categories/62680/coffee-manufacturers-and-exporters.html).

| Kênh | Hiện trạng |
|---|---|
| Wikipedia / Wikidata | Không có |
| LinkedIn (trang công ty) | Không có (CMS đã có chỗ điền link) |
| YouTube | Không có |
| Reddit / diễn đàn ngành | Không có |
| Danh bạ ngành (Yellow Pages VN, danh sách "top exporters", hiệp hội VICOFA/VINACAS) | Không có |

Đây là **đòn bẩy lớn nhất**. AI chỉ trích dẫn những thương hiệu nó đã "gặp" ở nhiều nguồn độc lập.

## 6. Các đoạn có thể được trích dẫn

**Đã tốt:**
- **FAQ trang chủ:** 7 câu hỏi dạng câu hỏi thật, câu trả lời 27–38 từ, tự đứng được một mình và có số liệu (MOQ 19,2 tấn/container, thời gian vận chuyển theo tuyến, điều khoản thanh toán). Đây là khối dễ trích nhất.
- **Trang sản phẩm:** bảng thông số (độ ẩm, tạp chất, sàng, vụ mùa) được máy đọc dễ.
- **Hồ sơ công ty:** gom pháp nhân, mã số doanh nghiệp, sản phẩm, điều khoản trên một trang, là nguồn "fact sheet" tốt.

**Còn yếu:**
- Không có câu định nghĩa thực thể ở đầu trang chủ theo kiểu *"Cao Gia là nhà xuất khẩu cà phê nhân và hạt điều có trụ sở tại Hà Nội, thành lập năm 2018…"*. Tiêu đề H1 hiện là khẩu hiệu ("Vietnam's Harvest, Delivered to Your Port"), không mang thông tin.
- Các tuyên bố quan trọng chưa có nguồn: EUDR, chứng nhận, "AFI standards". Nên dẫn tới văn bản gốc (EU 2023/1115, tiêu chuẩn AFI) và file chứng nhận PDF.
- Câu trả lời FAQ khá ngắn. Một số câu (EUDR, chất lượng) nên dài hơn, khoảng 80–150 từ, kèm quy trình cụ thể. Đây là quy ước tham khảo, **không phải yêu cầu của Google**.

## 7. Kiểm tra render phía server

✅ **Đạt.** Mọi nội dung (tiêu đề, mô tả, FAQ, thông số, giá trị số liệu) đều có sẵn trong HTML trả về, không cần chạy JavaScript: trang chủ khoảng 1.890 từ, trang sản phẩm khoảng 360 từ, cả 3 ngôn ngữ đều vậy. Animation chỉ ẩn nội dung **bằng CSS trên trình duyệt**; HTML vẫn đầy đủ, nên các crawler AI không chạy JS như GPTBot hay PerplexityBot vẫn đọc được.

⚠️ **Một lỗi thật cần sửa:** tiêu đề hai dòng được dựng bằng hai `<span>` hoặc `<br>` không có khoảng trắng. Máy đọc text ra thành **"Harvest,Delivered to Your Port"**, **"Ready to sourcefrom Vietnam?"**, **"From Farmto Export"**. Crawler, trình đọc màn hình và AI trích xuất sẽ gặp từ bị dính liền. Cách sửa: thêm khoảng trắng giữa hai dòng.

## 8. 5 thay đổi có tác động lớn nhất

| # | Việc cần làm | Vì sao (quan sát gốc) | Phụ thuộc | Cách biết đã thất bại | Chỉ số theo dõi |
|---|---|---|---|---|---|
| 1 | **Thay nội dung mẫu bằng nội dung thật** (đánh giá, đối tác, chứng nhận, CEO), hoặc tắt hiển thị | AI và người mua đều đối chiếu; tuyên bố sai làm hỏng E-E-A-T và có thể bị phản bác công khai | Không — làm trước mọi việc khác | Có người tra "Kestrel Roastery" / chứng nhận mà không thấy | Số mục "Nội dung mẫu" trên CMS → 0 |
| 2 | **Tạo dấu vết thương hiệu bên ngoài:** trang LinkedIn công ty, Google Business Profile, hồ sơ VICOFA/VINACAS, danh bạ xuất khẩu (Yellow Pages VN, VietnamExport, Kompass), một video YouTube về kho và quy trình | Mức độ được nhắc tên tương quan mạnh hơn backlink với việc được AI trích dẫn (Ahrefs, 12/2025) | Cần tên miền + email tên miền (#5) | Sau 3 tháng, tìm "Cao Gia coffee exporter" vẫn không ra trang bên thứ ba nào | Số kết quả nhắc "Cao Gia" không phải từ caogia.com |
| 3 | **Câu định nghĩa thực thể + dữ liệu có cấu trúc đầy đủ:** câu "Cao Gia là…" ở đầu trang chủ và trang Giới thiệu; bổ sung `Organization` (logo, `sameAs` trỏ tới các kênh ở #2, `foundingLocation`), `WebSite`, `BreadcrumbList`, `Person` cho CEO | AI cần xác định "Cao Gia là ai" từ một đoạn tự đứng được và từ dữ liệu có cấu trúc | `sameAs` cần #2 | Google Rich Results Test báo lỗi, hoặc AI trả lời sai năm thành lập/địa điểm | Kết quả của Rich Results Test; câu trả lời của ChatGPT/Perplexity khi hỏi "Who is Cao Gia?" |
| 4 | **Sửa khoảng trắng tiêu đề + làm sạch dàn ý:** tiêu đề các slide 2–4 của hero đang là H2 xuất hiện trước mọi section; đổi thành đoạn văn thường | Dàn ý H2 đầu trang đang là khẩu hiệu slider chứ không phải cấu trúc nội dung | Không | Công cụ xem dàn ý (headingsMap) vẫn hiện từ dính liền | Dàn ý H1/H2 đọc được thành câu |
| 5 | **Tên miền + email tên miền; gửi sitemap lên Google Search Console và Bing Webmaster (bật IndexNow)** | AI Overviews lấy nguồn từ chỉ mục Google; Copilot lấy từ chỉ mục Bing. Chưa được lập chỉ mục thì không thể được trích | Deploy | Search Console báo "Discovered – not indexed" kéo dài | Số trang được lập chỉ mục (48 URL trong sitemap) |

## 9. Dữ liệu có cấu trúc

**Hiện có:** `Organization` (tên pháp lý, tên thay thế, email, điện thoại, `foundingDate`, `taxID`, địa chỉ) trên trang chủ; `Product` trên trang sản phẩm; `FAQPage` trên trang chủ.

**Lưu ý về FAQPage:** Google đã ngừng hiển thị rich result FAQ cho **mọi** website (7/5/2026). Không cần gỡ markup này, nhưng đừng kỳ vọng nó mang lại hiển thị đặc biệt trên Google.

**Nên thêm:**
- `Organization`: `logo`, `sameAs` (LinkedIn, YouTube, hồ sơ hiệp hội khi có), `foundingLocation` (Hà Nội), `areaServed`, `knowsAbout` ("Robusta green coffee", "cashew kernels"), `founder` trỏ tới `Person` của CEO.
- `WebSite` với `inLanguage` cho từng ngôn ngữ.
- `BreadcrumbList` trên trang sản phẩm (Products → Coffee → Robusta S18).
- `Product`: `additionalProperty` (`PropertyValue`) cho từng dòng thông số; `manufacturer`/`brand` trỏ về `Organization`; `countryOfOrigin` đã có.
- `Person` trên trang CEO (tên, chức danh, `worksFor`, ảnh, `sameAs` LinkedIn), **chỉ sau khi có thông tin thật**.
- `AboutPage` / `ContactPage` cho trang Giới thiệu / Liên hệ.

## 10. Gợi ý viết lại nội dung

1. **Đầu trang chủ** (ngay dưới hero, thay đoạn "The Cao Gia Promise" hoặc thêm trước nó), khoảng 60 từ:
   > *Cao Gia is a Vietnamese exporter of green coffee and cashew kernels, based in Hanoi and registered in 2018 (enterprise code 0108270629). We supply Robusta Screen 16–18, washed Arabica from Cau Dat and cashew kernels W240/W320 to importers, roasters and food brands, shipping FOB, CFR or CIF from Vietnam with full export documentation.*
2. **FAQ EUDR:** mở rộng thành quy trình cụ thể: dữ liệu toạ độ từng lô đất, định dạng giao cho khách, hạn áp dụng theo Quy định (EU) 2023/1115, kèm link văn bản gốc.
3. **Trang sản phẩm:** thêm một đoạn trả lời trực tiếp cho câu hỏi người mua hay tìm, ví dụ *"What is Robusta Screen 18?"*: định nghĩa, khác gì S16, dùng cho sản phẩm nào, trong khoảng 80–120 từ. Thêm dòng "Specs updated: [tháng/năm], crop 2025/26".
4. **Trang Quy trình:** mỗi bước thêm một con số kiểm chứng được, như ngưỡng độ ẩm, tỉ lệ lỗi, thời gian phơi, **chỉ khi có số liệu thật**.
5. **Ngày cập nhật:** hiển thị "Last updated" trên trang sản phẩm, hồ sơ công ty và lịch mùa vụ. Nội dung mới cập nhật có khả năng được AI trích cao hơn đáng kể, theo nghiên cứu của SE Ranking.

---

_Nguồn thống kê bên thứ ba trong báo cáo (Ahrefs 12/2025 về tương quan nhắc tên thương hiệu; SE Ranking về độ mới của nội dung) chưa được kiểm chứng lại ở thời điểm viết. Google AI optimization guide: developers.google.com/search/docs/fundamentals/ai-optimization-guide._
