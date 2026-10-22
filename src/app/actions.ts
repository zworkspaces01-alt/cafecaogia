"use server";

import { after } from "next/server";
import { isLocale } from "@/i18n/config";
import { loadDictionary } from "@/i18n/dictionaries";
import { parseAttribution } from "@/lib/attribution";
import { sendInquiryAutoReply } from "@/lib/auto-reply";
import { insert } from "@/lib/db";
import { isGmailConfigured } from "@/lib/gmail";
import { isEmailConfigured, notifyInquiry, type Inquiry } from "@/lib/notify";
import { getProductSummary } from "@/lib/products";
import { escapeHtml, notifyInquiryTelegram, notifyTelegram } from "@/lib/telegram";

export type InquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "message", string>>;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(form: FormData, key: string, max: number) {
  const value = form.get(key);
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

export async function submitInquiry(_prev: InquiryState, form: FormData): Promise<InquiryState> {
  const locale = field(form, "lang", 5);
  const { errors } = (await loadDictionary(isLocale(locale) ? locale : "en")).form;

  // Honeypot: real visitors never see or fill this field.
  if (field(form, "website", 200)) return { status: "success" };

  const inquiry: Inquiry = {
    name: field(form, "name", 120),
    email: field(form, "email", 200),
    phone: field(form, "phone", 40) || null,
    product_slug: field(form, "product", 120) || null,
    message: field(form, "message", 4000),
    locale: isLocale(locale) ? locale : "en",
    attribution: parseAttribution(field(form, "attribution", 4000)),
  };

  const fieldErrors: InquiryState["fieldErrors"] = {};
  if (!inquiry.name) fieldErrors.name = errors.name;
  if (!EMAIL_RE.test(inquiry.email)) fieldErrors.email = errors.email;
  if (!inquiry.message) fieldErrors.message = errors.message;
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: errors.check, fieldErrors };
  }

  let stored = false;
  let storeError = "";
  let id: string | null = null;
  try {
    id = await insert("inquiries", inquiry);
    stored = true;
  } catch (error) {
    console.error("Failed to save inquiry", error);
    storeError = error instanceof Error ? error.message : String(error);
  }

  // Email and Telegram are independent channels: the inquiry counts as received if any of them works.
  const product = inquiry.product_slug ? await getProductSummary(inquiry.product_slug).catch(() => null) : null;
  const [emailed, telegrammed] = await Promise.all([notifyInquiry(inquiry), notifyInquiryTelegram(inquiry, product, id)]);
  if (storeError) {
    after(() =>
      notifyTelegram(
        "system",
        `🚨 <b>Yêu cầu báo giá không lưu được vào database</b>\nKhách: ${escapeHtml(inquiry.name)} · ${escapeHtml(inquiry.email)}\nLỗi: <code>${escapeHtml(storeError.slice(0, 300))}</code>\nEmail: ${emailed ? "đã gửi" : "không gửi được"} · Telegram: ${telegrammed ? "đã gửi" : "không gửi được"}`,
      ),
    );
  }
  if (stored || emailed || telegrammed) {
    // Confirmation to the buyer, sent after the response so they don't wait on Gmail.
    if (isGmailConfigured()) {
      after(async () => {
        if (await sendInquiryAutoReply(inquiry)) return;
        await notifyTelegram(
          "system",
          `⚠️ <b>Không gửi được email tự động cho khách</b>\nKhách: ${escapeHtml(inquiry.name)} · ${escapeHtml(inquiry.email)}\nYêu cầu báo giá vẫn được ghi nhận. Xem log Cloudflare; nếu lỗi là <code>invalid_grant</code>, chạy lại <code>npm run gmail:auth</code>.`,
        );
      });
    }
    return { status: "success" };
  }

  if (!isEmailConfigured() && process.env.NODE_ENV !== "production") {
    console.info("[dev] Inquiry (not stored, no email configured):", inquiry);
    return { status: "success" };
  }

  console.error("Inquiry could not be stored or emailed", inquiry);
  return { status: "error", message: errors.failed };
}
