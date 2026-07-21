// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageRenderer } from "@/components/page-builder/PageRenderer";

describe("CapabilitySection", () => {
  it("renders capability children as readable, non-interactive content", () => {
    render(
      <PageRenderer
        mode="portal"
        schema={{
          layout: {},
          sections: [{
            component: "CapabilitySection",
            data: { items: [{ id: 1, items: [{ id: 11, name: "数据治理" }, { id: 12, name: "数据仓库" }], name: "数据智能平台能力" }] },
            id: "capabilities",
            props: { title: "核心能力" },
            slot: "main",
            sortOrder: 0,
            style: { layout: "three-columns", spacing: "standard", theme: "light" },
            visible: true,
          }],
          seo: { keywords: [] },
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "数据智能平台能力" })).toBeTruthy();
    expect(screen.getByText("数据治理")).toBeTruthy();
    expect(screen.queryByRole("link", { name: "数据治理" })).toBeNull();
    expect(screen.queryByRole("button", { name: "数据治理" })).toBeNull();
  });

  it("shows a concise empty state without hiding a following contact CTA", () => {
    render(
      <PageRenderer
        mode="portal"
        schema={{
          layout: {},
          sections: [
            {
              component: "CapabilitySection",
              data: { items: [] },
              id: "capabilities",
              props: { emptyStateText: "核心能力正在持续完善", title: "核心能力" },
              slot: "main",
              sortOrder: 0,
              style: { layout: "three-columns", spacing: "standard", theme: "light" },
              visible: true,
            },
            {
              component: "ContactCtaSection",
              id: "contact",
              props: {
                action: { enabled: true, openInNewTab: false, routePath: "/contact", targetType: "INTERNAL_ROUTE", text: "联系我们" },
                title: "从清晰的问题开始",
              },
              slot: "main",
              sortOrder: 10,
              style: { layout: "centered", spacing: "standard", theme: "dark" },
              visible: true,
            },
          ],
          seo: { keywords: [] },
        }}
      />,
    );

    expect(screen.getByText("核心能力正在持续完善")).toBeTruthy();
    expect(screen.getByRole("link", { name: "联系我们" }).getAttribute("href")).toBe("/contact");
  });
});
