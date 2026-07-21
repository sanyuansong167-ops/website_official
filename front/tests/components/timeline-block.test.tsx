// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TimelineBlock } from "@/components/page-builder/TimelineBlock";

describe("TimelineBlock", () => {
  it("keeps the published service order and exposes an accessible timeline", () => {
    render(
      <TimelineBlock
        mode="portal"
        section={{
          component: "TimelineSection",
          data: {
            items: [
              { description: "第一阶段", id: "2020", time: "2020", title: "开始实践" },
              { description: "第二阶段", id: "2024", time: "2024", title: "持续演进" },
            ],
          },
          id: "timeline",
          props: { displayLimit: 2, title: "发展历程" },
          slot: "main",
          sortOrder: 0,
          style: { theme: "light" },
          visible: true,
        }}
      />,
    );

    const timeline = screen.getByRole("list", { name: "发展历程" });
    expect(timeline.getAttribute("class")).toBeTruthy();
    expect(screen.getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      expect.stringContaining("2020"),
      expect.stringContaining("2024"),
    ]);
  });

  it("renders a concise empty state when no valid timeline items are available", () => {
    render(
      <TimelineBlock
        mode="portal"
        section={{
          component: "TimelineSection",
          data: { items: [] },
          id: "timeline",
          props: { emptyStateText: "暂无历程", title: "发展历程" },
          slot: "main",
          sortOrder: 0,
          style: {},
          visible: true,
        }}
      />,
    );

    expect(screen.getByText("暂无历程")).toBeTruthy();
    expect(screen.queryByRole("list", { name: "发展历程" })).toBeNull();
  });
});
