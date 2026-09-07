import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

import { isGioAdmin } from "@/lib/auth/admin";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { serverLog } from "@/lib/logging/server";
import { MEDIA_BUCKET, MediaInputError } from "@/lib/media/config";
import { processUploadedImage } from "@/lib/media/image-processing";
import { readUploadFile } from "@/lib/media/upload-request";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!(await getAuthenticatedUser())) return Response.json({ error: "Sign in to upload images." }, { status: 401 });
  if (!(await isGioAdmin())) return Response.json({ error: "Only the site owner can upload images." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) {
    return Response.json({ error: "Open your media page and try again." }, { status: 403 });
  }

  try {
    const file = await readUploadFile(request);
    const bytes = await processUploadedImage(new Uint8Array(await file.arrayBuffer()));
    const path = `portfolio/${randomUUID()}.webp`;
    const supabase = await createClient();
    const storage = supabase.storage.from(MEDIA_BUCKET);
    const { error } = await storage.upload(path, bytes, { contentType: "image/webp", cacheControl: "31536000", upsert: false });
    if (error) {
      serverLog({ scope: "media", level: "error", event: "upload_failed", metadata: { code: error.name } });
      return Response.json({ error: "Your image was not uploaded. Keep the original file and try again." }, { status: 503 });
    }

    revalidatePath("/dashboard/media");
    return Response.json({ image: { name: path.split("/").at(-1), path, url: storage.getPublicUrl(path).data.publicUrl, size: bytes.byteLength } }, { status: 201 });
  } catch (error) {
    if (error instanceof MediaInputError) return Response.json({ error: error.message }, { status: error.status });
    serverLog({ scope: "media", level: "error", event: "upload_request_failed" });
    return Response.json({ error: "The upload could not be completed. Please try again." }, { status: 500 });
  }
}
