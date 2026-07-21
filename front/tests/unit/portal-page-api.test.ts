import { afterEach, describe, expect, it, vi } from "vitest";
import { createLead, getPortalPage } from "@/services/portal-api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("portal page api", () => {
  it("submits anonymous leads without credentials to match the Portal CORS contract", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_API_BASE_URL", "https://portal.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ code: 0, message: "操作成功" }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    await createLead({ company: "云台数据", email: "hello@example.com", name: "张三" });

    expect(fetchMock).toHaveBeenCalledWith(
      new URL("https://portal.example.com/portal/api/leads"),
      expect.objectContaining({ credentials: "omit", method: "POST" }),
    );
  });

  it("adapts the refactored bindingData field without exposing binding metadata", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_API_BASE_URL", "https://portal.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        code: 0,
        data: {
          layout: {},
          name: "首页",
          pageKey: "home",
          sections: [{
            bindingData: { items: [{ id: 1, name: "产品一" }] },
            component: "ProductGridSection",
            id: "products",
            props: { title: "产品矩阵" },
            style: {},
            visible: true,
          }],
          seo: { keywords: [] },
        },
      }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const page = await getPortalPage("/");

    expect(page.schema.sections[0].data).toEqual({ items: [{ id: 1, name: "产品一" }] });
    expect(page.schema.sections[0].dataBinding).toBeUndefined();
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      "https://portal.example.com/portal/api/page-builder/pages?routePath=%2F",
    );
  });

  it("adapts the deployed Portal response when editor-only fields are absent", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_API_BASE_URL", "https://portal.example.com");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: async () => ({
        code: 0,
        data: {
          layout: { type: "default" },
          name: "E2E Integration Page",
          pageKey: "e2e-page",
          sections: [{
            bindingData: [{ id: 1, name: "E2E Test Product" }],
            component: "ProductGrid",
            id: "products",
            props: { title: "E2E Products" },
          }],
          seo: { title: "E2E Integration Page" },
        },
      }),
      ok: true,
      status: 200,
    }));

    const page = await getPortalPage("/e2e-page");

    expect(page.schema.sections[0]).toMatchObject({
      component: "ProductGridSection",
      data: { items: [{ id: 1, name: "E2E Test Product" }] },
      style: {},
      visible: true,
    });
  });

  it("resolves Portal media paths against the Portal API without changing internal routes", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_API_BASE_URL", "https://portal.example.com/api-root");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      json: async () => ({
        code: 0,
        data: {
          layout: {},
          name: "首页",
          pageKey: "home",
          sections: [{
            bindingData: {
              items: [{ coverUrl: "/media/public/product.png", detailPath: "/products/1" }],
            },
            component: "ProductGrid",
            id: "products",
            props: { backgroundImage: "/media/public/background.png", buttonLink: "/contact" },
          }],
          seo: { keywords: [] },
        },
      }),
      ok: true,
      status: 200,
    }));

    const page = await getPortalPage("/");

    expect(page.schema.sections[0].data).toEqual({
      items: [{
        coverUrl: "https://portal.example.com/media/public/product.png",
        detailPath: "/products/1",
      }],
    });
    expect(page.schema.sections[0].props).toEqual({
      backgroundImage: "https://portal.example.com/media/public/background.png",
      buttonLink: "/contact",
    });
  });
});
