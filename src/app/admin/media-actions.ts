"use server";

import { allowed } from "@/lib/admin/auth";
import { audit } from "@/lib/admin/audit";
import { cloudName } from "@/lib/cloudinary-loader";

// Studio › Thư viện ảnh: files uploaded from the CMS live on Cloudinary under caogia/. Listing and
// deleting go through the Cloudinary Admin API with the account's key and secret (server-side only).

export type MediaItem = { id: string; url: string; name: string; bytes: number; width: number; height: number; format: string; createdAt: string };

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string };

type CloudinaryResource = {
  public_id: string;
  secure_url: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
  created_at: string;
};

function credentials() {
  const key = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  return key && secret && cloudName ? `Basic ${btoa(`${key}:${secret}`)}` : null;
}

const notConfigured = "Chưa cấu hình Cloudinary (CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).";

export async function listMedia(cursor?: string): Promise<Result<{ items: MediaItem[]; next: string | null }>> {
  const auth = await allowed("content.read");
  if (!auth.ok) return auth;
  const basic = credentials();
  if (!basic) return { ok: false, error: notConfigured };

  const query = new URLSearchParams({ prefix: "caogia/", max_results: "60", direction: "desc" });
  if (cursor) query.set("next_cursor", cursor);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${query}`, {
    headers: { Authorization: basic },
    cache: "no-store",
  });
  const json = (await res.json()) as { resources?: CloudinaryResource[]; next_cursor?: string; error?: { message?: string } };
  if (!res.ok) return { ok: false, error: `Cloudinary báo lỗi: ${json.error?.message ?? res.status}` };
  return {
    ok: true,
    next: json.next_cursor ?? null,
    items: (json.resources ?? []).map((r) => ({
      id: r.public_id,
      url: r.secure_url,
      name: r.public_id.split("/").pop() ?? r.public_id,
      bytes: r.bytes,
      width: r.width,
      height: r.height,
      format: r.format,
      createdAt: r.created_at,
    })),
  };
}

export async function deleteMedia(id: string): Promise<Result> {
  const auth = await allowed("media.delete");
  if (!auth.ok) return auth;
  const { user } = auth;
  if (!id.startsWith("caogia/")) return { ok: false, error: "Chỉ xoá được ảnh tải lên từ CMS." };
  const basic = credentials();
  if (!basic) return { ok: false, error: notConfigured };
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/resources/image/upload?${new URLSearchParams({ "public_ids[]": id })}`, {
    method: "DELETE",
    headers: { Authorization: basic },
  });
  if (!res.ok) return { ok: false, error: `Cloudinary báo lỗi: ${res.status}` };
  await audit(user.email, "media.delete", id);
  return { ok: true };
}
