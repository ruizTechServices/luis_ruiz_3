import "server-only";

import { serverLog } from "@/lib/logging/server";
import { createClient } from "@/lib/supabase/server";
import { type ManagedSoundClip, type SoundCategory, type SoundClip, type SoundStatus } from "./catalog";
import { AUDIO_BUCKET } from "./audio-validation";

export const SOUND_COLUMNS = "id,label,source_path,hotkey,category,duration_seconds,status,daily_pick,is_original,sort_order,updated_at";
export interface SoundRow { id: string; label: string; source_path: string; hotkey: string; category: SoundCategory; duration_seconds: number; status: SoundStatus; daily_pick: boolean; is_original: boolean; sort_order: number; updated_at: string }
type StorageClient = Awaited<ReturnType<typeof createClient>>;

export function mapSoundRow(row: SoundRow, client: StorageClient): ManagedSoundClip {
  return { id: row.id, label: row.label, src: row.is_original ? row.source_path : client.storage.from(AUDIO_BUCKET).getPublicUrl(row.source_path).data.publicUrl, hotkey: row.hotkey, category: row.category, durationSeconds: Number(row.duration_seconds), status: row.status, dailyPick: row.daily_pick, original: row.is_original, sortOrder: row.sort_order, updatedAt: row.updated_at };
}

export async function getPublicSounds(): Promise<{ clips: readonly SoundClip[]; unavailable: boolean }> {
  try {
    const client = await createClient();
    const { data, error } = await client.from("soundboard_clips").select(SOUND_COLUMNS).eq("status", "published").order("sort_order").order("created_at").limit(500);
    if (error) throw error;
    return { clips: (data as SoundRow[]).map((row) => mapSoundRow(row, client)), unavailable: false };
  } catch {
    serverLog({ scope: "soundboard", level: "warn", event: "catalog_unavailable" });
    return { clips: [], unavailable: true };
  }
}

export async function getManagedSounds(): Promise<ManagedSoundClip[]> {
  const client = await createClient();
  const { data, error } = await client.from("soundboard_clips").select(SOUND_COLUMNS).order("sort_order").order("created_at").limit(500);
  if (error) throw error;
  return (data as SoundRow[]).map((row) => mapSoundRow(row, client));
}
