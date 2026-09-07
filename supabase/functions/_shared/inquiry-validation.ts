import { CONTACT_TOPICS } from "../../../lib/contact/topics.ts";
import { publicMetricPath } from "./metrics-contracts.ts";

export type InquiryPayload = {
  full_name: string; email: string; subject: string; message: string;
  budget: string; timeline: string; source_path: string | null;
};

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function publicSourcePath(value: unknown): string | null {
  return publicMetricPath(value);
}

export function validateInquiry(value: unknown): { ok: true; requestId: string; payload: InquiryPayload; measurementAllowed: boolean; honeypot: boolean } | { ok: false; message: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, message: "Check your project note and try again." };
  const input = value as Record<string, unknown>;
  if (typeof input.request_id !== "string" || !uuid.test(input.request_id)) return { ok: false, message: "Refresh the form and try again." };
  const fields = ["full_name", "email", "subject", "message", "budget", "timeline"] as const;
  if (fields.some((field) => typeof input[field] !== "string")) return { ok: false, message: "Check your project note and try again." };
  const payload = Object.fromEntries(fields.map((field) => [field, (input[field] as string).trim()])) as Omit<InquiryPayload, "source_path">;
  payload.email = payload.email.toLowerCase();
  const singleLine = [payload.full_name, payload.email, payload.subject, payload.budget, payload.timeline];
  if (singleLine.some((field) => /[\r\n\u0000-\u001f\u007f]/.test(field))) return { ok: false, message: "Use one line for your contact details." };
  if (payload.full_name.length < 1 || payload.full_name.length > 120 || payload.email.length > 254 || !email.test(payload.email)) return { ok: false, message: "Check your name and email address." };
  if (!(CONTACT_TOPICS as readonly string[]).includes(payload.subject)) return { ok: false, message: "Choose what you need help with." };
  if (payload.message.length < 10 || payload.message.length > 5000 || payload.message.includes("\u0000")) return { ok: false, message: "Use 10 to 5,000 characters for your project note." };
  if (payload.budget.length > 120 || payload.timeline.length > 120) return { ok: false, message: "Keep your budget and timeline under 120 characters each." };
  const measurementAllowed = input.measurement_allowed === true;
  return { ok: true, requestId: input.request_id.toLowerCase(), payload: { ...payload, source_path: measurementAllowed ? publicSourcePath(input.source_path) : null }, measurementAllowed, honeypot: typeof input.website_url === "string" && input.website_url.length > 0 };
}

export function allowedInquiryOrigin(origin: string | null): boolean {
  return origin !== null && (["https://www.luis-ruiz.com", "https://luis-ruiz.com", "http://localhost:3000", "http://127.0.0.1:3000"].includes(origin) || /^https:\/\/luis-ruiz-3-[a-z0-9-]+-ruiztechservices-projects\.vercel\.app$/.test(origin));
}

export async function boundedJson(request: Request, limit = 16_384): Promise<unknown> {
  const size = request.headers.get("content-length");
  if (size && (!/^\d+$/.test(size) || Number(size) > limit)) throw new Error("too_large");
  if (!request.body) throw new Error("empty_body");
  const reader = request.body.getReader();
  const parts: Uint8Array[] = []; let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > limit) { await reader.cancel(); throw new Error("too_large"); }
      parts.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const output = new Uint8Array(bytes); let offset = 0;
  for (const part of parts) { output.set(part, offset); offset += part.byteLength; }
  return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(output));
}
