"use client";

import { useState, useSyncExternalStore } from "react";

import { measurementIsAllowed, setMeasurementOptOut } from "@/lib/analytics/client";
import { ANALYTICS_PREFERENCE_EVENT, privacySignalEnabled } from "@/lib/analytics/contracts";

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(ANALYTICS_PREFERENCE_EVENT, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(ANALYTICS_PREFERENCE_EVENT, callback); };
}

export function MeasurementPrivacyControl() {
  const allowed = useSyncExternalStore(subscribe, measurementIsAllowed, () => false);
  const signal = useSyncExternalStore(subscribe, () => privacySignalEnabled(navigator), () => false);
  const [message, setMessage] = useState("");
  return <div className="rounded-xl border border-border bg-card p-5">
    <label className="flex min-h-11 items-center gap-3 text-sm font-medium">
      <input type="checkbox" className="size-4 accent-primary" checked={allowed} disabled={signal} onChange={(event) => {
        const saved = setMeasurementOptOut(!event.target.checked);
        setMessage(saved ? "Your preference is saved in this browser." : "Your preference couldn’t be saved. Optional measurement is off for this visit.");
      }} />
      Allow anonymous visit counts
    </label>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{signal ? "Your browser’s privacy signal has already turned measurement off." : "Turn this off to stop optional measurement and clear this browser’s soundboard return marker. Soundboard favorites still work."}</p>
    <p className="mt-2 text-sm text-muted-foreground" role="status">{message}</p>
  </div>;
}
