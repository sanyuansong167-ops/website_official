import { getAdminApiBaseUrl } from "@/lib/environment";
import { requestApi } from "@/services/http";
import type {
  BindableContentItem,
  BindableContentPage,
  BindableContentSnapshot,
  ContentBindingSource,
} from "@/types/content-binding";

const snapshotPageSize = 100;
const maximumSnapshotPages = 20;

export function getBindableContentPage(source: ContentBindingSource, pageNo = 1, pageSize = 20) {
  const query = new URLSearchParams({ pageNo: String(pageNo), pageSize: String(pageSize) });

  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: (value) => decodePage(value, source),
    init: { cache: "no-store", credentials: "include", method: "GET" },
    path: `${getSourcePath(source)}?${query}`,
  });
}

export async function getBindableContentSnapshot(
  source: ContentBindingSource,
): Promise<BindableContentSnapshot> {
  const firstPage = await getBindableContentPage(source, 1, snapshotPageSize);
  const totalPages = Math.max(1, Math.ceil(firstPage.total / firstPage.pageSize));
  const requestedPages = Math.min(totalPages, maximumSnapshotPages);
  const remainingPages = await Promise.all(
    Array.from({ length: Math.max(0, requestedPages - 1) }, (_, index) =>
      getBindableContentPage(source, index + 2, snapshotPageSize),
    ),
  );
  const itemsById = new Map<number, BindableContentItem>();

  for (const page of [firstPage, ...remainingPages]) {
    for (const item of page.list) itemsById.set(item.id, item);
  }

  return {
    complete: totalPages <= maximumSnapshotPages,
    items: [...itemsById.values()],
    source,
  };
}

function getSourcePath(source: ContentBindingSource) {
  if (source === "CASE") return "/admin/api/cases";
  if (source === "INDUSTRY_SOLUTION") return "/admin/api/industry-solutions";
  return "/admin/api/products";
}

function decodePage(value: unknown, source: ContentBindingSource): BindableContentPage {
  const record = requiredRecord(value);
  if (!Array.isArray(record.list)) throw new Error("Expected a bindable content list.");

  return {
    list: record.list.map((item) => decodeItem(item, source)),
    pageNo: requiredPositiveInteger(record.pageNo),
    pageSize: requiredPositiveInteger(record.pageSize),
    total: requiredNonNegativeNumber(record.total),
  };
}

function decodeItem(value: unknown, source: ContentBindingSource): BindableContentItem {
  const record = requiredRecord(value);

  if (source === "PRODUCT") {
    const logo = optionalRecord(record.logo);
    return {
      id: requiredPositiveInteger(record.id),
      sortOrder: requiredNonNegativeInteger(record.sortOrder),
      source,
      summary: optionalString(record.abstractText) ?? optionalString(record.subTitle) ?? "",
      tags: optionalString(record.statusTag) ? [requiredString(record.statusTag)] : [],
      thumbnailUrl: resolveOptionalUrl(logo ? optionalString(logo.url) : undefined),
      title: requiredString(record.name),
      updatedAt: optionalString(record.updatedAt),
      visible: record.visible === 1,
    };
  }

  if (source === "CASE") {
    return {
      id: requiredPositiveInteger(record.id),
      sortOrder: requiredNonNegativeInteger(record.sortOrder),
      source,
      summary: optionalString(record.summary) ?? "",
      tags: optionalStringArray(record.keywords),
      thumbnailUrl: resolveOptionalUrl(optionalString(record.logoUrl)),
      title: requiredString(record.title),
      updatedAt: optionalString(record.updatedAt),
      visible: requiredBoolean(record.visible),
    };
  }

  return {
    id: requiredPositiveInteger(record.id),
    sortOrder: requiredNonNegativeInteger(record.sortOrder),
    source,
    summary: optionalString(record.description) ?? "",
    tags: optionalStringArray(record.customerTags),
    thumbnailUrl: resolveOptionalUrl(optionalString(record.iconUrl)),
    title: requiredString(record.name),
    updatedAt: optionalString(record.updatedAt),
    visible: requiredBoolean(record.visible),
  };
}

function resolveOptionalUrl(value: string | undefined) {
  return value ? new URL(value, `${getAdminApiBaseUrl()}/`).toString() : undefined;
}

function requiredRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Expected an object.");
  return value as Record<string, unknown>;
}

function optionalRecord(value: unknown) {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : undefined;
}

function requiredString(value: unknown) {
  if (typeof value !== "string") throw new Error("Expected a string.");
  return value;
}

function optionalString(value: unknown) {
  return typeof value === "string" && value ? value : undefined;
}

function optionalStringArray(value: unknown) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
    throw new Error("Expected a string list.");
  }
  return value;
}

function requiredBoolean(value: unknown) {
  if (typeof value !== "boolean") throw new Error("Expected a boolean.");
  return value;
}

function requiredPositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) throw new Error("Expected a positive integer.");
  return value;
}

function requiredNonNegativeInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("Expected a non-negative integer.");
  }
  return value;
}

function requiredNonNegativeNumber(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new Error("Expected a non-negative number.");
  return value;
}
