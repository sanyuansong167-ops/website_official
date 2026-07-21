import { describe, expect, it } from "vitest";
import { getContentResourceDefinition, isContentResourceKind } from "@/features/content-editor/content-resource";

describe("content resource definitions", () => {
  it("maps every editor kind to its approved Admin endpoint and lock resource type", () => {
    expect(getContentResourceDefinition("product")).toEqual({ endpointSegment: "products", resourceType: "PRODUCT" });
    expect(getContentResourceDefinition("case")).toEqual({ endpointSegment: "cases", resourceType: "CASE" });
    expect(getContentResourceDefinition("solution")).toEqual({ endpointSegment: "industry-solutions", resourceType: "INDUSTRY_SOLUTION" });
  });

  it("accepts only the three independently editable content kinds", () => {
    expect(isContentResourceKind("product")).toBe(true);
    expect(isContentResourceKind("case")).toBe(true);
    expect(isContentResourceKind("solution")).toBe(true);
    expect(isContentResourceKind("page")).toBe(false);
  });
});
