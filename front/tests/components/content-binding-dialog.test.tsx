// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ContentBindingDialog } from "@/features/editor/ContentBindingDialog";
import { getBindableContentPage } from "@/services/content-binding-api";

vi.mock("@/services/content-binding-api", () => ({
  getBindableContentPage: vi.fn(),
}));

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getBindableContentPage).mockResolvedValue({
    list: [
      { id: 1, sortOrder: 1, source: "PRODUCT", summary: "摘要一", tags: [], title: "产品一", visible: true },
      { id: 2, sortOrder: 2, source: "PRODUCT", summary: "摘要二", tags: [], title: "产品二", visible: true },
      { id: 3, sortOrder: 3, source: "PRODUCT", summary: "已隐藏", tags: [], title: "隐藏产品", visible: false },
    ],
    pageNo: 1,
    pageSize: 20,
    total: 3,
  });
});

describe("ContentBindingDialog", () => {
  it("selects visible content, reorders ids and blocks hidden content", async () => {
    const onConfirm = vi.fn();
    render(
      <ContentBindingDialog
        limit={2}
        onClose={() => undefined}
        onConfirm={onConfirm}
        selectedIds={[1]}
        source="PRODUCT"
      />,
    );

    const secondProduct = await screen.findByRole("checkbox", { name: /产品二/ });
    const hiddenProduct = screen.getByRole("checkbox", { name: /隐藏产品/ });
    expect(hiddenProduct.hasAttribute("disabled")).toBe(true);

    fireEvent.click(secondProduct);
    const moveUpButtons = screen.getAllByRole("button", { name: "上移" });
    fireEvent.click(moveUpButtons[1]);
    fireEvent.click(screen.getByRole("button", { name: "确认选择" }));

    expect(onConfirm).toHaveBeenCalledWith(
      [2, 1],
      expect.arrayContaining([
        expect.objectContaining({ id: 1, title: "产品一" }),
        expect.objectContaining({ id: 2, title: "产品二" }),
      ]),
    );
  });
});
