// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ContactFormBlock } from "@/components/page-builder/ContactFormBlock";
import { PromiseBlock } from "@/components/page-builder/PromiseBlock";
import type { ControlledSection } from "@/types/page-builder";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("direction=AI%20%E6%88%98%E7%95%A5%E5%92%A8%E8%AF%A2"),
}));

describe("stage-three controlled blocks", () => {
  it("renders bound contact details and only accepts a configured direction", () => {
    render(
      <ContactFormBlock
        mode="portal"
        section={section({
          data: {
            contact: {
              businessPhone: "027-88886666",
              contactAddress: "武汉市东湖高新区",
              contactEmail: "business@example.com",
            },
            directions: [
              { tagText: "AI 战略咨询" },
              { tagText: "数据治理" },
            ],
          },
          id: "contact-form",
          props: { title: "预约交流" },
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: "预约交流" })).toBeTruthy();
    expect(screen.getByText("027-88886666")).toBeTruthy();
    expect(screen.getByLabelText("需求描述（选填）").textContent).toContain("合作方向：AI 战略咨询");
    expect(screen.getByRole("button", { name: "提交预约" })).toBeTruthy();
  });

  it("renders promise copy and bound promise tags", () => {
    render(
      <PromiseBlock
        mode="preview"
        section={section({
          data: {
            content: "以专业、务实和创新持续创造真实价值。",
            tags: [
              { description: "可靠交付", tagText: "过硬的技术" },
              { tagText: "实用的功能" },
            ],
          },
          id: "promise",
          props: { title: "我们的承诺" },
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: "我们的承诺" })).toBeTruthy();
    expect(screen.getByText("以专业、务实和创新持续创造真实价值。")).toBeTruthy();
    expect(screen.getByText("过硬的技术")).toBeTruthy();
    expect(screen.getByText("可靠交付")).toBeTruthy();
  });
});

function section(
  overrides: Partial<ControlledSection> & Pick<ControlledSection, "id">,
): ControlledSection {
  const { id, ...rest } = overrides;
  return {
    component: "ContactFormSection",
    id,
    props: {},
    slot: "main",
    sortOrder: 0,
    style: { spacing: "standard", theme: "light" },
    visible: true,
    ...rest,
  };
}
