import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { isGioAdmin } from "@/lib/auth/admin";
import { getAuthenticatedUser } from "@/lib/auth/session";
import { serverLog } from "@/lib/logging/server";
import { AUDIO_BUCKET, AudioInputError, validateAudio, verifyAudioPlayback } from "@/lib/soundboard/audio-validation";
import { SOUND_CATEGORIES } from "@/lib/soundboard/catalog";
import { mapSoundRow, SOUND_COLUMNS, type SoundRow } from "@/lib/soundboard/data";
import { readAudioUpload, readBoundedBody } from "@/lib/soundboard/upload-request";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const detailsSchema = z.object({
  label: z.string().trim().min(1, "Give this sound a name.").max(70, "Keep the sound name under 70 characters."),
  category: z.enum(SOUND_CATEGORIES),
  dailyPick: z.boolean(),
});
const updateSchema = detailsSchema.extend({ id: z.string().regex(/^[a-z0-9-]{1,80}$/), updatedAt: z.iso.datetime({ offset: true }), status: z.enum(["draft", "published", "archived"]), sortOrder: z.number().int().min(0).max(9999) }).strict();

async function authorize(request: Request): Promise<Response | null> {
  if (!(await getAuthenticatedUser())) return Response.json({ error: "Your sign-in expired. Sign in again, then retry; your file stays on your device." }, { status: 401 });
  if (!(await isGioAdmin())) return Response.json({ error: "Only the site owner can manage sounds." }, { status: 403 });
  if (request.headers.get("origin") !== new URL(request.url).origin) return Response.json({ error: "Open your soundboard dashboard and try again." }, { status: 403 });
  return null;
}

function refreshed() {
  for (const path of ["/soundboard", "/dashboard/soundboard", "/", "/soundboard/opengraph-image"]) revalidatePath(path);
}

function failure(error: unknown) {
  if (error instanceof AudioInputError) return Response.json({ error: error.message }, { status: error.status });
  serverLog({ scope: "soundboard", level: "error", event: "management_request_failed" });
  return Response.json({ error: "The sound could not be saved. Keep your original file and try again." }, { status: 503 });
}

export async function POST(request: Request) {
  const denied = await authorize(request);
  if (denied) return denied;
  try {
    const client = await createClient();
    const quota = await client.rpc("reserve_soundboard_upload");
    if (quota.error) throw quota.error;
    if (quota.data !== true) return Response.json({ error: "You’ve reached 10 upload attempts this hour. Please try again after the next hour begins." }, { status: 429 });
    const form = await readAudioUpload(request);
    const details = detailsSchema.safeParse({ label: form.get("label"), category: form.get("category"), dailyPick: form.get("dailyPick") === "true" });
    if (!details.success) throw new AudioInputError(details.error.issues[0]?.message ?? "Check the sound details.");
    const file = form.get("file") as File;
    const audio = await verifyAudioPlayback(validateAudio(new Uint8Array(await file.arrayBuffer())));
    const id = randomUUID();
    const path = `clips/${id}.${audio.extension}`;
    const stored = await client.storage.from(AUDIO_BUCKET).upload(path, audio.bytes, { contentType: audio.contentType, cacheControl: "31536000", upsert: false });
    if (stored.error) throw stored.error;
    const result = await client.from("soundboard_clips").insert({ id: `sound-${id}`, label: details.data.label, category: details.data.category, source_path: path, duration_seconds: audio.durationSeconds, daily_pick: details.data.dailyPick }).select(SOUND_COLUMNS).single();
    if (result.error) {
      serverLog({ scope: "soundboard", level: "error", event: "uploaded_file_catalog_save_failed", metadata: { path } });
      throw new AudioInputError("The audio uploaded, but its sound entry could not be saved. Keep your original file and try again. It has not been added to the public soundboard.", 503);
    }
    refreshed();
    return Response.json({ clip: mapSoundRow(result.data as SoundRow, client) }, { status: 201 });
  } catch (error) { return failure(error); }
}

export async function PATCH(request: Request) {
  const denied = await authorize(request);
  if (denied) return denied;
  try {
    let json: unknown;
    try { json = JSON.parse((await readBoundedBody(request, 4096)).toString("utf8")); }
    catch (error) { if (error instanceof AudioInputError) throw error; throw new AudioInputError("The sound details could not be read."); }
    const parsed = updateSchema.safeParse(json);
    if (!parsed.success) throw new AudioInputError(parsed.error.issues[0]?.message ?? "Check the sound details.");
    const input = parsed.data;
    const client = await createClient();
    const result = await client.from("soundboard_clips").update({ label: input.label, category: input.category, daily_pick: input.dailyPick, status: input.status, sort_order: input.sortOrder }).eq("id", input.id).eq("updated_at", input.updatedAt).select(SOUND_COLUMNS).maybeSingle();
    if (result.error) throw result.error;
    if (!result.data) return Response.json({ error: "This sound changed in another tab. Reload this page to see the latest version before editing again." }, { status: 409 });
    refreshed();
    return Response.json({ clip: mapSoundRow(result.data as SoundRow, client) });
  } catch (error) { return failure(error); }
}
