// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListingGridBlock } from "@/components/page-builder/ListingGridBlock";

describe("ListingGridBlock", () => {
  it("derives the approved public detail route for a published solution", () => {
    render(
      <ListingGridBlock
        kind="solution"
        mode="portal"
        section={{
          component: "SolutionGridSection",
          data: {
            items: [{
              customerTags: ["能源"],
              description: "贯通生产经营数据。",
              id: 11,
              name: "能源行业解决方案",
            }],
          },
          id: "solution-grid",
          props: { title: "行业解决方案" },
          slot: "main",
          sortOrder: 0,
          style: {},
          visible: true,
        }}
      />,
    );

    expect(screen.getByText("能源")).toBeTruthy();
    expect(screen.getByRole("link", { name: "查看详情" }).getAttribute("href")).toBe("/solutions/11");
  });

  it("keeps an approved solution detail route when one is supplied", () => {
    render(
      <ListingGridBlock
        kind="solution"
        mode="portal"
        section={{
          component: "SolutionGridSection",
          data: {
            items: [{ detailLink: "/solutions/11", id: 11, name: "能源行业解决方案" }],
          },
          id: "solution-grid",
          props: { title: "行业解决方案" },
          slot: "main",
          sortOrder: 0,
          style: {},
          visible: true,
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "查看详情" }).getAttribute("href")).toBe("/solutions/11");
  });
});
