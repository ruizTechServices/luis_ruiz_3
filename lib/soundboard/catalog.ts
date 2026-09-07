export type SoundCategory = "Reactions" | "Comedy" | "Effects";

export interface SoundClip {
  id: string;
  label: string;
  src: string;
  hotkey: string;
  category: SoundCategory;
  durationSeconds: number;
}

// Original archive and pad order recovered from luis_ruiz_2 at 97ea4af.
// Durations measured with ffprobe; the browser remains authoritative during playback.
// See docs/soundboard-provenance.md for source paths and exact audio hashes.
export const SOUND_CLIPS: readonly SoundClip[] = [
  { id: "vine-boom", label: "Vine Boom", src: "/sounds/vine-boom.mp3", hotkey: "1", category: "Effects", durationSeconds: 1.306122 },
  { id: "uwu", label: "UwU", src: "/sounds/uwu.mp3", hotkey: "2", category: "Reactions", durationSeconds: 0.72 },
  { id: "stop-the-cap", label: "Stop The Cap", src: "/sounds/stop-the-cap-cut.mp3", hotkey: "3", category: "Reactions", durationSeconds: 0.862041 },
  { id: "roblox-oof", label: "Roblox Oof", src: "/sounds/roblox-death-sound_1.mp3", hotkey: "4", category: "Effects", durationSeconds: 1.044898 },
  { id: "airhorn", label: "MLG Airhorn", src: "/sounds/mlg-airhorn.mp3", hotkey: "5", category: "Effects", durationSeconds: 3.004082 },
  { id: "meow", label: "Meow", src: "/sounds/meow_jEHtSyd.mp3", hotkey: "6", category: "Effects", durationSeconds: 0.835918 },
  { id: "mystery-clip", label: "Mystery Clip", src: "/sounds/indian.mp3", hotkey: "7", category: "Comedy", durationSeconds: 8.594286 },
  { id: "gulping", label: "Gulp", src: "/sounds/gulping.mp3", hotkey: "8", category: "Comedy", durationSeconds: 17.110204 },
  { id: "gigachad", label: "Gigachad", src: "/sounds/gigachad.mp3", hotkey: "9", category: "Comedy", durationSeconds: 28.656438 },
  { id: "get-out", label: "Get Out", src: "/sounds/getouttuco.mp3", hotkey: "Q", category: "Reactions", durationSeconds: 1.752 },
  { id: "ewww", label: "Ewww", src: "/sounds/ewww.mp3", hotkey: "W", category: "Reactions", durationSeconds: 3.056327 },
  { id: "dry-fart", label: "Dry Fart", src: "/sounds/dry-fart.mp3", hotkey: "E", category: "Comedy", durationSeconds: 0.365714 },
  { id: "dababy", label: "DaBaby", src: "/sounds/dababy.mp3", hotkey: "R", category: "Comedy", durationSeconds: 3.696 },
  { id: "bruh", label: "Bruh", src: "/sounds/bruh.mp3", hotkey: "T", category: "Reactions", durationSeconds: 0.336 },
  { id: "anime-wow", label: "Anime Wow", src: "/sounds/anime-wow-sound-effect.mp3", hotkey: "Y", category: "Reactions", durationSeconds: 4.205714 },
  { id: "fah", label: "Fahhhhh", src: "/sounds/fahhhhhhhhhhhhhh.mp3", hotkey: "U", category: "Reactions", durationSeconds: 1.959184 },
];
