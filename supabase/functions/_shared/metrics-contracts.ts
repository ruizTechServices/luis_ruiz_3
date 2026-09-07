export const ANALYTICS_RETENTION_DAYS = 90;
export const ANALYTICS_BODY_LIMIT = 768;
export const ANALYTICS_OPTOUT_KEY = "lr:measurement:optout:v1";
export const ANALYTICS_RETURN_KEY = "lr:measurement:soundboard-day:v1";
export const ANALYTICS_SOURCE_KEY = "lr:measurement:source:v1";
export const ANALYTICS_PREFERENCE_EVENT = "lr:measurement:preference";

export const PUBLIC_METRIC_EVENTS = ["page_view", "sound_play", "soundboard_return"] as const;
export type PublicMetricEvent = (typeof PUBLIC_METRIC_EVENTS)[number];
export type MetricEvent = PublicMetricEvent | "inquiry_submitted";
export type MetricPayload = { id: string; event: PublicMetricEvent; path: string };

const STATIC_PATHS = new Set(["/", "/about", "/projects", "/blog", "/contact", "/soundboard", "/sitemap"]);
const PUBLIC_PATH = /^(?:\/projects\/[a-z0-9][a-z0-9-]{0,99}|\/blog\/[1-9][0-9]{0,12})$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Accept pathnames only. Query strings, fragments, external URLs, encoded data,
// owner routes and arbitrary user-generated paths never enter the metric store.
export function publicMetricPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 112) return null;
  return STATIC_PATHS.has(value) || PUBLIC_PATH.test(value) ? value : null;
}

export function parseMetricPayload(value: unknown): MetricPayload | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some((key) => !["id", "event", "path"].includes(key))) return null;
  const path = publicMetricPath(input.path);
  if (!path || typeof input.id !== "string" || !UUID.test(input.id)) return null;
  if (!PUBLIC_METRIC_EVENTS.includes(input.event as PublicMetricEvent)) return null;
  if (input.event !== "page_view" && path !== "/soundboard") return null;
  return { id: input.id, event: input.event as PublicMetricEvent, path };
}

export function privacySignalEnabled(value: { globalPrivacyControl?: boolean; doNotTrack?: string | null }): boolean {
  return value.globalPrivacyControl === true || value.doNotTrack === "1" || value.doNotTrack === "yes";
}

export function returnVisitForDay(previousDay: string | null, now = new Date()): { day: string; returning: boolean } {
  const day = now.toISOString().slice(0, 10);
  const previousTime = previousDay && /^\d{4}-\d{2}-\d{2}$/.test(previousDay) ? Date.parse(`${previousDay}T00:00:00Z`) : Number.NaN;
  const todayTime = Date.parse(`${day}T00:00:00Z`);
  const age = todayTime - previousTime;
  return { day, returning: age > 0 && age <= ANALYTICS_RETENTION_DAYS * 86_400_000 && new Date(previousTime).toISOString().slice(0, 10) === previousDay };
}

export function parseInquirySource(raw: string | null, now = Date.now()): string | null {
  if (!raw || raw.length > 220) return null;
  try {
    const entry = JSON.parse(raw) as { path?: unknown; expires?: unknown };
    return typeof entry.expires === "number" && entry.expires > now && entry.expires <= now + 30 * 60_000
      ? publicMetricPath(entry.path)
      : null;
  } catch { return null; }
}
