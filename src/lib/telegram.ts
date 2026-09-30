import "server-only";

import { channelLabels, channelOf, sourceLabel } from "@/lib/attribution";
import { getSettings } from "@/lib/content";
import type { Inquiry } from "@/lib/notify";
import { site } from "@/lib/site";
import { isChatId, telegramTopics } from "@/lib/telegram-topics";
import type { Category, NotifyTopic } from "@/lib/types";

// Telegram Bot API (https://core.telegram.org/bots/api). The token is a secret: env only, never in
// the database, never logged.

type ApiResult<T> = { ok: true; result: T } | { ok: false; error: string };
export type TelegramButton = { text: string; url: string };

const token = () => process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "";
export const isTelegramConfigured = () => Boolean(token());

export async function telegramApi<T>(method: string, body: Record<string, unknown> = {}): Promise<ApiResult<T>> {
  if (!token()) return { ok: false, error: "Chưa đặt biến môi trường TELEGRAM_BOT_TOKEN." };
  try {
    const res = await fetch(`https://api.telegram.org/bot${token()}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
    return json.ok ? { ok: true, result: json.result as T } : { ok: false, error: json.description ?? `HTTP ${res.status}` };
  } catch (error) {
    return { ok: false, error: (error as Error).name === "TimeoutError" ? "Telegram không phản hồi (quá 8 giây)." : (error as Error).message };
  }
}

export const escapeHtml = (value: string) => value.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]!);

/** Telegram rejects buttons that point at localhost or plain http. */
const usableButton = (b: TelegramButton) => /^https:\/\/(?!localhost|127\.0\.0\.1)/.test(b.url);

export async function sendTelegramMessage(
  target: { chatId: string; threadId?: string },
  html: string,
  buttons: TelegramButton[] = [],
) {
  const keyboard = buttons.filter(usableButton).map(({ text, url }) => ({ text, url }));
  return telegramApi<{ message_id: number }>("sendMessage", {
    chat_id: target.chatId.trim(),
    ...(target.threadId?.trim() && { message_thread_id: Number(target.threadId) }),
    text: html,
    parse_mode: "HTML",
    link_preview_options: { is_disabled: true },
    ...(keyboard.length && { reply_markup: { inline_keyboard: [keyboard] } }),
  });
}

/**
 * Sends to the topic configured for `topic` in CMS → Notifications. Returns false (without throwing)
 * when Telegram is off, not configured, that topic is disabled, or the send fails.
 */
export async function notifyTelegram(topic: NotifyTopic, html: string, buttons?: TelegramButton[]): Promise<boolean> {
  let telegram;
  try {
    telegram = (await getSettings()).notifications.telegram;
  } catch (error) {
    console.error(`[telegram] ${topic}: could not read settings`, error);
    return false;
  }
  if (!telegram.enabled || !isTelegramConfigured() || !isChatId(telegram.chatId)) return false;

  let route = telegram.topics[topic];
  // The per-category inquiry topics are optional splits of the main inquiry topic.
  if ((topic === "inquiryCoffee" || topic === "inquiryCashew") && !route.enabled) route = telegram.topics.inquiry;
  if (!route.enabled) return false;

  const result = await sendTelegramMessage({ chatId: telegram.chatId, threadId: route.threadId }, html, buttons);
  if (!result.ok) console.error(`[telegram] ${topic}: ${result.error}`);
  return result.ok;
}

// ── Messages ────────────────────────────────────────────────────────────────

const languageNames: Record<string, string> = { en: "tiếng Anh", ru: "tiếng Nga", ar: "tiếng Ả Rập" };

export async function notifyInquiryTelegram(inquiry: Inquiry, product: { name: string; category: Category } | null) {
  const a = inquiry.attribution;
  const lines = [
    "🆕 <b>Yêu cầu báo giá mới</b>",
    `<b>${escapeHtml(inquiry.name)}</b> · ${escapeHtml(inquiry.email)}`,
    inquiry.phone && `📞 ${escapeHtml(inquiry.phone)}`,
    product ? `📦 ${escapeHtml(product.name)}` : inquiry.product_slug && `📦 ${escapeHtml(inquiry.product_slug)}`,
    `🌐 Website ${languageNames[inquiry.locale] ?? inquiry.locale}`,
    a && `📣 ${escapeHtml(sourceLabel(a))} · ${channelLabels[channelOf(a)]}`,
    a?.landing && `🔗 Vào từ trang ${escapeHtml(a.landing.split("?")[0])}`,
    "",
    `<blockquote>${escapeHtml(inquiry.message.slice(0, 1500))}${inquiry.message.length > 1500 ? "…" : ""}</blockquote>`,
  ];
  const phone = inquiry.phone?.replace(/\D/g, "");
  const topic: NotifyTopic =
    product?.category === "coffee" ? "inquiryCoffee" : product?.category === "cashew" ? "inquiryCashew" : "inquiry";
  return notifyTelegram(topic, lines.filter((l): l is string => typeof l === "string").join("\n"), [
    { text: "📋 Mở trong CMS", url: `${site.url}/admin/inquiries?status=new` },
    ...(phone && phone.length >= 8 ? [{ text: "💬 WhatsApp", url: `https://wa.me/${phone}` }] : []),
  ]);
}

export function testMessage(topic: NotifyTopic) {
  const info = telegramTopics.find((t) => t.key === topic)!;
  return `✅ <b>Kết nối thành công</b>\nTopic này sẽ nhận: <b>${escapeHtml(info.label.replace("↳ ", ""))}</b>\n<i>${escapeHtml(info.help)}</i>`;
}

// ── Setup helper ────────────────────────────────────────────────────────────

type TgChat = { id: number; title?: string; type: string; is_forum?: boolean };
type TgMessage = {
  chat: TgChat;
  message_thread_id?: number;
  is_topic_message?: boolean;
  forum_topic_created?: { name: string };
  forum_topic_edited?: { name?: string };
  reply_to_message?: { forum_topic_created?: { name: string } };
};
type TgUpdate = { message?: TgMessage; edited_message?: TgMessage; my_chat_member?: { chat: TgChat } };

export type DiscoveredChat = { id: string; title: string; isForum: boolean; topics: { id: string; name: string }[] };

/**
 * Lists the groups and topics the bot has seen in the last 24 hours (Telegram keeps updates that
 * long), so the CMS can offer them instead of asking for raw IDs.
 */
export async function discoverTelegram(): Promise<ApiResult<{ bot: string; chats: DiscoveredChat[] }>> {
  const me = await telegramApi<{ username: string }>("getMe");
  if (!me.ok) return me;
  const updates = await telegramApi<TgUpdate[]>("getUpdates", {
    limit: 100,
    allowed_updates: ["message", "edited_message", "my_chat_member"],
  });
  if (!updates.ok) return updates;

  const chats = new Map<string, { title: string; isForum: boolean; topics: Map<string, string> }>();
  for (const update of updates.result) {
    const message = update.message ?? update.edited_message;
    const chat = message?.chat ?? update.my_chat_member?.chat;
    if (!chat || chat.type === "private" || chat.type === "channel") continue;
    const id = String(chat.id);
    const entry = chats.get(id) ?? { title: chat.title ?? id, isForum: Boolean(chat.is_forum), topics: new Map() };
    entry.isForum ||= Boolean(chat.is_forum);
    if (message?.is_topic_message && message.message_thread_id) {
      const thread = String(message.message_thread_id);
      const name =
        message.forum_topic_created?.name ??
        message.forum_topic_edited?.name ??
        message.reply_to_message?.forum_topic_created?.name ??
        entry.topics.get(thread) ??
        `Topic #${thread}`;
      entry.topics.set(thread, name);
    }
    chats.set(id, entry);
  }

  return {
    ok: true,
    result: {
      bot: me.result.username,
      chats: [...chats].map(([id, c]) => ({
        id,
        title: c.title,
        isForum: c.isForum,
        topics: [...c.topics].map(([topicId, name]) => ({ id: topicId, name })),
      })),
    },
  };
}
