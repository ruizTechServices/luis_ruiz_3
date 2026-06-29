import { z } from "zod";

export function optionalText(formData: FormData, name: string): string | null {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

export function requiredText(formData: FormData, name: string): string {
  return optionalText(formData, name) ?? "";
}

export function optionalInteger(formData: FormData, name: string): number | null {
  const value = optionalText(formData, name);

  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) ? parsed : Number.NaN;
}

export function checkboxValue(formData: FormData, name: string): boolean {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

export function recordId(formData: FormData): number {
  const parsed = Number(requiredText(formData, "id"));

  return Number.isInteger(parsed) && parsed > 0 ? parsed : Number.NaN;
}

export function zodError(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join(" ");
}

export function unknownError(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

