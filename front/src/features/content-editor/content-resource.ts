import type { ContentResourceKind, ContentResourceType } from "@/types/content-editor";

const resourceDefinitions = {
  case: { endpointSegment: "cases", resourceType: "CASE" },
  product: { endpointSegment: "products", resourceType: "PRODUCT" },
  solution: { endpointSegment: "industry-solutions", resourceType: "INDUSTRY_SOLUTION" },
} as const satisfies Record<ContentResourceKind, { endpointSegment: string; resourceType: ContentResourceType }>;

export function getContentResourceDefinition(kind: ContentResourceKind) {
  return resourceDefinitions[kind];
}

export function isContentResourceKind(value: string): value is ContentResourceKind {
  return value === "case" || value === "product" || value === "solution";
}
