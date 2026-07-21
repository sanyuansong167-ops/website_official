// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { getCaseDetail } from "@/services/portal-api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("case detail Portal API", () => {
  it("requests the published case detail endpoint and adapts public fields", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_API_BASE_URL", "https://portal.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        code: 0,
        data: {
          background: "项目背景",
          coverUrl: "https://cdn.example.com/case.svg",
          customerName: "测试客户",
          id: 21,
          industry: "制造业",
          logoUrl: "https://cdn.example.com/case-logo.svg",
          result: "项目成果",
          seoDescription: "案例 SEO 描述",
          seoTitle: "案例 SEO 标题",
          solution: "解决方案",
          status: "PUBLISHED",
          title: "制造业数据智能实践",
        },
      }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const caseDetail = await getCaseDetail(21);

    expect(String(fetchMock.mock.calls[0][0])).toBe("https://portal.example.com/portal/api/cases/21");
    expect(caseDetail).toEqual(expect.objectContaining({
      customerName: "测试客户",
      id: 21,
      logoUrl: "https://cdn.example.com/case-logo.svg",
      title: "制造业数据智能实践",
    }));
  });
});
