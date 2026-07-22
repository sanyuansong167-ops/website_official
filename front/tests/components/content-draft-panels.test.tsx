// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContentDraftPanels } from "@/features/content-editor/ContentDraftPanels";
import type { ContentDraftForm } from "@/features/content-editor/content-draft-form";

describe("ContentDraftPanels", () => {
  it("shows the complete product panels and reports field changes", () => {
    const onChange = vi.fn();
    render(
      <ContentDraftPanels
        disabled={false}
        form={{ ...emptyForm(), title: "产品一" }}
        onChange={onChange}
        resourceId={7}
        resourceKind="product"
      />,
    );

    expect(screen.getByRole("heading", { name: "基本信息" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "正文内容" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "媒体资源" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "关联内容" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "搜索信息" })).toBeTruthy();
    expect(screen.getByText("关联案例")).toBeTruthy();
    expect(screen.getByText("关联行业方案")).toBeTruthy();

    fireEvent.change(screen.getByLabelText("短标题"), { target: { value: "产品短标题" } });
    fireEvent.change(screen.getByRole("textbox", { name: /^详情正文/ }), { target: { value: "<p>安全正文</p>" } });

    expect(onChange).toHaveBeenCalledWith("shortTitle", "产品短标题");
    expect(onChange).toHaveBeenCalledWith("content", "<p>安全正文</p>");
  });

  it("renders case-specific business fields in read-only mode", () => {
    render(
      <ContentDraftPanels
        disabled
        form={{ ...emptyForm(), customerName: "客户 A", industry: "制造" }}
        onChange={() => undefined}
        resourceId={9}
        resourceKind="case"
      />,
    );

    expect(screen.getByLabelText("客户名称").hasAttribute("disabled")).toBe(true);
    expect(screen.getByLabelText("所属行业").hasAttribute("disabled")).toBe(true);
    expect(screen.getByLabelText("项目背景").hasAttribute("disabled")).toBe(true);
    screen.getAllByRole("button", { name: "选择并排序" }).forEach((button) => {
      expect(button.hasAttribute("disabled")).toBe(true);
    });
  });
});

function emptyForm(): ContentDraftForm {
  return {
    applicationScenarios: "",
    background: "",
    content: "",
    coreCapabilities: "",
    coverAltText: "",
    coverMediaId: null,
    customerName: "",
    customerTags: "",
    features: "",
    galleryMediaIds: [],
    heroAltText: "",
    heroMediaId: null,
    highlights: "",
    industry: "",
    painPoints: "",
    primaryMediaAltText: "",
    primaryMediaId: null,
    relatedCaseIds: [],
    relatedIndustrySolutionIds: [],
    relatedProductIds: [],
    result: "",
    seoDescription: "",
    seoKeywords: "",
    seoTitle: "",
    shortTitle: "",
    solution: "",
    solutionApproach: "",
    summary: "",
    title: "",
  };
}
