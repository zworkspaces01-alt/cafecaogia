// The block catalog the editor offers: what each block is called and which of its fields are editable.
// Client-safe. Keys not listed in `fields` (e.g. screen-reader labels) are kept in the content as is.

import type { BlockSchema, Field } from "@/lib/blocks/types";

const heading = (description = true): Field[] => [
  { name: "eyebrow", label: "Nhãn nhỏ phía trên", type: "text" },
  { name: "title", label: "Tiêu đề", type: "text" },
  { name: "accent", label: "Tiêu đề (dòng nghiêng)", type: "text" },
  ...(description ? [{ name: "description", label: "Mô tả", type: "textarea" } as Field] : []),
];

export const iconOptions = [
  { value: "shield", label: "Khiên (an toàn)" },
  { value: "handshake", label: "Bắt tay" },
  { value: "leaf", label: "Lá" },
  { value: "timer", label: "Đồng hồ" },
  { value: "trees", label: "Cây" },
  { value: "sprout", label: "Mầm" },
  { value: "factory", label: "Nhà máy" },
  { value: "clipboard", label: "Kiểm tra" },
  { value: "package", label: "Đóng gói" },
  { value: "ship", label: "Tàu" },
  { value: "globe", label: "Địa cầu" },
  { value: "award", label: "Giải thưởng" },
];

export const blockSchemas: BlockSchema[] = [
  // ── Homepage sections ────────────────────────────────────────────────────
  {
    type: "hero",
    label: "Hero trình chiếu",
    description: "Ảnh toàn màn hình với các slide tự chuyển và dải điểm nổi bật.",
    group: "home",
    fields: [
      {
        name: "slides",
        label: "Slide",
        type: "list",
        titleField: "label",
        fields: [
          { name: "image", label: "Ảnh nền", type: "image" },
          { name: "label", label: "Tên slide (thanh điều hướng)", type: "text" },
          { name: "eyebrow", label: "Nhãn nhỏ", type: "text" },
          { name: "title", label: "Tiêu đề", type: "text" },
          { name: "lead", label: "Dòng 2", type: "text" },
          { name: "accent", label: "Chữ nghiêng cuối", type: "text" },
          { name: "description", label: "Mô tả", type: "textarea" },
          { name: "primary", label: "Nút chính", type: "text" },
          { name: "primaryHref", label: "Link nút chính", type: "url" },
          { name: "secondary", label: "Nút phụ", type: "text" },
          { name: "secondaryHref", label: "Link nút phụ", type: "url" },
          { name: "alt", label: "Mô tả ảnh (alt)", type: "text" },
        ],
      },
      { name: "proof", label: "Điểm nổi bật dưới slide", type: "lines", help: "Dùng {year} cho năm thành lập." },
    ],
  },
  {
    type: "featuredProducts",
    label: "Sản phẩm nổi bật",
    description: "6 sản phẩm có tab lọc Cà phê / Hạt điều (lấy từ mục Sản phẩm).",
    group: "home",
    fields: heading(),
  },
  {
    type: "tradeTerms",
    label: "Điều khoản thương mại",
    description: "Các ô MOQ, tải trọng, thời gian giao, Incoterms, thanh toán, mẫu.",
    group: "home",
    fields: [
      ...heading(),
      {
        name: "items",
        label: "Các ô",
        type: "list",
        titleField: "label",
        fields: [
          { name: "label", label: "Nhãn", type: "text" },
          { name: "value", label: "Giá trị", type: "text" },
          { name: "detail", label: "Chi tiết", type: "text" },
        ],
      },
      { name: "tailoredLead", label: "Dòng cuối (câu hỏi)", type: "text" },
      { name: "tailoredEmphasis", label: "Dòng cuối (nhấn mạnh)", type: "text" },
      { name: "tailoredCta", label: "Nút dòng cuối", type: "text" },
    ],
  },
  {
    type: "aboutIntro",
    label: "Giới thiệu ngắn",
    description: "Cụm ảnh, số năm xuất khẩu và các điểm chính về công ty.",
    group: "home",
    fields: [
      ...heading(false),
      { name: "body", label: "Đoạn giới thiệu", type: "textarea" },
      { name: "points", label: "Các điểm chính", type: "lines", help: "Dùng {year} cho năm thành lập, {count} cho số mã hàng." },
      { name: "yearsLabel", label: "Chú thích số năm", type: "text" },
      { name: "cta", label: "Nút", type: "text" },
    ],
  },
  {
    type: "process",
    label: "Quy trình (tab)",
    description: "Các bước có tab và bảng số liệu; kèm số liệu thống kê trong Cài đặt công ty.",
    group: "home",
    fields: [
      ...heading(),
      {
        name: "steps",
        label: "Các bước",
        type: "list",
        titleField: "title",
        fields: [
          { name: "title", label: "Tên bước", type: "text" },
          { name: "caption", label: "Chú thích", type: "text" },
          { name: "location", label: "Địa điểm", type: "text" },
          { name: "heading", label: "Tiêu đề thẻ", type: "text" },
          { name: "big", label: "Chữ lớn", type: "text" },
          { name: "sub", label: "Dòng phụ", type: "text" },
          { name: "rows", label: "Bảng số liệu", type: "pairs" },
        ],
      },
    ],
  },
  {
    type: "compliance",
    label: "Chứng nhận & chứng từ",
    description: "Chứng nhận (lấy từ mục Chứng nhận), EUDR và danh sách chứng từ.",
    group: "home",
    fields: [
      ...heading(),
      { name: "onRequestTitle", label: "Tiêu đề khi chưa có chứng nhận", type: "text" },
      { name: "onRequestBody", label: "Nội dung khi chưa có chứng nhận", type: "textarea" },
      { name: "eudrTitle", label: "EUDR: tiêu đề", type: "text" },
      { name: "eudrAccent", label: "EUDR: chữ nghiêng", type: "text" },
      { name: "eudrBody", label: "EUDR: nội dung", type: "textarea" },
      { name: "documentsTitle", label: "Tiêu đề danh sách chứng từ", type: "text" },
      { name: "documents", label: "Chứng từ", type: "lines" },
    ],
  },
  {
    type: "photoStories",
    label: "Ảnh thực tế",
    description: "Lưới ảnh có tab theo công đoạn (lấy từ thư viện ảnh).",
    group: "home",
    fields: [...heading(), { name: "seeAll", label: "Nút xem tất cả", type: "text" }],
  },
  {
    type: "partnerSegments",
    label: "Nhóm khách hàng",
    description: "Các thẻ nhóm khách hàng có ảnh và lời mời hợp tác.",
    group: "home",
    fields: [
      ...heading(),
      {
        name: "segments",
        label: "Nhóm",
        type: "list",
        titleField: "title",
        fields: [
          { name: "image", label: "Ảnh", type: "image" },
          { name: "title", label: "Tên nhóm", type: "text" },
          { name: "body", label: "Mô tả", type: "textarea" },
          { name: "products", label: "Sản phẩm gợi ý", type: "lines" },
        ],
      },
      { name: "becomeTitle", label: "Dải cuối: tiêu đề", type: "text" },
      { name: "becomeAccent", label: "Dải cuối: chữ nghiêng", type: "text" },
      { name: "becomeBody", label: "Dải cuối: nội dung", type: "text" },
      { name: "becomeCta", label: "Dải cuối: nút", type: "text" },
    ],
  },
  {
    type: "testimonials",
    label: "Đánh giá khách hàng",
    description: "Lấy từ mục Đánh giá; tự ẩn khi chưa có đánh giá nào.",
    group: "home",
    fields: heading(),
  },
  {
    type: "industryPartners",
    label: "Dải logo đối tác",
    description: "Logo chạy ngang (lấy từ mục Đối tác).",
    group: "home",
    fields: [
      ...heading(),
      { name: "kinds.bank", label: "Nhãn ngân hàng", type: "text" },
      { name: "kinds.shipping", label: "Nhãn hãng tàu", type: "text" },
    ],
  },
  {
    type: "harvestCalendar",
    label: "Lịch mùa vụ",
    description: "Bảng 12 tháng thu hoạch và hàng mới vụ.",
    group: "home",
    fields: [...heading(), { name: "caption", label: "Chú thích", type: "text" }],
  },

  // ── Page sections ────────────────────────────────────────────────────────
  {
    type: "pageHero",
    label: "Đầu trang có ảnh",
    description: "Tiêu đề trang trên nền ảnh.",
    group: "page",
    fields: [{ name: "image", label: "Ảnh nền", type: "image" }, ...heading()],
  },
  {
    type: "story",
    label: "Chữ + 2 ảnh",
    description: "Đoạn văn bên trái, hai ảnh dọc bên phải.",
    group: "page",
    fields: [
      ...heading(false),
      { name: "paragraphs", label: "Các đoạn văn", type: "lines" },
      { name: "image1", label: "Ảnh 1", type: "image" },
      { name: "image1Alt", label: "Mô tả ảnh 1", type: "text" },
      { name: "image2", label: "Ảnh 2", type: "image" },
      { name: "image2Alt", label: "Mô tả ảnh 2", type: "text" },
    ],
  },
  {
    type: "valueCards",
    label: "Thẻ có biểu tượng",
    description: "Lưới thẻ có icon, tuỳ chọn kèm số liệu thống kê công ty.",
    group: "page",
    fields: [
      ...heading(),
      {
        name: "items",
        label: "Thẻ",
        type: "list",
        titleField: "title",
        fields: [
          { name: "icon", label: "Biểu tượng", type: "select", options: iconOptions },
          { name: "title", label: "Tiêu đề", type: "text" },
          { name: "body", label: "Nội dung", type: "textarea" },
        ],
      },
      {
        name: "showStats",
        label: "Hiện số liệu thống kê",
        type: "select",
        options: [
          { value: "yes", label: "Có" },
          { value: "no", label: "Không" },
        ],
      },
    ],
  },
  {
    type: "imageCards",
    label: "Thẻ có ảnh",
    description: "Lưới 3 thẻ ảnh có nhãn, vùng và mô tả.",
    group: "page",
    fields: [
      ...heading(),
      {
        name: "items",
        label: "Thẻ",
        type: "list",
        titleField: "name",
        fields: [
          { name: "image", label: "Ảnh", type: "image" },
          { name: "product", label: "Nhãn trên ảnh", type: "text" },
          { name: "area", label: "Dòng nhỏ", type: "text" },
          { name: "name", label: "Tiêu đề", type: "text" },
          { name: "body", label: "Nội dung", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "companyDetails",
    label: "Thông tin pháp lý",
    description: "Tên công ty, mã số doanh nghiệp, địa chỉ (từ Cài đặt công ty) và ô tra cứu.",
    group: "page",
    fields: [
      { name: "legalTitle", label: "Tiêu đề", type: "text" },
      { name: "brandNote", label: "Ghi chú thương hiệu", type: "textarea", help: "Dùng {legalName} và {year}." },
      { name: "businessLinesLabel", label: "Nhãn ngành nghề", type: "text" },
      { name: "businessLines", label: "Ngành nghề đăng ký", type: "textarea" },
      { name: "membershipsTitle", label: "Tiêu đề hội viên", type: "text" },
      { name: "verifyTitle", label: "Ô tra cứu: tiêu đề", type: "text" },
      { name: "verifyBody", label: "Ô tra cứu: nội dung", type: "textarea", help: "Dùng {code} cho mã số doanh nghiệp." },
      { name: "verifyCta", label: "Ô tra cứu: nút", type: "text" },
    ],
  },
  {
    type: "buyerVisits",
    label: "Ảnh khách đến thăm",
    description: "Lưới ảnh khách hàng đến kho, kèm nút sang thư viện ảnh.",
    group: "page",
    fields: [...heading(), { name: "galleryCta", label: "Nút", type: "text" }],
  },
  {
    type: "processSteps",
    label: "Các bước (dòng thời gian)",
    description: "Từng bước với ảnh, mô tả và các ý chính, xếp so le.",
    group: "page",
    fields: [
      { name: "step", label: "Chữ \"Bước\"", type: "text" },
      {
        name: "steps",
        label: "Các bước",
        type: "list",
        titleField: "title",
        fields: [
          { name: "image", label: "Ảnh", type: "image" },
          { name: "icon", label: "Biểu tượng", type: "select", options: iconOptions },
          { name: "title", label: "Tên bước", type: "text" },
          { name: "lead", label: "Mô tả", type: "textarea" },
          { name: "points", label: "Các ý chính", type: "lines" },
          { name: "meta", label: "Nhãn trên ảnh", type: "text" },
        ],
      },
    ],
  },
  {
    type: "productTable",
    label: "Bảng mã hàng",
    description: "Bảng các mã hàng thô của một danh mục (lấy từ mục Sản phẩm) và điều khoản thương mại.",
    group: "page",
    fields: [
      {
        name: "category",
        label: "Danh mục",
        type: "select",
        options: [
          { value: "coffee", label: "Cà phê" },
          { value: "cashew", label: "Hạt điều" },
        ],
      },
      { name: "title", label: "Tiêu đề", type: "text" },
      { name: "accent", label: "Tiêu đề (dòng nghiêng)", type: "text" },
      { name: "description", label: "Mô tả", type: "textarea" },
      { name: "termsTitle", label: "Tiêu đề điều khoản", type: "text" },
    ],
  },

  // ── Content blocks ───────────────────────────────────────────────────────
  {
    type: "richText",
    label: "Đoạn văn",
    description: "Tiêu đề và các đoạn văn.",
    group: "content",
    fields: [...heading(false), { name: "paragraphs", label: "Các đoạn văn", type: "lines" }],
  },
  {
    type: "facts",
    label: "Số liệu nổi bật",
    description: "Dải nền tối với các con số lớn.",
    group: "content",
    fields: [
      { name: "title", label: "Tiêu đề", type: "text" },
      { name: "accent", label: "Tiêu đề (dòng nghiêng)", type: "text" },
      {
        name: "items",
        label: "Số liệu",
        type: "list",
        titleField: "value",
        fields: [
          { name: "value", label: "Con số", type: "text" },
          { name: "label", label: "Chú thích", type: "text" },
        ],
      },
    ],
  },
  {
    type: "cards",
    label: "Thẻ văn bản",
    description: "Lưới thẻ tiêu đề + nội dung.",
    group: "content",
    fields: [
      { name: "title", label: "Tiêu đề", type: "text" },
      { name: "accent", label: "Tiêu đề (dòng nghiêng)", type: "text" },
      { name: "description", label: "Mô tả", type: "textarea" },
      {
        name: "tone",
        label: "Màu thẻ",
        type: "select",
        options: [
          { value: "white", label: "Trắng" },
          { value: "sand", label: "Kem" },
        ],
      },
      {
        name: "items",
        label: "Thẻ",
        type: "list",
        titleField: "title",
        fields: [
          { name: "title", label: "Tiêu đề", type: "text" },
          { name: "body", label: "Nội dung", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "dataTable",
    label: "Bảng",
    description: "Bảng 3 cột có ghi chú.",
    group: "content",
    fields: [
      { name: "title", label: "Tiêu đề", type: "text" },
      { name: "accent", label: "Tiêu đề (dòng nghiêng)", type: "text" },
      { name: "description", label: "Mô tả", type: "textarea" },
      { name: "columns", label: "Tên 3 cột", type: "lines" },
      {
        name: "rows",
        label: "Hàng",
        type: "list",
        titleField: "c1",
        fields: [
          { name: "c1", label: "Cột 1", type: "text" },
          { name: "c2", label: "Cột 2", type: "text" },
          { name: "c3", label: "Cột 3", type: "text" },
        ],
      },
      { name: "note", label: "Ghi chú dưới bảng", type: "textarea" },
    ],
  },
  {
    type: "faq",
    label: "Câu hỏi thường gặp",
    description: "Danh sách hỏi – đáp mở rộng được.",
    group: "content",
    fields: [
      ...heading(false),
      { name: "cantFind", label: "Dòng \"không tìm thấy câu trả lời\"", type: "text" },
      { name: "cta", label: "Nút báo giá (để trống thì hiện dòng trên)", type: "text" },
      {
        name: "surface",
        label: "Nền",
        type: "select",
        options: [
          { value: "white", label: "Trắng" },
          { value: "sand", label: "Kem" },
        ],
      },
      {
        name: "items",
        label: "Câu hỏi",
        type: "list",
        titleField: "q",
        fields: [
          { name: "q", label: "Câu hỏi", type: "text" },
          { name: "a", label: "Trả lời", type: "textarea" },
        ],
      },
    ],
  },
  {
    type: "sources",
    label: "Nguồn tham khảo",
    description: "Danh sách link nguồn.",
    group: "content",
    fields: [
      { name: "title", label: "Tiêu đề", type: "text" },
      { name: "note", label: "Ghi chú", type: "text" },
      {
        name: "items",
        label: "Nguồn",
        type: "list",
        titleField: "label",
        fields: [
          { name: "label", label: "Tên nguồn", type: "text" },
          { name: "url", label: "Link", type: "url" },
        ],
      },
    ],
  },
  {
    type: "cta",
    label: "Kêu gọi báo giá",
    description: "Khối báo giá có danh sách thị trường và liên hệ trực tiếp.",
    group: "content",
    fields: [
      { name: "title", label: "Tiêu đề", type: "text" },
      { name: "accent", label: "Tiêu đề (dòng nghiêng)", type: "text" },
      { name: "body", label: "Nội dung", type: "textarea" },
      { name: "marketsLabel", label: "Nhãn thị trường", type: "text" },
      { name: "markets", label: "Thị trường", type: "lines" },
      { name: "talkDirect", label: "Tiêu đề liên hệ trực tiếp", type: "text" },
      { name: "languages", label: "Ngôn ngữ hỗ trợ", type: "text" },
    ],
  },
];

export const blockSchema = (type: string) => blockSchemas.find((schema) => schema.type === type);

export const blockGroups: { key: BlockSchema["group"]; label: string }[] = [
  { key: "content", label: "Nội dung" },
  { key: "page", label: "Khối trang" },
  { key: "home", label: "Khối trang chủ" },
];
