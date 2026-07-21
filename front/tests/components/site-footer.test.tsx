// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SiteFooter } from "@/components/layout/SiteFooter";

describe("SiteFooter", () => {
  it("renders configured navigation groups, legal routes and a safe filing link", () => {
    render(
      <SiteFooter
        contact={null}
        navigation={[
          {
            children: [{
              children: [],
              id: 2,
              menuName: "数据治理",
              openInNewTab: false,
              routePath: "/solutions/data-governance",
              targetType: "INTERNAL_ROUTE",
            }],
            id: 1,
            menuName: "服务领域",
            openInNewTab: false,
            targetType: "GROUP",
          },
        ]}
        site={{
          brandSlogan: "让数据成为持续进化的力量",
          brandTagline: "数据智能服务",
          filingNumber: "鄂ICP备00000000号",
          filingUrl: "https://beian.miit.gov.cn",
          privacyPolicyPath: "/legal/privacy",
          seoDescription: "官网",
          seoKeywords: "数据智能",
          siteTitle: "云台数据",
          termsOfServicePath: "/legal/terms",
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "服务领域" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "数据治理" }).getAttribute("href")).toBe("/solutions/data-governance");
    expect(screen.getByRole("link", { name: "隐私政策" }).getAttribute("href")).toBe("/legal/privacy");
    expect(screen.getByRole("link", { name: "服务条款" }).getAttribute("href")).toBe("/legal/terms");
    expect(screen.getByRole("link", { name: "鄂ICP备00000000号" }).getAttribute("href")).toBe("https://beian.miit.gov.cn");
  });
});
