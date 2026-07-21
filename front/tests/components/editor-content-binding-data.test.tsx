// @vitest-environment jsdom

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PageRenderer } from "@/components/page-builder/PageRenderer";
import { useEditorContentBindingData } from "@/features/editor/use-editor-content-binding-data";
import { createDefaultHomePageSchema } from "@/lib/home-page-template";
import { getBindableContentSnapshot } from "@/services/content-binding-api";
import type { PageSchema } from "@/types/page-builder";

vi.mock("@/services/content-binding-api", () => ({
  getBindableContentSnapshot: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(getBindableContentSnapshot).mockImplementation(async (source) => ({
    complete: true,
    items: source === "PRODUCT" ? [{
      id: 9,
      sortOrder: 1,
      source,
      summary: "编辑器绑定预览",
      tags: ["核心产品"],
      title: "实时产品卡片",
      visible: true,
    }] : [],
    source,
  }));
});

describe("editor content binding data", () => {
  it("loads Admin binding snapshots outside the shared renderer", async () => {
    render(<EditorBindingHarness schema={createDefaultHomePageSchema()} />);

    expect(screen.getAllByText("正在加载绑定内容…").length).toBeGreaterThan(0);
    expect(await screen.findByRole("heading", { name: "实时产品卡片" })).toBeTruthy();
    expect(getBindableContentSnapshot).toHaveBeenCalledWith("PRODUCT");
    expect(getBindableContentSnapshot).toHaveBeenCalledTimes(3);
  });
});

function EditorBindingHarness({ schema }: Readonly<{ schema: PageSchema }>) {
  const data = useEditorContentBindingData(schema);
  return <PageRenderer mode="editor" resolvedDataByBlockId={data} schema={schema} />;
}
