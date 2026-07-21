import { getAdminApiBaseUrl } from "@/lib/environment";
import { requestApi } from "@/services/http";
import type { CsrfToken } from "@/types/admin";
import type { MediaAsset, MediaAssetPage } from "@/types/media";

export function getImageAssets(pageNo = 1, pageSize = 24) {
  const query = new URLSearchParams({
    mediaType: "IMAGE",
    pageNo: String(pageNo),
    pageSize: String(pageSize),
    status: "ACTIVE",
  });

  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodeMediaAssetPage,
    init: { cache: "no-store", credentials: "include", method: "GET" },
    path: `/admin/api/media/assets?${query}`,
  });
}

export function uploadImageAsset(file: File, csrf: CsrfToken) {
  const body = new FormData();
  body.append("file", file);

  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: (value) => decodeUploadedMediaAsset(value, file),
    init: {
      body,
      cache: "no-store",
      credentials: "include",
      headers: { [csrf.headerName]: csrf.token },
      method: "POST",
    },
    path: "/admin/api/media/assets",
  });
}

function decodeMediaAssetPage(value: unknown): MediaAssetPage {
  const record = requiredRecord(value);
  if (!Array.isArray(record.list)) throw new Error("Expected a media asset list.");

  return {
    // Page schemas only accept positive media IDs. Historical seed records can
    // use negative internal IDs, so exclude them instead of making the whole
    // media picker unavailable.
    list: record.list.flatMap(decodeMediaAsset),
    pageNo: requiredPositiveInteger(record.pageNo),
    pageSize: requiredPositiveInteger(record.pageSize),
    total: requiredNonNegativeNumber(record.total),
  };
}

function decodeMediaAsset(value: unknown): MediaAsset[] {
  const record = requiredRecord(value);
  if (!isPositiveInteger(record.id)) return [];
  const id = record.id;
  const mediaType = requiredString(record.mediaType);
  if (mediaType !== "DOCUMENT" && mediaType !== "IMAGE") throw new Error("Unexpected media type.");

  const publicUrl = requiredString(record.publicUrl);
  const absoluteUrl = optionalString(record.absoluteUrl);

  return [{
    absoluteUrl,
    altText: optionalString(record.altText),
    contentType: requiredString(record.contentType),
    createdAt: requiredString(record.createdAt),
    displayUrl: resolveDisplayUrl(absoluteUrl ?? publicUrl),
    fileSize: requiredNonNegativeNumber(record.fileSize),
    id,
    mediaType,
    originalFilename: requiredString(record.originalFilename),
    publicUrl,
    status: requiredString(record.status),
    updatedAt: requiredString(record.updatedAt),
    usageTag: optionalString(record.usageTag),
    version: requiredNonNegativeNumber(record.version),
  }];
}

function decodeUploadedMediaAsset(value: unknown, file: File): MediaAsset {
  const record = requiredRecord(value);
  const mediaType = requiredString(record.mediaType);
  if (mediaType !== "DOCUMENT" && mediaType !== "IMAGE") throw new Error("Unexpected uploaded media type.");

  const publicUrl = requiredString(record.url);
  const absoluteUrl = optionalString(record.absoluteUrl);
  const now = new Date().toISOString();

  return {
    absoluteUrl,
    contentType: requiredString(record.contentType),
    createdAt: now,
    displayUrl: resolveDisplayUrl(absoluteUrl ?? publicUrl),
    fileSize: requiredNonNegativeNumber(record.size),
    id: requiredPositiveInteger(record.mediaId),
    mediaType,
    originalFilename: optionalString(record.originalFilename) ?? file.name,
    publicUrl,
    status: "TEMPORARY",
    updatedAt: now,
    version: 0,
  };
}

function resolveDisplayUrl(value: string) {
  return new URL(value, `${getAdminApiBaseUrl()}/`).toString();
}

function requiredRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Expected an object.");
  return value as Record<string, unknown>;
}

function requiredString(value: unknown) {
  if (typeof value !== "string") throw new Error("Expected a string.");
  return value;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}

function requiredPositiveInteger(value: unknown) {
  if (!isPositiveInteger(value)) throw new Error("Expected a positive integer.");
  return value;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function requiredNonNegativeNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error("Expected a non-negative number.");
  return value;
}
