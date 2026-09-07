"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Check, Copy, Headphones, Keyboard, LoaderCircle, Pause, Play, Search, Shuffle, Sparkles, Square, Star, Volume2, VolumeX, X } from "lucide-react";

import { useAudioPlayer } from "@/components/soundboard/use-audio-player";
import { SOUND_CLIPS, type SoundCategory } from "@/lib/soundboard/catalog";
import { dailySoundIndex, formatSoundTime, ignoreSoundShortcut, parseSoundPreferences, randomSoundIndex, readSoundPreferencesSnapshot, readUtcDate, serverSoundPreferencesSnapshot, serverUtcDate, subscribeSoundPreferences, subscribeUtcDate, updateSoundPreferences, type SoundPreferences } from "@/lib/soundboard/preferences";

const FILTERS = ["All sounds", "Reactions", "Comedy", "Effects", "Favorites"] as const;
type SoundFilter = (typeof FILTERS)[number];
const CATEGORY_STYLES: Record<SoundCategory, string> = {
  Reactions: "bg-primary/10 text-primary",
  Comedy: "bg-amber-100 text-amber-900",
  Effects: "bg-stone-200/60 text-stone-700",
};

export function Soundboard({ initialSoundId }: { initialSoundId: string | null }) {
  const snapshot = useSyncExternalStore(subscribeSoundPreferences, readSoundPreferencesSnapshot, serverSoundPreferencesSnapshot);
  const preferences = useMemo(() => parseSoundPreferences(snapshot), [snapshot]);
  const utcDate = useSyncExternalStore(subscribeUtcDate, readUtcDate, serverUtcDate);
  const dailySound = utcDate ? SOUND_CLIPS[dailySoundIndex(utcDate, SOUND_CLIPS.length)] : null;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<SoundFilter>("All sounds");
  const [storageLimited, setStorageLimited] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [manualLink, setManualLink] = useState<string | null>(null);

  const savePreferences = useCallback((update: (value: SoundPreferences) => SoundPreferences) => {
    if (!updateSoundPreferences(update)) setStorageLimited(true);
  }, []);
  const rememberPlayed = useCallback((id: string) => {
    setShareMessage(null);
    setManualLink(null);
    savePreferences((current) => ({ ...current, recent: [id, ...current.recent.filter((item) => item !== id)].slice(0, 6) }));
  }, [savePreferences]);
  const { audioRef, selected, phase, elapsed, duration, error, play, stop, togglePlayback, seek, events } = useAudioPlayer({ initialSoundId, volume: preferences.volume, muted: preferences.muted, onPlayed: rememberPlayed });
  const playing = phase === "playing";
  const loading = phase === "loading";
  const favoriteIds = useMemo(() => new Set(preferences.favorites), [preferences.favorites]);
  const visibleSounds = SOUND_CLIPS.filter((sound) => {
    const matchesFilter = filter === "All sounds" || (filter === "Favorites" ? favoriteIds.has(sound.id) : sound.category === filter);
    return matchesFilter && `${sound.label} ${sound.category}`.toLowerCase().includes(query.trim().toLowerCase());
  });
  const recentSounds = preferences.recent.flatMap((id) => {
    const sound = SOUND_CLIPS.find((clip) => clip.id === id);
    return sound ? [sound] : [];
  });

  const playRandom = useCallback(() => {
    const index = randomSoundIndex(SOUND_CLIPS.map((sound) => sound.id), selected?.id ?? null);
    void play(SOUND_CLIPS[index]);
  }, [play, selected]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (!preferences.keyboardEnabled || ignoreSoundShortcut(event)) return;
      const key = event.key.toLowerCase();
      if (key === "escape") { event.preventDefault(); stop(); }
      else if (key === " " && selected) { event.preventDefault(); togglePlayback(); }
      else if (key === "0") { event.preventDefault(); playRandom(); }
      else {
        const sound = SOUND_CLIPS.find((clip) => clip.hotkey.toLowerCase() === key);
        if (sound) { event.preventDefault(); void play(sound); }
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [play, playRandom, preferences.keyboardEnabled, selected, stop, togglePlayback]);

  function toggleFavorite(id: string) {
    savePreferences((current) => ({ ...current, favorites: current.favorites.includes(id) ? current.favorites.filter((item) => item !== id) : [...current.favorites, id] }));
  }

  async function copySoundLink() {
    if (!selected) return;
    const url = new URL(window.location.href);
    url.search = "";
    url.searchParams.set("sound", selected.id);
    url.hash = "";
    try {
      await navigator.clipboard.writeText(url.toString());
      setShareMessage(`Link copied for ${selected.label}.`);
      setManualLink(null);
    } catch {
      setShareMessage("Copy the link below to share this sound.");
      setManualLink(url.toString());
    }
  }

  const phaseLabel = { ready: "Ready when you are", loading: "Loading", playing: "Now playing", paused: "Paused", stopped: "Stopped", ended: "That’s the one", error: "Playback unavailable" }[phase];

  return (
    <div className="space-y-8 pb-8">
      <audio ref={audioRef} preload="none" {...events} />

      <div className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
        <section aria-labelledby="daily-sound-heading" className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground sm:p-8">
          <div className="relative z-10 flex h-full flex-col justify-between gap-7 sm:flex-row sm:items-center">
            <div><p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.17em] text-white/65"><Sparkles aria-hidden="true" size={14} /> A fresh pick, every day</p><h2 id="daily-sound-heading" className="mt-4 font-display text-3xl sm:text-4xl">{dailySound?.label ?? "Today’s sound"}</h2><p className="mt-3 text-sm text-white/70">A tiny break from being productive. You’re welcome.</p></div>
            <button type="button" onClick={() => dailySound && void play(dailySound)} disabled={!dailySound} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 self-start rounded-full bg-primary-foreground px-5 py-3 text-sm font-semibold text-primary transition hover:bg-white active:scale-[0.97] disabled:opacity-50 sm:self-center"><Play aria-hidden="true" size={15} fill="currentColor" /> Play today’s pick</button>
          </div>
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-12 right-12 flex items-center gap-3 opacity-[0.06]">{[90, 140, 100, 180, 120, 160, 90].map((height, index) => <span key={index} className="w-8 rounded-full bg-white" style={{ height }} />)}</div>
        </section>
        <section className="flex flex-col justify-between gap-6 rounded-2xl border border-amber-900/15 bg-[#f0e7d3] p-6 sm:p-8">
          <div><p className="font-mono text-[10px] uppercase tracking-[0.17em] text-amber-950/60">Leave it to chance</p><h2 className="mt-4 font-display text-3xl text-amber-950">Surprise me.</h2><p className="mt-3 text-sm leading-6 text-amber-950/70">One button. A different sound. See what happens.</p></div>
          <button type="button" onClick={playRandom} className="inline-flex min-h-11 items-center justify-center gap-2 self-start rounded-full border border-amber-950/25 px-5 py-3 text-sm font-medium text-amber-950 transition hover:bg-amber-950/5 active:scale-[0.97]"><Shuffle aria-hidden="true" size={16} /> Play a random sound <kbd className="ml-2 rounded border border-amber-950/20 px-1.5 text-[10px]">0</kbd></button>
        </section>
      </div>

      <section aria-label="Choose your sounds" className="space-y-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm"><Search aria-hidden="true" size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><label className="sr-only" htmlFor="sound-search">Search sounds</label><input id="sound-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find your sound…" className="min-h-12 w-full rounded-xl border border-border bg-card pl-11 pr-12 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/40" />{query && <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className="absolute right-0.5 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground"><X size={16} /></button>}</div>
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Filter sounds">{FILTERS.map((item) => <button type="button" key={item} onClick={() => setFilter(item)} aria-pressed={filter === item} className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-sm transition ${filter === item ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>{item === "Favorites" && <Star aria-hidden="true" size={14} />}{item}{item === "Favorites" && <span className="font-mono text-xs opacity-70">{preferences.favorites.length}</span>}</button>)}</div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground" role="status">{visibleSounds.length} {visibleSounds.length === 1 ? "sound" : "sounds"}{filter === "All sounds" && !query ? ". Zero serious reasons required." : " in this view."}</p><p className="text-xs text-muted-foreground">Tap to play. Tap again to restart.</p></div>

        {visibleSounds.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {visibleSounds.map((sound) => {
              const active = selected?.id === sound.id;
              const isPlaying = active && playing;
              const isLoading = active && loading;
              const favorite = favoriteIds.has(sound.id);
              return (
                <div key={sound.id} className={`group relative rounded-2xl border transition ${active ? "border-primary bg-primary text-primary-foreground shadow-[0_5px_0_0_#163723]" : "border-[#d7dccd] bg-card shadow-[0_5px_0_0_#e1e4d9] hover:border-primary/40 hover:shadow-[0_7px_0_0_#d8decf]"}`}>
                  <button type="button" onClick={() => void play(sound)} aria-label={`${active ? "Restart" : "Play"} ${sound.label}, shortcut ${sound.hotkey}`} aria-pressed={active} className="flex min-h-44 w-full flex-col items-start justify-between rounded-2xl p-4 text-left outline-none transition-transform active:translate-y-1 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 sm:min-h-48 sm:p-5">
                    <span className={`flex size-11 items-center justify-center rounded-xl ${active ? "bg-white/15 text-white" : CATEGORY_STYLES[sound.category]}`}>{isLoading ? <LoaderCircle aria-hidden="true" size={19} className="animate-spin" /> : isPlaying ? <PlayingBars /> : <Play aria-hidden="true" size={17} fill="currentColor" />}</span>
                    <span className="mt-5 w-full"><span className="block pr-1 text-base font-semibold leading-snug sm:text-lg">{sound.label}</span><span className={`mt-3 flex w-full items-center justify-between gap-2 text-[10px] sm:text-xs ${active ? "text-white/65" : "text-muted-foreground"}`}><span>{sound.category} · {sound.durationSeconds < 1 ? "<1" : Math.round(sound.durationSeconds)}s</span><kbd className={`rounded-md border px-2 py-1 font-mono text-[10px] ${active ? "border-white/25 bg-white/10" : "border-border bg-background"}`}>{sound.hotkey}</kbd></span></span>
                  </button>
                  <button type="button" onClick={() => toggleFavorite(sound.id)} aria-label={`${favorite ? "Remove" : "Add"} ${sound.label} ${favorite ? "from" : "to"} favorites`} aria-pressed={favorite} className={`absolute right-2 top-2 flex size-11 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${active ? "text-white/75 hover:bg-white/10 hover:text-white" : "text-muted-foreground hover:bg-muted hover:text-primary"}`}><Star aria-hidden="true" size={17} fill={favorite ? "currentColor" : "none"} /></button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center"><Star aria-hidden="true" className="mx-auto mb-4 text-muted-foreground" size={25} /><h3 className="font-display text-2xl">{filter === "Favorites" && !query ? "Keep the good ones close." : "Nothing on that frequency."}</h3><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">{filter === "Favorites" && !query ? "Tap the star on any sound. Your favorites will be waiting here the next time you visit." : "Try a different name or show all sounds."}</p><button type="button" onClick={() => { setQuery(""); setFilter("All sounds"); }} className="mt-6 min-h-11 rounded-full border border-border px-5 py-3 text-sm font-medium hover:bg-muted">Show all sounds</button></div>
        )}
      </section>

      {recentSounds.length > 0 && <section aria-labelledby="recent-sounds-heading" className="border-t border-border pt-7"><div className="mb-4 flex items-center justify-between gap-3"><h2 id="recent-sounds-heading" className="text-sm font-medium">Back for another listen?</h2><button type="button" onClick={() => savePreferences((current) => ({ ...current, recent: [] }))} className="min-h-11 px-2 text-xs text-muted-foreground hover:text-foreground">Clear recent</button></div><div className="flex flex-wrap gap-2">{recentSounds.map((sound) => <button type="button" key={sound.id} onClick={() => void play(sound)} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm hover:border-primary/40 hover:bg-primary/5"><Play aria-hidden="true" size={12} />{sound.label}</button>)}</div></section>}

      <div className="flex flex-wrap items-start justify-between gap-4 border-t border-border pt-6 text-xs leading-6 text-muted-foreground">
        <p className="max-w-md">{storageLimited ? "Browser storage is unavailable. Favorites and recent sounds will last for this visit." : "Favorites, recent sounds, and volume stay in this browser. No account needed."}</p>
        <details className="group max-w-md"><summary className="flex min-h-11 cursor-pointer items-center gap-2 font-medium text-foreground"><Keyboard aria-hidden="true" size={17} /> Keyboard shortcuts</summary><p className="mt-2"><kbd>1–9</kbd> and <kbd>Q W E R T Y U</kbd> play the labeled pad. <kbd>Space</kbd> pauses or resumes. <kbd>Esc</kbd> stops. <kbd>0</kbd> picks a different sound. Shortcuts pause while you type.</p><label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3"><input type="checkbox" checked={preferences.keyboardEnabled} onChange={(event) => savePreferences((current) => ({ ...current, keyboardEnabled: event.target.checked }))} className="size-4 accent-primary" />Enable keyboard shortcuts</label><p className="mt-2">Today’s pick changes at midnight UTC.</p></details>
      </div>

      <section aria-label="Sound player" className="sticky bottom-4 z-30 rounded-2xl border border-[#354b38] bg-[#263b2b] p-4 text-[#fafbf5] shadow-[0_10px_50px_-10px_#17281955] sm:p-5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex min-w-0 flex-1 basis-48 items-center gap-3"><span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/10">{playing ? <PlayingBars /> : <Headphones size={19} />}</span><div className="min-w-0"><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/55">{selected ? phaseLabel : "Your little sound machine"}</p><p className="mt-1 truncate text-sm font-semibold sm:text-base">{selected?.label ?? "Pick a sound. Make a moment."}</p></div></div>
          <div className="flex items-center gap-2"><button type="button" onClick={togglePlayback} disabled={!selected} aria-label={playing || loading ? "Pause sound" : "Play selected sound"} className="flex size-12 items-center justify-center rounded-full bg-[#f7f7f2] text-[#263b2b] transition hover:bg-white disabled:opacity-40">{loading ? <LoaderCircle aria-hidden="true" className="animate-spin" size={20} /> : playing ? <Pause aria-hidden="true" size={20} fill="currentColor" /> : <Play aria-hidden="true" size={19} fill="currentColor" />}</button><button type="button" onClick={stop} disabled={!selected} aria-label="Stop sound" title="Stop (Esc)" className="flex size-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10 disabled:opacity-30"><Square aria-hidden="true" size={17} fill="currentColor" /></button><button type="button" onClick={playRandom} aria-label="Play a random sound" title="Random (0)" className="flex size-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10"><Shuffle aria-hidden="true" size={18} /></button></div>
          <div className="flex items-center gap-2"><button type="button" onClick={() => savePreferences((current) => ({ ...current, muted: !current.muted }))} aria-label={preferences.muted ? "Unmute sound" : "Mute sound"} aria-pressed={preferences.muted} className="flex size-11 items-center justify-center rounded-full text-white/80 hover:bg-white/10">{preferences.muted || preferences.volume === 0 ? <VolumeX aria-hidden="true" size={19} /> : <Volume2 aria-hidden="true" size={19} />}</button><label className="sr-only" htmlFor="sound-volume">Volume</label><input id="sound-volume" type="range" min="0" max="100" step="1" value={Math.round(preferences.volume * 100)} onChange={(event) => savePreferences((current) => ({ ...current, volume: Number(event.target.value) / 100, muted: false }))} aria-valuetext={`${Math.round(preferences.volume * 100)} percent`} className="h-11 w-20 cursor-pointer accent-[#d8bc78] sm:w-24" /><button type="button" onClick={copySoundLink} disabled={!selected} title="Copy a link to the selected sound" className="ml-1 inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-xs text-white/80 hover:bg-white/10 disabled:opacity-30">{shareMessage?.startsWith("Link copied") ? <Check aria-hidden="true" size={16} /> : <Copy aria-hidden="true" size={16} />}<span className="hidden sm:inline">Copy link</span><span className="sr-only sm:hidden">Copy sound link</span></button></div>
        </div>
        <div className="mt-2 flex items-center gap-3"><span className="w-8 shrink-0 font-mono text-[10px] text-white/55">{formatSoundTime(elapsed)}</span><label className="sr-only" htmlFor="sound-progress">Playback position</label><input id="sound-progress" type="range" min="0" max={duration > 0 ? duration : 1} step="0.01" value={Math.min(elapsed, duration || 1)} disabled={duration <= 0} onChange={(event) => seek(Number(event.target.value))} aria-valuetext={`${formatSoundTime(elapsed)} of ${formatSoundTime(duration || selected?.durationSeconds || 0)}`} className="h-11 min-w-0 flex-1 cursor-pointer accent-[#d8bc78] disabled:cursor-default disabled:opacity-30" /><span className="w-8 shrink-0 text-right font-mono text-[10px] text-white/55">{formatSoundTime(duration || selected?.durationSeconds || 0)}</span></div>
        <div className="sr-only" role="status" aria-live="polite">{selected ? `${phaseLabel}: ${selected.label}.` : "Select a sound to begin."}</div>
        {error && <p role="alert" className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-sm leading-6">{error}</p>}
        {shareMessage && <p role="status" className="mt-2 text-xs leading-5 text-white/65">{shareMessage}</p>}
        {manualLink && <input readOnly aria-label="Share this sound link" value={manualLink} onFocus={(event) => event.target.select()} className="mt-2 min-h-11 w-full rounded-lg border border-white/20 bg-white/5 px-3 text-xs" />}
      </section>
    </div>
  );
}

function PlayingBars() {
  return <span aria-hidden="true" className="flex h-5 items-center gap-[3px]">{[9, 18, 13, 20].map((height, index) => <span key={index} className="w-[3px] animate-pulse rounded-full bg-current motion-reduce:animate-none" style={{ height, animationDelay: `${index * 120}ms` }} />)}</span>;
}
