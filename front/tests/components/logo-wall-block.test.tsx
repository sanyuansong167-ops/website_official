// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PageRenderer } from "@/components/page-builder/PageRenderer";

describe("LogoWallSection", () => {
  it("renders readable honor cards and customer logo alternative text from published binding data", () => {
    render(
      <PageRenderer
        mode="portal"
        schema={{
          layout: {},
          sections: [
            {
              component: "LogoWallSection",
              data: { items: [{ iconUrl: "https://cdn.example.com/honor.svg", id: 1, name: "数据管理能力成熟度认证" }] },
              id: "honors",
              props: { displayLimit: 6, title: "资质与荣誉" },
              slot: "main",
              sortOrder: 0,
              style: { layout: "honor-grid", spacing: "standard", theme: "light" },
              visible: true,
            },
            {
              component: "LogoWallSection",
              data: { items: [{ id: 2, industry: "能源", logoUrl: "https://cdn.example.com/client.svg", name: "能源行业客户" }] },
              id: "clients",
              props: { displayLimit: 6, title: "服务客户" },
              slot: "main",
              sortOrder: 10,
              style: { layout: "logo-wall", spacing: "standard", theme: "light" },
              visible: true,
            },
            {
              component: "MetricsSection",
              data: { items: [{ iconUrl: "https://cdn.example.com/metric.svg", id: 3, label: "服务客户", metricValue: "100+" }] },
              id: "strength-metrics",
              props: { title: "实力沉淀" },
              slot: "main",
              sortOrder: 20,
              style: { layout: "three-columns", spacing: "standard", theme: "light" },
              visible: true,
            },
          ],
          seo: { keywords: [] },
        }}
      />,
    );

    expect(screen.getByRole("heading", { name: "数据管理能力成熟度认证" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "能源行业客户" })).toBeTruthy();
    expect(screen.getByText("能源")).toBeTruthy();
    expect(screen.getByText("100+")).toBeTruthy();
    expect(screen.getAllByText("服务客户")).toHaveLength(2);
  });
});
