// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IndustrySolutionDetailPage } from "@/features/portal-detail/IndustrySolutionDetailPage";

describe("IndustrySolutionDetailPage", () => {
  it("renders the published solution shell, customer tags and safe navigation", () => {
    render(
      <IndustrySolutionDetailPage
        solution={{
          customerTags: ["央企", "能源"],
          description: "贯通生产经营数据，支撑精细化运营。",
          iconUrl: "https://cdn.example.com/solution.svg",
          id: 11,
          name: "能源行业解决方案",
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "能源行业解决方案" })).toBeTruthy();
    expect(screen.getByText("央企")).toBeTruthy();
    expect(screen.getByRole("img", { name: "能源行业解决方案图标" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "返回解决方案" }).getAttribute("href")).toBe("/solutions");
    expect(screen.getByRole("link", { name: "咨询方案" }).getAttribute("href")).toBe("/contact?direction=%E8%83%BD%E6%BA%90%E8%A1%8C%E4%B8%9A%E8%A7%A3%E5%86%B3%E6%96%B9%E6%A1%88");
  });
});
