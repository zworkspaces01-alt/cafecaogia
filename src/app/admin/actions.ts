"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { getAuthClient, requireAdmin } from "@/lib/admin/auth";
import { getEntity, type Entity, type Field } from "@/lib/admin/entities";
import { CMS_CACHE_TAG } from "@/lib/supabase";
import { analyticsKeys, analyticsTools } from "@/lib/analytics-ids";
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

export async function signIn(
  _prev: { error?: string; email?: string },
  form: FormData,
): Promise<{ error?: string; email?: string }> {
  const supabase = await getAuthClient();
  if (!supabase) return { error: "Chưa cấu hình Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)." };

  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  // Echo the email back: React resets the form after each submission.
  if (error) return { error: "Email hoặc mật khẩu không đúng.", email };

  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    await supabase.auth.signOut();
    return { error: "Tài khoản này chưa được cấp quyền quản trị.", email };
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await getAuthClient();
  await supabase?.auth.signOut();
  redirect("/admin/login");
}

// ── Content ─────────────────────────────────────────────────────────────────

const nullableTypes = new Set(["image", "file", "number", "date"]);
const nullableText = new Set(["product_slug", "url"]);

function normalize(field: Field, value: unknown): unknown {
  switch (field.type) {
    case "boolean":
      return Boolean(value);
    case "number": {
      if (value === "" || value === null || value === undefined) return null;
      const n = Number(value);
      return Number.isFinite(n) ? n : null;
    }
    case "gallery":
    case "lines":
      return Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];
    case "specs":
      return Array.isArray(value)
        ? value
            .map((s) => ({ label: String(s?.label ?? "").trim(), value: String(s?.value ?? "").trim() }))
            .filter((s) => s.label || s.value)
        : [];
    default: {
      const text = typeof value === "string" ? value.trim() : "";
      if (!text && (nullableTypes.has(field.type) || nullableText.has(field.name))) return null;
      return text;
    }
  }
}

const isEmpty = (v: unknown) => v === null || v === "" || (Array.isArray(v) && v.length === 0);

function buildRow(entity: Entity, values: Record<string, unknown>) {
  const row: Record<string, unknown> = {};
  const translations: Record<string, Record<string, unknown>> = {};
  const incoming = (values.translations ?? {}) as Record<string, Record<string, unknown>>;

  for (const field of entity.fields) {
    const value = normalize(field, values[field.name]);
    if (field.required && isEmpty(value)) throw new Error(`Vui lòng nhập “${field.label}”.`);
    row[field.name] = value;

    if (field.translatable && entity.hasTranslations) {
      for (const lang of ["ru", "ar"]) {
        const translated = normalize(field, incoming[lang]?.[field.name]);
        if (!isEmpty(translated)) (translations[lang] ??= {})[field.name] = translated;
      }
    }
  }
  if (entity.hasTranslations) row.translations = translations;
  return row;
}

/** Expires cached CMS data and every rendered page, so edits appear on the website immediately. */
function refreshSite() {
  updateTag(CMS_CACHE_TAG);
  revalidatePath("/", "layout");
}

/** Telegram notice sent after the response, so the editor never waits on (or sees errors from) Telegram. */
function notifyLater(topic: NotifyTopic, html: string, buttons?: TelegramButton[]) {
  after(() => notifyTelegram(topic, html, buttons));
}

const who = (user: { email?: string }) => escapeHtml(user.email ?? "Quản trị viên");

export async function saveRecord(entityKey: string, id: string | null, values: Record<string, unknown>): Promise<ActionResult> {
  const entity = getEntity(entityKey);
  if (!entity) return { ok: false, error: "Loại nội dung không hợp lệ." };
  const { supabase, user } = await requireAdmin();

  let row: Record<string, unknown>;
  try {
    row = buildRow(entity, values);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }

  const query = id
    ? supabase.from(entity.table).update(row).eq("id", id).select("id").single()
    : supabase.from(entity.table).insert(row).select("id").single();
  const { data, error } = await query;
  if (error) {
    const duplicate = error.code === "23505";
    return { ok: false, error: duplicate ? "Đường dẫn (slug) này đã tồn tại." : `Không lưu được: ${error.message}` };
  }

  refreshSite();
  const title = escapeHtml(String(row[entity.titleField] ?? "") || "(chưa đặt tên)");
  notifyLater("content", `${id ? "✏️" : "➕"} ${who(user)} đã ${id ? "sửa" : "thêm"} ${entity.singular} <b>${title}</b>`, [
    { text: "Mở trong CMS", url: `${site.url}/admin/${entity.key}/${data.id}` },
  ]);
  return { ok: true, id: data.id as string };
}

export async function deleteRecord(entityKey: string, id: string): Promise<ActionResult> {
  const entity = getEntity(entityKey);
  if (!entity) return { ok: false, error: "Loại nội dung không hợp lệ." };
  const { supabase, user } = await requireAdmin();
  const { data, error } = await supabase.from(entity.table).delete().eq("id", id).select(entity.titleField).maybeSingle();
  if (error) return { ok: false, error: `Không xoá được: ${error.message}` };
  refreshSite();
  const title = escapeHtml(String((data as Record<string, unknown> | null)?.[entity.titleField] ?? "") || id);
  notifyLater("content", `🗑 ${who(user)} đã xoá ${entity.singular} <b>${title}</b>`);
  return { ok: true };
}

// ── Inquiries & settings ────────────────────────────────────────────────────

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
  const { supabase, user } = await requireAdmin();
  const { data, error } = await supabase
    .from("inquiries")
    .update({ status })
    .eq("id", id)
    .select("name, company, product_slug")
    .maybeSingle();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin", "layout");
  if (data) {
    const lead = [data.name, data.company].filter(Boolean).map(String).map(escapeHtml).join(" · ");
    const product = data.product_slug ? ` (${escapeHtml(String(data.product_slug))})` : "";
    notifyLater("pipeline", `${statusIcons[status]} <b>${lead}</b>${product} → <b>${statusNames[status]}</b>\nbởi ${who(user)}`, [
      { text: "Mở danh sách", url: `${site.url}/admin/inquiries?status=${status}` },
    ]);
  }
  return { ok: true };
}

/** Merges `patch` into the stored settings, so each admin screen only overwrites its own groups. */
async function writeSettings(patch: Partial<SiteSettings>, what: string): Promise<ActionResult> {
  const { supabase, user } = await requireAdmin();
  const { data: current, error: readError } = await supabase.from("site_settings").select("data").eq("id", 1).maybeSingle();
  if (readError) return { ok: false, error: `Không đọc được cài đặt: ${readError.message}` };
  const { error } = await supabase.from("site_settings").upsert({ id: 1, data: { ...(current?.data ?? {}), ...patch } });
  if (error) return { ok: false, error: `Không lưu được: ${error.message}` };
  refreshSite();
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

/** Accepts either the code or the whole <meta … content="code"> tag the search engine shows. */
function verificationCode(value: string) {
  const code = (value.match(/content=["']([^"']+)["']/)?.[1] ?? value).trim();
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
  return writeSettings({ notifications: { telegram } }, "Cài đặt thông báo Telegram");
}

/** Sends a test message to one topic using the form's current (possibly unsaved) values. */
export async function sendTestNotification(draft: TelegramDraft, topic: NotifyTopic): Promise<ActionResult> {
  await requireAdmin();
  const telegram = cleanTelegram({ ...draft, enabled: true });
  if (typeof telegram === "string") return { ok: false, error: telegram };
  const result = await sendTelegramMessage(
    { chatId: telegram.chatId, threadId: telegram.topics[topic].threadId },
    testMessage(topic),
  );
  return result.ok ? { ok: true } : { ok: false, error: `Telegram báo lỗi: ${result.error}` };
}

export async function findTelegramChats(): Promise<{ ok: true; bot: string; chats: DiscoveredChat[] } | { ok: false; error: string }> {
  await requireAdmin();
  const result = await discoverTelegram();
  return result.ok ? { ok: true, ...result.result } : { ok: false, error: `Telegram báo lỗi: ${result.error}` };
}

// ── Uploads ─────────────────────────────────────────────────────────────────

export type UploadSignature =
  | { ok: true; cloudName: string; apiKey: string; timestamp: number; signature: string; folder: string }
  | { ok: false; error: string };

/** Signs a direct browser → Cloudinary upload so the API secret never leaves the server. */
export async function signUpload(folder: string): Promise<UploadSignature> {
  await requireAdmin();
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !secret) {
    return { ok: false, error: "Chưa cấu hình Cloudinary — hãy dán đường dẫn ảnh thay vì tải lên." };
  }

  const safeFolder = `caogia/${folder.replace(/[^a-z0-9_-]/gi, "")}`;
  const timestamp = Math.floor(Date.now() / 1000);
  const payload = `folder=${safeFolder}&timestamp=${timestamp}${secret}`;
  const digest = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(payload));
  const signature = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");

  return { ok: true, cloudName, apiKey, timestamp, signature, folder: safeFolder };
}
