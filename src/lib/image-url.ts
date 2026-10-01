import { site } from "@/lib/site";

/** Absolute image URL for metadata (OG tags, JSON-LD), where next/image loaders don't apply. */
export function imageUrl(src: string, width = 1200) {
  // Local files, e.g. /photos/drying-beds.jpg (a 1200px JPEG, the size social networks expect).
  if (src.startsWith("/")) return `${site.url}${src}`;
  if (src.startsWith("https://images.unsplash.com/")) return `${src}?w=${width}&q=75&auto=format&fit=max`;
  if (/^https?:\/\//.test(src)) return src;
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,c_limit,w_${width}/${src}`;
}
