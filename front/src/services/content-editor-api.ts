import { getContentResourceDefinition } from "@/features/content-editor/content-resource";
import { getAdminApiBaseUrl } from "@/lib/environment";
import { ApiError, requestApi } from "@/services/http";
import type { CsrfToken } from "@/types/admin";
import type {
  ContentDraft,
  ContentEditorLock,
  ContentForceReleaseResult,
  ContentLockConflict,
  ContentResourceKind,
} from "@/types/content-editor";
import type { JsonObject, JsonValue } from "@/types/page-builder";

type SaveContentDraftInput = {
  csrf: CsrfToken;
  draft: JsonObject;
  kind: ContentResourceKind;
  lockToken: string;
  resourceId: number;
  version: number;
};

export function getContentDraft(kind: ContentResourceKind, resourceId: number) {
  const { endpointSegment } = getContentResourceDefinition(kind);

  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodeContentDraft,
    init: adminRequestInit("GET"),
    path: `/admin/api/${endpointSegment}/${encodeURIComponent(String(resourceId))}/draft`,
  });
}

export function saveContentDraft({ csrf, draft, kind, lockToken, resourceId, version }: SaveContentDraftInput) {
  const { endpointSegment } = getContentResourceDefinition(kind);

  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodeContentDraft,
    init: adminRequestInit("PUT", csrf, { draft, version }, lockToken),
    path: `/admin/api/${endpointSegment}/${encodeURIComponent(String(resourceId))}/draft`,
  });
}

export function acquireContentLock(kind: ContentResourceKind, resourceId: number, csrf: CsrfToken) {
  const { endpointSegment, resourceType } = getContentResourceDefinition(kind);

  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: (value) => decodeContentEditorLock(value, resourceType),
    init: adminRequestInit("POST", csrf, { editorSessionRemark: "官网内容详情编辑器" }),
    path: `/admin/api/${endpointSegment}/${encodeURIComponent(String(resourceId))}/lock`,
  });
}

export function heartbeatContentLock(kind: ContentResourceKind, resourceId: number, csrf: CsrfToken) {
  const { endpointSegment, resourceType } = getContentResourceDefinition(kind);

  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: (value) => decodeContentEditorLock(value, resourceType),
    init: adminRequestInit("POST", csrf),
    path: `/admin/api/${endpointSegment}/${encodeURIComponent(String(resourceId))}/lock/heartbeat`,
  });
}

export function releaseContentLock(kind: ContentResourceKind, resourceId: number, csrf: CsrfToken) {
  const { endpointSegment } = getContentResourceDefinition(kind);

  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodeNull,
    init: { ...adminRequestInit("DELETE", csrf), keepalive: true },
    path: `/admin/api/${endpointSegment}/${encodeURIComponent(String(resourceId))}/lock`,
  });
}

export function forceReleaseContentLock(
  kind: ContentResourceKind,
  resourceId: number,
  csrf: CsrfToken,
  reason: string,
) {
  const { endpointSegment } = getContentResourceDefinition(kind);

  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodeContentForceReleaseResult,
    init: adminRequestInit("POST", csrf, { reason }),
    path: `/admin/api/${endpointSegment}/${encodeURIComponent(String(resourceId))}/lock/force-release`,
  });
}

export function getContentLockConflict(error: unknown): ContentLockConflict | null {
  if (!(error instanceof ApiError) || error.kind !== "conflict" || !isRecord(error.details)) return null;

  return {
    expiresAt: optionalString(error.details.expiresAt),
    forceUnlockAllowed: optionalBoolean(error.details.forceUnlockAllowed) ?? false,
    ownerDisplayName: optionalString(error.details.ownerDisplayName),
  };
}

function adminRequestInit(
  method: "DELETE" | "GET" | "POST" | "PUT",
  csrf?: CsrfToken,
  body?: object,
  lockToken?: string,
): RequestInit {
  const headers: Record<string, string> = {};
  if (csrf) headers[csrf.headerName] = csrf.token;
  if (lockToken) headers["X-Editor-Lock-Token"] = lockToken;
  if (body) headers["Content-Type"] = "application/json";

  return {
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    credentials: "include",
    headers,
    method,
  };
}

function decodeContentDraft(value: unknown): ContentDraft {
  const record = requiredRecord(value);

  return {
    draft: decodeJsonObject(record.draft),
    draftHash: optionalString(record.draftHash),
    id: requiredNumber(record.id),
    updatedAt: requiredString(record.updatedAt),
    version: requiredNumber(record.version),
  };
}

function decodeContentEditorLock(value: unknown, expectedResourceType: ContentEditorLock["resourceType"]): ContentEditorLock {
  const record = requiredRecord(value);
  const resourceType = requiredString(record.resourceType);
  if (resourceType !== expectedResourceType) throw new Error("Unexpected content lock resource type.");

  return {
    acquiredAt: requiredString(record.acquiredAt),
    editable: requiredBoolean(record.editable),
    expiresAt: requiredString(record.expiresAt),
    forceUnlockAllowed: requiredBoolean(record.forceUnlockAllowed),
    heartbeatIntervalSeconds: requiredNumber(record.heartbeatIntervalSeconds),
    lockToken: optionalString(record.lockToken),
    ownerDisplayName: requiredString(record.ownerDisplayName),
    resourceId: requiredNumber(record.resourceId),
    resourceType,
  };
}

function decodeContentForceReleaseResult(value: unknown): ContentForceReleaseResult {
  const record = requiredRecord(value);

  return {
    auditId: requiredNumber(record.auditId),
    releasedAt: requiredString(record.releasedAt),
  };
}

function decodeJsonObject(value: unknown): JsonObject {
  const record = requiredRecord(value);
  return Object.fromEntries(Object.entries(record).map(([key, item]) => [key, decodeJsonValue(item)]));
}

function decodeJsonValue(value: unknown): JsonValue {
  if (value === null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(decodeJsonValue);
  return decodeJsonObject(value);
}

function decodeNull(value: unknown): null {
  if (value !== null) throw new Error("Expected an empty response.");
  return null;
}

function requiredRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("Expected an object.");
  return value;
}

function requiredString(value: unknown): string {
  if (typeof value !== "string") throw new Error("Expected a string.");
  return value;
}

function requiredNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error("Expected a number.");
  return value;
}

function requiredBoolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Expected a boolean.");
  return value;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
