import { getPortalApiBaseUrl } from "@/lib/environment";
import { requestApi } from "@/services/http";
import type { ContentResourceKind } from "@/types/content-editor";
import type { CaseDetailViewModel, IndustrySolutionDetailViewModel, ProductDetailViewModel } from "@/types/portal";

type ServerRequestContext = { cookie?: string };

export type ContentPreview =
  | { data: CaseDetailViewModel; kind: "case" }
  | { data: ProductDetailViewModel; kind: "product" }
  | { data: IndustrySolutionDetailViewModel; kind: "solution" };

const endpointSegments: Record<ContentResourceKind, string> = {
  case: "cases",
  product: "products",
  solution: "industry-solutions",
};

export function getContentPreview(
  kind: ContentResourceKind,
  resourceId: number,
  previewToken: string,
  context: ServerRequestContext,
): Promise<ContentPreview> {
  return requestApi({
    baseUrl: getPortalApiBaseUrl(),
    decode: (value) => decodeContentPreview(kind, resourceId, value),
    init: {
      cache: "no-store",
      credentials: "include",
      headers: context.cookie ? { Cookie: context.cookie } : undefined,
      method: "GET",
    },
    path: `/portal/api/${endpointSegments[kind]}/${encodeURIComponent(String(resourceId))}/previews/${encodeURIComponent(previewToken)}`,
  });
}

function decodeContentPreview(kind: ContentResourceKind, resourceId: number, value: unknown): ContentPreview {
  const record = requiredRecord(value);
  if (kind === "product") {
    return {
      data: {
        coverUrl: optionalString(record.coverUrl),
        description: firstString(record.description, record.summary, record.subTitle),
        id: resourceId,
        logoUrl: optionalString(record.logoUrl),
        seoDescription: firstOptionalString(record.seoDescription, readNestedString(record.seo, "description")),
        seoTitle: firstOptionalString(record.seoTitle, readNestedString(record.seo, "title")),
        status: "DRAFT",
        title: firstString(record.title, record.name),
      },
      kind,
    };
  }

  if (kind === "case") {
    return {
      data: {
        background: optionalString(record.background),
        coverUrl: optionalString(record.coverUrl),
        customerName: optionalString(record.customerName),
        id: resourceId,
        industry: optionalString(record.industry),
        logoUrl: optionalString(record.logoUrl),
        result: optionalString(record.result),
        seoDescription: firstOptionalString(record.seoDescription, readNestedString(record.seo, "description")),
        seoTitle: firstOptionalString(record.seoTitle, readNestedString(record.seo, "title")),
        solution: firstOptionalString(record.solution, record.content),
        status: "DRAFT",
        title: firstString(record.title, record.name),
      },
      kind,
    };
  }

  const customerTags = record.customerTags;
  return {
    data: {
      customerTags: Array.isArray(customerTags) ? customerTags.filter((item): item is string => typeof item === "string") : [],
      description: firstString(record.description, record.summary),
      iconUrl: optionalString(record.iconUrl),
      id: resourceId,
      name: firstString(record.name, record.title),
    },
    kind,
  };
}

function readNestedString(value: unknown, key: string) {
  return typeof value === "object" && value !== null ? optionalString((value as Record<string, unknown>)[key]) : undefined;
}

function firstString(...values: unknown[]) {
  return firstOptionalString(...values) ?? "未命名内容";
}

function firstOptionalString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0);
}

function optionalString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function requiredRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error("Expected a content preview object.");
  return value as Record<string, unknown>;
}
