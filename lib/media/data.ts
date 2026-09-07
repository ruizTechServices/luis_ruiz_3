import "server-only";

import { requireGioAdmin } from "@/lib/auth/admin";
import { MEDIA_BUCKET, MEDIA_PAGE_SIZE, type MediaFolder, type MediaImage } from "@/lib/media/config";
import { createClient } from "@/lib/supabase/server";

export async function getMediaImages(folder: MediaFolder, page: number): Promise<{ images: MediaImage[]; hasMore: boolean }> {
  await requireGioAdmin();
  const supabase = await createClient();
  const storage = supabase.storage.from(MEDIA_BUCKET);
  const { data, error } = await storage.list(folder, {
    limit: MEDIA_PAGE_SIZE + 1,
    offset: page * MEDIA_PAGE_SIZE,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw new Error("Your media could not be loaded. Please try again.");

  const images = (data ?? []).slice(0, MEDIA_PAGE_SIZE).flatMap((entry) => {
    // A page lists files in the selected folder only; it never walks subfolders.
    if (!entry.id || !/\.(png|jpe?g|webp|gif|avif)$/i.test(entry.name)) return [];
    const path = `${folder}/${entry.name}`;
    return [{ name: entry.name, path, url: storage.getPublicUrl(path).data.publicUrl, size: typeof entry.metadata?.size === "number" ? entry.metadata.size : null }];
  });
  return { images, hasMore: (data?.length ?? 0) > MEDIA_PAGE_SIZE };
}
