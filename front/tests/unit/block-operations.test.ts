import { describe, expect, it } from "vitest";
import {
  addHomeBlock,
  copyHomeBlock,
  deleteHomeBlock,
  moveHomeBlock,
  reorderHomeBlock,
} from "@/features/editor/block-operations";
import { createDefaultHomePageSchema } from "@/lib/home-page-template";

describe("home block operations", () => {
  it("adds repeatable blocks with independent defaults and rejects duplicate singleton blocks", () => {
    const schema = createDefaultHomePageSchema();
    const added = addHomeBlock(schema, "ImageTextSection", "image-text-extra");

    expect(added.sections).toHaveLength(schema.sections.length + 1);
    expect(added.sections.at(-1)).toEqual(expect.objectContaining({ component: "ImageTextSection", id: "image-text-extra" }));
    expect(addHomeBlock(schema, "HeroSection", "hero-extra")).toBe(schema);
  });

  it("copies repeatable blocks deeply and refuses to copy non-repeatable blocks", () => {
    const schema = createDefaultHomePageSchema();
    const source = schema.sections.find((section) => section.component === "ImageTextSection");
    const hero = schema.sections.find((section) => section.component === "HeroSection");
    if (!source || !hero) throw new Error("Expected homepage blocks.");

    const copied = copyHomeBlock(schema, source.id, "image-text-copy");
    const copy = copied.sections.find((section) => section.id === "image-text-copy");
    if (!copy) throw new Error("Expected copied block.");
    copy.props.title = "副本标题";

    expect(source.props.title).not.toBe("副本标题");
    expect(copyHomeBlock(schema, hero.id, "hero-copy")).toBe(schema);
  });

  it("deletes, moves and drag-reorders only main-slot homepage blocks", () => {
    const schema = createDefaultHomePageSchema();
    const firstId = schema.sections[0].id;
    const secondId = schema.sections[1].id;
    const thirdId = schema.sections[2].id;

    const moved = moveHomeBlock(schema, firstId, "down");
    expect(orderOf(moved).slice(0, 2)).toEqual([secondId, firstId]);

    const reordered = reorderHomeBlock(schema, thirdId, firstId);
    expect(orderOf(reordered).slice(0, 3)).toEqual([thirdId, firstId, secondId]);

    const deleted = deleteHomeBlock(schema, secondId);
    expect(deleted.sections.some((section) => section.id === secondId)).toBe(false);
    expect(orderOf(deleted)).toEqual(expect.not.arrayContaining([secondId]));
  });
});

function orderOf(schema: ReturnType<typeof createDefaultHomePageSchema>) {
  return [...schema.sections].sort((left, right) => left.sortOrder - right.sortOrder).map((section) => section.id);
}
