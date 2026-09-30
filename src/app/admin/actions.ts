"use server";

import { revalidatePath, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { getAuthClient, requireAdmin } from "@/lib/admin/auth";
import { getEntity, type Entity, type Field } from "@/lib/admin/entities";
import { CMS_CACHE_TAG } from "@/lib/supabase";
import type { SiteSettings } from "@/lib/types";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

// ── Auth ────────────────────────────────────────────────────────────────────

export async function signIn(
  _prev: { error?: string; email?: string },
  form: FormData,
): Promise<{ error?: string; email?: string }> {
  const supabase = await getAuthClient();
  if (!supabase) return { error: "Chưa cấu hình Supabase (SUPABASE_URL, SUPABASE_ANON_KEY)." };

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

const nullableTypes = new Set(["image", "file", "number"]);
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

export async function saveRecord(entityKey: string, id: string | null, values: Record<string, unknown>): Promise<ActionResult> {
  const entity = getEntity(entityKey);
  if (!entity) return { ok: false, error: "Loại nội dung không hợp lệ." };
  const { supabase } = await requireAdmin();

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
  return { ok: true, id: data.id as string };
}

export async function deleteRecord(entityKey: string, id: string): Promise<ActionResult> {
  const entity = getEntity(entityKey);
  if (!entity) return { ok: false, error: "Loại nội dung không hợp lệ." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from(entity.table).delete().eq("id", id);
  if (error) return { ok: false, error: `Không xoá được: ${error.message}` };
  refreshSite();
  return { ok: true };
}

// ── Inquiries & settings ────────────────────────────────────────────────────

const inquiryStatuses = ["new", "contacted", "quoted", "won", "lost"];

export async function setInquiryStatus(id: string, status: string): Promise<ActionResult> {
  if (!inquiryStatuses.includes(status)) return { ok: false, error: "Trạng thái không hợp lệ." };
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("inquiries").update({ status }).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin", "layout");
  return { ok: true };
}

export async function saveSettings(data: SiteSettings): Promise<ActionResult> {
  const { supabase } = await requireAdmin();
  const clean: SiteSettings = {
    ...data,
    company: { ...data.company, foundingYear: Number(data.company.foundingYear) || new Date().getFullYear() },
    memberships: data.memberships.filter((m) => m.name.trim()),
    stats: data.stats.filter((s) => s.value.trim() && s.label.en.trim()),
  };
  const { error } = await supabase.from("site_settings").upsert({ id: 1, data: clean });
  if (error) return { ok: false, error: `Không lưu được: ${error.message}` };
  refreshSite();
  return { ok: true };
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
