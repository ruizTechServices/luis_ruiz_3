export type SafeJsonResult<T> =
  | {
      ok: true;
      data: T;
      rawText: string;
    }
  | {
      ok: false;
      error: string;
      rawText: string;
    };

export async function safeJson<T>(response: Response): Promise<SafeJsonResult<T>> {
  const rawText = await response.text();

  if (!rawText.trim()) {
    return {
      ok: false,
      error: "Response body was empty.",
      rawText,
    };
  }

  try {
    return {
      ok: true,
      data: JSON.parse(rawText) as T,
      rawText,
    };
  } catch {
    return {
      ok: false,
      error: "Response body was not valid JSON.",
      rawText,
    };
  }
}

export async function readRequestJson<T>(request: Request): Promise<SafeJsonResult<T>> {
  const rawText = await request.text();

  if (!rawText.trim()) {
    return {
      ok: false,
      error: "Request body was empty.",
      rawText,
    };
  }

  try {
    return {
      ok: true,
      data: JSON.parse(rawText) as T,
      rawText,
    };
  } catch {
    return {
      ok: false,
      error: "Request body was not valid JSON.",
      rawText,
    };
  }
}
