"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { allowed, endSession, isAuthConfigured, startSession } from "@/lib/admin/auth";
import { audit, recentFailures } from "@/lib/admin/audit";
import { verifyPassword } from "@/lib/admin/password";
import { CMS_CACHE_TAG, count, first, now, run } from "@/lib/db";
import { analyticsKeys, analyticsTools } from "@/lib/analytics-ids";
import { cloudName } from "@/lib/cloudinary-loader";
import { site } from "@/lib/site";
import {
  discoverTelegram,
  escapeHtml,
  notifyTelegram,
  sendTelegramMessage,
  testMessage,
  type DiscoveredChat,
  type TelegramButton,
} from "@/lib/telegram";
import { isChatId } from "@/lib/telegram-topics";
import type { Permission } from "@/lib/admin/roles";
import type {
  AnalyticsSettings,
  NotificationSettings,
  NotifyTopic,
  SeoPageKey,
  SeoSettings,
  SiteSettings,
} from "@/lib/types";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

// ── Auth ────────────────────────────────────────────────────────────────────

/** Failed sign-ins allowed per email in LOCK_MINUTES before it is locked for a while. */
const MAX_FAILURES = 8;
const LOCK_MINUTES = 15;

export async function signIn(
  _prev: { error?: string; email?: string },
  form: FormData,
): Promise<{ error?: string; email?: string }> {
  if (!isAuthConfigured()) return { error: "Chưa cấu hình AUTH_SECRET (xem README → Tài khoản quản trị)." };

  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  if ((await recentFailures(email, LOCK_MINUTES)) >= MAX_FAILURES) {
    await audit(email, "login.locked", email);
    return { error: `Sai mật khẩu quá nhiều lần. Thử lại sau ${LOCK_MINUTES} phút.`, email };
  }
  const account = await first<{ email: string; password_hash: string; disabled: boolean }>(
    "select email, password_hash, disabled from admin_users where email = ?",
    email,
  );
  // Echo the email back: React resets the form after each submission.
  if (!account || !(await verifyPassword(password, account.password_hash))) {
    await audit(email, "login.failed", email);
    return { error: "Email hoặc mật khẩu không đúng.", email };
  }
  if (account.disabled) return { error: "Tài khoản này đang bị khoá. Liên hệ Quản trị.", email };
  await startSession(account.email);
  await audit(account.email, "login");
  redirect("/admin");
}

export async function signOut() {
  await endSession();
  redirect("/admin/login");
}

// ── Inquiries & settings ────────────────────────────────────────────────────

/** Expires cached CMS data and every rendered page, so a settings save appears on the website immediately. */
function refreshSite() {
  updateTag(CMS_CACHE_TAG);
  revalidatePath("/", "layout");
}

/** Telegram notice sent after the response, so the editor never waits on (or sees errors from) Telegram. */
function notifyLater(topic: NotifyTopic, html: string, buttons?: TelegramButton[]) {
  after(() => notifyTelegram(topic, html, buttons));
}

const who = (user: { name?: string; email?: string }) => escapeHtml(user.name || user.email || "Quản trị viên");

const inquiryStatuses = ["new", "contacted", "quoted", "won", "lost"];
const statusNames: Record<string, string> = {
  new: "Mới",
  contacted: "Đã liên hệ",
  quoted: "Đã báo giá",
  won: "Chốt đơn",
  lost: "Không thành",
};
const statusIcons: Record<string, string> = { new: "🔄", contacted: "📞", quoted: "💰", won: "🎉", lost: "❌" };

export async function setInquiryStatus(id: string, status: string): Promise<ActionResult> {
  if (!inquiryStatuses.includes(status)) return { ok: false, error: "Trạng thái không hợp lệ." };
  const auth = await allowed("inquiries");
  if (!auth.ok) return auth;
  const { user } = auth;
  let data: { name: string; company: string | null; product_slug: string | null } | null;
  try {
    data = await first("update inquiries set status = ? where id = ? returning name, company, product_slug", status, id);
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
  revalidatePath("/admin", "layout");
  if (data) {
    await audit(user.email, "inquiry.status", data.name, statusNames[status]);
    const lead = [data.name, data.company].filter(Boolean).map(String).map(escapeHtml).join(" · ");
    const product = data.product_slug ? ` (${escapeHtml(String(data.product_slug))})` : "";
    notifyLater("pipeline", `${statusIcons[status]} <b>${lead}</b>${product} → <b>${statusNames[status]}</b>\nbởi ${who(user)}`, [
      { text: "Mở yêu cầu", url: `${site.url}/admin/inquiries?id=${id}` },
    ]);
  }
  return { ok: true };
}

/** New quote requests, for the badge in the Studio rail. */
export async function newInquiryCount(): Promise<number> {
  const auth = await allowed("inquiries");
  return auth.ok ? count("select count(*) as n from inquiries where status = 'new'") : 0;
}

/** The sales team's internal note on a quote request (never shown to the customer). */
export async function setInquiryNote(id: string, note: string): Promise<ActionResult> {
  const auth = await allowed("inquiries");
  if (!auth.ok) return auth;
  const { user } = auth;
  const text = String(note).trim().slice(0, 4000);
  const data = await first<{ name: string }>("update inquiries set note = ? where id = ? returning name", text, id);
  if (!data) return { ok: false, error: "Không tìm thấy yêu cầu này." };
  await audit(user.email, "inquiry.note", data.name);
  return { ok: true };
}

/** Merges `patch` into the stored settings, so each admin screen only overwrites its own groups. */
async function writeSettings(patch: Partial<SiteSettings>, what: string, permission: Permission = "settings"): Promise<ActionResult> {
  const auth = await allowed(permission);
  if (!auth.ok) return auth;
  const { user } = auth;
  try {
    const current = await first<{ data: Partial<SiteSettings> }>("select data from site_settings where id = 1");
    await run(
      `insert into site_settings (id, data, updated_at) values (1, ?, ?)
       on conflict (id) do update set data = excluded.data, updated_at = excluded.updated_at`,
      JSON.stringify({ ...(current?.data ?? {}), ...patch }),
      now(),
    );
  } catch (error) {
    return { ok: false, error: `Không lưu được: ${(error as Error).message}` };
  }
  refreshSite();
  await audit(user.email, "settings", what);
  notifyLater("system", `⚙️ ${who(user)} đã lưu <b>${what}</b>`);
  return { ok: true };
}

export async function saveSettings(data: SiteSettings): Promise<ActionResult> {
  return writeSettings({
    company: { ...data.company, foundingYear: Number(data.company.foundingYear) || new Date().getFullYear() },
    contact: data.contact,
    socials: data.socials,
    memberships: data.memberships.filter((m) => m.name.trim()),
    stats: data.stats.filter((s) => s.value.trim() && s.label.en.trim()),
  }, "Cài đặt công ty");
}

/** Accepts the code, the whole <meta … content="code"> tag, or a `name=code` DNS TXT value. */
function verificationCode(value: string) {
  const code = (value.match(/content=["']([^"']+)["']/)?.[1] ?? value)
    .trim()
    .replace(/^(google-site-verification|yandex-verification|msvalidate\.01)=/i, "");
  return /^[\w.:=+/-]{1,200}$/.test(code) ? code : "";
}

export async function saveSeoSettings(seo: SeoSettings): Promise<ActionResult> {
  const pages: SeoSettings["pages"] = {};
  for (const [page, byLocale] of Object.entries(seo.pages ?? {})) {
    for (const [locale, text] of Object.entries(byLocale ?? {})) {
      const title = text?.title?.trim() ?? "";
      const description = text?.description?.trim() ?? "";
      if (!title && !description) continue;
      ((pages[page as SeoPageKey] ??= {})[locale as "en"] = { title, description });
    }
  }
  const engines = { google: "Google", bing: "Bing", yandex: "Yandex" } as const;
  const verification = { google: "", bing: "", yandex: "" };
  for (const engine of Object.keys(engines) as (keyof typeof engines)[]) {
    const raw = seo.verification[engine]?.trim() ?? "";
    verification[engine] = verificationCode(raw);
    if (raw && !verification[engine]) return { ok: false, error: `Mã xác minh ${engines[engine]} không hợp lệ.` };
  }
  return writeSettings({
    seo: { indexing: Boolean(seo.indexing), ogImage: seo.ogImage?.trim() ?? "", verification, pages },
  }, seo.indexing ? "Cài đặt SEO" : "Cài đặt SEO — ⚠️ đang TẮT lập chỉ mục Google");
}

export async function saveAnalyticsSettings(ids: AnalyticsSettings): Promise<ActionResult> {
  const clean = Object.fromEntries(
    analyticsKeys.map((key) => {
      const raw = String(ids[key] ?? "").trim();
      return [key, key === "clarity" || key === "cloudflare" ? raw.toLowerCase() : raw.toUpperCase()];
    }),
  ) as AnalyticsSettings;
  const invalid = analyticsKeys.find((key) => clean[key] && !analyticsTools[key].pattern.test(clean[key]));
  if (invalid) {
    const tool = analyticsTools[invalid];
    return { ok: false, error: `Mã ${tool.label} không đúng định dạng (ví dụ: ${tool.example}).` };
  }
  return writeSettings({ analytics: clean }, "Mã đo lường (Phân tích)");
}

// ── Notifications ───────────────────────────────────────────────────────────

type TelegramDraft = NotificationSettings["telegram"];

function cleanTelegram(draft: TelegramDraft): TelegramDraft | string {
  const chatId = draft.chatId.trim();
  if (draft.enabled && !isChatId(chatId)) return "Chat ID của nhóm không hợp lệ (dạng -100…).";
  const topics = { ...draft.topics };
  for (const key of Object.keys(topics) as NotifyTopic[]) {
    const threadId = topics[key].threadId.trim();
    if (threadId && !/^\d{1,10}$/.test(threadId)) return "ID topic chỉ gồm chữ số (hoặc dán link topic).";
    topics[key] = { enabled: Boolean(topics[key].enabled), threadId };
  }
  return { enabled: Boolean(draft.enabled), chatId, topics };
}

export async function saveNotificationSettings(draft: TelegramDraft): Promise<ActionResult> {
  const telegram = cleanTelegram(draft);
  if (typeof telegram === "string") return { ok: false, error: telegram };
  return writeSettings({ notifications: { telegram } }, "Cài đặt thông báo Telegram", "users");
}

/** Sends a test message to one topic using the form's current (possibly unsaved) values. */
export async function sendTestNotification(draft: TelegramDraft, topic: NotifyTopic): Promise<ActionResult> {
  const auth = await allowed("users");
  if (!auth.ok) return auth;
  const telegram = cleanTelegram({ ...draft, enabled: true });
  if (typeof telegram === "string") return { ok: false, error: telegram };
  const result = await sendTelegramMessage(
    { chatId: telegram.chatId, threadId: telegram.topics[topic].threadId },
    testMessage(topic),
  );
  return result.ok ? { ok: true } : { ok: false, error: `Telegram báo lỗi: ${result.error}` };
}

export async function findTelegramChats(): Promise<{ ok: true; bot: string; chats: DiscoveredChat[] } | { ok: false; error: string }> {
  const auth = await allowed("users");
  if (!auth.ok) return auth;
  const result = await discoverTelegram();
  return result.ok ? { ok: true, ...result.result } : { ok: false, error: `Telegram báo lỗi: ${result.error}` };
}

// ── Uploads ─────────────────────────────────────────────────────────────────

export type UploadSignature =
  | { ok: true; cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string }
  | { ok: false; error: string };

/** Signs a direct browser → Cloudinary upload so the API secret never leaves the server. */
export async function signUpload(folder: string): Promise<UploadSignature> {
  const auth = await allowed("content.write");
  if (!auth.ok) return auth;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!apiKey || !secret) {
    return { ok: false, error: "Chưa cấu hình Cloudinary — hãy dán đường dẫn ảnh thay vì tải lên." };
  }

  const safeFolder = `caogia/${folder.replace(/[^a-z0-9_-]/gi, "")}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `folder=${safeFolder}&timestamp=${timestamp}${secret}`;
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(payload));
  const signature = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");

  return { ok: true, cloudName, apiKey, timestamp, signature, folder: safeFolder };
}
