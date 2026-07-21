import { afterEach, describe, expect, it, vi } from "vitest";
import { getBindableContentPage } from "@/services/content-binding-api";
import type { ContentBindingSource } from "@/types/content-binding";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("content binding api", () => {
  it.each([
    {
      item: {
        abstractText: "产品摘要",
        id: 1,
        logo: { id: 11, url: "/media/product.webp", fileName: "product.webp" },
        name: "产品一",
        sortOrder: 1,
        statusTag: "核心产品",
        visible: 1,
      },
      path: "/admin/api/products",
      source: "PRODUCT" as ContentBindingSource,
      title: "产品一",
    },
    {
      item: {
        id: 2,
        keywords: ["制造业"],
        logoUrl: "/media/case.webp",
        sortOrder: 2,
        summary: "案例摘要",
        title: "案例一",
        updatedAt: "2026-07-15T10:00:00",
        visible: true,
      },
      path: "/admin/api/cases",
      source: "CASE" as ContentBindingSource,
      title: "案例一",
    },
    {
      item: {
        customerTags: ["央企"],
        description: "方案摘要",
        iconUrl: "/media/solution.webp",
        id: 3,
        name: "方案一",
        sortOrder: 3,
        updatedAt: "2026-07-15T10:00:00",
        visible: true,
      },
      path: "/admin/api/industry-solutions",
      source: "INDUSTRY_SOLUTION" as ContentBindingSource,
      title: "方案一",
    },
  ])("adapts $source list items without copying detail content", async ({ item, path, source, title }) => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({ code: 0, data: { list: [item], pageNo: 1, pageSize: 20, total: 1 } }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const page = await getBindableContentPage(source);

    expect(page.list[0]).toEqual(expect.objectContaining({ source, title, visible: true }));
    expect(Object.keys(page.list[0]).sort()).toEqual([
      "id", "sortOrder", "source", "summary", "tags", "thumbnailUrl", "title", "updatedAt", "visible",
    ]);
    expect(String(fetchMock.mock.calls[0][0])).toContain(path);
  });

  it("loads all bounded pages for dependency validation", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "https://api.example.com");
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(createPageResponse(1, 2, 3, [createProduct(1)]))
      .mockResolvedValueOnce(createPageResponse(2, 2, 3, [createProduct(2), createProduct(3)]));
    vi.stubGlobal("fetch", fetchMock);

    const { getBindableContentSnapshot } = await import("@/services/content-binding-api");
    const snapshot = await getBindableContentSnapshot("PRODUCT");

    expect(snapshot.complete).toBe(true);
    expect(snapshot.items.map((item) => item.id)).toEqual([1, 2, 3]);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

function createProduct(id: number) {
  return {
    abstractText: `摘要 ${id}`,
    id,
    logo: null,
    name: `产品 ${id}`,
    sortOrder: id,
    visible: 1,
  };
}

function createPageResponse(pageNo: number, pageSize: number, total: number, list: unknown[]) {
  return {
    json: async () => ({ code: 0, data: { list, pageNo, pageSize, total } }),
    ok: true,
    status: 200,
  };
}
