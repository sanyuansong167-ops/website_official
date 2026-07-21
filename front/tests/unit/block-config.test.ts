import { describe, expect, it } from "vitest";
import { getBlockConfigValue, updateBlockConfig } from "@/features/editor/block-config";
import { createDefaultHomePageSchema } from "@/lib/home-page-template";

describe("block config", () => {
  it("reads controlled values from props, style and data binding", () => {
    const schema = createDefaultHomePageSchema();
    const hero = schema.sections[0];
    const metrics = schema.sections[1];

    expect(getBlockConfigValue(hero, "props.mainTitle")).toBe("让数据智能更可靠地服务业务增长");
    expect(getBlockConfigValue(hero, "style.theme")).toBe("dark");
    expect(getBlockConfigValue(metrics, "dataBinding.limit")).toBe(4);
  });

  it("updates one selected block without mutating the original schema", () => {
    const schema = createDefaultHomePageSchema();
    const heroId = schema.sections[0].id;
    const updated = updateBlockConfig(schema, heroId, "props.mainTitle", "新的首页标题");

    expect(schema.sections[0].props.mainTitle).not.toBe("新的首页标题");
    expect(updated.sections[0].props.mainTitle).toBe("新的首页标题");
    expect(updated.sections[1]).toBe(schema.sections[1]);
  });

  it("creates a missing binding object and ignores unknown block ids", () => {
    const schema = createDefaultHomePageSchema();
    const imageTextId = schema.sections[2].id;
    const updated = updateBlockConfig(schema, imageTextId, "dataBinding.displayMode", "MANUAL");

    expect(updated.sections[2].dataBinding).toEqual({ displayMode: "MANUAL" });
    expect(updateBlockConfig(schema, "missing", "props.title", "ignored")).toBe(schema);
  });
});
