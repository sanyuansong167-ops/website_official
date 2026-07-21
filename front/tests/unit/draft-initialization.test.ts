import { describe, expect, it } from "vitest";
import { resolveDraftInitialization } from "@/features/editor/draft-initialization";
import type { PageDraft } from "@/types/page-builder";

function createDraft(schemaJson: PageDraft["schemaJson"]): PageDraft {
  return {
    id: 1,
    pageId: 1,
    schemaJson,
    updatedAt: "2026-07-15T10:00:00",
    version: 1,
  };
}

describe("resolveDraftInitialization", () => {
  it("uses a complete existing draft Schema", () => {
    const schema = { layout: {}, sections: [], seo: { keywords: [] } };
    expect(resolveDraftInitialization(createDraft(schema))).toEqual({ schema, status: "ready" });
  });

  it("blocks an empty draft instead of inventing a Schema", () => {
    expect(resolveDraftInitialization(createDraft(null))).toEqual({ status: "initialization-required" });
  });
});
