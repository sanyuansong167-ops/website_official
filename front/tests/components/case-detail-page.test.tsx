// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CaseDetailPage } from "@/features/portal-detail/CaseDetailPage";

describe("CaseDetailPage", () => {
  it("renders published case fields and keeps a safe return link", () => {
    render(
      <CaseDetailPage
        caseDetail={{
          background: "项目背景说明",
          coverUrl: "https://cdn.example.com/case.svg",
          customerName: "测试客户",
          id: 21,
          industry: "制造业",
          logoUrl: "https://cdn.example.com/case-logo.svg",
          result: "项目成果说明",
          seoDescription: "案例 SEO 描述",
          seoTitle: "案例 SEO 标题",
          solution: "解决方案说明",
          status: "PUBLISHED",
          title: "制造业数据智能实践",
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "制造业数据智能实践" })).toBeTruthy();
    expect(screen.getByText("已发布案例")).toBeTruthy();
    expect(screen.getByText("测试客户")).toBeTruthy();
    expect(screen.getByRole("heading", { level: 2, name: "解决方案" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "制造业数据智能实践封面" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "制造业数据智能实践客户标识" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "返回客户案例" }).getAttribute("href")).toBe("/cases");
  });
});
