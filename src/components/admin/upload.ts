import { signUpload } from "@/app/admin/actions";

/** Uploads a file straight from the browser to Cloudinary (signed on the server) and returns its URL. */
export async function uploadToCloudinary(file: File, folder: string, kind: "image" | "auto") {
  const sig = await signUpload(folder);
  if (!sig.ok) throw new Error(sig.error);
  const body = new FormData();
  body.append("file", file);
  body.append("api_key", sig.apiKey);
  body.append("timestamp", String(sig.timestamp));
  body.append("signature", sig.signature);
  body.append("folder", sig.folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/${kind}/upload`, { method: "POST", body });
  const json = (await res.json()) as { secure_url?: string; error?: { message?: string } };
  if (!res.ok) throw new Error(json?.error?.message ?? "Tải lên thất bại.");
  return json.secure_url as string;
}
