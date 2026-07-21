import { describe, expect, it } from "vitest";
import { contentDraftToForm, mergeContentDraftForm } from "@/features/content-editor/content-draft-form";

describe("content draft form adapter", () => {
  it("reads supported fields and keeps unknown draft data when merging", () => {
    const draft = { extra: { id: 7 }, seoTitle: "旧 SEO", summary: "旧摘要", title: "旧标题" };
    expect(contentDraftToForm(draft)).toEqual({ seoDescription: "", seoKeywords: "", seoTitle: "旧 SEO", summary: "旧摘要", title: "旧标题" });
    expect(mergeContentDraftForm(draft, { seoDescription: " 描述 ", seoKeywords: " 关键词 ", seoTitle: " SEO ", summary: " 摘要 ", title: " 标题 " })).toEqual({ extra: { id: 7 }, seoDescription: "描述", seoKeywords: "关键词", seoTitle: "SEO", summary: "摘要", title: "标题" });
  });
});
