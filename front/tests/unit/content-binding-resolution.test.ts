import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resolveContentBinding,
  validatePageContentDependencies,
} from "@/features/editor/content-binding-resolution";
import { createDefaultHomePageSchema } from "@/lib/home-page-template";
import { getBindableContentSnapshot } from "@/services/content-binding-api";
import type {
  BindableContentItem,
  BindableContentSnapshot,
  ContentBindingRequest,
  ContentBindingSource,
} from "@/types/content-binding";

vi.mock("@/services/content-binding-api", () => ({
  getBindableContentSnapshot: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("content binding resolution", () => {
  it("preserves manual order and reports hidden or deleted dependencies", () => {
    const resolution = resolveContentBinding(
      createRequest({ displayMode: "MANUAL", selectedIds: [2, 1, 99] }),
      createSnapshot("PRODUCT", [
        createItem({ id: 1, title: "产品一" }),
        createItem({ id: 2, title: "隐藏产品", visible: false }),
      ]),
    );

    expect(resolution.items.map((item) => item.id)).toEqual([2, 1]);
    expect(resolution.issues.map((issue) => issue.message)).toEqual(expect.arrayContaining([
      "产品“隐藏产品”已隐藏或不满足公开展示条件。",
      "产品 ID 99 不存在或已删除。",
    ]));
  });

  it("filters automatic results by controlled tag, visibility, order and limit", () => {
    const resolution = resolveContentBinding(
      createRequest({ displayMode: "AUTO", limit: 2, tag: "制造业" }),
      createSnapshot("PRODUCT", [
        createItem({ id: 1, sortOrder: 30, tags: ["制造业"] }),
        createItem({ id: 2, sortOrder: 10, tags: ["制造业"] }),
        createItem({ id: 3, sortOrder: 20, tags: ["金融"] }),
        createItem({ id: 4, sortOrder: 5, tags: ["制造业"], visible: false }),
      ]),
    );

    expect(resolution.items.map((item) => item.id)).toEqual([2, 1]);
    expect(resolution.issues).toEqual([]);
  });

  it("blocks unreliable recent-update sorting when the list contract omits timestamps", () => {
    const resolution = resolveContentBinding(
      createRequest({ displayMode: "AUTO", sortBy: "UPDATED_AT_DESC" }),
      createSnapshot("PRODUCT", [createItem({ updatedAt: undefined })]),
    );

    expect(resolution.issues).toEqual([
      expect.objectContaining({ field: "sortBy", message: expect.stringContaining("不能可靠使用") }),
    ]);
  });

  it("checks every supported homepage binding before save or publish", async () => {
    const schema = createDefaultHomePageSchema();
    const products = schema.sections.find((section) => section.component === "ProductGridSection");
    if (!products?.dataBinding) throw new Error("Expected ProductGridSection binding.");
    products.dataBinding.displayMode = "MANUAL";
    products.dataBinding.selectedIds = [8];

    vi.mocked(getBindableContentSnapshot).mockImplementation(async (source) =>
      source === "PRODUCT"
        ? createSnapshot(source, [createItem({ id: 8, title: "已隐藏产品", visible: false })])
        : createSnapshot(source, []),
    );

    const issues = await validatePageContentDependencies(schema);

    expect(issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ blockId: products.id, message: expect.stringContaining("已隐藏产品") }),
    ]));
    expect(getBindableContentSnapshot).toHaveBeenCalledTimes(3);
  });
});

function createRequest(overrides: Partial<ContentBindingRequest> = {}): ContentBindingRequest {
  return {
    blockId: "products",
    displayMode: "AUTO",
    limit: 6,
    selectedIds: [],
    sortBy: "SORT_ORDER_ASC",
    source: "PRODUCT",
    ...overrides,
  };
}

function createSnapshot(
  source: ContentBindingSource,
  items: BindableContentItem[],
): BindableContentSnapshot {
  return { complete: true, items: items.map((item) => ({ ...item, source })), source };
}

function createItem(overrides: Partial<BindableContentItem> = {}): BindableContentItem {
  return {
    id: 1,
    sortOrder: 1,
    source: "PRODUCT",
    summary: "摘要",
    tags: [],
    title: "产品",
    updatedAt: "2026-07-15T10:00:00",
    visible: true,
    ...overrides,
  };
}
