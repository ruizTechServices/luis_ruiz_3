export interface ApiErrorBody {
  code: string;
  message: string;
  status: number;
  retryable: boolean;
}

export type ApiSuccessEnvelope<TData extends object> = {
  ok: true;
  requestId: string;
} & TData;

export interface ApiErrorEnvelope {
  ok: false;
  requestId: string;
  error: ApiErrorBody;
}

export type ApiEnvelope<TData extends object> =
  | ApiSuccessEnvelope<TData>
  | ApiErrorEnvelope;

export function successEnvelope<TData extends object>(
  requestId: string,
  data: TData,
): ApiSuccessEnvelope<TData> {
  return {
    ok: true,
    requestId,
    ...data,
  };
}

export function errorEnvelope(
  requestId: string,
  error: ApiErrorBody,
): ApiErrorEnvelope {
  return {
    ok: false,
    requestId,
    error,
  };
}

export function jsonSuccess<TData extends object>(
  requestId: string,
  data: TData,
  init?: ResponseInit,
): Response {
  return Response.json(successEnvelope(requestId, data), init);
}

export function jsonError(requestId: string, error: ApiErrorBody): Response {
  return Response.json(errorEnvelope(requestId, error), {
    status: error.status,
  });
}
