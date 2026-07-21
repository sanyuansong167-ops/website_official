import { describe, expect, it } from "vitest";
import { getBlockDefinition, isBlockSlotAllowed } from "@/components/page-builder/block-registry";
import { validatePageSchema } from "@/features/editor/validate-page-schema";
import {
  createDefaultHomePageSchema,
  homeBlockOrder,
  homeBlockTemplates,
} from "@/lib/home-page-template";

describe("home page block templates", () => {
  it("defines the nine approved homepage blocks in the delivery order", () => {
    const schema = createDefaultHomePageSchema();

    expect(schema.sections.map((section) => section.component)).toEqual(homeBlockOrder);
    expect(schema.sections.map((section) => section.sortOrder)).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80]);
    expect(new Set(schema.sections.map((section) => section.id)).size).toBe(homeBlockOrder.length);
  });

  it("keeps every homepage block registered, editable and limited to the main slot", () => {
    for (const component of homeBlockOrder) {
      const definition = getBlockDefinition(component);

      expect(definition).not.toBeNull();
      expect(definition?.configFields?.length).toBeGreaterThan(0);
      expect(isBlockSlotAllowed(component, "main")).toBe(true);
      expect(isBlockSlotAllowed(component, "header")).toBe(false);
      expect(isBlockSlotAllowed(component, "footer")).toBe(false);
    }
  });

  it("provides controlled bindings for every list block", () => {
    const listBlocks = [
      "MetricsSection",
      "AiCardSection",
      "CapabilitySection",
      "ProductGridSection",
      "SolutionGridSection",
      "CaseGridSection",
    ] as const;

    for (const component of listBlocks) {
      const binding = homeBlockTemplates[component].defaultDataBinding;

      expect(binding?.displayMode).toBe("AUTO");
      expect(binding?.selectedIds).toEqual([]);
      expect(binding?.limit).toBeTypeOf("number");
      expect(binding?.sortBy).toBe("SORT_ORDER_ASC");
    }
  });

  it("creates independent schema copies instead of sharing mutable defaults", () => {
    const first = createDefaultHomePageSchema();
    const second = createDefaultHomePageSchema();

    first.sections[0].props.mainTitle = "已修改";
    const firstBinding = first.sections[1].dataBinding;
    if (firstBinding) firstBinding.limit = 1;

    expect(second.sections[0].props.mainTitle).not.toBe("已修改");
    expect(second.sections[1].dataBinding?.limit).toBe(4);
  });

  it("produces a default schema accepted by the current frontend validator", () => {
    expect(validatePageSchema(createDefaultHomePageSchema())).toEqual([]);
  });
});
