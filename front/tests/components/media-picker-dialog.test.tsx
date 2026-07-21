// @vitest-environment jsdom

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { MediaPickerDialog } from "@/features/editor/MediaPickerDialog";
import { getImageAssets, uploadImageAsset } from "@/services/media-api";

vi.mock("@/services/admin-api", () => ({
  getCsrfToken: vi.fn(),
}));

vi.mock("@/services/media-api", () => ({
  getImageAssets: vi.fn(),
  uploadImageAsset: vi.fn(),
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
  vi.mocked(getImageAssets).mockResolvedValue({
    list: [{
      altText: "数据中心",
      contentType: "image/webp",
      createdAt: "2026-07-15T10:00:00",
      displayUrl: "https://cdn.example.com/hero.webp",
      fileSize: 2048,
      id: 8,
      mediaType: "IMAGE",
      originalFilename: "hero.webp",
      publicUrl: "/media/public/hero.webp",
      status: "ACTIVE",
      updatedAt: "2026-07-15T10:00:00",
      version: 1,
    }],
    pageNo: 1,
    pageSize: 24,
    total: 1,
  });
});

describe("MediaPickerDialog", () => {
  it("loads active images and returns the selected media asset", async () => {
    const onSelect = vi.fn();
    render(<MediaPickerDialog onClose={() => undefined} onSelect={onSelect} open />);

    const assetButton = await screen.findByRole("button", { name: /hero\.webp/ });
    fireEvent.click(assetButton);

    expect(getImageAssets).toHaveBeenCalledWith(1);
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 8, altText: "数据中心" }));
  });

  it("rejects unsupported files before calling the upload api", async () => {
    render(<MediaPickerDialog onClose={() => undefined} onSelect={() => undefined} open />);
    const input = screen.getByLabelText("上传新图片");

    fireEvent.change(input, {
      target: { files: [new File(["text"], "unsafe.svg", { type: "image/svg+xml" })] },
    });

    await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("仅支持 PNG"));
    expect(uploadImageAsset).not.toHaveBeenCalled();
  });
});
