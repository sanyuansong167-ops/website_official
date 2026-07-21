// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { getBlockDefinition } from "@/components/page-builder/block-registry";
import { BlockPropertiesPanel } from "@/features/editor/BlockPropertiesPanel";
import { createDefaultHomePageSchema } from "@/lib/home-page-template";

vi.mock("@/features/editor/MediaPickerDialog", () => ({
  MediaPickerDialog: ({
    onSelect,
    open,
  }: {
    onSelect: (asset: {
      altText: string;
      displayUrl: string;
      id: number;
    }) => void;
    open: boolean;
  }) => open ? (
    <button
      onClick={() => onSelect({
        altText: "数据中心展示图",
        displayUrl: "https://cdn.example.com/hero.webp",
        id: 88,
      })}
      type="button"
    >
      选择测试图片
    </button>
  ) : null,
}));

vi.mock("@/features/editor/ContentBindingPreview", () => ({
  ContentBindingPreview: () => <div>绑定结果预览</div>,
}));

describe("BlockPropertiesPanel", () => {
  it("edits text fields through their controlled configuration path", () => {
    const schema = createDefaultHomePageSchema();
    const section = schema.sections[0];
    const definition = getBlockDefinition(section.component);
    const onChange = vi.fn();
    if (!definition) throw new Error("Expected a registered Hero block.");

    render(
      <BlockPropertiesPanel
        definition={definition}
        disabled={false}
        issues={[]}
        onChange={onChange}
        section={section}
      />,
    );

    fireEvent.change(screen.getByRole("textbox", { name: "主标题 *" }), {
      target: { value: "新的首页标题" },
    });

    expect(onChange).toHaveBeenCalledWith("props.mainTitle", "新的首页标题");

    fireEvent.change(screen.getByRole("combobox", { name: "跳转类型" }), {
      target: { value: "PAGE_ANCHOR" },
    });
    expect(onChange).toHaveBeenCalledWith(
      "props.primaryButton",
      expect.objectContaining({ openInNewTab: false, targetType: "PAGE_ANCHOR" }),
    );
  });

  it("renders list options and reports changes without exposing arbitrary JSON", () => {
    const schema = createDefaultHomePageSchema();
    const section = schema.sections[5];
    const definition = getBlockDefinition(section.component);
    const onChange = vi.fn();
    if (!definition) throw new Error("Expected a registered product grid block.");

    render(
      <BlockPropertiesPanel
        definition={definition}
        disabled={false}
        issues={[]}
        onChange={onChange}
        section={section}
      />,
    );

    fireEvent.change(screen.getByRole("spinbutton", { name: "展示数量 *" }), { target: { value: "4" } });
    fireEvent.change(screen.getByRole("textbox", { name: "标签筛选" }), { target: { value: "核心产品" } });
    fireEvent.change(screen.getByRole("combobox", { name: "内容选择方式 *" }), {
      target: { value: "MANUAL" },
    });

    expect(onChange).toHaveBeenCalledWith("dataBinding.limit", 4);
    expect(onChange).toHaveBeenCalledWith("dataBinding.filters", {
      publishedOnly: true,
      tag: "核心产品",
    });
    expect(onChange).toHaveBeenCalledWith("dataBinding.displayMode", "MANUAL");
    expect(screen.queryByRole("textbox", { name: /JSON/i })).toBeNull();
  });

  it("selects media through controlled id, url and alt-text paths and enables supported manual binding", () => {
    const schema = createDefaultHomePageSchema();
    const hero = schema.sections[0];
    const heroDefinition = getBlockDefinition(hero.component);
    if (!heroDefinition) throw new Error("Expected a registered Hero block.");

    const onChange = vi.fn();
    const { rerender } = render(
      <BlockPropertiesPanel
        definition={heroDefinition}
        disabled={false}
        issues={[]}
        onChange={onChange}
        section={hero}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "选择图片" }));
    fireEvent.click(screen.getByRole("button", { name: "选择测试图片" }));

    expect(onChange).toHaveBeenCalledWith("props.backgroundImageMediaId", 88);
    expect(onChange).toHaveBeenCalledWith("props.backgroundImageUrl", "https://cdn.example.com/hero.webp");
    expect(onChange).toHaveBeenCalledWith("props.backgroundImageAlt", "数据中心展示图");

    const products = schema.sections[5];
    if (products.dataBinding) products.dataBinding.displayMode = "MANUAL";
    const productDefinition = getBlockDefinition(products.component);
    if (!productDefinition) throw new Error("Expected a registered product grid block.");
    rerender(
      <BlockPropertiesPanel
        definition={productDefinition}
        disabled={false}
        issues={[]}
        onChange={() => undefined}
        section={products}
      />,
    );

    expect(screen.getByRole("button", { name: "选择内容" }).hasAttribute("disabled")).toBe(false);
  });
});
