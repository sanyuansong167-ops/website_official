import { afterEach, describe, expect, it, vi } from "vitest";
import { validatePageSchema } from "@/features/editor/validate-page-schema";
import { createDefaultHomePageSchema } from "@/lib/home-page-template";
import type { PageSchema } from "@/types/page-builder";

function createSchema(): PageSchema {
  return {
    layout: {},
    sections: [
      {
        component: "HeroSection",
        id: "hero",
        props: { mainTitle: "云台数据", subTitle: "可信的数据智能服务" },
        slot: "main",
        sortOrder: 0,
        style: { layout: "left", spacing: "large", theme: "dark" },
        visible: true,
      },
    ],
    seo: { keywords: [] },
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("validatePageSchema", () => {
  it("accepts a valid Hero with controlled media and actions", () => {
    const schema = createSchema();
    schema.sections[0].props = {
      ...schema.sections[0].props,
      backgroundImageMediaId: 10,
      backgroundImageUrl: "https://cdn.example.com/hero.webp",
      primaryButton: {
        enabled: true,
        openInNewTab: false,
        routePath: "/contact",
        targetType: "INTERNAL_ROUTE",
        text: "预约交流",
      },
      secondaryButton: { enabled: false },
    };

    expect(validatePageSchema(schema)).toEqual([]);
  });

  it("rejects illegal slots and repeated non-repeatable blocks", () => {
    const schema = createSchema();
    schema.sections.push({
      ...schema.sections[0],
      id: "hero-copy",
      slot: "footer",
      sortOrder: 1,
    });

    const messages = validatePageSchema(schema).map((issue) => issue.message);

    expect(messages).toContain("区块 HeroSection 不允许放在 footer 插槽。");
    expect(messages).toContain("区块 HeroSection 不允许重复添加。");
  });

  it("rejects invalid media and unsafe Hero button targets", () => {
    const schema = createSchema();
    schema.sections[0].props = {
      ...schema.sections[0].props,
      backgroundImageMediaId: 0,
      backgroundImageUrl: "javascript:alert(1)",
      primaryButton: {
        enabled: true,
        externalUrl: "http://127.0.0.1/internal",
        openInNewTab: true,
        targetType: "EXTERNAL_LINK",
        text: "不安全链接",
      },
    };

    const fields = validatePageSchema(schema).map((issue) => issue.field);
    expect(fields).toEqual(
      expect.arrayContaining(["backgroundImageMediaId", "backgroundImageUrl", "primaryButton"]),
    );
  });

  it("allows a media URL from the configured local Admin API origin", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "http://localhost:8080");
    const schema = createSchema();
    schema.sections[0].props = {
      ...schema.sections[0].props,
      backgroundImageMediaId: 1,
      backgroundImageUrl: "http://localhost:8080/media/public/e2e.png",
    };

    expect(validatePageSchema(schema)).toEqual([]);
  });

  it("allows new-window behavior only for external links", () => {
    const schema = createSchema();
    schema.sections[0].props.primaryButton = {
      enabled: true,
      openInNewTab: true,
      routePath: "/contact",
      targetType: "INTERNAL_ROUTE",
      text: "预约交流",
    };

    expect(validatePageSchema(schema)).toEqual([
      expect.objectContaining({ field: "primaryButton", message: "主按钮只有外部链接可以在新窗口打开。" }),
    ]);
  });

  it("blocks RichText until an approved Schema and sanitizer exist", () => {
    const schema = createSchema();
    schema.sections.push({
      component: "RichTextSection",
      id: "rich-text",
      props: { content: "<script>alert(1)</script>" },
      slot: "main",
      sortOrder: 1,
      style: {},
      visible: true,
    });

    expect(validatePageSchema(schema)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockId: "rich-text",
          field: "content",
          message: "RichTextSection 尚未配置批准的字段 Schema 与白名单净化器，当前不能保存。",
        }),
      ]),
    );
  });

  it("validates required, numeric and controlled option fields from block metadata", () => {
    const schema = createSchema();
    schema.sections.push({
      component: "ProductGridSection",
      dataBinding: {
        displayMode: "UNSAFE",
        limit: 99,
        selectedIds: [],
        sortBy: "SORT_ORDER_ASC",
        source: "PRODUCT",
      },
      id: "products",
      props: { emptyStateText: "暂无产品", summary: "", title: "" },
      slot: "main",
      sortOrder: 1,
      style: { layout: "three-columns", spacing: "standard", theme: "light" },
      visible: true,
    });

    expect(validatePageSchema(schema)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ blockId: "products", field: "title", message: "区块标题不能为空。" }),
        expect.objectContaining({ blockId: "products", field: "limit", message: "展示数量不能大于 12。" }),
        expect.objectContaining({
          blockId: "products",
          field: "displayMode",
          message: "内容选择方式使用了未批准的选项。",
        }),
      ]),
    );
  });

  it("validates required, numeric and select fields from block templates", () => {
    const schema = createDefaultHomePageSchema();
    const metrics = schema.sections.find((section) => section.component === "MetricsSection");
    if (!metrics?.dataBinding) throw new Error("Expected MetricsSection binding.");

    metrics.props.title = "";
    metrics.dataBinding.limit = 99;
    metrics.style.layout = "unsupported";

    expect(validatePageSchema(schema)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ blockId: metrics.id, field: "title", message: "区块标题不能为空。" }),
        expect.objectContaining({ blockId: metrics.id, field: "limit", message: "展示数量不能大于 12。" }),
        expect.objectContaining({ blockId: metrics.id, field: "layout", message: "卡片布局使用了未批准的选项。" }),
      ]),
    );
  });

  it("requires alternative text for content images", () => {
    const schema = createDefaultHomePageSchema();
    const imageText = schema.sections.find((section) => section.component === "ImageTextSection");
    if (!imageText) throw new Error("Expected ImageTextSection.");
    imageText.props.imageMediaId = 18;
    imageText.props.imageUrl = "https://cdn.example.com/strength.webp";
    imageText.props.imageAlt = "";

    expect(validatePageSchema(schema)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          blockId: imageText.id,
          field: "imageAlt",
          message: "展示图片必须填写有意义的替代文本。",
        }),
      ]),
    );
  });

  it("rejects duplicate or over-limit manual content ids", () => {
    const schema = createDefaultHomePageSchema();
    const products = schema.sections.find((section) => section.component === "ProductGridSection");
    if (!products?.dataBinding) throw new Error("Expected ProductGridSection binding.");
    products.dataBinding.displayMode = "MANUAL";
    products.dataBinding.limit = 2;
    products.dataBinding.selectedIds = [1, 1, 2];

    const messages = validatePageSchema(schema).map((issue) => issue.message);
    expect(messages).toContain("手动选择内容不能包含重复 ID。");
    expect(messages).toContain("手动选择内容不能超过展示数量 2。");
  });

  it("locks external list blocks to their approved source and published-only filter", () => {
    const schema = createDefaultHomePageSchema();
    const products = schema.sections.find((section) => section.component === "ProductGridSection");
    if (!products?.dataBinding) throw new Error("Expected ProductGridSection binding.");
    products.dataBinding.source = "CASE";
    products.dataBinding.filters = { publishedOnly: false, tag: "x".repeat(65) };

    expect(validatePageSchema(schema)).toEqual(expect.arrayContaining([
      expect.objectContaining({ blockId: products.id, field: "source" }),
      expect.objectContaining({
        blockId: products.id,
        field: "filters",
        message: "自动内容绑定必须固定为仅选择可公开展示内容。",
      }),
    ]));
  });
});
