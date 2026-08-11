import type { SupabaseClient } from "@supabase/supabase-js";

const MAX_BYTES = 2 * 1024 * 1024;

const EXTENSION: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export type UploadResult =
  | { url: string; error?: undefined }
  | { url?: undefined; error: string };

/**
 * Uploads an organization logo and returns its public URL.
 *
 * The bucket enforces size and MIME type as well (0006_storage.sql) — this is
 * the friendly half of the same rule, so a member gets a sentence rather than a
 * storage error code.
 */
export async function uploadOrgLogo(
  // Only the storage client, not the whole Supabase client: buckets are
  // schema-agnostic, and asking for the narrower thing keeps this from being
  // pinned to whichever Postgres schema the caller happens to be querying.
  supabase: { storage: SupabaseClient["storage"] },
  file: File,
): Promise<UploadResult> {
  const extension = EXTENSION[file.type];
  if (!extension) {
    return { error: "Logo must be a PNG, JPEG, WebP or SVG image." };
  }
  if (file.size > MAX_BYTES) {
    return { error: "Logo must be smaller than 2 MB." };
  }

  const path = `${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage
    .from("org-logos")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) return { error: "Could not upload that logo. Try again." };

  const {
    data: { publicUrl },
  } = supabase.storage.from("org-logos").getPublicUrl(path);

  return { url: publicUrl };
}
