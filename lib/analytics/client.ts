"use client";

import { createClient } from "@/lib/supabase/client";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase/env";

import {
  ANALYTICS_OPTOUT_KEY, ANALYTICS_PREFERENCE_EVENT, ANALYTICS_RETURN_KEY, ANALYTICS_SOURCE_KEY,
  parseInquirySource, privacySignalEnabled, publicMetricPath, returnVisitForDay, type PublicMetricEvent,
} from "./contracts";

let disabledInMemory = false;
let lastSoundPlayAt = 0;

export function measurementIsAllowed(): boolean {
  if (typeof window === "undefined" || disabledInMemory || privacySignalEnabled(navigator)) return false;
  if (!["www.luis-ruiz.com", "luis-ruiz.com"].includes(window.location.hostname)) return false;
  try { return localStorage.getItem(ANALYTICS_OPTOUT_KEY) !== "1"; }
  catch { return false; }
}

export function setMeasurementOptOut(optOut: boolean): boolean {
  disabledInMemory = optOut;
  let persisted = true;
  try {
    localStorage.setItem(ANALYTICS_OPTOUT_KEY, optOut ? "1" : "0");
  } catch { persisted = false; disabledInMemory = true; }
  if (optOut) {
    // A quota can reject writes while removals remain available. Clear both
    // optional markers independently even when the preference cannot be saved.
    try { localStorage.removeItem(ANALYTICS_RETURN_KEY); } catch { persisted = false; }
    try { sessionStorage.removeItem(ANALYTICS_SOURCE_KEY); } catch { persisted = false; }
  }
  window.dispatchEvent(new Event(ANALYTICS_PREFERENCE_EVENT));
  return persisted;
}

export async function sendPublicMetric(event: PublicMetricEvent, path: string): Promise<boolean> {
  if (!measurementIsAllowed() || !publicMetricPath(path)) return false;
  try {
    // This is an exclusion preference, never an authorization decision. Owner
    // server rendering also disables page measurement while authenticated.
    const { data, error } = await createClient().auth.getSession();
    if (error || data.session || !measurementIsAllowed()) return false;
    const publicKey = getSupabasePublishableKey();
    const response = await fetch(`${getSupabaseUrl()}/functions/v1/site-metrics`, {
      method: "POST", credentials: "omit", keepalive: true,
      headers: { "Content-Type": "application/json", apikey: publicKey, ...(publicKey.startsWith("eyJ") ? { Authorization: `Bearer ${publicKey}` } : {}) },
      referrerPolicy: "no-referrer",
      body: JSON.stringify({ id: crypto.randomUUID(), event, path }),
    });
    // 204 deliberately means ignored (signed in, privacy signal, or rate cap).
    return response.status === 202;
  } catch { return false; }
}

export function rememberPublicPage(path: string): void {
  if (!measurementIsAllowed() || !publicMetricPath(path) || path === "/contact") return;
  try { sessionStorage.setItem(ANALYTICS_SOURCE_KEY, JSON.stringify({ path, expires: Date.now() + 30 * 60_000 })); }
  catch { /* Missing storage means unattributed, never a broken form. */ }
}

export function getInquirySource(): string | null {
  if (!measurementIsAllowed()) return null;
  try { return parseInquirySource(sessionStorage.getItem(ANALYTICS_SOURCE_KEY)); }
  catch { return null; }
}

export async function trackSoundboardReturn(): Promise<void> {
  if (!measurementIsAllowed()) return;
  try {
    const previous = localStorage.getItem(ANALYTICS_RETURN_KEY);
    const visit = returnVisitForDay(previous);
    if (previous === visit.day) return;
    // A single date stays in this browser; no persistent visitor ID is sent.
    localStorage.setItem(ANALYTICS_RETURN_KEY, visit.day);
    if (visit.returning) await sendPublicMetric("soundboard_return", "/soundboard");
  } catch { /* Return estimates omit browsers without usable local storage. */ }
}

export function trackSoundPlay(): void {
  const now = Date.now();
  if (now - lastSoundPlayAt < 750) return;
  lastSoundPlayAt = now;
  void sendPublicMetric("sound_play", "/soundboard");
}
