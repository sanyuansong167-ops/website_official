// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { getProductDetail } from "@/services/portal-api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("product detail Portal API", () => {
  it("requests the published product detail endpoint and adapts its public fields", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_API_BASE_URL", "https://portal.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        code: 0,
        data: {
          coverUrl: "https://cdn.example.com/product.svg",
          description: "统一管理数据标准。",
          id: 7,
          logoUrl: "https://cdn.example.com/product-logo.svg",
          seoDescription: "产品 SEO 描述",
          seoTitle: "产品 SEO 标题",
          status: "PUBLISHED",
          title: "数据治理平台",
        },
      }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const product = await getProductDetail(7);

    expect(String(fetchMock.mock.calls[0][0])).toBe("https://portal.example.com/portal/api/products/7");
    expect(product).toEqual(expect.objectContaining({
      id: 7,
      logoUrl: "https://cdn.example.com/product-logo.svg",
      seoTitle: "产品 SEO 标题",
      title: "数据治理平台",
    }));
  });
});
