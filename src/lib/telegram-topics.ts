// Shared by the CMS form (client) and lib/telegram.ts (server).

import type { NotifyTopic } from "@/lib/types";

export const telegramTopics: { key: NotifyTopic; label: string; help: string; optional?: boolean }[] = [
  { key: "inquiry", label: "Yêu cầu báo giá mới", help: "Mỗi form liên hệ gửi từ website, kèm nguồn truy cập và nút WhatsApp." },
  {
    key: "inquiryCoffee",
    label: "↳ Riêng yêu cầu về cà phê",
    help: "Bật để tách yêu cầu có sản phẩm cà phê sang topic khác. Tắt thì vào topic “Yêu cầu báo giá mới”.",
    optional: true,
  },
  {
    key: "inquiryCashew",
    label: "↳ Riêng yêu cầu về hạt điều",
    help: "Bật để tách yêu cầu có sản phẩm hạt điều sang topic khác.",
    optional: true,
  },
  { key: "pipeline", label: "Tiến độ đơn hàng", help: "Khi đổi trạng thái yêu cầu: đã liên hệ, đã báo giá, chốt đơn, không thành." },
  { key: "content", label: "Nội dung CMS", help: "Ai thêm, sửa, xoá sản phẩm, bài viết, đánh giá… (nhật ký chỉnh sửa)." },
  {
    key: "system",
    label: "Hệ thống & cảnh báo",
    help: "Thay đổi cài đặt / SEO / mã đo lường, và cảnh báo khi yêu cầu báo giá không lưu được vào database.",
  },
];

/**
 * Reads a topic link copied from Telegram ("Copy link" on a topic or a message in it):
 *   https://t.me/c/1234567890/42        private group → chat -1001234567890, topic 42
 *   https://t.me/c/1234567890/42/1337   message inside topic 42
 * A plain number is taken as the topic ID itself.
 */
export function parseTopicInput(value: string): { threadId: string; chatId?: string } | null {
  const text = value.trim();
  if (/^\d{1,10}$/.test(text)) return { threadId: text };
  const match = text.match(/t\.me\/c\/(\d{5,15})\/(\d{1,10})(?:\/\d+)?\/?(?:\?.*)?$/);
  return match ? { chatId: `-100${match[1]}`, threadId: match[2] } : null;
}

export const isChatId = (value: string) => /^-?\d{5,20}$/.test(value.trim());
