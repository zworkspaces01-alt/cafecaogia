// Describes each editable content type. The admin list and edit screens are generated from this,
// so adding a field here (and to the database) is all it takes to make it editable.

export type FieldType = "text" | "textarea" | "number" | "boolean" | "select" | "image" | "file" | "gallery" | "lines" | "specs";

export type Field = {
  name: string;
  label: string;
  type: FieldType;
  /** Stored per language in the `translations` column (English stays in the main column). */
  translatable?: boolean;
  required?: boolean;
  options?: { value: string; label: string }[];
  help?: string;
  placeholder?: string;
};

export type Entity = {
  key: string;
  table: string;
  label: string;
  singular: string;
  description: string;
  titleField: string;
  subtitleField?: string;
  imageField?: string;
  hasTranslations: boolean;
  fields: Field[];
  defaults: Record<string, unknown>;
};

const common: Field[] = [
  { name: "published", label: "Hiển thị trên website", type: "boolean" },
  {
    name: "is_sample",
    label: "Nội dung mẫu",
    type: "boolean",
    help: "Đánh dấu nội dung giả lập cần thay trước khi chạy quảng cáo. Bỏ đánh dấu khi đã là nội dung thật.",
  },
  { name: "sort_order", label: "Thứ tự hiển thị", type: "number", help: "Số nhỏ hiển thị trước." },
];

const baseDefaults = { published: true, is_sample: false, sort_order: 100, translations: {} };

export const entities: Entity[] = [
  {
    key: "products",
    table: "products",
    label: "Sản phẩm",
    singular: "sản phẩm",
    description: "Danh mục cà phê và hạt điều, thông số kỹ thuật, ảnh.",
    titleField: "name",
    subtitleField: "grade",
    imageField: "image",
    hasTranslations: true,
    fields: [
      { name: "name", label: "Tên sản phẩm", type: "text", translatable: true, required: true },
      { name: "slug", label: "Đường dẫn (slug)", type: "text", required: true, help: "Chữ thường, không dấu, nối bằng gạch ngang. Ví dụ: robusta-s18-clean" },
      {
        name: "category",
        label: "Danh mục",
        type: "select",
        required: true,
        options: [
          { value: "coffee", label: "Cà phê" },
          { value: "cashew", label: "Hạt điều" },
        ],
      },
      { name: "grade", label: "Cấp hạng / quy cách", type: "text", translatable: true, placeholder: "Wet polished · S18" },
      { name: "summary", label: "Tóm tắt", type: "textarea", translatable: true },
      { name: "description", label: "Mô tả chi tiết", type: "textarea", translatable: true },
      { name: "image", label: "Ảnh chính", type: "image", required: true },
      { name: "gallery", label: "Ảnh phụ", type: "gallery" },
      { name: "origin", label: "Xuất xứ", type: "text", translatable: true },
      { name: "specs", label: "Thông số kỹ thuật", type: "specs", translatable: true },
      { name: "packaging", label: "Đóng gói", type: "text", translatable: true },
      { name: "moq", label: "Đơn hàng tối thiểu (MOQ)", type: "text", translatable: true },
      { name: "featured", label: "Nổi bật trên trang chủ", type: "boolean" },
      ...common,
    ],
    defaults: { ...baseDefaults, category: "coffee", featured: false, gallery: [], specs: [] },
  },
  {
    key: "testimonials",
    table: "testimonials",
    label: "Đánh giá",
    singular: "đánh giá",
    description: "Nhận xét của đối tác, khách hàng.",
    titleField: "name",
    subtitleField: "company",
    imageField: "image",
    hasTranslations: true,
    fields: [
      { name: "quote", label: "Nội dung nhận xét", type: "textarea", translatable: true, required: true },
      { name: "name", label: "Họ tên", type: "text", required: true },
      { name: "role", label: "Chức vụ", type: "text", translatable: true },
      { name: "company", label: "Công ty", type: "text" },
      { name: "country", label: "Quốc gia", type: "text", translatable: true },
      { name: "flag", label: "Cờ (emoji)", type: "text", placeholder: "🇩🇪" },
      { name: "product_slug", label: "Sản phẩm đã mua (slug)", type: "text", placeholder: "cashew-kernels-w320" },
      { name: "since", label: "Hợp tác từ năm", type: "number" },
      { name: "rating", label: "Số sao (1–5)", type: "number" },
      { name: "image", label: "Ảnh minh hoạ", type: "image" },
      { name: "logo", label: "Logo công ty", type: "image" },
      ...common,
    ],
    defaults: { ...baseDefaults, rating: 5 },
  },
  {
    key: "partners",
    table: "partners",
    label: "Đối tác",
    singular: "đối tác",
    description: "Logo đối tác hiển thị ở dải chạy và lưới logo.",
    titleField: "name",
    subtitleField: "country",
    imageField: "logo",
    hasTranslations: false,
    fields: [
      { name: "name", label: "Tên đối tác", type: "text", required: true },
      { name: "logo", label: "Logo (PNG/SVG nền trong suốt)", type: "image", help: "Để trống sẽ hiển thị tên dạng chữ." },
      { name: "country", label: "Cờ quốc gia (emoji)", type: "text", placeholder: "🇩🇪" },
      {
        name: "style",
        label: "Kiểu chữ khi chưa có logo",
        type: "select",
        options: [
          { value: "sans", label: "Chữ in hoa" },
          { value: "serif", label: "Chữ có chân" },
          { value: "script", label: "Chữ nghiêng" },
          { value: "mono", label: "Chữ đơn cách" },
        ],
      },
      { name: "url", label: "Website", type: "text" },
      ...common,
    ],
    defaults: { ...baseDefaults, style: "sans" },
  },
  {
    key: "certifications",
    table: "certifications",
    label: "Chứng nhận",
    singular: "chứng nhận",
    description: "Chứng nhận, kiểm định — hiển thị ở mục Chứng nhận & Tuân thủ.",
    titleField: "name",
    subtitleField: "issuer",
    imageField: "logo",
    hasTranslations: true,
    fields: [
      { name: "name", label: "Tên chứng nhận", type: "text", translatable: true, required: true },
      { name: "issuer", label: "Đơn vị cấp / lĩnh vực", type: "text" },
      { name: "year", label: "Năm", type: "number" },
      { name: "scope", label: "Phạm vi", type: "textarea", translatable: true },
      { name: "logo", label: "Logo chứng nhận", type: "image", help: "Để trống sẽ hiển thị con dấu chung." },
      { name: "file", label: "File chứng nhận (PDF)", type: "file" },
      ...common,
    ],
    defaults: { ...baseDefaults, year: new Date().getFullYear() },
  },
  {
    key: "team",
    table: "team_members",
    label: "Đội ngũ & CEO",
    singular: "thành viên",
    description: "Trang About CEO và người liên hệ trong khối “Liên hệ đội xuất khẩu”.",
    titleField: "name",
    subtitleField: "role",
    imageField: "photo",
    hasTranslations: true,
    fields: [
      { name: "name", label: "Họ tên", type: "text", required: true },
      { name: "role", label: "Chức vụ", type: "text", translatable: true },
      { name: "is_ceo", label: "Là CEO (hiển thị ở trang About CEO)", type: "boolean" },
      { name: "photo", label: "Ảnh chân dung", type: "image" },
      { name: "bio", label: "Tiểu sử (mỗi dòng một đoạn)", type: "lines", translatable: true },
      { name: "quote", label: "Câu nói / thông điệp", type: "textarea", translatable: true },
      { name: "email", label: "Email", type: "text" },
      { name: "whatsapp", label: "WhatsApp", type: "text", placeholder: "+84 ..." },
      ...common,
    ],
    defaults: { ...baseDefaults, is_ceo: false, bio: [] },
  },
];

export const getEntity = (key: string) => entities.find((e) => e.key === key);

export const adminLocales = [
  { code: "en", label: "English (gốc)" },
  { code: "ru", label: "Tiếng Nga" },
  { code: "ar", label: "Tiếng Ả Rập" },
] as const;
