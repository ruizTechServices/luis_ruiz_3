export type AdminActionResult<T> =
  | { ok: true; data: T; message: string }
  | { ok: false; error: string };

export type AdminActionState<T> = AdminActionResult<T> | null;

