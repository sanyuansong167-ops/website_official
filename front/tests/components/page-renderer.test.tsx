// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageRenderer } from "@/components/page-builder/PageRenderer";
import type { PageSchema } from "@/types/page-builder";

const schema: PageSchema = {
  layout: {},
  sections: [
    {
      component: "HeroSection",
      id: "hero",
      props: { mainTitle: "云台数据", subTitle: "可信的数据智能服务" },
      slot: "main",
      sortOrder: 0,
      style: {},
      visible: true,
    },
  ],
  seo: { keywords: [] },
};

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("PageRenderer rendering modes", () => {
  it("renders the same Hero content in portal and preview modes without editor controls", () => {
    const { rerender } = render(<PageRenderer mode="portal" schema={schema} />);

    expect(screen.getByRole("heading", { name: "云台数据" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: /选择区块/ })).toBeNull();

    rerender(<PageRenderer mode="preview" schema={schema} />);

    expect(screen.getByRole("heading", { name: "云台数据" })).not.toBeNull();
    expect(screen.queryByRole("button", { name: /选择区块/ })).toBeNull();
  });

  it("shows editor-only selection controls in editor mode", () => {
    const onSelectBlock = vi.fn();
    render(<PageRenderer mode="editor" onSelectBlock={onSelectBlock} schema={schema} />);

    expect(screen.getByRole("button", { name: "选择区块 HeroSection" })).not.toBeNull();
  });

  it("renders only Hero actions with a valid target", () => {
    render(
      <PageRenderer
        mode="portal"
        schema={{
          ...schema,
          sections: [
            {
              ...schema.sections[0],
              props: {
                ...schema.sections[0].props,
                primaryButton: {
                  enabled: true,
                  openInNewTab: false,
                  routePath: "/contact",
                  targetType: "INTERNAL_ROUTE",
                  text: "预约交流",
                },
                secondaryButton: {
                  enabled: true,
                  externalUrl: "javascript:alert(1)",
                  openInNewTab: true,
                  targetType: "EXTERNAL_LINK",
                  text: "不安全链接",
                },
              },
            },
          ],
        }}
      />,
    );

    expect(screen.getByRole("link", { name: "预约交流" }).getAttribute("href")).toBe("/contact");
    expect(screen.queryByRole("link", { name: "不安全链接" })).toBeNull();
  });

  it("renders managed media from the configured local Admin API origin", () => {
    vi.stubEnv("NEXT_PUBLIC_ADMIN_API_BASE_URL", "http://localhost:8080");
    const { container } = render(
      <PageRenderer
        mode="preview"
        schema={{
          ...schema,
          sections: [{
            ...schema.sections[0],
            props: {
              ...schema.sections[0].props,
              backgroundImageUrl: "http://localhost:8080/media/public/e2e.png",
            },
          }],
        }}
      />,
    );

    expect(container.querySelector('img[src="http://localhost:8080/media/public/e2e.png"]')).not.toBeNull();
  });

  it("exposes controlled copy, delete and drag operations only in editor mode", () => {
    const onCopyBlock = vi.fn();
    const onDeleteBlock = vi.fn();
    const onReorderBlock = vi.fn();
    const editorSchema: PageSchema = {
      ...schema,
      sections: [
        schema.sections[0],
        {
          component: "ImageTextSection",
          id: "image-text",
          props: { title: "企业实力" },
          slot: "main",
          sortOrder: 10,
          style: {},
          visible: true,
        },
      ],
    };

    render(
      <PageRenderer
        mode="editor"
        onCopyBlock={onCopyBlock}
        onDeleteBlock={onDeleteBlock}
        onReorderBlock={onReorderBlock}
        onSelectBlock={() => undefined}
        schema={editorSchema}
      />,
    );

    expect(screen.queryByRole("button", { name: "复制区块 HeroSection" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "复制区块 ImageTextSection" }));
    fireEvent.click(screen.getByRole("button", { name: "删除区块 HeroSection" }));

    expect(onCopyBlock).toHaveBeenCalledWith("image-text");
    expect(onDeleteBlock).toHaveBeenCalledWith("hero");

    const values = new Map<string, string>();
    const dataTransfer = {
      effectAllowed: "none",
      getData: (type: string) => values.get(type) ?? "",
      setData: (type: string, value: string) => values.set(type, value),
    };
    const dragHandle = screen.getByRole("button", { name: "拖拽区块 ImageTextSection" });
    const heroSection = screen.getByRole("button", { name: "选择区块 HeroSection" }).closest("section");
    if (!heroSection) throw new Error("Expected Hero editor section.");

    fireEvent.dragStart(dragHandle, { dataTransfer });
    fireEvent.drop(heroSection, { dataTransfer });

    expect(onReorderBlock).toHaveBeenCalledWith("image-text", "hero");
  });

  it("renders assembled product data identically in portal and preview modes", () => {
    const listingSchema: PageSchema = {
      layout: {},
      sections: [
        {
          component: "ProductGridSection",
          data: {
            items: [{
              abstractText: "可信的数据治理产品",
              detailLink: "/products/1",
              id: 1,
              name: "数据治理平台",
              statusTag: "核心产品",
            }],
          },
          id: "products",
          props: { emptyStateText: "暂无产品", summary: "产品摘要", title: "产品矩阵" },
          slot: "main",
          sortOrder: 0,
          style: { layout: "three-columns", spacing: "standard", theme: "light" },
          visible: true,
        },
        {
          component: "CaseGridSection",
          data: { items: [{ id: 2, keywords: ["制造业"], summary: "效率提升", title: "制造业案例" }] },
          id: "cases",
          props: { title: "客户案例" },
          slot: "main",
          sortOrder: 10,
          style: { layout: "featured", spacing: "standard", theme: "light" },
          visible: true,
        },
        {
          component: "SolutionGridSection",
          data: { items: [{ customerTags: ["央企"], description: "行业实践方案", id: 3, name: "能源行业方案" }] },
          id: "solutions",
          props: { title: "行业方案" },
          slot: "main",
          sortOrder: 20,
          style: { layout: "two-columns", spacing: "standard", theme: "dark" },
          visible: true,
        },
      ],
      seo: { keywords: [] },
    };
    const { rerender } = render(<PageRenderer mode="portal" schema={listingSchema} />);

    expect(screen.getByRole("heading", { name: "数据治理平台" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "制造业案例" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "能源行业方案" })).toBeTruthy();
    expect(screen.getAllByRole("link", { name: "查看详情" }).map((link) => link.getAttribute("href"))).toEqual([
      "/products/1",
      "/cases/2",
      "/solutions/3",
    ]);
    expect(screen.queryByRole("button", { name: /选择区块/ })).toBeNull();

    rerender(<PageRenderer mode="preview" schema={listingSchema} />);
    expect(screen.getByRole("heading", { name: "数据治理平台" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "制造业案例" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "能源行业方案" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /选择区块/ })).toBeNull();
  });

  it("injects Admin-resolved binding data only through the editor renderer input", () => {
    const editorSchema: PageSchema = {
      layout: {},
      sections: [{
        component: "CaseGridSection",
        dataBinding: {
          displayMode: "AUTO",
          filters: { publishedOnly: true, tag: "" },
          limit: 3,
          selectedIds: [],
          sortBy: "SORT_ORDER_ASC",
          source: "CASE",
        },
        id: "cases",
        props: { title: "客户案例" },
        slot: "main",
        sortOrder: 0,
        style: {},
        visible: true,
      }],
      seo: { keywords: [] },
    };

    render(
      <PageRenderer
        mode="editor"
        onSelectBlock={() => undefined}
        resolvedDataByBlockId={{
          cases: {
            items: [{ id: 7, summary: "降本增效", title: "制造业案例" }],
            status: "ready",
          },
        }}
        schema={editorSchema}
      />,
    );

    expect(screen.getByRole("heading", { name: "制造业案例" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "选择区块 CaseGridSection" })).toBeTruthy();
  });

  it("renders image-text and contact CTA content identically in portal and preview modes", () => {
    const staticSchema: PageSchema = {
      layout: {},
      sections: [
        {
          component: "ImageTextSection",
          id: "strength",
          props: {
            action: {
              enabled: true,
              openInNewTab: false,
              routePath: "/about",
              targetType: "INTERNAL_ROUTE",
              text: "了解我们",
            },
            body: "从数据治理到智能应用，提供稳定的工程交付。",
            imageAlt: "研发团队讨论方案",
            imageUrl: "https://cdn.example.com/strength.jpg",
            summary: "围绕数据、行业与工程构建长期能力。",
            title: "可靠的交付来自系统能力",
          },
          slot: "main",
          sortOrder: 0,
          style: { layout: "image-left", spacing: "large", theme: "light" },
          visible: true,
        },
        {
          component: "ContactCtaSection",
          id: "contact-cta",
          props: {
            action: {
              enabled: true,
              openInNewTab: false,
              routePath: "/contact",
              targetType: "INTERNAL_ROUTE",
              text: "联系我们",
            },
            summary: "告诉我们你的业务目标。",
            title: "从一次交流开始",
          },
          slot: "main",
          sortOrder: 10,
          style: { spacing: "large", theme: "dark" },
          visible: true,
        },
      ],
      seo: { keywords: [] },
    };
    const { rerender } = render(<PageRenderer mode="portal" schema={staticSchema} />);

    expect(screen.getByRole("heading", { name: "可靠的交付来自系统能力" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "研发团队讨论方案" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "了解我们" }).getAttribute("href")).toBe("/about");
    expect(screen.getByRole("link", { name: "联系我们" }).getAttribute("href")).toBe("/contact");
    expect(screen.queryByRole("button", { name: /选择区块/ })).toBeNull();

    rerender(<PageRenderer mode="preview" schema={staticSchema} />);
    expect(screen.getByRole("heading", { name: "可靠的交付来自系统能力" })).toBeTruthy();
    expect(screen.getByRole("img", { name: "研发团队讨论方案" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "联系我们" }).getAttribute("href")).toBe("/contact");
    expect(screen.queryByRole("button", { name: /选择区块/ })).toBeNull();
  });

  it("falls back safely when static block media or actions are unavailable", () => {
    const unsafeSchema: PageSchema = {
      layout: {},
      sections: [
        {
          component: "ImageTextSection",
          id: "strength",
          props: {
            action: {
              enabled: true,
              externalUrl: "javascript:alert(1)",
              openInNewTab: true,
              targetType: "EXTERNAL_LINK",
              text: "不安全链接",
            },
            imageAlt: "企业展厅",
            imageUrl: "https://cdn.example.com/strength.jpg",
            title: "企业实力",
          },
          slot: "main",
          sortOrder: 0,
          style: {},
          visible: true,
        },
        {
          component: "ContactCtaSection",
          id: "contact-cta",
          props: {
            action: {
              enabled: true,
              openInNewTab: false,
              routePath: "//unsafe.example.com",
              targetType: "INTERNAL_ROUTE",
              text: "错误目标",
            },
            title: "联系我们",
          },
          slot: "main",
          sortOrder: 10,
          style: {},
          visible: true,
        },
      ],
      seo: { keywords: [] },
    };
    const { rerender } = render(<PageRenderer mode="portal" schema={unsafeSchema} />);

    expect(screen.queryByRole("link", { name: "不安全链接" })).toBeNull();
    expect(screen.queryByRole("link", { name: "错误目标" })).toBeNull();
    fireEvent.error(screen.getByRole("img", { name: "企业展厅" }));
    expect(screen.getByRole("img", { name: "企业展厅（图片暂不可用）" })).toBeTruthy();

    rerender(<PageRenderer mode="editor" onSelectBlock={() => undefined} schema={unsafeSchema} />);
    expect(screen.getByText("请配置有效的行动按钮和跳转目标。").getAttribute("role")).toBe("alert");
  });

  it("renders metrics, AI cards and capability categories from assembled section data", () => {
    const dynamicSchema: PageSchema = {
      layout: {},
      sections: [
        {
          component: "MetricsSection",
          data: { items: [{ description: "行业数字化实践经验", unit: "+年", value: "11" }] },
          id: "metrics",
          props: { summary: "用可验证的数据建立信任。", title: "核心指标" },
          slot: "main",
          sortOrder: 0,
          style: { layout: "four-columns", spacing: "standard", theme: "light" },
          visible: true,
        },
        {
          component: "AiCardSection",
          data: {
            items: [{
              description: "沉淀组织经验与业务知识",
              englishName: "Knowledge",
              iconUrl: "https://cdn.example.com/knowledge.svg",
              id: 2,
              jumpLink: "/ai-strategy",
              name: "企业知识库",
            }],
          },
          id: "ai-cards",
          props: { title: "AI 战略与实践" },
          slot: "main",
          sortOrder: 10,
          style: { layout: "three-columns", spacing: "large", theme: "dark" },
          visible: true,
        },
        {
          component: "CapabilitySection",
          data: {
            items: [{
              id: 3,
              items: [
                { id: 31, name: "数据治理" },
                { id: 32, name: "数据中台" },
                { id: 33, name: "数据仓库" },
                { id: 34, name: "BI 分析" },
                { id: 35, name: "实时数据平台" },
                { id: 36, name: "数据资产运营" },
              ],
              name: "数据智能平台能力",
            }],
          },
          id: "capabilities",
          props: { title: "核心能力" },
          slot: "main",
          sortOrder: 20,
          style: { layout: "three-columns", spacing: "standard", theme: "light" },
          visible: true,
        },
      ],
      seo: { keywords: [] },
    };
    const { rerender } = render(<PageRenderer mode="portal" schema={dynamicSchema} />);

    expect(screen.getByText("11")).toBeTruthy();
    expect(screen.getByText("+年")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "企业知识库" })).toBeTruthy();
    expect(screen.getByText("Knowledge")).toBeTruthy();
    expect(screen.getByRole("link", { name: "了解详情" }).getAttribute("href")).toBe("/ai-strategy");
    expect(screen.getByRole("heading", { name: "数据智能平台能力" })).toBeTruthy();
    expect(screen.getByText("实时数据平台")).toBeTruthy();
    expect(screen.queryByText("数据资产运营")).toBeNull();
    expect(screen.getByRole("link", { name: "查看全部能力（共 6 项）" }).getAttribute("href")).toBe("/capabilities");
    expect(screen.queryByRole("button", { name: /选择区块/ })).toBeNull();

    rerender(<PageRenderer mode="preview" schema={dynamicSchema} />);
    expect(screen.getByRole("heading", { name: "企业知识库" })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "数据智能平台能力" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: /选择区块/ })).toBeNull();
  });

  it("keeps dynamic binding diagnostics inside editor mode", () => {
    const stateSchema: PageSchema = {
      layout: {},
      sections: [{
        component: "AiCardSection",
        data: {
          issues: ["AI 卡片依赖已失效。"],
          items: [],
          message: "暂时无法读取绑定内容。",
          status: "error",
        },
        id: "ai-cards",
        props: { emptyStateText: "暂无 AI 能力", title: "AI 战略" },
        slot: "main",
        sortOrder: 0,
        style: {},
        visible: true,
      }],
      seo: { keywords: [] },
    };
    const { rerender } = render(<PageRenderer mode="portal" schema={stateSchema} />);

    expect(screen.getByRole("alert").textContent).toBe("暂无 AI 能力");
    expect(screen.queryByText("AI 卡片依赖已失效。")).toBeNull();

    rerender(<PageRenderer mode="editor" onSelectBlock={() => undefined} schema={stateSchema} />);
    expect(screen.getByText("暂时无法读取绑定内容。")).toBeTruthy();
    expect(screen.getByText("AI 卡片依赖已失效。")).toBeTruthy();
  });
});
