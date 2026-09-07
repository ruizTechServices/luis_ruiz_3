"use client";

import { useState, useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

function localInputValue(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Preserve the stored instant until edited, then use the browser's local zone. */
type DateTimeFieldProps = {
  name: string;
  label: string;
  value: string;
  required?: boolean;
  hint?: string;
};

export function LocalDateTimeField(props: DateTimeFieldProps) {
  return <DateTimeInput key={props.value} {...props} />;
}

function DateTimeInput({ name, label, value, required, hint }: DateTimeFieldProps) {
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const [instant, setInstant] = useState(value);
  const [editedLocal, setEditedLocal] = useState<string | null>(null);
  const local = editedLocal ?? (hydrated && instant ? localInputValue(instant) : "");
  const zone = hydrated ? Intl.DateTimeFormat().resolvedOptions().timeZone : null;

  return <label className="grid min-w-0 gap-1 text-sm">
    <span className="font-medium">{label}</span>
    <input type="hidden" name={name} value={instant} />
    <input
      type="datetime-local"
      value={local}
      required={required}
      disabled={zone === null}
      className="min-w-0 w-full rounded-md border border-input bg-background px-3 py-2"
      onChange={(event) => {
        const next = event.target.value;
        setEditedLocal(next);
        if (!next) {
          event.target.setCustomValidity("");
          setInstant("");
          return;
        }
        const date = new Date(next);
        if (Number.isNaN(date.getTime())) {
          event.target.setCustomValidity("Choose a valid date and time.");
          return;
        }
        const normalized = date.toISOString();
        if (localInputValue(normalized) !== next) {
          event.target.setCustomValidity("This local time does not exist because the clocks change. Choose a different time.");
          return;
        }
        event.target.setCustomValidity("");
        setInstant(normalized);
      }}
    />
    <span className="text-xs leading-5 text-muted-foreground">{zone ? `Your local time (${zone}).` : "Loading your local time…"}{hint ? ` ${hint}` : ""}</span>
  </label>;
}
