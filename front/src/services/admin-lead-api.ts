import { getAdminApiBaseUrl } from "@/lib/environment";
import { ApiError, requestApi } from "@/services/http";
import type { CsrfToken } from "@/types/admin";
import type {
  AdminLeadDetail,
  AdminLeadListItem,
  AdminLeadPage,
  AdminLeadQuery,
  LeadExportFile,
  LeadExportRequest,
  LeadStatus,
} from "@/types/lead";

export function getAdminLeadPage(query: AdminLeadQuery) {
  const search = new URLSearchParams({
    pageNo: String(query.pageNo),
    pageSize: String(query.pageSize),
  });
  if (query.status !== undefined) search.set("status", String(query.status));
  if (query.submitAtStart) search.set("submitAtStart", query.submitAtStart);
  if (query.submitAtEnd) search.set("submitAtEnd", query.submitAtEnd);

  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodeAdminLeadPage,
    init: adminRequestInit("GET"),
    path: `/admin/api/leads?${search}`,
  });
}

export function getAdminLeadDetail(leadId: number) {
  return requestApi({
    baseUrl: getAdminApiBaseUrl(),
    decode: decodeAdminLeadDetail,
    init: adminRequestInit("GET"),
    path: `/admin/api/leads/${encodeURIComponent(String(leadId))}`,
  });
}

export function updateAdminLeadStatus(
  leadId: number,
  status: LeadStatus,
  version: number,
  csrf: CsrfToken,
) {
  return requestApi({
    allowMissingData: true,
    baseUrl: getAdminApiBaseUrl(),
    decode: () => undefined,
    init: adminRequestInit("PUT", csrf, { status, version }),
    path: `/admin/api/leads/${encodeURIComponent(String(leadId))}/status`,
  });
}

export async function exportAdminLeads(
  request: LeadExportRequest,
  csrf: CsrfToken,
): Promise<LeadExportFile> {
  let response: Response;
  try {
    response = await fetch(new URL("/admin/api/leads/export", `${getAdminApiBaseUrl()}/`), {
      ...adminRequestInit("POST", csrf, request),
      headers: {
        Accept: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json",
        "Content-Type": "application/json",
        [csrf.headerName]: csrf.token,
      },
    });
  } catch {
    throw new ApiError("导出请求未能连接到后台服务。", "network");
  }

  if (!response.ok) throw await decodeExportError(response);

  return {
    blob: await response.blob(),
    filename: decodeDownloadFilename(response.headers.get("Content-Disposition")),
  };
}

function adminRequestInit(
  method: "GET" | "POST" | "PUT",
  csrf?: CsrfToken,
  body?: object,
): RequestInit {
  const headers: Record<string, string> = {};
  if (csrf) headers[csrf.headerName] = csrf.token;
  if (body) headers["Content-Type"] = "application/json";

  return {
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
    credentials: "include",
    headers,
    method,
  };
}

function decodeAdminLeadPage(value: unknown): AdminLeadPage {
  const record = requiredRecord(value);
  if (!Array.isArray(record.list)) throw new Error("Expected an admin lead list.");

  return {
    list: record.list.map(decodeAdminLeadListItem),
    pageNo: requiredPositiveInteger(record.pageNo),
    pageSize: requiredPositiveInteger(record.pageSize),
    total: requiredNonNegativeInteger(record.total),
  };
}

function decodeAdminLeadListItem(value: unknown): AdminLeadListItem {
  const record = requiredRecord(value);
  return {
    company: requiredString(record.company),
    demandDescriptionPreview: optionalString(record.demandDescriptionPreview),
    id: requiredPositiveInteger(record.id),
    maskedEmail: requiredString(record.maskedEmail),
    maskedPhone: optionalString(record.maskedPhone),
    name: requiredString(record.name),
    status: requiredLeadStatus(record.status),
    statusLabel: requiredString(record.statusLabel),
    submittedAt: requiredString(record.submittedAt),
    updatedAt: requiredString(record.updatedAt),
  };
}

function decodeAdminLeadDetail(value: unknown): AdminLeadDetail {
  const record = requiredRecord(value);
  return {
    company: requiredString(record.company),
    demandDescription: optionalString(record.demandDescription),
    email: requiredString(record.email),
    id: requiredPositiveInteger(record.id),
    name: requiredString(record.name),
    phone: optionalString(record.phone),
    status: requiredLeadStatus(record.status),
    statusLabel: requiredString(record.statusLabel),
    submitIp: requiredString(record.submitIp),
    submittedAt: requiredString(record.submittedAt),
    updatedAt: requiredString(record.updatedAt),
    version: requiredNonNegativeInteger(record.version),
  };
}

async function decodeExportError(response: Response) {
  let value: unknown;
  try {
    value = await response.json();
  } catch {
    value = undefined;
  }
  const record = isRecord(value) ? value : {};
  return new ApiError(
    typeof record.message === "string" ? record.message : "线索导出失败，请稍后重试。",
    getErrorKind(response.status),
    typeof record.traceId === "string" ? record.traceId : undefined,
    undefined,
    typeof record.code === "number" || typeof record.code === "string" ? record.code : undefined,
  );
}

function decodeDownloadFilename(contentDisposition: string | null) {
  if (!contentDisposition) return "leads.xlsx";
  const encoded = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
  if (encoded) {
    try {
      return decodeURIComponent(encoded);
    } catch {
      return "leads.xlsx";
    }
  }
  return contentDisposition.match(/filename="?([^";]+)"?/i)?.[1] ?? "leads.xlsx";
}

function getErrorKind(status: number) {
  if (status === 401) return "authentication" as const;
  if (status === 403) return "authorization" as const;
  if (status === 409) return "conflict" as const;
  if (status === 400 || status === 422) return "validation" as const;
  return "server" as const;
}

function requiredRecord(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) throw new Error("Expected an object.");
  return value;
}

function requiredString(value: unknown) {
  if (typeof value !== "string") throw new Error("Expected a string.");
  return value;
}

function optionalString(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

function requiredPositiveInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw new Error("Expected a positive integer.");
  }
  return value;
}

function requiredNonNegativeInteger(value: unknown) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new Error("Expected a non-negative integer.");
  }
  return value;
}

function requiredLeadStatus(value: unknown): LeadStatus {
  if (value === 0 || value === 1 || value === 2 || value === 3) return value;
  throw new Error("Unexpected lead status.");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
