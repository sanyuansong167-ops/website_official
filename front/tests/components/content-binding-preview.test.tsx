// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ContentBindingPreview } from "@/features/editor/ContentBindingPreview";
import { getBindableContentSnapshot } from "@/services/content-binding-api";

vi.mock("@/services/content-binding-api", () => ({
  getBindableContentSnapshot: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getBindableContentSnapshot).mockResolvedValue({
    complete: true,
    items: [
      {
        id: 1,
        sortOrder: 20,
        source: "PRODUCT",
        summary: "摘要一",
        tags: ["制造业"],
        title: "产品一",
        visible: true,
      },
      {
        id: 2,
        sortOrder: 10,
        source: "PRODUCT",
        summary: "摘要二",
        tags: ["制造业"],
        title: "产品二",
        visible: true,
      },
    ],
    source: "PRODUCT",
  });
});

describe("ContentBindingPreview", () => {
  it("shows the resolved automatic binding order", async () => {
    render(
      <ContentBindingPreview
        blockId="products"
        displayMode="AUTO"
        limit={2}
        selectedIds={[]}
        sortBy="SORT_ORDER_ASC"
        source="PRODUCT"
        tag="制造业"
      />,
    );

    const results = await screen.findAllByRole("listitem");
    expect(results.map((item) => item.textContent)).toEqual([
      expect.stringContaining("产品二"),
      expect.stringContaining("产品一"),
    ]);
    expect(getBindableContentSnapshot).toHaveBeenCalledWith("PRODUCT");
  });
});
