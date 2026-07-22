import { describe, expect, it } from "vitest";
import { buildPortalPageMetadata } from "@/features/portal-page/portal-page-metadata";
import type { PortalPageViewModel } from "@/types/page-builder";

function createPage(overrides: Partial<PortalPageViewModel["schema"]["seo"]> = {}): PortalPageViewModel {
  return {
    name: "公司实力",
    pageKey: "strength",
    schema: {
      layout: {},
      sections: [],
      seo: {
        keywords: [" 企业数字化 ", "数据智能"],
        ...overrides,
      },
    },
  };
}

describe("buildPortalPageMetadata", () => {
  it("uses the published page SEO fields without applying a second title template", () => {
    expect(buildPortalPageMetadata(createPage({
      description: " 了解公司的核心能力。 ",
      title: " 武汉云台数据｜公司实力 ",
    }))).toEqual({
      description: "了解公司的核心能力。",
      keywords: ["企业数字化", "数据智能"],
      title: { absolute: "武汉云台数据｜公司实力" },
    });
  });

  it("falls back to the published page name and omits empty optional fields", () => {
    expect(buildPortalPageMetadata(createPage({ description: "", keywords: [] }))).toEqual({
      title: { absolute: "公司实力" },
    });
  });
});
