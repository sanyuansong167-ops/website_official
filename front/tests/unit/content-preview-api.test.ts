import { afterEach, describe, expect, it, vi } from "vitest";
import { getContentPreview } from "@/services/content-preview-api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("content preview Portal API", () => {
  it("adapts a product draft to the existing detail view model", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_API_BASE_URL", "https://portal.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ code: 0, data: { coverUrl: "/media/cover.png", name: "数据平台", subTitle: "统一数据能力" } }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const preview = await getContentPreview("product", 7, "preview-token", { cookie: "SESSION=admin" });

    expect(preview).toEqual({
      data: expect.objectContaining({ description: "统一数据能力", id: 7, status: "DRAFT", title: "数据平台" }),
      kind: "product",
    });
    expect(String(fetchMock.mock.calls[0][0])).toBe("https://portal.example.com/portal/api/products/7/previews/preview-token");
    expect(fetchMock.mock.calls[0][1].headers).toEqual(expect.objectContaining({ Cookie: "SESSION=admin" }));
  });
});
