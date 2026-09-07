"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LoaderCircle, Upload } from "lucide-react";

import { SOUND_CATEGORIES, type ManagedSoundClip, type SoundStatus } from "@/lib/soundboard/catalog";

const field = "mt-2 min-h-11 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";
type Feedback = { message: string; error: boolean; signIn?: boolean };

export function SoundboardManager({ clips, loadFailed }: { clips: ManagedSoundClip[]; loadFailed: boolean }) {
  const router = useRouter();
  const [added, setAdded] = useState<ManagedSoundClip[]>([]);
  const [uploading, setUploading] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [filter, setFilter] = useState<SoundStatus | "all">("all");
  const knownIds = new Set(clips.map((clip) => clip.id));
  const shown = [...added.filter((clip) => !knownIds.has(clip.id)), ...clips];

  async function upload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const body = new FormData(form);
    const file = body.get("file");
    if (!(file instanceof File) || !file.size) { setFeedback({ error: true, message: "Choose an MP3 or PCM WAV file." }); return; }
    if (file.size > 3 * 1024 * 1024) { setFeedback({ error: true, message: "Choose a file smaller than 3 MB." }); return; }
    body.set("dailyPick", body.get("dailyPick") === "on" ? "true" : "false");
    setUploading(true); setFeedback(null);
    try {
      const response = await fetch("/api/soundboard", { method: "POST", body });
      const result = await response.json();
      if (!response.ok || !result.clip) { setFeedback({ error: true, message: result.error ?? "Upload failed. Please try again.", signIn: response.status === 401 }); return; }
      setAdded((current) => [result.clip, ...current]); setFilter("all"); form.reset();
      setFeedback({ error: false, message: `${result.clip.label} is saved as a draft. Preview it below, then choose Published and save to add it to the public soundboard.` });
      router.refresh();
    } catch { setFeedback({ error: true, message: "The upload did not finish. Keep your file and try again." }); }
    finally { setUploading(false); }
  }

  return <>
    <form onSubmit={upload} className="my-9 rounded-2xl border border-border bg-card p-5 sm:p-7">
      <h2 className="font-display text-2xl">Add a sound</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">MP3 or PCM WAV, up to 3 MB and 60 seconds. Uploads start as drafts. Audio file URLs are public, including while a pad is a draft or archived; upload clips intended for public sharing.</p>
      <fieldset disabled={uploading} className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <label className="text-sm font-medium">Sound name<input name="label" required maxLength={70} className={field} placeholder="Name your next favorite" /></label>
        <label className="text-sm font-medium">Category<select name="category" className={field}>{SOUND_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
        <label className="text-sm font-medium">Audio file<input name="file" type="file" accept=".mp3,.wav,audio/mpeg,audio/wav,audio/x-wav" required className={`${field} file:mr-3 file:border-0 file:bg-transparent file:font-medium`} /></label>
        <label className="flex min-h-11 items-center gap-3 text-sm"><input name="dailyPick" type="checkbox" defaultChecked className="size-4 accent-primary" /> Include in daily picks after publishing</label>
        <div className="sm:col-span-2 lg:col-span-2"><button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{uploading ? <LoaderCircle size={16} className="animate-spin" /> : <Upload size={16} />}{uploading ? "Uploading…" : "Upload draft sound"}</button></div>
      </fieldset><Message value={feedback} />
    </form>
    {loadFailed && <p role="alert" className="mb-6 rounded-xl border border-border p-4 text-sm">Your saved sounds could not be loaded. <button type="button" onClick={() => router.refresh()} className="underline">Try again</button>.</p>}
    <div aria-label="Filter your sounds" className="mb-6 flex flex-wrap gap-2">{(["all", "published", "draft", "archived"] as const).map((status) => <button key={status} type="button" aria-pressed={filter === status} onClick={() => setFilter(status)} className={`min-h-11 rounded-full px-4 py-2 text-sm capitalize ${status === filter ? "bg-primary text-primary-foreground" : "border border-border hover:bg-muted"}`}>{status === "all" ? "All sounds" : status}</button>)}</div>
    <div className="grid gap-5 lg:grid-cols-2">{shown.map((clip) => <SoundEditor key={clip.id} clip={clip} filter={filter} />)}</div>
    {!loadFailed && shown.length === 0 && <p className="py-10 text-sm text-muted-foreground">Your sound collection starts with an upload.</p>}
    <p className="mt-8 text-xs leading-6 text-muted-foreground">Archiving hides a pad from the public catalog and daily picks. It preserves its stable link, saved favorites, and audio file so you can publish it again. Original audio files and shortcuts stay intact.</p>
  </>;
}

function SoundEditor({ clip, filter }: { clip: ManagedSoundClip; filter: SoundStatus | "all" }) {
  const router = useRouter();
  const [saved, setSaved] = useState(clip);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setPending(true); setFeedback(null);
    try {
      const response = await fetch("/api/soundboard", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ id: saved.id, updatedAt: saved.updatedAt, label: form.get("label"), category: form.get("category"), status: form.get("status"), dailyPick: form.get("dailyPick") === "on", sortOrder: Number(form.get("sortOrder")) }) });
      const result = await response.json();
      if (!response.ok || !result.clip) { setFeedback({ error: true, message: result.error ?? "This sound could not be saved.", signIn: response.status === 401 }); return; }
      setSaved(result.clip); setFeedback({ error: false, message: result.clip.status === "published" ? "Saved. This sound is live on the public soundboard." : `Saved as ${result.clip.status}. This pad is hidden from the public soundboard.` });
      router.refresh();
    } catch { setFeedback({ error: true, message: "Your changes could not be saved. Please try again." }); }
    finally { setPending(false); }
  }

  return <article hidden={filter !== "all" && saved.status !== filter} className="rounded-2xl border border-border bg-card p-5 sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl">{saved.label}</h2><span className="rounded-full bg-muted px-3 py-1.5 text-xs capitalize">{saved.status}</span></div>
    <p className="mt-2 text-xs text-muted-foreground">{saved.original ? `Original collection · Shortcut ${saved.hotkey}` : "Uploaded sound"} · {saved.durationSeconds.toFixed(1)} seconds</p>
    <audio controls preload="none" src={saved.src} aria-label={`Preview ${saved.label}`} className="mt-5 w-full" />
    <form onSubmit={save} className="mt-5"><fieldset disabled={pending} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm font-medium sm:col-span-2">Sound name<input name="label" required maxLength={70} defaultValue={saved.label} className={field} /></label>
      <label className="text-sm font-medium">Category<select name="category" defaultValue={saved.category} className={field}>{SOUND_CATEGORIES.map((category) => <option key={category}>{category}</option>)}</select></label>
      <label className="text-sm font-medium">Visibility<select name="status" defaultValue={saved.status} className={field}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
      <label className="text-sm font-medium">Display order<input name="sortOrder" type="number" min={0} max={9999} required defaultValue={saved.sortOrder} className={field} /><span className="mt-1 block text-xs font-normal text-muted-foreground">Lower numbers appear first.</span></label>
      <label className="flex min-h-11 items-center gap-3 self-center text-sm"><input name="dailyPick" type="checkbox" defaultChecked={saved.dailyPick} className="size-4 accent-primary" /> Include in daily picks</label>
      <div className="flex flex-wrap items-center gap-4 sm:col-span-2"><button type="submit" className="min-h-11 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{pending ? "Saving…" : "Save sound"}</button>{saved.status === "published" && <Link href={`/soundboard?sound=${saved.id}`} target="_blank" className="min-h-11 py-3 text-sm underline">Open sound</Link>}</div>
    </fieldset><Message value={feedback} /></form>
  </article>;
}

function Message({ value }: { value: Feedback | null }) {
  return value ? <p role={value.error ? "alert" : "status"} className={`mt-4 text-sm leading-6 ${value.error ? "text-destructive" : "text-foreground"}`}>{value.message}{value.signIn && <> <Link href="/login?next=/dashboard/soundboard" target="_blank" className="font-medium underline">Sign in in a new tab</Link>, then retry here.</>}</p> : null;
}
