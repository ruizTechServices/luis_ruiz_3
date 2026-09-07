"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function InquiryTime({ value }: { value: string }) {
  const hydrated = useSyncExternalStore(subscribe, clientSnapshot, serverSnapshot);
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return <span>Date unavailable</span>;

  const formatted = new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
    timeZone: hydrated ? undefined : "UTC", timeZoneName: "short",
  }).format(date);

  return <time dateTime={value}>{formatted}</time>;
}
