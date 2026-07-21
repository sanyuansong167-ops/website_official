export type ApiErrorKind =
  | "authentication"
  | "authorization"
  | "conflict"
  | "network"
  | "server"
  | "unexpected-response"
  | "validation";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly kind: ApiErrorKind,
    readonly requestId?: string,
    readonly details?: unknown,
    readonly code?: string | number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type JsonDecoder<T> = (value: unknown) => T;

type RequestApiOptions<T> = {
  allowMissingData?: boolean;
  baseUrl: string;
  decode: JsonDecoder<T>;
  init?: RequestInit;
  path: string;
};

type ApiEnvelope = {
  code?: string | number;
  data: unknown;
  message?: string;
  requestId?: string;
  traceId?: string;
};

export async function requestApi<T>({ allowMissingData = false, baseUrl, decode, init, path }: RequestApiOptions<T>): Promise<T> {
  let response: Response;

  try {
    response = await fetch(new URL(path, `${baseUrl}/`), {
      ...init,
      headers: {
        Accept: "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new ApiError("网络连接失败，请稍后重试。", "network");
  }

  const envelope = await readEnvelope(response, allowMissingData);

  if (!response.ok) {
    throw new ApiError(
      envelope.message ?? "请求未能完成，请稍后重试。",
      getErrorKind(response.status),
      envelope.requestId ?? envelope.traceId,
      envelope.data,
      envelope.code,
    );
  }

  try {
    return decode(envelope.data);
  } catch {
    throw new ApiError("服务返回的数据格式无效。", "unexpected-response", envelope.requestId ?? envelope.traceId);
  }
}

async function readEnvelope(response: Response, allowMissingData: boolean): Promise<ApiEnvelope> {
  let value: unknown;

  try {
    value = await response.json();
  } catch {
    throw new ApiError("服务返回的数据格式无效。", "unexpected-response");
  }

  if (!isRecord(value)) {
    throw new ApiError("服务返回的数据格式无效。", "unexpected-response");
  }

  // Successful responses must always carry `data`, while error responses from
  // the local backend may deliberately omit a null `data` field. Preserve the
  // latter so callers can still handle the HTTP status and business code.
  if (response.ok && !allowMissingData && !("data" in value)) {
    throw new ApiError("服务返回的数据格式无效。", "unexpected-response");
  }

  return {
    code: isCode(value.code) ? value.code : undefined,
    data: "data" in value ? value.data : undefined,
    message: typeof value.message === "string" ? value.message : undefined,
    requestId: typeof value.requestId === "string" ? value.requestId : undefined,
    traceId: typeof value.traceId === "string" ? value.traceId : undefined,
  };
}

function getErrorKind(status: number): ApiErrorKind {
  if (status === 401) return "authentication";
  if (status === 403) return "authorization";
  if (status === 409) return "conflict";
  if (status === 400 || status === 422) return "validation";
  return "server";
}

function isCode(value: unknown): value is string | number {
  return typeof value === "string" || typeof value === "number";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
