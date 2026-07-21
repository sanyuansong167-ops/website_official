// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";
import { getIndustrySolutionDetail } from "@/services/portal-api";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("industry solution detail Portal API", () => {
  it("requests and adapts the published industry solution detail", async () => {
    vi.stubEnv("NEXT_PUBLIC_PORTAL_API_BASE_URL", "https://portal.example.com");
    const fetchMock = vi.fn().mockResolvedValue({
      json: async () => ({
        code: 0,
        data: {
          customerTags: ["央企", "能源"],
          description: "贯通生产经营数据。",
          detailJson: { description: "贯通生产经营数据。" },
          iconUrl: "https://cdn.example.com/solution.svg",
          id: 11,
          name: "能源行业解决方案",
        },
      }),
      ok: true,
      status: 200,
    });
    vi.stubGlobal("fetch", fetchMock);

    const solution = await getIndustrySolutionDetail(11);

    expect(String(fetchMock.mock.calls[0][0])).toBe("https://portal.example.com/portal/api/industry-solutions/11");
    expect(solution).toEqual(expect.objectContaining({ customerTags: ["央企", "能源"], id: 11, name: "能源行业解决方案" }));
  });
});
