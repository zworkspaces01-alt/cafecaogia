"use server";

import { isLocale } from "@/i18n/config";
import { loadDictionary } from "@/i18n/dictionaries";
import { isEmailConfigured, notifyInquiry, type Inquiry } from "@/lib/notify";
import { getSupabase } from "@/lib/supabase";

export type InquiryState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<"name" | "email" | "country" | "message", string>>;
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
    company: field(form, "company", 160) || null,
    email: field(form, "email", 200),
    phone: field(form, "phone", 40) || null,
    country: field(form, "country", 80),
    product_slug: field(form, "product", 120) || null,
    quantity: field(form, "quantity", 80) || null,
    incoterm: field(form, "incoterm", 10) || null,
    message: field(form, "message", 4000),
    locale: isLocale(locale) ? locale : "en",
  };

  const fieldErrors: InquiryState["fieldErrors"] = {};
  if (!inquiry.name) fieldErrors.name = errors.name;
  if (!EMAIL_RE.test(inquiry.email)) fieldErrors.email = errors.email;
  if (!inquiry.country) fieldErrors.country = errors.country;
  if (!inquiry.message) fieldErrors.message = errors.message;
  if (Object.keys(fieldErrors).length > 0) {
    return { status: "error", message: errors.check, fieldErrors };
  }

  const supabase = getSupabase();
  let stored = false;
  if (supabase) {
    const { error } = await supabase.from("inquiries").insert(inquiry);
    if (error) console.error("Failed to save inquiry", error);
    else stored = true;
  }

  // Email is a second, independent channel: the inquiry counts as received if either works.
  const emailed = await notifyInquiry(inquiry);
  if (stored || emailed) return { status: "success" };

  if (!supabase && !isEmailConfigured() && process.env.NODE_ENV !== "production") {
    console.info("[dev] Inquiry (no Supabase or email configured):", inquiry);
    return { status: "success" };
  }

  console.error("Inquiry could not be stored or emailed", inquiry);
  return { status: "error", message: errors.failed };
}
