"use client";

import type { ImageLoaderProps } from "next/image";

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

/** Widths pre-rendered for each photo in /public/photos (name-480.webp, name-960.webp, name-1600.webp). */
const PHOTO_WIDTHS = [480, 960, 1600];

/**
 * Resolves every <Image> src to a resized, auto-format URL.
 *
 * Accepted src formats:
 * - Cloudinary public ID:       "caogia/products/robusta-s18"
 * - Full Cloudinary upload URL: "https://res.cloudinary.com/<cloud>/image/upload/v1/caogia/x.jpg"
 * - Unsplash URL (placeholder photos until real ones are uploaded)
 * - Any other remote URL (proxied through Cloudinary fetch when a cloud name is set)
 * - Own photo in /public/photos: "/photos/drying-beds.jpg" → the smallest WebP that covers `width`
 * - Other local file in /public
 */
export default function cloudinaryLoader({ src, width, quality }: ImageLoaderProps) {
  const q = quality ? `q_${quality}` : "q_auto";
  const transform = `f_auto,${q},c_limit,w_${width}`;

  const photo = src.match(/^\/photos\/([\w-]+)\.jpg$/);
  if (photo) {
    const w = PHOTO_WIDTHS.find((size) => size >= width) ?? PHOTO_WIDTHS[PHOTO_WIDTHS.length - 1];
    return `/photos/${photo[1]}-${w}.webp`;
  }

  if (src.startsWith("/")) {
    return `${src}?w=${width}`;
  }

  if (src.includes("res.cloudinary.com") && src.includes("/image/upload/")) {
    return src.replace("/image/upload/", `/image/upload/${transform}/`);
  }

  if (src.startsWith("https://images.unsplash.com/")) {
    const url = new URL(src);
    url.searchParams.set("w", String(width));
    url.searchParams.set("q", String(quality ?? 75));
    url.searchParams.set("auto", "format");
    url.searchParams.set("fit", "max");
    return url.toString();
  }

  if (/^https?:\/\//.test(src)) {
    return cloudName
      ? `https://res.cloudinary.com/${cloudName}/image/fetch/${transform}/${encodeURIComponent(src)}`
      : src;
  }

  if (!cloudName) {
    throw new Error(
      `Image "${src}" looks like a Cloudinary public ID but NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME is not set.`,
    );
  }
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${src}`;
}
