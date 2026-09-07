"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { SOUND_CLIPS, type SoundClip } from "@/lib/soundboard/catalog";
import { safeSeek } from "@/lib/soundboard/preferences";

type PlaybackPhase = "ready" | "loading" | "playing" | "paused" | "stopped" | "ended" | "error";

export function useAudioPlayer({ initialSoundId, volume, muted, onPlayed }: { initialSoundId: string | null; volume: number; muted: boolean; onPlayed: (id: string) => void }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const requestRef = useRef(0);
  const intentRef = useRef<"play" | "pause" | "stop">("stop");
  const [selectedId, setSelectedId] = useState(initialSoundId);
  const [phase, setPhase] = useState<PlaybackPhase>("ready");
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const selected = SOUND_CLIPS.find((clip) => clip.id === selectedId) ?? null;

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      requestRef.current += 1;
      if (audio) { audio.pause(); audio.removeAttribute("src"); audio.load(); }
    };
  }, []);

  const play = useCallback(async (sound: SoundClip, restart = true) => {
    const audio = audioRef.current;
    if (!audio) return;
    const request = ++requestRef.current;
    intentRef.current = "play";
    setError(null);
    setSelectedId(sound.id);
    const sourceChanged = audio.getAttribute("src") !== sound.src;
    if (sourceChanged || audio.error) {
      audio.pause();
      audio.src = sound.src;
      if (!sourceChanged) audio.load();
      setDuration(0);
    }
    if (restart || sourceChanged || audio.ended) {
      try { audio.currentTime = 0; } catch { /* New sources already start at zero. */ }
      setElapsed(0);
    }
    setPhase("loading");
    try {
      await audio.play();
      if (request !== requestRef.current) return;
      setPhase("playing");
      onPlayed(sound.id);
    } catch (failure) {
      if (request !== requestRef.current) return;
      intentRef.current = "stop";
      setPhase("error");
      setError(failure instanceof DOMException && failure.name === "NotAllowedError"
        ? "Your browser blocked playback. Tap the sound again to start it."
        : "This sound couldn’t play. Check your connection and try again.");
    }
  }, [onPlayed]);

  const togglePlayback = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !selected) return;
    if (!audio.paused || intentRef.current === "play") {
      requestRef.current += 1;
      intentRef.current = "pause";
      audio.pause();
      setPhase("paused");
    } else {
      void play(selected, false);
    }
  }, [play, selected]);

  const stop = useCallback(() => {
    requestRef.current += 1;
    intentRef.current = "stop";
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      try { audio.currentTime = 0; } catch { /* A selected sound may not be loaded yet. */ }
    }
    setElapsed(0);
    setPhase("stopped");
    setError(null);
  }, []);

  function seek(seconds: number) {
    const audio = audioRef.current;
    if (!audio) return;
    const next = safeSeek(seconds, audio.duration);
    if (next === null) return;
    audio.currentTime = next;
    setElapsed(next);
  }

  const events = {
    onLoadedMetadata: () => {
      const value = audioRef.current?.duration;
      if (value !== undefined && Number.isFinite(value) && value > 0) setDuration(value);
    },
    onDurationChange: () => {
      const value = audioRef.current?.duration;
      setDuration(value !== undefined && Number.isFinite(value) && value > 0 ? value : 0);
    },
    onTimeUpdate: () => {
      const value = audioRef.current?.currentTime;
      if (value !== undefined && Number.isFinite(value)) setElapsed(value);
    },
    onPlaying: () => { if (intentRef.current === "play" && !audioRef.current?.paused) setPhase("playing"); },
    onPause: () => {
      const audio = audioRef.current;
      // System interruptions are real pauses too. A queued pause from switching
      // clips must not overwrite the new source's already-playing state.
      if (!audio?.paused || audio.ended || intentRef.current === "stop") return;
      requestRef.current += 1;
      intentRef.current = "pause";
      setPhase("paused");
    },
    onWaiting: () => { if (intentRef.current === "play") setPhase("loading"); },
    onEnded: () => {
      if (!audioRef.current?.ended) return;
      intentRef.current = "stop";
      setPhase("ended");
    },
    onError: () => {
      if (!audioRef.current?.error) return;
      intentRef.current = "stop";
      setPhase("error");
      setError("This sound couldn’t load. Check your connection and tap it to try again.");
    },
  };

  return { audioRef, selected, phase, elapsed, duration, error, play, stop, togglePlayback, seek, events };
}
