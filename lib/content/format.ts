export function readingMinutes(body: string | null) {
  return Math.max(1, Math.ceil((body?.trim().split(/\s+/).length ?? 0) / 220));
}
export function articleDate(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(new Date(value));
}
export function stripRepeatedTitle(body: string, title: string | null) {
  const normalized = body.replace(/\r\n/g, "\n").trim();
  const [first, ...rest] = normalized.split("\n");
  return first.replace(/^#\s+/, "").trim() === title?.trim() ? rest.join("\n").trim() : normalized;
}
export function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;
  try { const url = new URL(value); return ["http:", "https:"].includes(url.protocol) ? url.href : null; } catch { return null; }
}
