export interface ActionState {
  message?: string;
}

export function readString(formData: FormData, name: string): string {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

export function readOptionalString(formData: FormData, name: string): string | null {
  const value = readString(formData, name);

  return value.length > 0 ? value : null;
}

export function readBoolean(formData: FormData, name: string): boolean {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

export function requireFormId(formData: FormData): string {
  const id = readString(formData, "id");

  if (!id) {
    throw new Error("Missing record id.");
  }

  return id;
}
