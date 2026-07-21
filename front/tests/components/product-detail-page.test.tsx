// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ProductDetailPage } from "@/features/portal-detail/ProductDetailPage";

describe("ProductDetailPage", () => {
  it("renders published product fields and keeps a safe return link", () => {
    render(
      <ProductDetailPage
        product={{
          coverUrl: "https://cdn.example.com/product.svg",
          description: "统一管理数据标准、质量与资产。",
          id: 1,
          logoUrl: "https://cdn.example.com/product-logo.svg",
          seoDescription: "产品 SEO 描述",
          seoTitle: "产品 SEO 标题",
          status: "PUBLISHED",
          title: "数据治理平台",
        }}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "数据治理平台" })).toBeTruthy();
    expect(screen.getByText("已发布产品")).toBeTruthy();
    expect(screen.getByRole("img", { name: "数据治理平台封面" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "数据治理平台产品标识" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "返回产品矩阵" }).getAttribute("href")).toBe("/products");
  });
});
